import { VOID_CONFIG } from "../constants";
import type { VoidFormId } from "../levels/LevelSchema";
import type { InputFrame } from "@/games/nexus/input/InputManager";
import { PlayerBody } from "./PlayerBody";
import {
  BallForm,
  BasePlayerForm,
  CubeForm,
  type FormContext,
  RobotForm,
  ShipForm,
  SpiderForm,
  UfoForm,
  WaveForm,
} from "./forms";

const FORM_IDS: VoidFormId[] = ["CUBE", "SHIP", "BALL", "UFO", "WAVE", "ROBOT", "SPIDER"];

function isVoidForm(value: string): value is VoidFormId {
  return (FORM_IDS as string[]).includes(value);
}

export class PlayerController {
  readonly body = new PlayerBody();
  private form: BasePlayerForm = new CubeForm();
  private readonly forms: Record<VoidFormId, BasePlayerForm> = {
    CUBE: new CubeForm(),
    SHIP: new ShipForm(),
    BALL: new BallForm(),
    UFO: new UfoForm(),
    WAVE: new WaveForm(),
    ROBOT: new RobotForm(),
    SPIDER: new SpiderForm(),
  };
  readonly ctx: FormContext = {
    gravitySign: 1,
    speedMult: 1,
    grounded: false,
    coyoteTimer: 0,
  };
  /** True if a ground/coyote jump impulse was applied this sim step. */
  private jumpUsedThisStep = false;

  get formId(): VoidFormId {
    return this.form.id;
  }

  setForm(form: VoidFormId | string): void {
    const next: VoidFormId = isVoidForm(form) ? form : "CUBE";
    if (this.form.id === next) return;
    this.form.exit(this.body, this.ctx);
    this.form = this.forms[next];
    this.form.enter(this.body, this.ctx);
  }

  spawn(
    x: number,
    y: number,
    speedMult: number,
    gravity: "normal" | "reverse",
    form: VoidFormId = "CUBE",
  ): void {
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
    this.form = this.forms[form];
    this.form.enter(this.body, this.ctx);
  }

  markGrounded(grounded: boolean): void {
    if (grounded) {
      this.ctx.grounded = true;
      this.ctx.coyoteTimer = VOID_CONFIG.coyoteMs / 1000;
      this.body.onGround = true;
    } else {
      this.ctx.grounded = false;
      this.body.onGround = false;
    }
  }

  update(input: InputFrame, dt: number): void {
    this.jumpUsedThisStep = false;
    if (!this.body.alive || this.body.finished) return;
    if (!this.ctx.grounded && this.ctx.coyoteTimer > 0) {
      this.ctx.coyoteTimer = Math.max(0, this.ctx.coyoteTimer - dt);
    }
    this.body.snapshotPrev();
    const coyoteBefore = this.ctx.coyoteTimer;
    this.form.update(this.body, this.ctx, input, dt);
    // Forms clear coyote on successful ground jump
    if (coyoteBefore > 0 && this.ctx.coyoteTimer === 0 && !this.body.onGround) {
      this.jumpUsedThisStep = true;
    }
  }

  /** Post-collision buffered jump (land + PRIMARY same step). */
  tryGroundJump(): boolean {
    if (this.jumpUsedThisStep || !this.body.alive || this.body.finished) return false;
    const ok = this.form.tryGroundJump(this.body, this.ctx);
    if (ok) this.jumpUsedThisStep = true;
    return ok;
  }

  get didJumpThisStep(): boolean {
    return this.jumpUsedThisStep;
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
