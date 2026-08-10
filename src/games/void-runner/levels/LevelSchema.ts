import { z } from "zod";

export const voidFormSchema = z.enum([
  "CUBE",
  "SHIP",
  "BALL",
  "UFO",
  "WAVE",
  "ROBOT",
  "SPIDER",
]);

export type VoidFormId = z.infer<typeof voidFormSchema>;

export const voidLevelObjectSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "BLOCK",
    "PLATFORM",
    "SPIKE",
    "PAD_JUMP",
    "PORTAL_GRAVITY",
    "FORM_PORTAL",
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

export const voidLevelSongSchema = z.object({
  id: z.string(),
  bpm: z.number().positive().default(128),
  offsetMs: z.number().default(0),
  durationSeconds: z.number().positive().default(80),
  assetPath: z.string().optional(),
});

export const voidLevelSettingsSchema = z.object({
  speedTier: z.enum(["0.75", "1.0", "1.25", "1.5", "1.8", "2.1"]).default("1.0"),
  startForm: voidFormSchema.default("CUBE"),
  gravity: z.enum(["normal", "reverse"]).default("normal"),
  startX: z.number().default(120),
  startY: z.number().default(420),
  finishX: z.number().positive(),
  groundY: z.number().default(500),
});

export const voidLevelSchema = z.object({
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
  song: voidLevelSongSchema,
  settings: voidLevelSettingsSchema,
  objects: z.array(voidLevelObjectSchema),
  triggers: z.array(z.record(z.string(), z.unknown())).default([]),
});

export type VoidLevelData = z.infer<typeof voidLevelSchema>;
export type VoidLevelObject = z.infer<typeof voidLevelObjectSchema>;

export function parseVoidLevelData(raw: unknown): VoidLevelData {
  return voidLevelSchema.parse(raw);
}
