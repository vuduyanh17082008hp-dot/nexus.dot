"use client";

const RECENT_KEY = "nexus-recent-games";
const FAVORITES_KEY = "nexus-favorites";
const SESSIONS_KEY = "nexus-local-sessions";

export interface RecentEntry {
  slug: string;
  title: string;
  thumbnail_url: string;
  lastPlayedAt: string;
}

export interface LocalSessionResult {
  score: number;
  xpGained: number;
  achievementsUnlocked: string[];
  highScore: number;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getRecentGames(): RecentEntry[] {
  return readJson<RecentEntry[]>(RECENT_KEY, []);
}

export function addRecentGame(entry: Omit<RecentEntry, "lastPlayedAt">): void {
  const list = getRecentGames().filter((g) => g.slug !== entry.slug);
  list.unshift({ ...entry, lastPlayedAt: new Date().toISOString() });
  writeJson(RECENT_KEY, list.slice(0, 12));
}

export function getLocalFavorites(): string[] {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export function toggleLocalFavorite(slug: string): boolean {
  const set = new Set(getLocalFavorites());
  if (set.has(slug)) {
    set.delete(slug);
    writeJson(FAVORITES_KEY, [...set]);
    return false;
  }
  set.add(slug);
  writeJson(FAVORITES_KEY, [...set]);
  return true;
}

export function isLocalFavorite(slug: string): boolean {
  return getLocalFavorites().includes(slug);
}

export function saveLocalSession(slug: string, result: LocalSessionResult): void {
  const sessions = readJson<Record<string, LocalSessionResult>>(SESSIONS_KEY, {});
  const prev = sessions[slug];
  sessions[slug] = {
    ...result,
    highScore: Math.max(prev?.highScore ?? 0, result.highScore),
  };
  writeJson(SESSIONS_KEY, sessions);
}

export function getLocalHighScore(slug: string): number {
  const sessions = readJson<Record<string, LocalSessionResult>>(SESSIONS_KEY, {});
  return sessions[slug]?.highScore ?? 0;
}
