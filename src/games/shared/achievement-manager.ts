import { ACHIEVEMENT_CATALOG, evaluateAchievements } from "@/lib/achievements/catalog";
import type { EventBus } from "./event-bus";

const STORAGE_KEY = "nexus:achievements";

export class AchievementManager {
  private unlocked: Set<string>;

  constructor(
    private readonly gameSlug: string,
    private readonly bus: EventBus,
  ) {
    this.unlocked = this.loadUnlocked();
  }

  checkAndUnlock(meta: Record<string, number>): string[] {
    const newlyUnlocked: string[] = [];
    const candidates = evaluateAchievements(this.gameSlug, meta);

    for (const achievement of candidates) {
      if (this.unlocked.has(achievement.slug)) continue;
      this.unlocked.add(achievement.slug);
      newlyUnlocked.push(achievement.slug);
      this.bus.emit("achievement:unlock", {
        slug: achievement.slug,
        name: achievement.name,
      });
    }

    if (newlyUnlocked.length > 0) this.persist();
    return newlyUnlocked;
  }

  getUnlockedSlugs(): string[] {
    return [...this.unlocked];
  }

  estimateXp(slugs: string[]): number {
    return slugs.reduce((sum, slug) => {
      const def = ACHIEVEMENT_CATALOG.find((a) => a.slug === slug);
      return sum + (def?.xp_reward ?? 0);
    }, 0);
  }

  private loadUnlocked(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.unlocked]));
  }
}
