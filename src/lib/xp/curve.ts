const BASE = 100;
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
