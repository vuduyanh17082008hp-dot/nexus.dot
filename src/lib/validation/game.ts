import { z } from "zod";

const GAME_SLUGS = [
  "boot-sequence",
  "neon-survivor",
  "void-runner",
  "cyber-breakout",
] as const;

export const SCORE_BOUNDS: Record<
  (typeof GAME_SLUGS)[number],
  { min: number; max: number; maxDurationSeconds: number }
> = {
  "boot-sequence": { min: 0, max: 50_000, maxDurationSeconds: 1_800 },
  "neon-survivor": { min: 0, max: 500_000, maxDurationSeconds: 7_200 },
  "void-runner": { min: 0, max: 250_000, maxDurationSeconds: 3_600 },
  "cyber-breakout": { min: 0, max: 100_000, maxDurationSeconds: 7_200 },
};

export const sessionSubmitSchema = z.object({
  gameSlug: z.enum(GAME_SLUGS),
  score: z.number().int().nonnegative(),
  durationSeconds: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export type SessionSubmitInput = z.infer<typeof sessionSubmitSchema>;

export function clampSessionValues(input: SessionSubmitInput): SessionSubmitInput {
  const bounds = SCORE_BOUNDS[input.gameSlug];
  return {
    ...input,
    score: Math.min(Math.max(input.score, bounds.min), bounds.max),
    durationSeconds: Math.min(Math.max(input.durationSeconds, 0), bounds.maxDurationSeconds),
  };
}

export const leaderboardQuerySchema = z.object({
  gameSlug: z.enum(GAME_SLUGS).optional(),
  period: z.enum(["today", "week", "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export const favoriteSchema = z.object({
  gameSlug: z.enum(GAME_SLUGS),
});

export const gameSaveSchema = z.object({
  gameSlug: z.enum(GAME_SLUGS),
  saveData: z.record(z.string(), z.unknown()),
});

export type FavoriteInput = z.infer<typeof favoriteSchema>;
export type GameSaveInput = z.infer<typeof gameSaveSchema>;
