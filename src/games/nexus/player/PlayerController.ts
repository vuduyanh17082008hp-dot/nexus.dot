import { NEXUS_CONFIG } from "../core/GameConfig";
import type { InputFrame } from "../input/InputManager";
import { PlayerBody } from "./PlayerBody";
import type { ModeContext, PlayerForm, PlayerMode } from "./modes/BaseMode";
import { CoreMode } from "./modes/CoreMode";

export class PlayerController {
  readonly body = new PlayerBody();
  private mode: PlayerMode = new CoreMode();
  private readonly modes: Record<"CORE", PlayerMode> = {
    CORE: new CoreMode(),
  };
  readonly ctx: ModeContext = {
    gravitySign: 1,
    speedMult: 1,
    grounded: false,
    coyoteTimer: 0,
  };

  setForm(form: PlayerForm): void {
    if (form !== "CORE") {
      // Phase 1: only CORE is active; stubs reserved for later phases
      form = "CORE";
    }
    if (this.mode.id === form) return;
    this.mode.exit(this.body, this.ctx);
    this.mode = this.modes.CORE;
    this.mode.enter(this.body, this.ctx);
  }

  spawn(x: number, y: number, speedMult: number, gravity: "normal" | "reverse"): void {
    this.body.alive = true;
    this.body.finished = false;
    this.body.vx = 0;
    this.body.vy = 0;
    this.body.rotation = 0;
    this.body.onGround = false;
    this.body.setPosition(x, y);
    this.ctx.speedMult = speedMult;
    this.ctx.gravitySign = gravity === "reverse" ? -1 : 1;
    this.ctx.grounded = false;
    this.ctx.coyoteTimer = 0;
    this.mode = this.modes.CORE;
    this.mode.enter(this.body, this.ctx);
  }

  markGrounded(grounded: boolean): void {
    if (grounded) {
      this.ctx.grounded = true;
      this.ctx.coyoteTimer = NEXUS_CONFIG.coyoteMs / 1000;
      this.body.onGround = true;
    } else {
      this.ctx.grounded = false;
      this.body.onGround = false;
    }
  }

  update(input: InputFrame, dt: number): void {
    if (!this.body.alive || this.body.finished) return;
    if (!this.ctx.grounded && this.ctx.coyoteTimer > 0) {
      this.ctx.coyoteTimer = Math.max(0, this.ctx.coyoteTimer - dt);
    }
    this.body.snapshotPrev();
    this.mode.update(this.body, this.ctx, input, dt);
  }

  kill(): void {
    this.body.alive = false;
    this.body.vx = 0;
    this.body.vy = 0;
  }

  finish(): void {
    this.body.finished = true;
    this.body.vx = 0;
    this.body.vy = 0;
  }
}
