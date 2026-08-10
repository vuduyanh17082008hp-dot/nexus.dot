import { z } from "zod";

export const feedbackCategories = [
  "BUG",
  "GAMEPLAY_ISSUE",
  "PERFORMANCE_ISSUE",
  "UI_ISSUE",
  "BALANCE_ISSUE",
  "FEATURE_REQUEST",
  "GENERAL_FEEDBACK",
] as const;

export const feedbackSchema = z.object({
  category: z.enum(feedbackCategories),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(8000),
  gameSlug: z
    .enum(["boot-sequence", "neon-survivor", "void-runner", "cyber-breakout"])
    .optional()
    .nullable(),
  sessionId: z.string().uuid().optional().nullable(),
  contactPermission: z.boolean().default(false),
  route: z.string().max(300).optional(),
  gameVersion: z.string().max(40).optional(),
  browser: z.string().max(200).optional(),
  device: z.string().max(80).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  screenshotPath: z.string().max(500).optional().nullable(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const errorReportSchema = z.object({
  source: z.enum(["CLIENT", "GAME_ENGINE", "API"]),
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional().nullable(),
  route: z.string().max(300).optional().nullable(),
  gameSlug: z
    .enum(["boot-sequence", "neon-survivor", "void-runner", "cyber-breakout"])
    .optional()
    .nullable(),
  sessionId: z.string().uuid().optional().nullable(),
  gameVersion: z.string().max(40).optional().nullable(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});
