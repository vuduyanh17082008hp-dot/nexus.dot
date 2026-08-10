import Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import type { GameAudio } from "@/games/shared/audio";
import { NEXUS_CONFIG } from "../core/GameConfig";
import { FixedStepLoop } from "../core/FixedStepLoop";
import { InputManager } from "../input/InputManager";
import { PlayerController } from "../player/PlayerController";
import { BeatClock } from "../audio/BeatClock";
import { parseLevelData, type LevelData } from "../world/LevelSchema";
import { objectToAabb, resolveCollisions, type Aabb } from "../world/CollisionSystem";
import { SCENE, GAME_SLUG } from "../constants";
import bootSequenceLevel from "../levels/boot-sequence.json";

type VisualObj = {
  id: string;
  sprite: Phaser.GameObjects.Image;
  kind: string;
};

export class PlayScene extends Phaser.Scene {
  private bus!: EventBus;
  private audio!: GameAudio;
  private inputMgr!: InputManager;
  private loop = new FixedStepLoop();
  private player = new PlayerController();
  private beat!: BeatClock;
  private level!: LevelData;

  private solids: Aabb[] = [];
  private hazards: Aabb[] = [];
  private specials: Aabb[] = [];
  private visuals: VisualObj[] = [];
  private collected = new Set<string>();
  private flippedPortals = new Set<string>();

  private playerSprite!: Phaser.GameObjects.Image;
  private trail!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hudText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private bgPulse!: Phaser.GameObjects.Rectangle;

  private attempts = 1;
  private deaths = 0;
  private startedAt = 0;
  private deadTimer = 0;
  private paused = false;

  constructor() {
    super(SCENE.PLAY);
  }

  create(): void {
    this.bus = this.registry.get("bus") as EventBus;
    this.audio = this.registry.get("audio") as GameAudio;
    this.level = parseLevelData(bootSequenceLevel);
    this.beat = new BeatClock(this.level.song.bpm, this.level.song.offsetMs);

    this.cameras.main.setBackgroundColor("#050510");
    this.bgPulse = this.add
      .rectangle(0, 0, 20000, NEXUS_CONFIG.height, 0x7c3aed, 0.04)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-10);

