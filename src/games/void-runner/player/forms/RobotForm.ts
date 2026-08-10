import type { InputFrame } from "@/games/nexus/input/InputManager";
import { VOID_CONFIG } from "../../constants";
import type { PlayerBody } from "../PlayerBody";
import { BasePlayerForm, type FormContext } from "./BasePlayerForm";

/** Jump like Cube; hold PRIMARY for brief hover thrust. */
export class RobotForm extends BasePlayerForm {
  readonly id = "ROBOT" as const;
  private jumpHeld = false;

  enter(body: PlayerBody, ctx: FormContext): void {
    body.setSize(VOID_CONFIG.robot.width, VOID_CONFIG.robot.height);
    body.vx = VOID_CONFIG.robot.runSpeed * ctx.speedMult;
    this.jumpHeld = false;
  }

  exit(): void {
    this.jumpHeld = false;
  }

  update(body: PlayerBody, ctx: FormContext, input: InputFrame, dt: number): void {
    const cfg = VOID_CONFIG.robot;
    body.vx = cfg.runSpeed * ctx.speedMult;

    const canJump = ctx.grounded || ctx.coyoteTimer > 0;
    if ((input.primaryPressed || (input.bufferedPrimary && canJump)) && canJump && body.alive) {
      body.vy = cfg.jumpVelocity * ctx.gravitySign;
      body.onGround = false;
      ctx.coyoteTimer = 0;
      this.jumpHeld = true;
    }
    if (input.primaryReleased) this.jumpHeld = false;

    body.vy += cfg.gravity * ctx.gravitySign * dt;
    if (input.primaryHeld && !ctx.grounded && this.jumpHeld === false) {
      body.vy -= cfg.hoverThrust * ctx.gravitySign * dt;
    }

    if (ctx.gravitySign === 1) body.vy = Math.min(body.vy, cfg.maxFallSpeed);
    else body.vy = Math.max(body.vy, -cfg.maxFallSpeed);

    body.x += body.vx * dt;
    body.y += body.vy * dt;
  }
}
