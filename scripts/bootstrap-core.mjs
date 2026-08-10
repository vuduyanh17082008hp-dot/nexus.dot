import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
function w(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trimStart(), "utf8");
  console.log("wrote", rel);
}

w(
  "src/types/database.ts",
  `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GameGenre =
  | "action"
  | "arcade"
  | "strategy"
  | "puzzle"
  | "racing"
  | "survival";

export type GameStatus = "draft" | "published" | "archived";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  xp: number;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  genre: GameGenre;
  thumbnail_url: string;
  banner_url: string;
  status: GameStatus;
  is_featured: boolean;
  play_count: number;
  rating: number;
  created_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  duration_seconds: number;
  metadata: Json;
  started_at: string;
  completed_at: string | null;
}

export interface GameStats {
  id: string;
  user_id: string;
  game_id: string;
  games_played: number;
  total_score: number;
  high_score: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  playtime_seconds: number;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  metadata: Json;
  created_at: string;
  profiles?: Pick<Profile, "username" | "display_name" | "avatar_url" | "level">;
  games?: Pick<Game, "slug" | "title">;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  game_slug: string | null;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievements?: Achievement;
}

export interface Favorite {
  user_id: string;
  game_id: string;
  created_at: string;
}

export interface GameSave {
  id: string;
  user_id: string;
  game_id: string;
  save_data: Json;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  master_volume: number;
  music_volume: number;
  sfx_volume: number;
  reduced_motion: boolean;
  performance_mode: "low" | "medium" | "high";
  show_mobile_controls: boolean;
  updated_at: string;
}

export interface SessionSubmitPayload {
  gameSlug: string;
  score: number;
  durationSeconds: number;
  metadata?: Record<string, unknown>;
}
`,
);

w(
  "src/types/game.ts",
  `export type PerformancePreset = "low" | "medium" | "high";

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
`,
);

w(
  "src/lib/utils/cn.ts",
  `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
);

w(
  "src/lib/utils/format.ts",
  `export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.floor(n));
}

export function formatPlaytime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return \`\${h}h \${m}m\`;
  if (m > 0) return \`\${m}m\`;
  return \`\${seconds}s\`;
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return \`\${mins}m ago\`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return \`\${hours}h ago\`;
  const days = Math.floor(hours / 24);
  return \`\${days}d ago\`;
}
`,
);

w(
  "src/lib/env.ts",
  `import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export type PublicEnv = z.infer<typeof envSchema>;

export function getPublicEnv(): PublicEnv {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!parsed.success) return {};
  return parsed.data;
}

export function isSupabaseConfigured(): boolean {
  const env = getPublicEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
  );
}
`,
);

w(
  "src/lib/xp/curve.ts",
  `const BASE = 100;
const EXP = 1.35;

export function getXPRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(BASE * Math.pow(i, EXP));
  }
  return total;
}

export function getXPForNextLevel(level: number): number {
  return Math.floor(BASE * Math.pow(Math.max(1, level), EXP));
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  let remaining = Math.max(0, xp);
  while (remaining >= getXPForNextLevel(level)) {
    remaining -= getXPForNextLevel(level);
    level += 1;
    if (level > 200) break;
  }
  return level;
}

export function getLevelProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number;
} {
  const level = getLevelFromXP(xp);
  const floor = getXPRequiredForLevel(level);
  const xpForNext = getXPForNextLevel(level);
  const xpIntoLevel = Math.max(0, xp - floor);
  const progress = xpForNext === 0 ? 1 : Math.min(1, xpIntoLevel / xpForNext);
  return { level, currentLevelXp: floor, xpIntoLevel, xpForNext, progress };
}

export function calculateSessionXP(input: {
  score: number;
  durationSeconds: number;
  isHighScore: boolean;
  isDailyFirst: boolean;
}): number {
  const base = Math.floor(input.score / 100) + Math.floor(input.durationSeconds / 30);
  const highBonus = input.isHighScore ? 50 : 0;
  const dailyBonus = input.isDailyFirst ? 25 : 0;
  return Math.max(5, base + highBonus + dailyBonus);
}
`,
);

w(
  "src/lib/achievements/catalog.ts",
  `export interface AchievementDef {
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
`,
);

w(
  "src/lib/game/catalog.ts",
  `import type { Game, GameGenre } from "@/types/database";

export const GAME_CATALOG: Game[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "neon-survivor",
    title: "Neon Survivor",
    description:
      "A top-down survival shooter in a collapsing neon grid. Survive endless waves, collect power-ups, and carve through the horde.",
    short_description: "Top-down survival shooter with escalating waves.",
    genre: "survival",
    thumbnail_url: "/games/neon-survivor.svg",
    banner_url: "/games/neon-survivor-banner.svg",
    status: "published",
    is_featured: true,
    play_count: 12840,
    rating: 4.8,
    created_at: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "void-runner",
    title: "Void Runner",
    description:
      "Sprint through an endless cyber void. Jump obstacles, collect coins, and push your high score as speed ramps up.",
    short_description: "Endless runner through the cyber void.",
    genre: "arcade",
    thumbnail_url: "/games/void-runner.svg",
    banner_url: "/games/void-runner-banner.svg",
    status: "published",
    is_featured: true,
    play_count: 9420,
    rating: 4.6,
    created_at: "2026-02-02T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "cyber-breakout",
    title: "Cyber Breakout",
    description:
      "A modern Breakout experience with physics, power-ups, particle juice, and multi-stage campaigns.",
    short_description: "Modern Breakout with levels and power-ups.",
    genre: "puzzle",
    thumbnail_url: "/games/cyber-breakout.svg",
    banner_url: "/games/cyber-breakout-banner.svg",
    status: "published",
    is_featured: false,
    play_count: 7155,
    rating: 4.7,
    created_at: "2026-03-15T00:00:00.000Z",
  },
];

export const CATEGORIES: { slug: GameGenre; title: string; description: string }[] = [
  { slug: "action", title: "Action", description: "High-intensity combat and reflexes." },
  { slug: "arcade", title: "Arcade", description: "Pick-up-and-play classics reinvented." },
  { slug: "strategy", title: "Strategy", description: "Think ahead. Outplay everyone." },
  { slug: "puzzle", title: "Puzzle", description: "Precision, timing, and clever clears." },
  { slug: "racing", title: "Racing", description: "Speed, lanes, and perfect lines." },
  { slug: "survival", title: "Survival", description: "Last as long as you can." },
];

export function getGameBySlug(slug: string): Game | undefined {
  return GAME_CATALOG.find((g) => g.slug === slug);
}

export function getGamesByGenre(genre: GameGenre): Game[] {
  return GAME_CATALOG.filter((g) => g.genre === genre && g.status === "published");
}

export function searchGames(query: string): Game[] {
  const q = query.trim().toLowerCase();
  if (!q) return GAME_CATALOG.filter((g) => g.status === "published");
  return GAME_CATALOG.filter((g) => {
    if (g.status !== "published") return false;
    return (
      g.title.toLowerCase().includes(q) ||
      g.genre.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.short_description.toLowerCase().includes(q)
    );
  });
}

export type SortKey = "trending" | "newest" | "most-played" | "highest-rated";

export function sortGames(games: Game[], sort: SortKey): Game[] {
  const list = [...games];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    case "most-played":
      return list.sort((a, b) => b.play_count - a.play_count);
    case "highest-rated":
      return list.sort((a, b) => b.rating - a.rating);
    case "trending":
    default:
      return list.sort((a, b) => b.play_count * b.rating - a.play_count * a.rating);
  }
}
`,
);

console.log("bootstrap-core complete");
