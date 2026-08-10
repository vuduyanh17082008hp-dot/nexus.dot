import type { InputFrame } from "@/games/nexus/input/InputManager";
import { VOID_CONFIG } from "../../constants";
import type { PlayerBody } from "../PlayerBody";
import { BasePlayerForm, type FormContext } from "./BasePlayerForm";

/** Bounce on ground contact / primary. */
export class BallForm extends BasePlayerForm {
  readonly id = "BALL" as const;

  enter(body: PlayerBody, ctx: FormContext): void {
    body.setSize(VOID_CONFIG.ball.width, VOID_CONFIG.ball.height);
    body.vx = VOID_CONFIG.ball.runSpeed * ctx.speedMult;
  }

  update(body: PlayerBody, ctx: FormContext, input: InputFrame, dt: number): void {
    const cfg = VOID_CONFIG.ball;
    body.vx = cfg.runSpeed * ctx.speedMult;
    body.vy += cfg.gravity * ctx.gravitySign * dt;

    if ((ctx.grounded || input.primaryPressed) && body.alive) {
      if (ctx.grounded || input.primaryPressed) {
        body.vy = cfg.bounceVelocity * ctx.gravitySign;
        ctx.coyoteTimer = 0;
        body.onGround = false;
      }
    }

    if (ctx.gravitySign === 1) body.vy = Math.min(body.vy, cfg.maxFallSpeed);
    else body.vy = Math.max(body.vy, -cfg.maxFallSpeed);

    body.x += body.vx * dt;
    body.y += body.vy * dt;
    body.rotation += 12 * dt;
  }
}
