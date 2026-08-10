-- NEXUS initial schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_username_unique UNIQUE (username)
);

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT NOT NULL,
  genre TEXT NOT NULL CHECK (
    genre IN ('action', 'arcade', 'strategy', 'puzzle', 'racing', 'survival')
  ),
  thumbnail_url TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  play_count INTEGER NOT NULL DEFAULT 0 CHECK (play_count >= 0),
  rating NUMERIC(4, 2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT games_slug_unique UNIQUE (slug)
);

CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  total_score BIGINT NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  high_score INTEGER NOT NULL DEFAULT 0 CHECK (high_score >= 0),
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
  kills INTEGER NOT NULL DEFAULT 0 CHECK (kills >= 0),
  deaths INTEGER NOT NULL DEFAULT 0 CHECK (deaths >= 0),
  playtime_seconds INTEGER NOT NULL DEFAULT 0 CHECK (playtime_seconds >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT game_stats_user_game_unique UNIQUE (user_id, game_id)
);

CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  game_slug TEXT,
  CONSTRAINT achievements_slug_unique UNIQUE (slug)
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_achievements_user_achievement_unique UNIQUE (user_id, achievement_id)
);

CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, game_id)
);

CREATE TABLE game_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  save_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT game_saves_user_game_unique UNIQUE (user_id, game_id)
);

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles (id) ON DELETE CASCADE,
  master_volume REAL NOT NULL DEFAULT 0.8 CHECK (master_volume >= 0 AND master_volume <= 1),
  music_volume REAL NOT NULL DEFAULT 0.7 CHECK (music_volume >= 0 AND music_volume <= 1),
  sfx_volume REAL NOT NULL DEFAULT 0.9 CHECK (sfx_volume >= 0 AND sfx_volume <= 1),
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  performance_mode TEXT NOT NULL DEFAULT 'medium' CHECK (performance_mode IN ('low', 'medium', 'high')),
  show_mobile_controls BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_profiles_username ON profiles (username);
CREATE INDEX idx_profiles_role ON profiles (role);

CREATE INDEX idx_games_slug ON games (slug);
CREATE INDEX idx_games_status ON games (status);
CREATE INDEX idx_games_featured ON games (is_featured) WHERE is_featured = TRUE;

CREATE INDEX idx_game_sessions_user_id ON game_sessions (user_id);
CREATE INDEX idx_game_sessions_game_id ON game_sessions (game_id);
CREATE INDEX idx_game_sessions_completed_at ON game_sessions (completed_at DESC);

CREATE INDEX idx_game_stats_user_id ON game_stats (user_id);
CREATE INDEX idx_game_stats_high_score ON game_stats (game_id, high_score DESC);

CREATE INDEX idx_leaderboard_game_score ON leaderboard_entries (game_id, score DESC, created_at ASC);
CREATE INDEX idx_leaderboard_user_id ON leaderboard_entries (user_id);
CREATE INDEX idx_leaderboard_created_at ON leaderboard_entries (created_at DESC);

CREATE INDEX idx_achievements_game_slug ON achievements (game_slug);
CREATE INDEX idx_user_achievements_user_id ON user_achievements (user_id);

CREATE INDEX idx_favorites_user_id ON favorites (user_id);
CREATE INDEX idx_favorites_game_id ON favorites (game_id);

CREATE INDEX idx_game_saves_user_id ON game_saves (user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER game_stats_set_updated_at
BEFORE UPDATE ON game_stats
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER game_saves_set_updated_at
BEFORE UPDATE ON game_saves
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_settings_set_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: create profile + default settings on signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chosen_username TEXT;
BEGIN
  chosen_username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'username'), ''),
    'player_' || SUBSTR(NEW.id::TEXT, 1, 8)
  );

  INSERT INTO profiles (id, username, level, xp, role)
  VALUES (NEW.id, chosen_username, 1, 0, 'user');

  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- Admin helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_public ON profiles
FOR SELECT
USING (TRUE);

CREATE POLICY profiles_update_own ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert_own ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- games (public read, admin write)
CREATE POLICY games_select_public ON games
FOR SELECT
USING (TRUE);

CREATE POLICY games_insert_admin ON games
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY games_update_admin ON games
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY games_delete_admin ON games
FOR DELETE
USING (is_admin());

