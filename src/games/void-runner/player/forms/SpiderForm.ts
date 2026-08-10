import type { InputFrame } from "@/games/nexus/input/InputManager";
import { VOID_CONFIG } from "../../constants";
import type { PlayerBody } from "../PlayerBody";
import { BasePlayerForm, type FormContext } from "./BasePlayerForm";

/** Cube-like jump stub; wall-cling reserved for later. */
export class SpiderForm extends BasePlayerForm {
  readonly id = "SPIDER" as const;

  enter(body: PlayerBody, ctx: FormContext): void {
    body.setSize(VOID_CONFIG.spider.width, VOID_CONFIG.spider.height);
    body.vx = VOID_CONFIG.spider.runSpeed * ctx.speedMult;
  }

  update(body: PlayerBody, ctx: FormContext, input: InputFrame, dt: number): void {
    const cfg = VOID_CONFIG.spider;
    body.vx = cfg.runSpeed * ctx.speedMult;
    const canJump = ctx.grounded || ctx.coyoteTimer > 0;
    if ((input.primaryPressed || input.bufferedPrimary) && canJump && body.alive) {
      body.vy = cfg.jumpVelocity * ctx.gravitySign;
      body.onGround = false;
      ctx.coyoteTimer = 0;
    }
    body.vy += cfg.gravity * ctx.gravitySign * dt;
    if (ctx.gravitySign === 1) body.vy = Math.min(body.vy, cfg.maxFallSpeed);
    else body.vy = Math.max(body.vy, -cfg.maxFallSpeed);
    body.x += body.vx * dt;
    body.y += body.vy * dt;
  }
}
