-- NEXUS platform hardening: session lifecycle, feedback, bugs, audit, releases

-- ---------------------------------------------------------------------------
-- Extend profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- ---------------------------------------------------------------------------
-- Extend games
-- ---------------------------------------------------------------------------
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Migrate game status values toward live/development model while keeping published
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check CHECK (
  status IN ('development', 'beta', 'live', 'maintenance', 'disabled', 'draft', 'published', 'archived')
);

UPDATE games SET status = 'live' WHERE status = 'published';

-- ---------------------------------------------------------------------------
-- Extend game_sessions for lifecycle
-- ---------------------------------------------------------------------------
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS session_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS game_version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('active', 'completed', 'abandoned', 'crashed')),
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS browser TEXT,
  ADD COLUMN IF NOT EXISTS xp_earned INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE game_sessions
SET ended_at = completed_at,
    status = CASE WHEN completed_at IS NULL THEN 'abandoned' ELSE 'completed' END
WHERE ended_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_game_sessions_session_token ON game_sessions (session_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_sessions_idempotency
  ON game_sessions (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_started ON game_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_started ON game_sessions (game_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions (status);

-- ---------------------------------------------------------------------------
-- Extend game_stats
-- ---------------------------------------------------------------------------
ALTER TABLE game_stats
  ADD COLUMN IF NOT EXISTS best_wave INTEGER NOT NULL DEFAULT 0 CHECK (best_wave >= 0);

-- ---------------------------------------------------------------------------
-- Extend game_saves for slots + version
-- ---------------------------------------------------------------------------
ALTER TABLE game_saves
  ADD COLUMN IF NOT EXISTS slot INTEGER NOT NULL DEFAULT 1 CHECK (slot >= 1 AND slot <= 5),
  ADD COLUMN IF NOT EXISTS game_version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE game_saves DROP CONSTRAINT IF EXISTS game_saves_user_game_unique;
ALTER TABLE game_saves ADD CONSTRAINT game_saves_user_game_slot_unique UNIQUE (user_id, game_id, slot);

-- ---------------------------------------------------------------------------
-- Suspicious score events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suspicious_score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions (id) ON DELETE SET NULL,
  score INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suspicious_scores_user ON suspicious_score_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suspicious_scores_created ON suspicious_score_events (created_at DESC);

-- ---------------------------------------------------------------------------
-- Feedback reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
  game_id UUID REFERENCES games (id) ON DELETE SET NULL,
  session_id UUID REFERENCES game_sessions (id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (
    category IN (
      'BUG',
      'GAMEPLAY_ISSUE',
      'PERFORMANCE_ISSUE',
      'UI_ISSUE',
      'BALANCE_ISSUE',
      'FEATURE_REQUEST',
      'GENERAL_FEEDBACK'
    )
  ),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 8000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN (
      'new',
      'triaged',
      'reproducing',
      'confirmed',
      'in_progress',
      'fixed',
      'released',
      'closed',
      'cannot_reproduce'
    )
  ),
  game_version TEXT,
  route TEXT,
  browser TEXT,
  device TEXT,
  screenshot_path TEXT,
  public_response TEXT,
  contact_permission BOOLEAN NOT NULL DEFAULT FALSE,
  correlated_bug_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status_severity ON feedback_reports (status, severity);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback_reports (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_game ON feedback_reports (game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback_reports (created_at DESC);

CREATE TRIGGER feedback_reports_set_updated_at
BEFORE UPDATE ON feedback_reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Bug events (fingerprinted)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bug_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('CLIENT', 'SERVER', 'GAME_ENGINE', 'API', 'DATABASE', 'PLAYER_REPORT')),
  user_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
  game_id UUID REFERENCES games (id) ON DELETE SET NULL,
  session_id UUID REFERENCES game_sessions (id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  priority TEXT NOT NULL DEFAULT 'P2' CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  error_fingerprint TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  route TEXT,
  game_version TEXT,
  environment TEXT NOT NULL DEFAULT 'production',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  occurrence_count INTEGER NOT NULL DEFAULT 1 CHECK (occurrence_count >= 1),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'triaged', 'in_progress', 'fixed', 'released', 'ignored', 'closed')
  )
);

CREATE INDEX IF NOT EXISTS idx_bug_events_fingerprint ON bug_events (error_fingerprint);
CREATE INDEX IF NOT EXISTS idx_bug_events_last_seen ON bug_events (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_events_status ON bug_events (status, priority);
CREATE INDEX IF NOT EXISTS idx_bug_events_game ON bug_events (game_id, last_seen_at DESC);

ALTER TABLE feedback_reports
  DROP CONSTRAINT IF EXISTS feedback_reports_correlated_bug_id_fkey;
ALTER TABLE feedback_reports
  ADD CONSTRAINT feedback_reports_correlated_bug_id_fkey
  FOREIGN KEY (correlated_bug_id) REFERENCES bug_events (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Game releases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  release_notes TEXT NOT NULL DEFAULT '',
  released_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'released' CHECK (status IN ('draft', 'released', 'yanked')),
  CONSTRAINT game_releases_game_version_unique UNIQUE (game_id, version)
);

CREATE INDEX IF NOT EXISTS idx_game_releases_game ON game_releases (game_id, released_at DESC);

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource, resource_id);

-- ---------------------------------------------------------------------------
-- Rate limit buckets (lightweight)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Seed releases for catalog games
-- ---------------------------------------------------------------------------
INSERT INTO game_releases (game_id, version, release_notes, status)
VALUES
  ('00000000-0000-4000-8000-000000000001', '1.0.0', 'Initial Neon Survivor release', 'released'),
  ('00000000-0000-4000-8000-000000000002', '1.0.0', 'Initial Void Runner release', 'released'),
  ('00000000-0000-4000-8000-000000000003', '1.0.0', 'Initial Cyber Breakout release', 'released')
ON CONFLICT DO NOTHING;

UPDATE games SET version = '1.0.0' WHERE version IS NULL OR version = '';

-- ---------------------------------------------------------------------------
-- RLS for new tables
-- ---------------------------------------------------------------------------
ALTER TABLE suspicious_score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY suspicious_select_admin ON suspicious_score_events
FOR SELECT USING (is_admin());
CREATE POLICY suspicious_insert_own ON suspicious_score_events
FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY feedback_select_own ON feedback_reports
FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY feedback_insert_auth ON feedback_reports
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY feedback_update_admin ON feedback_reports
FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY bug_events_select_admin ON bug_events
FOR SELECT USING (is_admin());
CREATE POLICY bug_events_insert_auth ON bug_events
FOR INSERT WITH CHECK (TRUE);
CREATE POLICY bug_events_update_admin ON bug_events
FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY game_releases_select_public ON game_releases
FOR SELECT USING (TRUE);
CREATE POLICY game_releases_admin_write ON game_releases
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY audit_logs_select_admin ON audit_logs
FOR SELECT USING (is_admin());
CREATE POLICY audit_logs_insert_admin ON audit_logs
FOR INSERT WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);

-- rate limits: no client access
CREATE POLICY rate_limit_deny_all ON rate_limit_buckets
FOR ALL USING (FALSE) WITH CHECK (FALSE);

-- Storage bucket for feedback screenshots (run in dashboard if storage API unavailable)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-screenshots', 'feedback-screenshots', false)
-- ON CONFLICT DO NOTHING;
