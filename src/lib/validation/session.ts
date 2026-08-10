import { z } from "zod";

const GAME_SLUGS = [
  "boot-sequence",
  "neon-survivor",
  "void-runner",
  "cyber-breakout",
] as const;

export const sessionStartSchema = z.object({
  gameSlug: z.enum(GAME_SLUGS),
  deviceType: z.string().max(40).optional(),
  browser: z.string().max(200).optional(),
});

export const sessionCompleteSchema = z.object({
  sessionId: z.string().uuid(),
  score: z.number().int().nonnegative(),
  durationSeconds: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  idempotencyKey: z.string().min(8).max(120).optional(),
});

export const sessionCrashSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().max(1000).optional(),
});

export const historyQuerySchema = z.object({
  gameSlug: z.enum(GAME_SLUGS).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
