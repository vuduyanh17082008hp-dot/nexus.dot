import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, _ and -")
    .optional(),
  displayName: z.string().min(1).max(48).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().max(280).nullable().optional(),
});

export const updateSettingsSchema = z.object({
  masterVolume: z.number().min(0).max(1).optional(),
  musicVolume: z.number().min(0).max(1).optional(),
  sfxVolume: z.number().min(0).max(1).optional(),
  reducedMotion: z.boolean().optional(),
  performanceMode: z.enum(["low", "medium", "high"]).optional(),
  showMobileControls: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
