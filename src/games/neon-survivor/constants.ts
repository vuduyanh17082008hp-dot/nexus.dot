import type { GameBootContext } from "@/games/shared/create-game";

export const GAME_SLUG = "neon-survivor";
export const SCENE = {
  BOOT: "NeonBoot",
  MENU: "NeonMenu",
  GAME: "NeonGame",
  UI: "NeonUI",
} as const;

export interface NeonRegistry {
  ctx: GameBootContext;
  kills: number;
  wave: number;
  survivalTime: number;
  highestWave: number;
  restart: () => void;
}

export const PLAYER_SPEED = 280;
export const BULLET_SPEED = 520;
export const ENEMY_BASE_SPEED = 80;
export const FIRE_RATE = 180;

export type PowerUpKind = "health" | "rapid" | "damage" | "speed";

export const POWERUP_COLORS: Record<PowerUpKind, number> = {
  health: 0x22ff88,
  rapid: 0xffaa00,
  damage: 0xff3366,
  speed: 0x44ccff,
};
