export type Json =
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
