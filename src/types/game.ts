export type PerformancePreset = "low" | "medium" | "high";

export interface GraphicsSettings {
  preset: PerformancePreset;
  particles: boolean;
  screenShake: boolean;
  shadows: boolean;
  postProcessing: boolean;
  effectsQuality: 0 | 1 | 2;
}

export interface GameHudStats {
  score: number;
  highScore?: number;
  lives?: number;
  level?: number;
  wave?: number;
  kills?: number;
  coins?: number;
  distance?: number;
  health?: number;
  time?: number;
}

export interface GameEndResult {
  score: number;
  highScore: number;
  xpGained: number;
  achievementsUnlocked: string[];
  metadata: Record<string, number | string | boolean>;
}

export type GameEventMap = {
  "hud:update": GameHudStats;
  "game:over": GameEndResult;
  "game:pause": boolean;
  "game:ready": void;
  "achievement:unlock": { slug: string; name: string };
  "score:popup": { value: number; x: number; y: number };
  "audio:unlock": void;
  "nexus:game-started": void;
  "nexus:pause": void;
  "nexus:resume": void;
  "nexus:error": { message: string };
};

export interface NexusGameBridge {
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMute: (muted: boolean) => void;
  onVolume: (master: number, music: number, sfx: number) => void;
  onGraphics: (settings: GraphicsSettings) => void;
  destroy: () => void;
}
