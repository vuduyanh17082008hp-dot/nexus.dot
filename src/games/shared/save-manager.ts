export interface GameSaveData {
  highScore: number;
  highWave?: number;
  bestDistance?: number;
  bestCoins?: number;
  highestLevel?: number;
  totalPlays: number;
  lastPlayedAt: string;
  stats: Record<string, number>;
}

const PREFIX = "nexus:save:";

export class SaveManager {
  constructor(private readonly gameSlug: string) {}

  load(): GameSaveData {
    if (typeof window === "undefined") return defaultSave();
    try {
      const raw = localStorage.getItem(PREFIX + this.gameSlug);
      if (!raw) return defaultSave();
      return { ...defaultSave(), ...JSON.parse(raw) };
    } catch {
      return defaultSave();
    }
  }

  save(data: Partial<GameSaveData>): GameSaveData {
    const current = this.load();
    const merged: GameSaveData = {
      ...current,
      ...data,
      stats: { ...current.stats, ...data.stats },
      lastPlayedAt: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(PREFIX + this.gameSlug, JSON.stringify(merged));
    }
    return merged;
  }

  recordPlay(score: number, stats: Record<string, number> = {}): GameSaveData {
    const current = this.load();
    return this.save({
      highScore: Math.max(current.highScore, score),
      highWave: Math.max(current.highWave ?? 0, stats.highestWave ?? 0),
      bestDistance: Math.max(current.bestDistance ?? 0, stats.distance ?? 0),
      bestCoins: Math.max(current.bestCoins ?? 0, stats.coins ?? 0),
      highestLevel: Math.max(current.highestLevel ?? 0, stats.level ?? 0),
      totalPlays: current.totalPlays + 1,
      stats: { ...current.stats, ...stats },
    });
  }
}

function defaultSave(): GameSaveData {
  return {
    highScore: 0,
    totalPlays: 0,
    lastPlayedAt: "",
    stats: {},
  };
}
