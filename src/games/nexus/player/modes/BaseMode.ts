import type { InputFrame } from "../../input/InputManager";
import type { PlayerBody } from "../PlayerBody";

export type PlayerForm =
  | "CORE"
  | "GLIDER"
  | "FLUX"
  | "PULSE"
  | "VECTOR"
  | "TITAN"
  | "PHASE"
  | "SWING"
  | "JET";

export interface ModeContext {
  gravitySign: 1 | -1;
  speedMult: number;
  grounded: boolean;
  coyoteTimer: number;
}

export interface PlayerMode {
  readonly id: PlayerForm;
  enter(body: PlayerBody, ctx: ModeContext): void;
  exit(body: PlayerBody, ctx: ModeContext): void;
  update(body: PlayerBody, ctx: ModeContext, input: InputFrame, dt: number): void;
  reset(body: PlayerBody, ctx: ModeContext): void;
}
