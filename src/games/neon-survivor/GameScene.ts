import Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import type { GameAudio } from "@/games/shared/audio";
import { InputManager } from "@/games/shared/input";
import { ScoreManager } from "@/games/shared/score-manager";
import { SaveManager } from "@/games/shared/save-manager";
import { AchievementManager } from "@/games/shared/achievement-manager";
import { PauseManager } from "@/games/shared/pause-manager";
import { particleCount } from "@/games/shared/graphics";
import { calculateSessionXP } from "@/lib/xp/curve";
import { FIRE_RATE, PLAYER_SPEED, SCENE, type PowerUpKind } from "./constants";
import { createBulletPool, fireBullet, updateBullets, type BulletItem } from "./bullets";
import { createEnemyPool, spawnAtEdge, updateEnemies, type EnemyItem } from "./enemies";
import { PowerUpManager, burstParticles, screenShake } from "./effects";
import { getWaveConfig } from "./waves";
import type { ObjectPool } from "@/games/shared/object-pool";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private bulletPool!: ObjectPool<BulletItem>;
  private enemyPool!: ObjectPool<EnemyItem>;
  private powerUps!: PowerUpManager;
  private inputMgr = new InputManager();
  private scoreMgr = new ScoreManager();
  private pauseMgr!: PauseManager;
  private audio!: GameAudio;
  private bus!: EventBus;
  private saveMgr!: SaveManager;
  private achievements!: AchievementManager;

  private health = 100;
  private kills = 0;
  private elapsed = 0;
  private wave = 1;
  private highestWave = 1;
  private lastFire = 0;
  private spawnTimer = 0;
  private gameOver = false;
  private invulnUntil = 0;

  constructor() {
    super({ key: SCENE.GAME });
  }

  create(): void {
    const { width, height } = this.scale;
    this.bus = this.registry.get("bus");
    this.audio = this.registry.get("audio");
    this.saveMgr = this.registry.get("saveMgr");
    this.achievements = this.registry.get("achievements");

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0014);
    this.physics.world.setBounds(0, 0, width, height);

    this.player = this.physics.add.sprite(width / 2, height / 2, "player");
    this.player.setCollideWorldBounds(true);
    if (this.player.body) this.player.body.setCircle(8);

    this.bulletPool = createBulletPool(this);
    this.enemyPool = createEnemyPool(this);
    this.powerUps = new PowerUpManager(this);
    this.pauseMgr = new PauseManager(this, this.bus);

    this.setupCollisions();
    this.setupVirtualInput();
    this.registry.set("kills", 0);
    this.registry.set("wave", 1);
    this.registry.set("survivalTime", 0);

    this.input.keyboard?.on("keydown-ESC", () => this.pauseMgr.toggle());
    this.input.keyboard?.on("keydown-R", () => {
      if (this.gameOver) this.registry.get("restart")();
    });
  }

  update(_time: number, delta: number): void {
    if (this.gameOver || this.pauseMgr.isPaused()) return;

    this.elapsed += delta / 1000;
    this.registry.set("survivalTime", Math.floor(this.elapsed));

    const waveCfg = getWaveConfig(this.elapsed);
    this.wave = waveCfg.wave;
    this.highestWave = Math.max(this.highestWave, this.wave);
    this.registry.set("wave", this.wave);

    this.spawnTimer += delta;
    if (this.spawnTimer >= waveCfg.spawnInterval) {
      this.spawnTimer = 0;
      for (let i = 0; i < waveCfg.spawnCount; i++) {
        spawnAtEdge(this.enemyPool, this.scale.width, this.scale.height, waveCfg.enemyHp, waveCfg.enemySpeed);
      }
    }

    const input = this.inputMgr.poll(this, this.player.x, this.player.y);
    const boosts = this.powerUps.tick(this.time.now);
    const speed = PLAYER_SPEED * boosts.speedMult;
    const len = Math.hypot(input.moveX, input.moveY) || 1;
    this.player.setVelocity(
      (input.moveX / len) * speed,
      (input.moveY / len) * speed,
    );

    const fireRate = boosts.rapid ? FIRE_RATE * 0.45 : FIRE_RATE;
    if (input.fire && this.time.now - this.lastFire > fireRate) {
      this.lastFire = this.time.now;
      const angle = Math.atan2(input.aimY, input.aimX);
      fireBullet(this.bulletPool, this.player.x, this.player.y, angle, boosts.damage);
      this.audio.playShoot();
    }

    updateEnemies(this.enemyPool, this.player.x, this.player.y);
    updateBullets(this.bulletPool, this.physics.world.bounds);

    if (input.pause) this.pauseMgr.toggle();
    this.emitHud();
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.bulletPool as unknown as Phaser.GameObjects.GameObject,
      this.enemyPool as unknown as Phaser.GameObjects.GameObject,
      () => {},
    );

    const checkBulletEnemy = () => {
      this.bulletPool.forEachActive((bullet) => {
        this.enemyPool.forEachActive((enemy) => {
          if (!bullet.active || !enemy.active) return;
          const dist = Phaser.Math.Distance.Between(bullet.sprite.x, bullet.sprite.y, enemy.sprite.x, enemy.sprite.y);
          if (dist < 14) {
            enemy.hp -= bullet.damage;
            this.bulletPool.release(bullet);
            if (enemy.hp <= 0) this.killEnemy(enemy);
            else this.audio.playHit();
          }
        });
      });
    };

    const checkPlayerEnemy = () => {
      if (this.time.now < this.invulnUntil) return;
      this.enemyPool.forEachActive((enemy) => {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y);
        if (dist < 16) {
          this.damagePlayer(12);
          this.enemyPool.release(enemy);
        }
      });
    };

    const checkPlayerPowerUp = () => {
      this.powerUps.getGroup().getChildren().forEach((obj) => {
        const sprite = obj as Phaser.Physics.Arcade.Sprite;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
        if (dist < 18) {
          const kind = sprite.getData("kind") as PowerUpKind;
          this.applyPowerUp(kind);
          sprite.destroy();
          this.audio.playPowerUp();
        }
      });
    };

    this.events.on("update", () => {
      checkBulletEnemy();
      checkPlayerEnemy();
      checkPlayerPowerUp();
    });
  }

  private killEnemy(enemy: EnemyItem): void {
    this.enemyPool.release(enemy);
    this.kills += 1;
    this.registry.set("kills", this.kills);
    const pts = this.scoreMgr.add(10 + this.wave * 2);
    this.bus.emit("score:popup", { value: pts, x: enemy.sprite.x, y: enemy.sprite.y });
    const gfx = this.registry.get("graphics");
    burstParticles(this, enemy.sprite.x, enemy.sprite.y, 0xff2266, particleCount(gfx, 6));
    if (Math.random() < 0.08) this.powerUps.spawn(enemy.sprite.x, enemy.sprite.y);
    this.audio.playHit();
  }

  private damagePlayer(amount: number): void {
    this.health -= amount;
    this.invulnUntil = this.time.now + 800;
    this.player.setTint(0xff0000);
    this.time.delayedCall(150, () => this.player.clearTint());
    const gfx = this.registry.get("graphics");
    if (gfx.screenShake) screenShake(this);
    this.audio.playHit();
    if (this.health <= 0) this.endGame();
  }

  private applyPowerUp(kind: PowerUpKind): void {
    if (kind === "health") this.health = Math.min(100, this.health + 25);
    else this.powerUps.collect(kind, this.time.now);
  }

  private emitHud(): void {
    const save = this.saveMgr.load();
    this.bus.emit("hud:update", {
      score: this.scoreMgr.getScore(),
      highScore: save.highScore,
      health: this.health,
      wave: this.wave,
      kills: this.kills,
      time: Math.floor(this.elapsed),
    });
  }

  private endGame(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.audio.playDeath();

    const score = this.scoreMgr.getScore();
    const save = this.saveMgr.recordPlay(score, {
      kills: this.kills,
      highestWave: this.highestWave,
      survivalTime: Math.floor(this.elapsed),
    });

    const meta = {
      score,
      kills: this.kills,
      survivalTime: Math.floor(this.elapsed),
      highestWave: this.highestWave,
    };
    const achievementsUnlocked = this.achievements.checkAndUnlock(meta);
    const achievementXp = this.achievements.estimateXp(achievementsUnlocked);
    const xpGained =
      calculateSessionXP({
        score,
        durationSeconds: Math.floor(this.elapsed),
        isHighScore: score >= save.highScore,
        isDailyFirst: false,
      }) + achievementXp;

    this.bus.emit("game:over", {
      score,
      highScore: save.highScore,
      xpGained,
      achievementsUnlocked,
      metadata: {
        kills: this.kills,
        wave: this.highestWave,
        survivalTime: Math.floor(this.elapsed),
      },
    });

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "GAME OVER\nPress R to restart", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#ff44aa",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100);
  }

  private setupVirtualInput(): void {
    const parent = this.game.canvas?.parentElement;
    if (!parent) return;
    parent.addEventListener("virtual-move", ((e: CustomEvent<{ x: number; y: number }>) => {
      this.inputMgr.setVirtualInput({ moveX: e.detail.x, moveY: e.detail.y });
    }) as EventListener);
    parent.addEventListener("virtual-fire", ((e: CustomEvent<{ down: boolean }>) => {
      this.inputMgr.setVirtualInput({ fire: e.detail.down });
    }) as EventListener);
  }

  resetState(): void {
    this.health = 100;
    this.kills = 0;
    this.elapsed = 0;
    this.wave = 1;
    this.highestWave = 1;
    this.gameOver = false;
    this.scoreMgr.reset();
    this.bulletPool.releaseAll();
    this.enemyPool.releaseAll();
    this.powerUps.getGroup().clear(true, true);
    this.player.setPosition(this.scale.width / 2, this.scale.height / 2);
  }
}
