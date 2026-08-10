export interface AchievementDef {
  slug: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  game_slug: string | null;
  check: (meta: Record<string, number>) => boolean;
}

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  {
    slug: "first-blood",
    name: "First Blood",
    description: "Kill your first enemy.",
    icon: "swords",
    xp_reward: 25,
    game_slug: "neon-survivor",
    check: (m) => (m.kills ?? 0) >= 1,
  },
  {
    slug: "survivor",
    name: "Survivor",
    description: "Survive 5 minutes in Neon Survivor.",
    icon: "shield",
    xp_reward: 100,
    game_slug: "neon-survivor",
    check: (m) => (m.survivalTime ?? 0) >= 300,
  },
  {
    slug: "unstoppable",
    name: "Unstoppable",
    description: "Kill 100 enemies in a single run.",
    icon: "flame",
    xp_reward: 150,
    game_slug: "neon-survivor",
    check: (m) => (m.kills ?? 0) >= 100,
  },
  {
    slug: "high-roller",
    name: "High Roller",
    description: "Reach 10,000 score in any game.",
    icon: "trophy",
    xp_reward: 120,
    game_slug: null,
    check: (m) => (m.score ?? 0) >= 10000,
  },
  {
    slug: "runner",
    name: "Runner",
    description: "Travel 5,000 meters in Void Runner.",
    icon: "footprints",
    xp_reward: 100,
    game_slug: "void-runner",
    check: (m) => (m.distance ?? 0) >= 5000,
  },
  {
    slug: "coin-collector",
    name: "Coin Collector",
    description: "Collect 100 coins in Void Runner.",
    icon: "coins",
    xp_reward: 75,
    game_slug: "void-runner",
    check: (m) => (m.coins ?? 0) >= 100,
  },
  {
    slug: "breakout-master",
    name: "Breakout Master",
    description: "Complete all Cyber Breakout stages.",
    icon: "sparkles",
    xp_reward: 200,
    game_slug: "cyber-breakout",
    check: (m) => (m.level ?? 0) >= 5 || Boolean(m.victory),
  },
  {
    slug: "brick-breaker",
    name: "Brick Breaker",
    description: "Destroy 50 blocks in Cyber Breakout.",
    icon: "box",
    xp_reward: 50,
    game_slug: "cyber-breakout",
    check: (m) => (m.blocksDestroyed ?? 0) >= 50,
  },
  {
    slug: "first-session",
    name: "Boot Sequence",
    description: "Complete your first game session.",
    icon: "rocket",
    xp_reward: 15,
    game_slug: null,
    check: () => true,
  },
];

export function evaluateAchievements(
  gameSlug: string,
  meta: Record<string, number>,
): AchievementDef[] {
  return ACHIEVEMENT_CATALOG.filter((a) => {
    if (a.game_slug && a.game_slug !== gameSlug) return false;
    return a.check(meta);
  });
}
