import Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import type { GameAudio } from "@/games/shared/audio";
import { ScoreManager } from "@/games/shared/score-manager";
import { SaveManager } from "@/games/shared/save-manager";
import { AchievementManager } from "@/games/shared/achievement-manager";
import { PauseManager } from "@/games/shared/pause-manager";
import { InputManager } from "@/games/shared/input";
import { particleCount } from "@/games/shared/graphics";
import { calculateSessionXP } from "@/lib/xp/curve";
import { BASE_SPEED, GRAVITY, JUMP_VELOCITY, SCENE } from "./constants";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private stars!: Phaser.GameObjects.TileSprite;

  private scoreMgr = new ScoreManager();
  private inputMgr = new InputManager();
  private pauseMgr!: PauseManager;
  private bus!: EventBus;
  private audio!: GameAudio;
  private saveMgr!: SaveManager;
  private achievements!: AchievementManager;

  private speed = BASE_SPEED;
  private distance = 0;
  private coinCount = 0;
  private grounded = false;
  private gameOver = false;
  private spawnTimer = 0;
  private coinTimer = 0;

  constructor() {
    super({ key: SCENE.GAME });
  }

  create(): void {
    const { width, height } = this.scale;
    this.bus = this.registry.get("bus");
    this.audio = this.registry.get("audio");
    this.saveMgr = this.registry.get("saveMgr");
    this.achievements = this.registry.get("achievements");

    this.physics.world.gravity.y = GRAVITY;
    this.add.rectangle(width / 2, height / 2, width, height, 0x050010);

    this.stars = this.add.tileSprite(0, 0, width, height, "spark").setOrigin(0).setAlpha(0.15);

    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < width + 128; x += 64) {
      this.ground.create(x, height - 24, "ground").setScale(1, 2).refreshBody();
    }

    this.player = this.physics.add.sprite(120, height - 80, "runner");
    this.player.setCollideWorldBounds(true);
    if (this.player.body) this.player.body.setSize(24, 28);

    this.obstacles = this.physics.add.group();
    this.coins = this.physics.add.group();

    this.physics.add.collider(this.player, this.ground, () => {
      this.grounded = true;
    });
    this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
      const c = coin as Phaser.Physics.Arcade.Sprite;
      c.destroy();
      this.coinCount += 1;
      this.scoreMgr.add(50);
      this.audio.playCollect();
      this.spawnSpark(c.x, c.y, 0xffdd00);
    });
    this.physics.add.overlap(this.player, this.obstacles, () => this.hitObstacle());

    this.pauseMgr = new PauseManager(this, this.bus);
    this.input.keyboard?.on("keydown-ESC", () => this.pauseMgr.toggle());
    this.input.keyboard?.on("keydown-R", () => {
      if (this.gameOver) this.registry.get("restart")();
    });

    this.input.on("pointerdown", () => this.tryJump());
  }

  update(_time: number, delta: number): void {
    if (this.gameOver || this.pauseMgr.isPaused()) return;

    const dt = delta / 1000;
    this.speed += dt * 12;
    this.distance += this.speed * dt * 0.1;
    this.scoreMgr.addRaw(Math.floor(this.speed * dt * 0.05));

    this.stars.tilePositionX += this.speed * dt * 0.3;

    this.grounded = false;
    const input = this.inputMgr.poll(this, this.player.x, this.player.y);
    if (input.jump) this.tryJump();

    this.spawnTimer += delta;
    this.coinTimer += delta;
    const interval = Math.max(900, 1800 - this.speed);
    if (this.spawnTimer > interval) {
      this.spawnTimer = 0;
      this.spawnObstacle();
    }
    if (this.coinTimer > 700) {
      this.coinTimer = 0;
      if (Math.random() > 0.35) this.spawnCoin();
    }

    this.obstacles.getChildren().forEach((obj) => {
      const o = obj as Phaser.Physics.Arcade.Sprite;
      o.x -= this.speed * dt;
      if (o.x < -40) o.destroy();
    });
    this.coins.getChildren().forEach((obj) => {
      const c = obj as Phaser.Physics.Arcade.Sprite;
      c.x -= this.speed * dt;
      if (c.x < -20) c.destroy();
    });

    this.emitHud();
  }

  private tryJump(): void {
    if (!this.grounded || this.gameOver) return;
    this.player.setVelocityY(JUMP_VELOCITY);
    this.grounded = false;
    this.audio.playJump();
  }

  private spawnObstacle(): void {
    const y = this.scale.height - 72;
    const obs = this.obstacles.create(this.scale.width + 30, y, "obstacle") as Phaser.Physics.Arcade.Sprite;
    obs.setImmovable(true);
    (obs.body as Phaser.Physics.Arcade.Body | null)?.setAllowGravity(false);
  }

  private spawnCoin(): void {
    const y = this.scale.height - Phaser.Math.Between(100, 200);
    const coin = this.coins.create(this.scale.width + 20, y, "coin") as Phaser.Physics.Arcade.Sprite;
    (coin.body as Phaser.Physics.Arcade.Body | null)?.setAllowGravity(false);
  }

  private hitObstacle(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.player.setTint(0xff0000);
    this.audio.playDeath();
    const gfx = this.registry.get("graphics");
    if (gfx?.screenShake) this.cameras.main.shake(200, 0.01);
    this.endRun();
  }

  private spawnSpark(x: number, y: number, color: number): void {
    const gfx = this.registry.get("graphics");
    const count = particleCount(gfx, 4);
    for (let i = 0; i < count; i++) {
      const s = this.add.image(x, y, "spark").setTint(color);
      this.tweens.add({
        targets: s,
        x: x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(-40, 10),
        alpha: 0,
        duration: 400,
        onComplete: () => s.destroy(),
      });
    }
  }

  private emitHud(): void {
    const save = this.saveMgr.load();
    this.bus.emit("hud:update", {
      score: this.scoreMgr.getScore(),
      highScore: save.highScore,
      distance: Math.floor(this.distance),
      coins: this.coinCount,
    });
  }

  private endRun(): void {
    const score = this.scoreMgr.getScore();
    const save = this.saveMgr.recordPlay(score, {
      distance: Math.floor(this.distance),
      coins: this.coinCount,
    });

    const meta = {
      score,
      distance: Math.floor(this.distance),
      coins: this.coinCount,
    };
    const achievementsUnlocked = this.achievements.checkAndUnlock(meta);
    const xpGained =
      calculateSessionXP({
        score,
        durationSeconds: Math.floor(this.distance / 10),
        isHighScore: score >= save.highScore,
        isDailyFirst: false,
      }) + this.achievements.estimateXp(achievementsUnlocked);

    this.bus.emit("game:over", {
      score,
      highScore: save.highScore,
      xpGained,
      achievementsUnlocked,
      metadata: {
        distance: Math.floor(this.distance),
        coins: this.coinCount,
      },
    });

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "CRASHED\nPress R to retry", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#ff44aa",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(50);
  }
}
