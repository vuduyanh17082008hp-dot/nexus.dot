import Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import type { GameAudio } from "@/games/shared/audio";
import { SaveManager } from "@/games/shared/save-manager";
import { AchievementManager } from "@/games/shared/achievement-manager";
import { FixedStepLoop } from "@/games/nexus/core/FixedStepLoop";
import { InputManager } from "@/games/nexus/input/InputManager";
import { BeatClock } from "@/games/nexus/audio/BeatClock";
import { VOID_CONFIG, VOID_PALETTE, SCENE, type VoidGameState } from "./constants";
import { parseVoidLevelData, type VoidFormId, type VoidLevelData } from "./levels/LevelSchema";
import { objectToAabb, resolveCollisions, type Aabb } from "./world/CollisionSystem";
import { PlayerController } from "./player/PlayerController";
import { ensureVoidTextures, textureForForm } from "./textures";
import voidSignalLevel from "./levels/void-signal.json";
import { calculateSessionXP } from "@/lib/xp/curve";

type VisualObj = {
  id: string;
  sprite: Phaser.GameObjects.Image;
  kind: string;
};

type Checkpoint = { id: string; x: number; y: number; form?: VoidFormId };

export class PlayScene extends Phaser.Scene {
  private bus!: EventBus;
  private audio!: GameAudio;
  private saveMgr!: SaveManager;
  private achievements!: AchievementManager;
  private inputMgr!: InputManager;
  private loop = new FixedStepLoop(VOID_CONFIG.simHz);
  private player = new PlayerController();
  private beat!: BeatClock;
  private level!: VoidLevelData;

  private solids: Aabb[] = [];
  private hazards: Aabb[] = [];
  private specials: Aabb[] = [];
  private visuals: VisualObj[] = [];
  private collected = new Set<string>();
  private flippedPortals = new Set<string>();
  private usedFormPortals = new Set<string>();
  private checkpoints: Checkpoint[] = [];
  private checkpointIndex = 0;
  private activeCheckpoint: Checkpoint | null = null;

  private playerSprite!: Phaser.GameObjects.Image;
  private trail!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hudText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private bgPulse!: Phaser.GameObjects.Rectangle;
  private grid!: Phaser.GameObjects.TileSprite;

  private state: VoidGameState = "READY";
  private attempts = 1;
  private deaths = 0;
  private bestProgress = 0;
  private startedAt = 0;
  private deadTimer = 0;
  private countdownTimer = 0;
  private lastForm: VoidFormId = "CUBE";
  private practiceMode = false;
  private beepCooldown = 0;

  constructor() {
    super({ key: SCENE.PLAY });
  }

  create(): void {
    ensureVoidTextures(this);
    this.bus = this.registry.get("bus") as EventBus;
    this.audio = this.registry.get("audio") as GameAudio;
    this.saveMgr = this.registry.get("saveMgr") as SaveManager;
    this.achievements = this.registry.get("achievements") as AchievementManager;
    this.level = parseVoidLevelData(voidSignalLevel);
    this.beat = new BeatClock(this.level.song.bpm, this.level.song.offsetMs);

    const save = this.saveMgr.load();
    this.bestProgress = Number(save.stats?.bestProgress ?? 0);

    this.cameras.main.setBackgroundColor(VOID_PALETTE.bg);
    this.bgPulse = this.add
      .rectangle(0, 0, 24000, VOID_CONFIG.height, VOID_PALETTE.violet, 0.06)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-20);

    this.grid = this.add
      .tileSprite(0, 0, VOID_CONFIG.width, VOID_CONFIG.height, "vr-platform")
      .setOrigin(0)
      .setScrollFactor(0)
      .setAlpha(0.08)
      .setDepth(-15)
      .setTint(VOID_PALETTE.blue);

