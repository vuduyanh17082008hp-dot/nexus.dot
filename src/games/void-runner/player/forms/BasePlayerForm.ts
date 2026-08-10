import type { InputFrame } from "@/games/nexus/input/InputManager";
import type { VoidFormId } from "../../levels/LevelSchema";
import type { PlayerBody } from "../PlayerBody";

export interface FormContext {
  gravitySign: 1 | -1;
  speedMult: number;
  grounded: boolean;
  coyoteTimer: number;
}

export abstract class BasePlayerForm {
  abstract readonly id: VoidFormId;

  enter(_body: PlayerBody, _ctx: FormContext): void {}
  exit(_body: PlayerBody, _ctx: FormContext): void {}
  reset(body: PlayerBody, ctx: FormContext): void {
    this.enter(body, ctx);
  }
  /** Ground / coyote jump. Returns true if an impulse was applied. */
  tryGroundJump(_body: PlayerBody, _ctx: FormContext): boolean {
    return false;
  }
  abstract update(body: PlayerBody, ctx: FormContext, input: InputFrame, dt: number): void;
}
