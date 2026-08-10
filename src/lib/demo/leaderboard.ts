export interface DemoLeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  score: number;
  gameSlug: string;
  gameTitle: string;
  level: number;
  avatarUrl: string | null;
}

export const DEMO_LEADERBOARD: DemoLeaderboardEntry[] = [
  {
    rank: 1,
    username: "neon_ace",
    displayName: "Neon Ace",
    score: 48200,
    gameSlug: "neon-survivor",
    gameTitle: "Neon Survivor",
    level: 42,
    avatarUrl: null,
  },
  {
    rank: 2,
    username: "void_drift",
    displayName: "Void Drift",
    score: 31850,
    gameSlug: "void-runner",
    gameTitle: "Void Runner",
    level: 38,
    avatarUrl: null,
  },
  {
    rank: 3,
    username: "cyber_king",
    displayName: "Cyber King",
    score: 29400,
    gameSlug: "cyber-breakout",
    gameTitle: "Cyber Breakout",
    level: 35,
    avatarUrl: null,
  },
  {
    rank: 4,
    username: "pulse_wave",
    displayName: "Pulse Wave",
    score: 27100,
    gameSlug: "neon-survivor",
    gameTitle: "Neon Survivor",
    level: 31,
    avatarUrl: null,
  },
  {
    rank: 5,
    username: "grid_runner",
    displayName: "Grid Runner",
    score: 24500,
    gameSlug: "void-runner",
    gameTitle: "Void Runner",
    level: 29,
    avatarUrl: null,
  },
];

export const DEMO_PROFILES: Record<
  string,
  {
    username: string;
    display_name: string;
    bio: string;
    level: number;
    xp: number;
    avatar_url: string | null;
    role: "user" | "admin";
    created_at: string;
  }
> = {
  neon_ace: {
    username: "neon_ace",
    display_name: "Neon Ace",
    bio: "Survival main. Chasing the perfect wave.",
    level: 42,
    xp: 128400,
    avatar_url: null,
    role: "user",
    created_at: "2025-06-01T00:00:00.000Z",
  },
  void_drift: {
    username: "void_drift",
    display_name: "Void Drift",
    bio: "Endless runner enthusiast.",
    level: 38,
    xp: 98200,
    avatar_url: null,
    role: "user",
    created_at: "2025-07-15T00:00:00.000Z",
  },
  cyber_king: {
    username: "cyber_king",
    display_name: "Cyber King",
    bio: "Breakout legend. No brick left standing.",
    level: 35,
    xp: 85400,
    avatar_url: null,
    role: "user",
    created_at: "2025-08-01T00:00:00.000Z",
  },
};
