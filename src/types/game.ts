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
  /** 0–100 run progress (rhythm runners) */
  progress?: number;
  /** Best progress percent */
  best?: number;
  /** Attempt counter */
  attempt?: number;
  /** Active player form id (CUBE, SHIP, …) */
  form?: string;
}

export interface GameEndResult {
  score: number;
  highScore: number;
  xpGained: number;
  achievementsUnlocked: string[];
  metadata: Record<string, number | string | boolean>;
}

export interface RoundCompletePayload {
  round: number;
  score: number;
  progress: number;
  time: number;
  /** True when this was the last round of the run */
  final?: boolean;
}

export type GameEventMap = {
  "hud:update": GameHudStats;
  "game:over": GameEndResult;
  "round-complete": RoundCompletePayload;
  "game:pause": boolean;
  "game:ready": void;
  /** Soft restart inside Phaser (no page reload) — clears shell session guards */
  "game:restart": void;
  /** Player chose return-to-menu from an in-game victory / results screen */
  "game:exit": void;
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