-- game_sessions
CREATE POLICY game_sessions_select_own ON game_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY game_sessions_insert_own ON game_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY game_sessions_update_own ON game_sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY game_sessions_delete_own ON game_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- game_stats
CREATE POLICY game_stats_select_own ON game_stats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY game_stats_insert_own ON game_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY game_stats_update_own ON game_stats
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- leaderboard_entries (public read, own insert/update/delete)
CREATE POLICY leaderboard_select_public ON leaderboard_entries
FOR SELECT
USING (TRUE);

CREATE POLICY leaderboard_insert_own ON leaderboard_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY leaderboard_update_own ON leaderboard_entries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY leaderboard_delete_own ON leaderboard_entries
FOR DELETE
USING (auth.uid() = user_id);

-- achievements (public read)
CREATE POLICY achievements_select_public ON achievements
FOR SELECT
USING (TRUE);

CREATE POLICY achievements_admin_write ON achievements
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- user_achievements
CREATE POLICY user_achievements_select_own ON user_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY user_achievements_insert_own ON user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- favorites
CREATE POLICY favorites_select_own ON favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY favorites_insert_own ON favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY favorites_delete_own ON favorites
FOR DELETE
USING (auth.uid() = user_id);

-- game_saves
CREATE POLICY game_saves_select_own ON game_saves
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY game_saves_insert_own ON game_saves
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY game_saves_update_own ON game_saves
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY game_saves_delete_own ON game_saves
FOR DELETE
USING (auth.uid() = user_id);

-- user_settings
CREATE POLICY user_settings_select_own ON user_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY user_settings_insert_own ON user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_settings_update_own ON user_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed: games
-- ---------------------------------------------------------------------------

INSERT INTO games (
  id,
  slug,
  title,
  description,
  short_description,
  genre,
  thumbnail_url,
  banner_url,
  status,
  is_featured,
  play_count,
  rating,
  created_at
)
VALUES
  (
    '00000000-0000-4000-8000-000000000001',
    'neon-survivor',
    'Neon Survivor',
    'A top-down survival shooter in a collapsing neon grid. Survive endless waves, collect power-ups, and carve through the horde.',
    'Top-down survival shooter with escalating waves.',
    'survival',
    '/games/neon-survivor.svg',
    '/games/neon-survivor-banner.svg',
    'published',
    TRUE,
    12840,
    4.80,
    '2026-01-10T00:00:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'void-runner',
    'Void Runner',
    'Sprint through an endless cyber void. Jump obstacles, collect coins, and push your high score as speed ramps up.',
    'Endless runner through the cyber void.',
    'arcade',
    '/games/void-runner.svg',
    '/games/void-runner-banner.svg',
    'published',
    TRUE,
    9420,
    4.60,
    '2026-02-02T00:00:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'cyber-breakout',
    'Cyber Breakout',
    'A modern Breakout experience with physics, power-ups, particle juice, and multi-stage campaigns.',
    'Modern Breakout with levels and power-ups.',
    'puzzle',
    '/games/cyber-breakout.svg',
    '/games/cyber-breakout-banner.svg',
    'published',
    FALSE,
    7155,
    4.70,
    '2026-03-15T00:00:00.000Z'
  );

-- ---------------------------------------------------------------------------
-- Seed: achievements (matches src/lib/achievements/catalog.ts)
-- ---------------------------------------------------------------------------

INSERT INTO achievements (slug, name, description, icon, xp_reward, game_slug)
VALUES
  ('first-blood', 'First Blood', 'Kill your first enemy.', 'swords', 25, 'neon-survivor'),
  ('survivor', 'Survivor', 'Survive 5 minutes in Neon Survivor.', 'shield', 100, 'neon-survivor'),
  ('unstoppable', 'Unstoppable', 'Kill 100 enemies in a single run.', 'flame', 150, 'neon-survivor'),
  ('high-roller', 'High Roller', 'Reach 10,000 score in any game.', 'trophy', 120, NULL),
  ('runner', 'Runner', 'Travel 5,000 meters in Void Runner.', 'footprints', 100, 'void-runner'),
  ('coin-collector', 'Coin Collector', 'Collect 100 coins in Void Runner.', 'coins', 75, 'void-runner'),
  ('breakout-master', 'Breakout Master', 'Complete all Cyber Breakout stages.', 'sparkles', 200, 'cyber-breakout'),
  ('brick-breaker', 'Brick Breaker', 'Destroy 50 blocks in Cyber Breakout.', 'box', 50, 'cyber-breakout'),
  ('first-session', 'Boot Sequence', 'Complete your first game session.', 'rocket', 15, NULL);
