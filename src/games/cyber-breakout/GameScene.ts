import Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import type { GameAudio } from "@/games/shared/audio";
import { ScoreManager } from "@/games/shared/score-manager";
import { SaveManager } from "@/games/shared/save-manager";
import { AchievementManager } from "@/games/shared/achievement-manager";
import { PauseManager } from "@/games/shared/pause-manager";
import { particleCount } from "@/games/shared/graphics";
import { calculateSessionXP } from "@/lib/xp/curve";
import { BALL_SPEED, MAX_LIVES, PADDLE_SPEED, SCENE } from "./constants";
import { LEVELS, brickColor, brickHp, brickPoints } from "./levels";
import { spawnParticles, screenShake } from "./effects";

interface BrickObj extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  code: number;
}

function arcadeBody(sprite: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Body | null {
  return sprite.body as Phaser.Physics.Arcade.Body | null;
}

export class GameScene extends Phaser.Scene {
  private paddle!: Phaser.Physics.Arcade.Sprite;
  private ball!: Phaser.Physics.Arcade.Sprite;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;
  private powerUps!: Phaser.Physics.Arcade.Group;

  private scoreMgr = new ScoreManager();
  private pauseMgr!: PauseManager;
  private bus!: EventBus;
  private audio!: GameAudio;
  private saveMgr!: SaveManager;
  private achievements!: AchievementManager;

  private lives = MAX_LIVES;
  private levelIndex = 0;
  private blocksDestroyed = 0;
  private ballLaunched = false;
  private paddleWide = false;
  private gameOver = false;
  private won = false;

  constructor() {
    super({ key: SCENE.GAME });
  }

  create(): void {
    const { width, height } = this.scale;
    this.bus = this.registry.get("bus");
    this.audio = this.registry.get("audio");
    this.saveMgr = this.registry.get("saveMgr");
    this.achievements = this.registry.get("achievements");
    this.levelIndex = this.registry.get("levelIndex") ?? 0;

    this.add.rectangle(width / 2, height / 2, width, height, 0x080018);
    this.physics.world.setBounds(0, 0, width, height - 20);
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.paddle = this.physics.add.sprite(width / 2, height - 40, "paddle").setImmovable(true);
    arcadeBody(this.paddle)?.setAllowGravity(false);

    this.ball = this.physics.add.sprite(width / 2, height - 70, "ball");
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(1, 1);
    const ballBody = arcadeBody(this.ball);
    if (ballBody) {
      ballBody.setCollideWorldBounds(true, 1, 1, true);
      ballBody.setCircle(6);
    }

    this.bricks = this.physics.add.staticGroup();
    this.powerUps = this.physics.add.group();
    this.buildLevel(this.levelIndex);

    this.physics.add.collider(this.ball, this.paddle, () => {
      const diff = this.ball.x - this.paddle.x;
      const b = arcadeBody(this.ball);
      if (b) {
        b.setVelocityX(diff * 8);
        b.setVelocityY(-Math.abs(b.velocity.y));
      }
      this.audio.playBounce();
    });
    this.physics.add.collider(this.ball, this.bricks, (_ball, brick) => {
      this.hitBrick(brick as BrickObj);
    });
    this.physics.add.overlap(this.paddle, this.powerUps, (_p, pu) => {
      const sprite = pu as Phaser.Physics.Arcade.Sprite;
      this.collectPowerUp(sprite);
      sprite.destroy();
    });

    this.physics.world.on("worldbounds", (body: Phaser.Physics.Arcade.Body) => {
      if (body.gameObject === this.ball && body.blocked.down) this.loseLife();
    });

    this.pauseMgr = new PauseManager(this, this.bus);
    this.input.keyboard?.on("keydown-ESC", () => this.pauseMgr.toggle());
    this.input.keyboard?.on("keydown-R", () => {
      if (this.gameOver || this.won) this.registry.get("restart")();
    });
    this.input.keyboard?.on("keydown-SPACE", () => this.launchBall());
    this.input.on("pointerdown", () => this.launchBall());

    this.emitHud();
  }

  update(): void {
    if (this.gameOver || this.won || this.pauseMgr.isPaused()) return;

    const pointer = this.input.activePointer;
    const kb = this.input.keyboard;
    let vx = 0;
    if (kb?.addKey("LEFT").isDown || kb?.addKey("A").isDown) vx = -PADDLE_SPEED;
    if (kb?.addKey("RIGHT").isDown || kb?.addKey("D").isDown) vx = PADDLE_SPEED;
    if (pointer.isDown) {
      const diff = pointer.worldX - this.paddle.x;
      vx = Phaser.Math.Clamp(diff * 6, -PADDLE_SPEED, PADDLE_SPEED);
    }
    this.paddle.setVelocityX(vx);

    if (!this.ballLaunched) {
      this.ball.setPosition(this.paddle.x, this.paddle.y - 24);
    }

    this.powerUps.getChildren().forEach((obj) => {
      const p = obj as Phaser.Physics.Arcade.Sprite;
      p.y += 2;
      if (p.y > this.scale.height) p.destroy();
    });
  }

  private buildLevel(index: number): void {
    this.bricks.clear(true, true);
    const level = LEVELS[index];
    if (!level) return;

    const { width } = this.scale;
    const brickW = 56;
    const gap = 8;
    const totalW = level.cols * (brickW + gap) - gap;
    const startX = (width - totalW) / 2 + brickW / 2;

    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        const code = level.pattern[r]?.[c] ?? 0;
        if (code <= 0) continue;
        const x = startX + c * (brickW + gap);
        const y = 80 + r * 28;
        const brick = this.bricks.create(x, y, "brick") as BrickObj;
        brick.code = code;
        brick.hp = brickHp(code);
        brick.setTint(brickColor(code));
        brick.refreshBody();
      }
    }

    this.add
      .text(width / 2, 24, `STAGE ${index + 1}: ${level.label}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#66ccff",
      })
      .setOrigin(0.5)
      .setName("levelLabel");
  }

  private launchBall(): void {
    if (this.ballLaunched || this.gameOver || this.won) return;
    this.ballLaunched = true;
    const angle = Phaser.Math.Between(-40, 40) * (Math.PI / 180);
    this.ball.setVelocity(Math.sin(angle) * BALL_SPEED * 0.4, -Math.cos(angle) * BALL_SPEED);
    this.audio.playBounce();
  }

  private hitBrick(brick: BrickObj): void {
    brick.hp -= 1;
    if (brick.hp > 0) {
      brick.setTint(0xffffff);
      this.audio.playHit();
      return;
    }

    this.blocksDestroyed += 1;
    const pts = this.scoreMgr.add(brickPoints(brick.code));
    this.bus.emit("score:popup", { value: pts, x: brick.x, y: brick.y });
    const gfx = this.registry.get("graphics");
    spawnParticles(this, brick.x, brick.y, brickColor(brick.code), particleCount(gfx, 5));
    if (gfx?.screenShake) screenShake(this);
    this.audio.playHit();

    if (brick.code === 3 && Math.random() < 0.6) {
      const pu = this.powerUps.create(brick.x, brick.y, "powerup") as Phaser.Physics.Arcade.Sprite;
      arcadeBody(pu)?.setAllowGravity(false);
    }

    brick.destroy();
    if (this.bricks.countActive(true) === 0) this.nextLevel();
  }

  private collectPowerUp(_sprite: Phaser.Physics.Arcade.Sprite): void {
    this.audio.playPowerUp();
    const kind = Phaser.Math.Between(0, 2);
    if (kind === 0) {
      this.paddleWide = true;
      this.paddle.setScale(1.4, 1);
      this.time.delayedCall(8000, () => {
        this.paddleWide = false;
        this.paddle.setScale(1);
      });
    } else if (kind === 1) {
      this.lives = Math.min(MAX_LIVES, this.lives + 1);
    } else {
      const b = arcadeBody(this.ball);
      if (b) b.setVelocity(b.velocity.x * 1.2, b.velocity.y * 1.2);
    }
    this.emitHud();
  }

  private loseLife(): void {
    this.lives -= 1;
    this.ballLaunched = false;
    this.ball.setVelocity(0, 0);
    this.ball.setPosition(this.paddle.x, this.paddle.y - 24);
    this.audio.playDeath();
    const gfx = this.registry.get("graphics");
    if (gfx?.screenShake) screenShake(this);
    if (this.lives <= 0) this.endGame(false);
    else this.emitHud();
  }

  private nextLevel(): void {
    this.levelIndex += 1;
    this.registry.set("levelIndex", this.levelIndex);
    if (this.levelIndex >= LEVELS.length) {
      this.endGame(true);
      return;
    }
    this.ballLaunched = false;
    this.ball.setVelocity(0, 0);
    this.children.getByName("levelLabel")?.destroy();
    this.buildLevel(this.levelIndex);
    this.audio.playVictory();
    this.emitHud();
  }

  private emitHud(): void {
    const save = this.saveMgr.load();
    this.bus.emit("hud:update", {
      score: this.scoreMgr.getScore(),
      highScore: save.highScore,
      lives: this.lives,
      level: this.levelIndex + 1,
    });
  }

  private endGame(victory: boolean): void {
    this.gameOver = !victory;
    this.won = victory;
    const score = this.scoreMgr.getScore();
    const save = this.saveMgr.recordPlay(score, {
      level: victory ? LEVELS.length : this.levelIndex + 1,
      blocksDestroyed: this.blocksDestroyed,
    });

    const meta = {
      score,
      level: victory ? LEVELS.length : this.levelIndex + 1,
      blocksDestroyed: this.blocksDestroyed,
      victory: victory ? 1 : 0,
    };
    const achievementsUnlocked = this.achievements.checkAndUnlock(meta);
    const xpGained =
      calculateSessionXP({
        score,
        durationSeconds: 120,
        isHighScore: score >= save.highScore,
        isDailyFirst: false,
      }) + this.achievements.estimateXp(achievementsUnlocked);

    this.bus.emit("game:over", {
      score,
      highScore: save.highScore,
      xpGained,
      achievementsUnlocked,
      metadata: {
        level: victory ? LEVELS.length : this.levelIndex + 1,
        blocksDestroyed: this.blocksDestroyed,
        victory,
      },
    });

    const msg = victory ? "VICTORY!\nPress R for menu" : "GAME OVER\nPress R to retry";
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, msg, {
        fontFamily: "monospace",
        fontSize: "28px",
        color: victory ? "#00ffaa" : "#ff44aa",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100);
  }
}