    this.buildLevel();
    this.playerSprite = this.add.image(0, 0, "vr-cube").setDepth(10);
    this.trail = this.add.particles(0, 0, "vr-spark", {
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.55, end: 0 },
      speed: 18,
      lifespan: 260,
      frequency: 36,
      blendMode: "ADD",
      follow: this.playerSprite,
      tint: VOID_PALETTE.cyan,
    });

    this.hudText = this.add
      .text(16, 12, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#F5F7FF",
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.overlayText = this.add
      .text(VOID_CONFIG.width / 2, VOID_CONFIG.height / 2, "", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#65E8FF",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(120)
      .setVisible(false);

    this.inputMgr = new InputManager(VOID_CONFIG.inputBufferMs);
    this.inputMgr.attach(this.game.canvas?.parentElement ?? this.game.canvas ?? window);
    this.bindPracticeKeys();

    this.state = "COUNTDOWN";
    this.countdownTimer = VOID_CONFIG.countdownSeconds;
    this.resetAttempt(false);
    this.startedAt = performance.now();

    this.bus.emit("game:ready", undefined);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    if (process.env.NODE_ENV === "development") {
      console.info("[VoidRunner] PlayScene ready — VOID SIGNAL");
    }
  }

  private bindPracticeKeys(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    kb.on("keydown-Z", () => this.cycleCheckpoint(-1));
    kb.on("keydown-X", () => this.cycleCheckpoint(1));
    kb.on("keydown-OPEN_BRACKET", () => this.cycleCheckpoint(-1));
    kb.on("keydown-CLOSED_BRACKET", () => this.cycleCheckpoint(1));
    kb.on("keydown-C", () => this.togglePractice());
  }

  private togglePractice(): void {
    this.practiceMode = !this.practiceMode;
    this.state = this.practiceMode ? "PRACTICE" : "PLAYING";
    this.overlayText
      .setText(this.practiceMode ? "PRACTICE ON\nZ/X or [/] checkpoints" : "")
      .setVisible(this.practiceMode);
    if (this.practiceMode) {
      this.time.delayedCall(900, () => {
        if (this.practiceMode) this.overlayText.setVisible(false);
      });
    }
  }

  private cycleCheckpoint(dir: number): void {
    if (!this.practiceMode || this.checkpoints.length === 0) return;
    this.checkpointIndex =
      (this.checkpointIndex + dir + this.checkpoints.length) % this.checkpoints.length;
    const cp = this.checkpoints[this.checkpointIndex]!;
    this.activeCheckpoint = cp;
    this.player.spawn(
      cp.x,
      cp.y,
      VOID_CONFIG.speeds[this.level.settings.speedTier],
      this.level.settings.gravity,
      this.player.formId,
    );
    this.state = "PRACTICE";
    this.deadTimer = 0;
    this.overlayText.setVisible(false);
    this.syncSprite(1);
  }

  private buildLevel(): void {
    this.solids = [];
    this.hazards = [];
    this.specials = [];
    this.visuals = [];
    this.checkpoints = [];

    for (const obj of this.level.objects) {
      const aabb = objectToAabb(obj);
      if (aabb.solid) this.solids.push(aabb);
      else if (aabb.lethal) this.hazards.push(aabb);
      else this.specials.push(aabb);

      if (obj.type === "CHECKPOINT") {
        this.checkpoints.push({ id: obj.id, x: obj.x, y: obj.y });
      }

      const key =
        obj.type === "SPIKE"
          ? "vr-spike"
          : obj.type === "PAD_JUMP"
            ? "vr-pad"
            : obj.type === "FORM_PORTAL"
              ? "vr-form-portal"
              : obj.type === "PORTAL_GRAVITY"
                ? "vr-gravity-portal"
                : obj.type === "FINISH"
                  ? "vr-finish"
                  : obj.type === "COLLECTIBLE"
                    ? "vr-gem"
                    : obj.type === "CHECKPOINT"
                      ? "vr-checkpoint"
                      : "vr-platform";

      const sprite = this.add
        .image(obj.x, obj.y, key)
        .setDisplaySize(obj.width * obj.scaleX, obj.height * obj.scaleY)
        .setRotation(Phaser.Math.DegToRad(obj.rotation))
        .setDepth(obj.type === "DECORATION" ? 0 : 5);

      if (obj.type === "SPIKE" && obj.rotation === 180) sprite.setFlipY(true);
      this.visuals.push({ id: obj.id, sprite, kind: obj.type });
    }

    this.checkpoints.sort((a, b) => a.x - b.x);
  }

  private resetAttempt(incrementDeath: boolean): void {
    if (incrementDeath) this.deaths += 1;

    this.loop.reset();
    this.beat.reset();
    this.collected.clear();
    this.flippedPortals.clear();
    this.usedFormPortals.clear();
    this.deadTimer = 0;
    this.overlayText.setVisible(false);
    this.playerSprite.setVisible(true).setAlpha(1);

    for (const v of this.visuals) {
      if (v.kind === "COLLECTIBLE") v.sprite.setVisible(true);
    }

    const speed = VOID_CONFIG.speeds[this.level.settings.speedTier];
    const spawn = this.activeCheckpoint ?? {
      x: this.level.settings.startX,
      y: this.level.settings.startY,
    };

    this.player.spawn(
      spawn.x,
      spawn.y,
      speed,
      this.level.settings.gravity,
      this.activeCheckpoint?.form ?? this.level.settings.startForm,
    );
    this.lastForm = this.player.formId;
    this.playerSprite.setTexture(textureForForm(this.lastForm));

    this.cameras.main.scrollX = Math.max(0, spawn.x - VOID_CONFIG.width * 0.35);
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

    if (this.state === "COUNTDOWN") {
      this.countdownTimer -= frameDt;
      const n = Math.ceil(Math.max(0, this.countdownTimer));
      this.overlayText
        .setText(n > 0 ? String(n) : "RUN")
        .setColor("#65E8FF")
        .setVisible(true);
      if (this.countdownTimer <= 0) {
        this.overlayText.setVisible(false);
        this.state = this.practiceMode ? "PRACTICE" : "PLAYING";
        this.beat.reset();
      }
      this.emitHud();
      return;
    }

    if (this.state === "PAUSED") {
      if (input.pausePressed || input.primaryPressed) this.requestResume();
      return;
    }

    if (input.pausePressed && (this.state === "PLAYING" || this.state === "PRACTICE")) {
      this.requestPause();
      return;
    }

    if (this.state === "DEAD") {
      this.deadTimer += frameDt;
      if (input.restartPressed || input.primaryPressed || this.deadTimer > VOID_CONFIG.deathRestartSeconds) {
        this.attempts += 1;
        this.state = this.practiceMode ? "PRACTICE" : "PLAYING";
        this.resetAttempt(false);
      }
      return;
    }

    if (this.state === "COMPLETED") {
      if (input.restartPressed || input.primaryPressed) {
        this.attempts += 1;
        this.activeCheckpoint = null;
        this.state = "COUNTDOWN";
        this.countdownTimer = VOID_CONFIG.countdownSeconds;
        this.resetAttempt(false);
      }
      return;
    }

    if (input.restartPressed) {
      this.attempts += 1;
      this.state = this.practiceMode ? "PRACTICE" : "PLAYING";
      this.resetAttempt(false);
      return;
    }

    const alpha = this.loop.tick(frameDt, (dt) => this.simulate(dt, input));
    this.beat.update(frameDt);
    this.syncSprite(alpha);
    this.updateCamera();
    this.updateBeatFx(frameDt);
    this.emitHud();
  }

  private simulate(dt: number, input: ReturnType<InputManager["beginFrame"]>): void {
    this.player.markGrounded(false);
    this.player.update(input, dt);

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
    }

    if (hit.padBoost && this.player.body.onGround) {
      this.player.body.vy =
        VOID_CONFIG.cube.jumpVelocity * hit.padBoost * this.player.ctx.gravitySign;
      this.player.markGrounded(false);
      this.audio.playJump();
      this.inputMgr.consumeBuffer();
    }

    for (const id of hit.collectibleIds) {
      if (this.collected.has(id)) continue;
      this.collected.add(id);
      this.visuals.find((v) => v.id === id)?.sprite.setVisible(false);
      this.audio.playCollect();
    }

    if (hit.checkpointId) {
      const cp = this.checkpoints.find((c) => c.id === hit.checkpointId);
      if (cp) {
        this.activeCheckpoint = { ...cp, form: this.player.formId };
        this.checkpointIndex = Math.max(
          0,
          this.checkpoints.findIndex((c) => c.id === cp.id),
        );
      }
    }

    if (hit.formChange && hit.formChange !== this.player.formId) {
      // one-shot per portal instance via nearest portal
      for (const s of activeSpecials) {
        if (s.kind !== "FORM_PORTAL" || this.usedFormPortals.has(s.id)) continue;
        const dx = Math.abs(this.player.body.x - s.x);
        const dy = Math.abs(this.player.body.y - s.y);
        if (dx < s.w && dy < s.h) {
          this.usedFormPortals.add(s.id);
          this.player.setForm(hit.formChange);
          this.lastForm = this.player.formId;
          this.playerSprite.setTexture(textureForForm(this.lastForm));
          this.cameras.main.flash(70, 101, 232, 255, false);
          this.audio.playCollect();
          break;
        }
      }
    }

    if (hit.gravityFlip) {
      for (const s of activeSpecials) {
        if (s.kind !== "PORTAL_GRAVITY" || this.flippedPortals.has(s.id)) continue;
        const dx = Math.abs(this.player.body.x - s.x);
        const dy = Math.abs(this.player.body.y - s.y);
        if (dx < s.w && dy < s.h) {
          this.flippedPortals.add(s.id);
          this.player.ctx.gravitySign = (this.player.ctx.gravitySign * -1) as 1 | -1;
          this.cameras.main.flash(80, 69, 139, 255, false);
          this.audio.playCollect();
          break;
        }
      }
    }

    if (this.player.body.y > 820 || this.player.body.y < -220) {
      hit.died = true;
    }

    if (hit.died) {
      this.die();
      return;
    }

    if (hit.finish || this.player.body.x >= this.level.settings.finishX) {
      this.complete();
    }

    if (
      (input.primaryPressed || input.bufferedPrimary) &&
      (this.player.body.onGround || this.player.ctx.coyoteTimer > 0)
    ) {
      this.inputMgr.consumeBuffer();
    }
  }

  private die(): void {
    if (!this.player.body.alive || this.state === "DEAD") return;
    this.player.kill();
    this.deaths += 1;
    this.state = "DEAD";
    this.deadTimer = 0;
    this.audio.playDeath();
    this.cameras.main.shake(120, 0.012);
    this.playerSprite.setAlpha(0.35);
    this.overlayText
      .setText("SIGNAL LOST\nPRIMARY / R — REBOOT")
      .setColor("#FF4D6D")
      .setVisible(true);

    const pct = Math.floor(this.progress() * 100);
    if (pct > this.bestProgress) {
      this.bestProgress = pct;
      this.saveMgr.save({
        ...this.saveMgr.load(),
        stats: { ...this.saveMgr.load().stats, bestProgress: pct },
      });
    }
    this.emitHud();
  }

  private complete(): void {
    if (this.player.body.finished || this.state === "COMPLETED") return;
    this.player.finish();
    this.state = "COMPLETED";
    this.audio.playCollect();
    this.cameras.main.flash(220, 124, 92, 255, false);

    const duration = Math.floor((performance.now() - this.startedAt) / 1000);
    const score = Math.max(
      100,
      Math.floor(12_000 * (1 / Math.max(1, this.attempts)) + this.collected.size * 400),
    );
    this.bestProgress = 100;
    const save = this.saveMgr.recordPlay(score, {
      progress: 100,
      attempts: this.attempts,
      deaths: this.deaths,
      collectibles: this.collected.size,
    });
    const achievementsUnlocked = this.achievements.checkAndUnlock({
      score,
      progress: 100,
      attempts: this.attempts,
    });
    const xpGained =
      calculateSessionXP({
        score,
        durationSeconds: duration,
        isHighScore: score >= save.highScore,
        isDailyFirst: false,
      }) + this.achievements.estimateXp(achievementsUnlocked);

    this.overlayText
      .setText(`SIGNAL LOCKED\n100%  ·  ${this.attempts} attempts\nGems ${this.collected.size}`)
      .setColor("#65E8FF")
      .setVisible(true);

    this.bus.emit("game:over", {
      score,
      highScore: save.highScore,
      xpGained,
      achievementsUnlocked,
      metadata: {
        score,
        progress: 100,
        attempts: this.attempts,
        deaths: this.deaths,
        collectibles: this.collected.size,
        durationSeconds: duration,
        victory: 1,
        levelId: this.level.metadata.id,
        form: this.player.formId,
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
    const targetX = this.player.body.x - VOID_CONFIG.width * 0.35 + VOID_CONFIG.camera.lookahead;
    const cam = this.cameras.main;
    cam.scrollX += (targetX - cam.scrollX) * VOID_CONFIG.camera.lerp;
    cam.scrollY = 0;
    this.grid.tilePositionX = cam.scrollX * 0.15;
  }

  private updateBeatFx(dt: number): void {
    const pulse = this.beat.isBeatPulse ? 0.1 : 0.045;
    this.bgPulse.setFillStyle(VOID_PALETTE.violet, pulse);
    this.beepCooldown = Math.max(0, this.beepCooldown - dt);
    if (this.beat.isBeatPulse && this.beepCooldown <= 0 && this.state === "PLAYING") {
      this.beepCooldown = 0.12;
      this.audio.playTone(196, 0.035, "sine", "music", 0.035);
    }
  }

  private emitHud(): void {
    const pct = Math.floor(this.progress() * 100);
    if (pct > this.bestProgress && this.state !== "COMPLETED") {
      // live best only tracks peaks mid-run for HUD; persist on death/complete
    }
    const label = this.practiceMode ? "PRACTICE" : "VOID SIGNAL";
    this.hudText.setText(
      `${label}  ${pct}%\nATTEMPT ${this.attempts}  ·  ${this.player.formId}  ·  BEAT ${this.beat.beat.toFixed(1)}`,
    );
    this.bus.emit("hud:update", {
      score: pct,
      highScore: Math.max(this.bestProgress, pct),
      progress: pct,
      best: Math.max(this.bestProgress, pct),
      attempt: this.attempts,
      form: this.player.formId,
      distance: Math.floor(this.player.body.x),
      coins: this.collected.size,
      health: this.player.body.alive ? 100 : 0,
    });
  }

  requestRestart(): void {
    this.practiceMode = false;
    this.activeCheckpoint = null;
    this.attempts += 1;
    this.state = "COUNTDOWN";
    this.countdownTimer = VOID_CONFIG.countdownSeconds;
    this.resetAttempt(false);
    this.bus.emit("game:pause", false);
  }

  requestResume(): void {
    if (this.state !== "PAUSED") return;
    this.state = this.practiceMode ? "PRACTICE" : "PLAYING";
    this.overlayText.setVisible(false);
    this.bus.emit("game:pause", false);
  }

  requestPause(): void {
    if (this.state !== "PLAYING" && this.state !== "PRACTICE") return;
    this.state = "PAUSED";
    this.overlayText.setText("PAUSED\nPRIMARY / Esc to resume").setVisible(true);
    this.bus.emit("game:pause", true);
  }
}
