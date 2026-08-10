import type { InputFrame } from "@/games/nexus/input/InputManager";
import { VOID_CONFIG } from "../../constants";
import type { PlayerBody } from "../PlayerBody";
import { BasePlayerForm, type FormContext } from "./BasePlayerForm";

/** Hold to rise diagonally; release to fall diagonally. */
export class WaveForm extends BasePlayerForm {
  readonly id = "WAVE" as const;

  enter(body: PlayerBody, ctx: FormContext): void {
    body.setSize(VOID_CONFIG.wave.width, VOID_CONFIG.wave.height);
    body.vx = VOID_CONFIG.wave.runSpeed * ctx.speedMult;
  }

  update(body: PlayerBody, ctx: FormContext, input: InputFrame, dt: number): void {
    const cfg = VOID_CONFIG.wave;
    body.vx = cfg.runSpeed * ctx.speedMult;
    body.vy = (input.primaryHeld ? -cfg.riseSpeed : cfg.fallSpeed) * ctx.gravitySign;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    body.rotation = Math.atan2(body.vy, body.vx);
  }
}
