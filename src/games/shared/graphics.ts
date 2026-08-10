import type { GraphicsSettings, PerformancePreset } from "@/types/game";

export const GRAPHICS_PRESETS: Record<PerformancePreset, GraphicsSettings> = {
  low: {
    preset: "low",
    particles: false,
    screenShake: false,
    shadows: false,
    postProcessing: false,
    effectsQuality: 0,
  },
  medium: {
    preset: "medium",
    particles: true,
    screenShake: true,
    shadows: false,
    postProcessing: false,
    effectsQuality: 1,
  },
  high: {
    preset: "high",
    particles: true,
    screenShake: true,
    shadows: true,
    postProcessing: true,
    effectsQuality: 2,
  },
};

export function getGraphicsPreset(preset: PerformancePreset): GraphicsSettings {
  return { ...GRAPHICS_PRESETS[preset] };
}

export function particleCount(settings: GraphicsSettings, base: number): number {
  if (!settings.particles) return 0;
  return Math.floor(base * (settings.effectsQuality + 1));
}
