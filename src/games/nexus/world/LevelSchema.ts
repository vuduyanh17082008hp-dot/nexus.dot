import { z } from "zod";

export const levelObjectSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "BLOCK",
    "PLATFORM",
    "SPIKE",
    "PAD_JUMP",
    "PORTAL_GRAVITY",
    "CHECKPOINT",
    "FINISH",
    "COLLECTIBLE",
    "DECORATION",
  ]),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().default(40),
  height: z.number().positive().default(40),
  rotation: z.number().default(0),
  scaleX: z.number().positive().default(1),
  scaleY: z.number().positive().default(1),
  layer: z.number().int().default(1),
  groups: z.array(z.number().int()).default([]),
  properties: z.record(z.string(), z.unknown()).default({}),
});

export const levelSongSchema = z.object({
  id: z.string(),
  bpm: z.number().positive().default(120),
  offsetMs: z.number().default(0),
  durationSeconds: z.number().positive().default(90),
  /** Optional path under /public — gameplay works without audio asset */
  assetPath: z.string().optional(),
});

export const levelSettingsSchema = z.object({
  speedTier: z.enum(["0.75", "1.0", "1.25", "1.5", "1.8", "2.1"]).default("1.0"),
  startForm: z.enum(["CORE"]).default("CORE"),
  gravity: z.enum(["normal", "reverse"]).default("normal"),
  startX: z.number().default(80),
  startY: z.number().default(400),
  finishX: z.number().positive(),
  groundY: z.number().default(480),
});

export const levelSchema = z.object({
  metadata: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().default(""),
    difficulty: z
      .enum([
        "UNRATED",
        "ZEN",
        "EASY",
        "NORMAL",
        "HARD",
        "INTENSE",
        "CHAOS",
        "NEXUS_I",
        "NEXUS_II",
        "NEXUS_III",
        "NEXUS_IV",
        "NEXUS_V",
      ])
      .default("EASY"),
    version: z.string().default("1.0.0"),
    official: z.boolean().default(true),
  }),
  song: levelSongSchema,
  settings: levelSettingsSchema,
  objects: z.array(levelObjectSchema),
  triggers: z.array(z.record(z.string(), z.unknown())).default([]),
});

export type LevelData = z.infer<typeof levelSchema>;
export type LevelObject = z.infer<typeof levelObjectSchema>;

export function parseLevelData(raw: unknown): LevelData {
  return levelSchema.parse(raw);
}