    this.buildLevel();
    this.playerSprite = this.add.image(0, 0, "nx-core").setDepth(10);
    this.trail = this.add.particles(0, 0, "nx-core", {
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.45, end: 0 },
      speed: 10,
      lifespan: 280,
      frequency: 40,
      blendMode: "ADD",
      follow: this.playerSprite,
    });

    this.hudText = this.add
      .text(16, 12, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#e2e8f0",
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.overlayText = this.add
      .text(NEXUS_CONFIG.width / 2, NEXUS_CONFIG.height / 2, "", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#22d3ee",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(120)
      .setVisible(false);

    this.inputMgr = new InputManager();
    this.inputMgr.attach(this.game.canvas ?? window);

    this.resetAttempt(false);
    this.startedAt = performance.now();

    this.bus.emit("game:ready", undefined);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  private buildLevel(): void {
    this.solids = [];
    this.hazards = [];
    this.specials = [];
    this.visuals = [];

    for (const obj of this.level.objects) {
      const aabb = objectToAabb(obj);
      if (aabb.solid) this.solids.push(aabb);
      else if (aabb.lethal) this.hazards.push(aabb);
      else this.specials.push(aabb);

      const key =
        obj.type === "SPIKE"
          ? "nx-spike"
          : obj.type === "PAD_JUMP"
            ? "nx-pad"
            : obj.type === "PORTAL_GRAVITY"
              ? "nx-portal"
              : obj.type === "FINISH"
                ? "nx-finish"
                : obj.type === "COLLECTIBLE"
                  ? "nx-core-gem"
                  : "nx-platform";

      const sprite = this.add
        .image(obj.x, obj.y, key)
        .setDisplaySize(obj.width * obj.scaleX, obj.height * obj.scaleY)
        .setRotation(Phaser.Math.DegToRad(obj.rotation))
        .setDepth(obj.type === "DECORATION" ? 0 : 5);

      if (obj.type === "SPIKE" && obj.rotation === 180) {
        sprite.setFlipY(true);
      }

      this.visuals.push({ id: obj.id, sprite, kind: obj.type });
    }
  }

  private resetAttempt(incrementDeath: boolean): void {
    if (incrementDeath) this.deaths += 1;
    else this.attempts = Math.max(1, this.attempts);

    this.loop.reset();
    this.beat.reset();
    this.collected.clear();
    this.flippedPortals.clear();
    this.deadTimer = 0;
    this.overlayText.setVisible(false);
    this.playerSprite.setVisible(true).setAlpha(1);

    for (const v of this.visuals) {
      if (v.kind === "COLLECTIBLE") v.sprite.setVisible(true);
    }

    const speed = NEXUS_CONFIG.speeds[this.level.settings.speedTier];
    this.player.spawn(
      this.level.settings.startX,
      this.level.settings.startY,
      speed,
      this.level.settings.gravity,
    );

    this.cameras.main.scrollX = 0;
    this.cameras.main.scrollY = 0;
    this.syncSprite(1);
    this.emitHud();
  }

  private cleanup(): void {
    this.inputMgr?.destroy();
  }

  update(_time: number, delta: number): void {
    const frameDt = delta / 1000;
    const input = this.inputMgr.beginFrame(frameDt);

    if (this.paused) {
      if (input.pausePressed || input.primaryPressed) {
        this.requestResume();
      }
      return;
    }

    if (input.pausePressed) {
      this.requestPause();
      return;
    }

    if (!this.player.body.alive) {
      this.deadTimer += frameDt;
      if (input.restartPressed || input.primaryPressed || this.deadTimer > 0.85) {
        this.attempts += 1;
        this.resetAttempt(false);
      }
      return;
    }

    if (this.player.body.finished) {
      if (input.restartPressed) {
        this.attempts += 1;
        this.resetAttempt(false);
      }
      return;
    }

    if (input.restartPressed) {
      this.attempts += 1;
      this.resetAttempt(false);
      return;
    }

    const alpha = this.loop.tick(frameDt, (dt) => this.simulate(dt, input));
    this.beat.update(frameDt);
    this.syncSprite(alpha);
    this.updateCamera();
    this.updateBeatFx();
    this.emitHud();
  }

  private simulate(dt: number, input: ReturnType<InputManager["beginFrame"]>): void {
    // clear grounded before physics; collisions re-apply
    this.player.markGrounded(false);
    this.player.update(input, dt);

    // filter collected collectibles from specials
    const activeSpecials = this.specials.filter(
      (s) => !(s.kind === "COLLECTIBLE" && this.collected.has(s.id)),
    );

    const hit = resolveCollisions(
      this.player.body,
      this.solids,
      this.hazards,
      activeSpecials,
      this.player.ctx.gravitySign,
    );

    if (hit.grounded) {
      this.player.markGrounded(true);
      if (hit.groundY !== undefined) this.player.body.y = hit.groundY;
      if (input.bufferedPrimary) {
        // allow buffered jump next frame via coyote + buffer
      }
    }

    if (hit.padBoost && this.player.body.onGround) {
      this.player.body.vy =
        NEXUS_CONFIG.core.jumpVelocity * hit.padBoost * this.player.ctx.gravitySign;
      this.player.markGrounded(false);
      this.audio.playJump();
      this.inputMgr.consumeBuffer();
    }

    for (const id of hit.collectibleIds) {
      if (this.collected.has(id)) continue;
      this.collected.add(id);
      const visual = this.visuals.find((v) => v.id === id);
      visual?.sprite.setVisible(false);
      this.audio.playCollect();
    }

    if (hit.gravityFlip) {
      // one-shot per portal contact by nearest portal id
      const portal = activeSpecials.find((s) => s.kind === "PORTAL_GRAVITY");
      if (portal && !this.flippedPortals.has(portal.id)) {
        // detect which portal overlapped — use all portals
      }
      for (const s of activeSpecials) {
        if (s.kind !== "PORTAL_GRAVITY") continue;
        if (this.flippedPortals.has(s.id)) continue;
        const dx = Math.abs(this.player.body.x - s.x);
        const dy = Math.abs(this.player.body.y - s.y);
        if (dx < s.w && dy < s.h) {
          this.flippedPortals.add(s.id);
          this.player.ctx.gravitySign = (this.player.ctx.gravitySign * -1) as 1 | -1;
          this.cameras.main.flash(80, 34, 211, 238, false);
          this.audio.playCollect();
          break;
        }
      }
    }

    // fall out of world
    if (this.player.body.y > 800 || this.player.body.y < -200) {
      hit.died = true;
    }

    if (hit.died) {
      this.die();
      return;
    }

    if (hit.finish || this.player.body.x >= this.level.settings.finishX) {
      this.complete();
    }

    if (input.primaryPressed || input.bufferedPrimary) {
      // buffer consumed on successful jump inside CoreMode when grounded
      if (this.player.body.onGround || this.player.ctx.coyoteTimer > 0) {
        this.inputMgr.consumeBuffer();
      }
    }
  }

  private die(): void {
    if (!this.player.body.alive) return;
    this.player.kill();
    this.deaths += 1;
    this.audio.playDeath();
    this.cameras.main.shake(120, 0.01);
    this.playerSprite.setAlpha(0.3);
    this.overlayText
      .setText("SIGNAL LOST\nPRIMARY / R — REBOOT")
      .setColor("#f97316")
      .setVisible(true);

    this.bus.emit("hud:update", {
      score: Math.floor(this.progress() * 100),
      health: 0,
    });
  }

  private complete(): void {
    if (this.player.body.finished) return;
    this.player.finish();
    this.audio.playCollect();
    this.cameras.main.flash(200, 124, 58, 237, false);
    const pct = 100;
    const duration = Math.floor((performance.now() - this.startedAt) / 1000);
    const score = Math.max(
      100,
      Math.floor(10_000 * (1 / Math.max(1, this.attempts)) + this.collected.size * 500),
    );

    this.overlayText
      .setText(`BOOT COMPLETE\n${pct}%  ·  ${this.attempts} attempts\nCores ${this.collected.size}`)
      .setColor("#22d3ee")
      .setVisible(true);

    this.bus.emit("game:over", {
      score,
      highScore: score,
      xpGained: 0,
      achievementsUnlocked: [],
      metadata: {
        score,
        progress: pct,
        attempts: this.attempts,
        deaths: this.deaths,
        collectibles: this.collected.size,
        durationSeconds: duration,
        victory: 1,
        levelId: this.level.metadata.id,
      },
    });
  }

  private progress(): number {
    const start = this.level.settings.startX;
    const end = this.level.settings.finishX;
    return Math.min(1, Math.max(0, (this.player.body.x - start) / (end - start)));
  }

  private syncSprite(alpha: number): void {
    const b = this.player.body;
    const x = b.prevX + (b.x - b.prevX) * alpha;
    const y = b.prevY + (b.y - b.prevY) * alpha;
    this.playerSprite.setPosition(x, y);
    this.playerSprite.setRotation(b.rotation);
  }

  private updateCamera(): void {
    const targetX = this.player.body.x - NEXUS_CONFIG.width * 0.35 + NEXUS_CONFIG.camera.lookahead;
    const cam = this.cameras.main;
    cam.scrollX += (targetX - cam.scrollX) * NEXUS_CONFIG.camera.lerp;
    cam.scrollY = 0;
  }

  private updateBeatFx(): void {
    const pulse = this.beat.isBeatPulse ? 0.08 : 0.035;
    this.bgPulse.setFillStyle(0x7c3aed, pulse);
  }

  private emitHud(): void {
    const pct = Math.floor(this.progress() * 100);
    this.hudText.setText(
      `BOOT SEQUENCE  ${pct}%\nATTEMPT ${this.attempts}  ·  CORES ${this.collected.size}`,
    );
    this.bus.emit("hud:update", {
      score: pct,
      level: this.attempts,
      health: this.player.body.alive ? 100 : 0,
    });
  }

  /** Called from bridge */
  requestRestart(): void {
    this.paused = false;
    this.bus.emit("game:pause", false);
    this.attempts += 1;
    this.resetAttempt(false);
  }

  requestResume(): void {
    this.paused = false;
    this.overlayText.setVisible(false);
    this.bus.emit("game:pause", false);
  }

  requestPause(): void {
    this.paused = true;
    this.overlayText.setText("PAUSED\nPRIMARY / Esc to resume").setVisible(true);
    this.bus.emit("game:pause", true);
  }
}
