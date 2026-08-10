import type { InputFrame } from "@/games/nexus/input/InputManager";
import { VOID_CONFIG } from "../../constants";
import type { PlayerBody } from "../PlayerBody";
import { BasePlayerForm, type FormContext } from "./BasePlayerForm";

/** Tap PRIMARY for mid-air hops. */
export class UfoForm extends BasePlayerForm {
  readonly id = "UFO" as const;

  enter(body: PlayerBody, ctx: FormContext): void {
    body.setSize(VOID_CONFIG.ufo.width, VOID_CONFIG.ufo.height);
    body.vx = VOID_CONFIG.ufo.runSpeed * ctx.speedMult;
  }

  update(body: PlayerBody, ctx: FormContext, input: InputFrame, dt: number): void {
    const cfg = VOID_CONFIG.ufo;
    body.vx = cfg.runSpeed * ctx.speedMult;
    body.vy += cfg.gravity * ctx.gravitySign * dt;

    if (input.primaryPressed && body.alive) {
      body.vy = cfg.hopVelocity * ctx.gravitySign;
      body.onGround = false;
    }

    if (ctx.gravitySign === 1) body.vy = Math.min(body.vy, cfg.maxFallSpeed);
    else body.vy = Math.max(body.vy, -cfg.maxFallSpeed);

    body.x += body.vx * dt;
    body.y += body.vy * dt;
    body.rotation *= 0.9;
  }
}
