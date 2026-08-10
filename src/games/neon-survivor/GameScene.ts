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

export type NeonGameState = "READY" | "PLAYING" | "PAUSED" | "GAME_OVER";

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

  private gameState: NeonGameState = "PLAYING";
  private health = 100;
  private kills = 0;
  private elapsed = 0;
  private wave = 1;
  private highestWave = 1;
  private lastFire = 0;
  private spawnTimer = 0;
  private invulnUntil = 0;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private onVirtualMove: EventListener | null = null;
  private onVirtualFire: EventListener | null = null;

  constructor() {
    super({ key: SCENE.GAME });
  }

  create(): void {
    const { width, height } = this.scale;
    this.bus = this.registry.get("bus");
    this.audio = this.registry.get("audio");
    this.saveMgr = this.registry.get("saveMgr");
    this.achievements = this.registry.get("achievements");

    // Launch HUD in parallel — never from MenuScene after scene.start()
    if (!this.scene.isActive(SCENE.UI)) {
      this.scene.launch(SCENE.UI);
    }
    this.scene.bringToTop(SCENE.UI);

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0014);
    this.physics.world.setBounds(0, 0, width, height);

    this.player = this.physics.add.sprite(width / 2, height / 2, "player");
    this.player.setCollideWorldBounds(true);
    if (this.player.body) this.player.body.setCircle(8);

    this.bulletPool = createBulletPool(this);
    this.enemyPool = createEnemyPool(this);
    this.powerUps = new PowerUpManager(this);
    this.pauseMgr = new PauseManager(this, this.bus);
    this.inputMgr.resetBinding();
    this.inputMgr.bind(this);

    this.resetState();
    this.gameState = "PLAYING";
    // Prevent the same pointerdown that left the menu from firing a bullet
    this.inputMgr.setFireLock(200, this.time.now);

    this.setupCollisions();
    this.setupVirtualInput();
    this.setupGameOverInput();

    this.registry.set("kills", 0);
    this.registry.set("wave", 1);
    this.registry.set("survivalTime", 0);

    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.gameState === "PLAYING" || this.gameState === "PAUSED") {
        this.pauseMgr.toggle();
        this.gameState = this.pauseMgr.isPaused() ? "PAUSED" : "PLAYING";
      }
    });

    this.emitHud();
    this.bus.emit("nexus:game-started", undefined);

    if (process.env.NODE_ENV === "development") {
      console.info("[NeonSurvivor] scene created");
      console.info("[NeonSurvivor] PLAYING");
    }

    this.events.once("shutdown", () => this.cleanup());
  }

  update(_time: number, delta: number): void {
    if (this.gameState !== "PLAYING" || this.pauseMgr.isPaused()) return;

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
        spawnAtEdge(
          this.enemyPool,
          this.scale.width,
          this.scale.height,
          waveCfg.enemyHp,
          waveCfg.enemySpeed,
        );
      }
    }

    const input = this.inputMgr.poll(this, this.player.x, this.player.y);
    const boosts = this.powerUps.tick(this.time.now);
    const speed = PLAYER_SPEED * boosts.speedMult;

    // InputManager already normalizes diagonals
    this.player.setVelocity(input.moveX * speed, input.moveY * speed);

    const aimAngle = Math.atan2(input.aimY, input.aimX);
    this.player.setRotation(aimAngle);

    const fireRate = boosts.rapid ? FIRE_RATE * 0.45 : FIRE_RATE;
    if (input.fire && this.time.now - this.lastFire > fireRate) {
      this.lastFire = this.time.now;
      fireBullet(this.bulletPool, this.player.x, this.player.y, aimAngle, boosts.damage);
      this.audio.playShoot();
    }

    updateEnemies(this.enemyPool, this.player.x, this.player.y);
    updateBullets(this.bulletPool, this.physics.world.bounds);

    if (input.pause) {
      this.pauseMgr.toggle();
      this.gameState = this.pauseMgr.isPaused() ? "PAUSED" : "PLAYING";
    }

    this.emitHud();
  }

  private setupCollisions(): void {
    const checkBulletEnemy = () => {
      if (this.gameState !== "PLAYING") return;
      this.bulletPool.forEachActive((bullet) => {
        this.enemyPool.forEachActive((enemy) => {
          if (!bullet.active || !enemy.active) return;
          const dist = Phaser.Math.Distance.Between(
            bullet.sprite.x,
            bullet.sprite.y,
            enemy.sprite.x,
            enemy.sprite.y,
          );
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
      if (this.gameState !== "PLAYING") return;
      if (this.time.now < this.invulnUntil) return;
      this.enemyPool.forEachActive((enemy) => {
        const dist = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          enemy.sprite.x,
          enemy.sprite.y,
        );
        if (dist < 16) {
          this.damagePlayer(12);
          this.enemyPool.release(enemy);
        }
      });
    };

    const checkPlayerPowerUp = () => {
      if (this.gameState !== "PLAYING") return;
      this.powerUps.getGroup().getChildren().forEach((obj) => {
        const sprite = obj as Phaser.Physics.Arcade.Sprite;
        const dist = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          sprite.x,
          sprite.y,
        );
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

  private setupGameOverInput(): void {
    const tryRestart = () => {
      if (this.gameState !== "GAME_OVER") return;
      const restart = this.registry.get("restart") as (() => void) | undefined;
      restart?.();
    };

    this.input.on("pointerdown", tryRestart);
    this.input.keyboard?.on("keydown-SPACE", tryRestart);
    this.input.keyboard?.on("keydown-R", tryRestart);
  }

  private killEnemy(enemy: EnemyItem): void {
    const x = enemy.sprite.x;
    const y = enemy.sprite.y;
    this.enemyPool.release(enemy);
    this.kills += 1;
    this.registry.set("kills", this.kills);
    const pts = this.scoreMgr.add(100);
    this.bus.emit("score:popup", { value: pts, x, y });
    const gfx = this.registry.get("graphics");
    burstParticles(this, x, y, 0xff2266, particleCount(gfx, 6));
    if (Math.random() < 0.08) this.powerUps.spawn(x, y);
    this.audio.playHit();
  }

  private damagePlayer(amount: number): void {
    this.health -= amount;
    this.invulnUntil = this.time.now + 400;
    this.player.setTint(0xff0000);
    this.time.delayedCall(150, () => {
      if (this.player?.active) this.player.clearTint();
    });
    const gfx = this.registry.get("graphics");
    if (gfx?.screenShake) screenShake(this);
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
    if (this.gameState === "GAME_OVER") return;
    this.gameState = "GAME_OVER";
    this.player.setVelocity(0, 0);
    this.audio.playDeath();

    if (process.env.NODE_ENV === "development") {
      console.info("[NeonSurvivor] GAME_OVER");
    }

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

    this.gameOverText?.destroy();
    this.gameOverText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        `GAME OVER\nSCORE: ${score}\nBEST: ${save.highScore}\n\n[ CLICK TO RESTART ]`,
        {
          fontFamily: "monospace",
          fontSize: "24px",
          color: "#ff44aa",
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(100);
  }

  private setupVirtualInput(): void {
    const parent = this.game.canvas?.parentElement;
    if (!parent) return;

    this.onVirtualMove = ((e: CustomEvent<{ x: number; y: number }>) => {
      this.inputMgr.setVirtualInput({ moveX: e.detail.x, moveY: e.detail.y });
    }) as EventListener;

    this.onVirtualFire = ((e: CustomEvent<{ down: boolean }>) => {
      this.inputMgr.setVirtualInput({ fire: e.detail.down });
    }) as EventListener;

    parent.addEventListener("virtual-move", this.onVirtualMove);
    parent.addEventListener("virtual-fire", this.onVirtualFire);
  }

  private cleanup(): void {
    const parent = this.game.canvas?.parentElement;
    if (parent) {
      if (this.onVirtualMove) parent.removeEventListener("virtual-move", this.onVirtualMove);
      if (this.onVirtualFire) parent.removeEventListener("virtual-fire", this.onVirtualFire);
    }
    this.onVirtualMove = null;
    this.onVirtualFire = null;
    this.inputMgr.resetBinding();
  }

  resetState(): void {
    this.health = 100;
    this.kills = 0;
    this.elapsed = 0;
    this.wave = 1;
    this.highestWave = 1;
    this.lastFire = 0;
    this.spawnTimer = 0;
    this.invulnUntil = 0;
    this.scoreMgr.reset();
    this.gameOverText?.destroy();
    this.gameOverText = null;
    if (this.bulletPool) this.bulletPool.releaseAll();
    if (this.enemyPool) this.enemyPool.releaseAll();
    if (this.powerUps) this.powerUps.getGroup().clear(true, true);
    if (this.player) {
      this.player.setPosition(this.scale.width / 2, this.scale.height / 2);
      this.player.setVelocity(0, 0);
      this.player.clearTint();
      this.player.setRotation(0);
    }
  }
}
