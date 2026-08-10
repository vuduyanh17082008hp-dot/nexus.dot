export const GAME_SLUG = "cyber-breakout";

export const SCENE = {
  BOOT: "BreakoutBoot",
  MENU: "BreakoutMenu",
  GAME: "BreakoutGame",
} as const;

export const PADDLE_SPEED = 420;
export const BALL_SPEED = 360;
export const MAX_LIVES = 3;

export type BrickKind = "normal" | "hard" | "power";

export interface LevelDef {
  rows: number;
  cols: number;
  pattern: number[][];
  label: string;
}
