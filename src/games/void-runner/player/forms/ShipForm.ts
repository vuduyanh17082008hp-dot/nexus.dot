import type { InputFrame } from "@/games/nexus/input/InputManager";
import { VOID_CONFIG } from "../../constants";
import type { PlayerBody } from "../PlayerBody";
import { BasePlayerForm, type FormContext } from "./BasePlayerForm";

/** Hold PRIMARY to thrust up; release to fall. Auto-runs. */
export class ShipForm extends BasePlayerForm {
  readonly id = "SHIP" as const;

  enter(body: PlayerBody, ctx: FormContext): void {
    body.setSize(VOID_CONFIG.ship.width, VOID_CONFIG.ship.height);
    body.vx = VOID_CONFIG.ship.runSpeed * ctx.speedMult;
    body.rotation = 0;
  }

  update(body: PlayerBody, ctx: FormContext, input: InputFrame, dt: number): void {
    const cfg = VOID_CONFIG.ship;
    body.vx = cfg.runSpeed * ctx.speedMult;

    const thrustDir = -ctx.gravitySign;
    if (input.primaryHeld) {
      body.vy += cfg.thrust * thrustDir * dt;
    } else {
      body.vy += cfg.gravity * ctx.gravitySign * dt;
    }

    if (ctx.gravitySign === 1) {
      body.vy = Math.max(-cfg.maxRiseSpeed, Math.min(cfg.maxFallSpeed, body.vy));
    } else {
      body.vy = Math.min(cfg.maxRiseSpeed, Math.max(-cfg.maxFallSpeed, body.vy));
    }

    body.x += body.vx * dt;
    body.y += body.vy * dt;

    const targetRot = PhaserMathClamp(body.vy / cfg.maxFallSpeed, -1, 1) * 0.55 * ctx.gravitySign;
    body.rotation += (targetRot - body.rotation) * Math.min(1, 10 * dt);
  }
}

function PhaserMathClamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
