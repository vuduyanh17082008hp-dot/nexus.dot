import type { SupabaseClient, User } from "@supabase/supabase-js";
import { evaluateAchievements } from "@/lib/achievements/catalog";
import { getGameVersion } from "@/lib/game/versions";
import { logger } from "@/lib/logging/logger";
import { validateScoreSubmission } from "@/lib/security/score-validation";
import { calculateSessionXP, getLevelFromXP } from "@/lib/xp/curve";
import type { Json } from "@/types/database";

function toNumericMeta(metadata: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "number" && Number.isFinite(value)) result[key] = value;
    else if (typeof value === "boolean") result[key] = value ? 1 : 0;
  }
  return result;
}

export async function startGameSession(
  supabase: SupabaseClient,
  user: User,
  input: {
    gameSlug: string;
    deviceType?: string;
    browser?: string;
    requestId?: string;
  },
) {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, slug, version, status")
    .eq("slug", input.gameSlug)
    .single();

  if (gameError || !game) {
    return { error: "Game not found", status: 404 as const };
  }

  if (game.status === "disabled" || game.status === "maintenance") {
    return { error: `Game is currently ${game.status}`, status: 503 as const };
  }

  // Abandon stale active sessions (>2h)
  const staleBefore = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("game_sessions")
    .update({ status: "abandoned", ended_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "active")
    .lt("started_at", staleBefore);

  const gameVersion = game.version || getGameVersion(input.gameSlug);
  const { data: session, error } = await supabase
    .from("game_sessions")
    .insert({
      user_id: user.id,
      game_id: game.id,
      score: 0,
      duration_seconds: 0,
      status: "active",
      game_version: gameVersion,
      device_type: input.deviceType ?? null,
      browser: input.browser ?? null,
      metadata: {},
    })
    .select("id, session_token, started_at, game_version, status")
    .single();

  if (error || !session) {
    logger.error("game.session.start_failed", {
      requestId: input.requestId,
      userId: user.id,
      message: error?.message,
    });
    return { error: error?.message ?? "Failed to start session", status: 500 as const };
  }

  await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", user.id);

  logger.info("game.session.started", {
    requestId: input.requestId,
    sessionId: session.id,
    userId: user.id,
    gameId: game.id,
  });

  return { session, game };
}

export async function completeGameSession(
  supabase: SupabaseClient,
  user: User,
  input: {
    sessionId: string;
    score: number;
    durationSeconds: number;
    metadata?: Record<string, unknown>;
    idempotencyKey?: string;
    requestId?: string;
  },
) {
  if (input.idempotencyKey) {
    const { data: existing } = await supabase
      .from("game_sessions")
      .select("id, score, xp_earned, status, metadata")
      .eq("user_id", user.id)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();

    if (existing?.status === "completed") {
      return {
        idempotent: true,
        sessionId: existing.id,
        score: existing.score,
        xpGained: existing.xp_earned,
        achievementsUnlocked: [] as string[],
        achievements: [] as { slug: string; name: string; xp_reward: number }[],
        highScore: existing.score,
        level: undefined as number | undefined,
      };
    }
  }

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("*, games(id, slug, version)")
    .eq("id", input.sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return { error: "Session not found", status: 404 as const };
  }

  if (session.status === "completed") {
    return {
      idempotent: true,
      sessionId: session.id,
      score: session.score,
      xpGained: session.xp_earned,
      achievementsUnlocked: [] as string[],
      achievements: [] as { slug: string; name: string; xp_reward: number }[],
      highScore: session.score,
      level: undefined as number | undefined,
    };
  }

  if (session.status !== "active") {
    return { error: `Session is ${session.status}`, status: 409 as const };
  }

  const game = session.games as { id: string; slug: string; version: string } | null;
  if (!game) return { error: "Game not found for session", status: 404 as const };

  const slug = game.slug as
    | "boot-sequence"
    | "neon-survivor"
    | "void-runner"
    | "cyber-breakout";
  const validation = validateScoreSubmission({
    gameSlug: slug,
    score: input.score,
    durationSeconds: input.durationSeconds,
    startedAt: session.started_at,
    metadata: input.metadata,
  });

  if (!validation.ok) {
    logger.warn("score.rejected", {
      requestId: input.requestId,
      sessionId: session.id,
      userId: user.id,
      reason: validation.reason,
    });
    return { error: `Score rejected: ${validation.reason}`, status: 422 as const };
  }

  if (validation.suspicious) {
    await supabase.from("suspicious_score_events").insert({
      user_id: user.id,
      game_id: game.id,
      session_id: session.id,
      score: input.score,
      reason: validation.reason,
      metadata: (input.metadata ?? {}) as Json,
    });
    logger.warn("score.suspicious", {
      requestId: input.requestId,
      sessionId: session.id,
      reason: validation.reason,
    });
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const { data: existingSessionsToday } = await supabase
    .from("game_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("started_at", startOfDay.toISOString())
    .limit(1);

  const { data: existingStats } = await supabase
    .from("game_stats")
    .select("*")
    .eq("user_id", user.id)
    .eq("game_id", game.id)
    .maybeSingle();

  const isHighScore = input.score > (existingStats?.high_score ?? 0);
  const isDailyFirst = !existingSessionsToday?.length;
  const xpGained = calculateSessionXP({
    score: input.score,
    durationSeconds: input.durationSeconds,
    isHighScore,
    isDailyFirst,
  });

  const numericMeta = toNumericMeta(input.metadata ?? {});
  numericMeta.score = input.score;

  const { data: achievementRows } = await supabase.from("achievements").select("id, slug, name, xp_reward");
  const { data: unlockedRows } = await supabase
    .from("user_achievements")
    .select("achievement_id, achievements(slug)")
    .eq("user_id", user.id);

  const unlockedSlugs = new Set(
    (unlockedRows ?? [])
      .map((row) => (row.achievements as { slug?: string } | null)?.slug)
      .filter(Boolean) as string[],
  );

  const matched = evaluateAchievements(game.slug, numericMeta);
  const newlyUnlocked: { slug: string; name: string; xp_reward: number }[] = [];
  let bonusXp = 0;

  for (const achievement of matched) {
    if (unlockedSlugs.has(achievement.slug)) continue;
    const row = achievementRows?.find((a) => a.slug === achievement.slug);
    if (!row) continue;
    const { error: unlockError } = await supabase.from("user_achievements").insert({
      user_id: user.id,
      achievement_id: row.id,
    });
    if (!unlockError) {
      bonusXp += row.xp_reward ?? achievement.xp_reward;
      newlyUnlocked.push({
        slug: achievement.slug,
        name: row.name ?? achievement.name,
        xp_reward: row.xp_reward ?? achievement.xp_reward,
      });
    }
  }

  const totalXpAward = xpGained + bonusXp;
  const bestWave = Math.max(
    existingStats?.best_wave ?? 0,
    typeof numericMeta.wave === "number" ? numericMeta.wave : 0,
    typeof numericMeta.highestWave === "number" ? numericMeta.highestWave : 0,
  );

  const { error: completeError } = await supabase
    .from("game_sessions")
    .update({
      status: "completed",
      score: input.score,
      duration_seconds: input.durationSeconds,
      metadata: (input.metadata ?? {}) as Json,
      completed_at: now.toISOString(),
      ended_at: now.toISOString(),
      xp_earned: totalXpAward,
      idempotency_key: input.idempotencyKey ?? null,
    })
    .eq("id", session.id)
    .eq("status", "active");

  if (completeError) {
    return { error: completeError.message, status: 500 as const };
  }

  const statsPayload = {
    user_id: user.id,
    game_id: game.id,
    games_played: (existingStats?.games_played ?? 0) + 1,
    total_score: Number(existingStats?.total_score ?? 0) + input.score,
    high_score: Math.max(existingStats?.high_score ?? 0, input.score),
    wins: (existingStats?.wins ?? 0) + (numericMeta.victory ? 1 : 0),
    losses: (existingStats?.losses ?? 0) + (numericMeta.victory ? 0 : 1),
    kills: (existingStats?.kills ?? 0) + (numericMeta.kills ?? 0),
    deaths: (existingStats?.deaths ?? 0) + (numericMeta.deaths ?? 0),
    playtime_seconds: (existingStats?.playtime_seconds ?? 0) + input.durationSeconds,
    best_wave: bestWave,
    updated_at: now.toISOString(),
  };

  await supabase.from("game_stats").upsert(statsPayload, { onConflict: "user_id,game_id" });

  if (isHighScore) {
    await supabase.from("leaderboard_entries").insert({
      user_id: user.id,
      game_id: game.id,
      score: input.score,
      metadata: (input.metadata ?? {}) as Json,
    });
  }

  const { data: profile } = await supabase.from("profiles").select("xp, level").eq("id", user.id).single();
  const currentXp = profile?.xp ?? 0;
  const totalXp = currentXp + totalXpAward;
  const newLevel = getLevelFromXP(totalXp);

  await supabase
    .from("profiles")
    .update({
      xp: totalXp,
      level: newLevel,
      last_active_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", user.id);

  await supabase
    .from("games")
    .update({ play_count: (await getPlayCount(supabase, game.id)) + 1 })
    .eq("id", game.id);

  logger.info("game.session.completed", {
    requestId: input.requestId,
    sessionId: session.id,
    userId: user.id,
    gameId: game.id,
    score: input.score,
    xp: totalXpAward,
  });

  return {
    sessionId: session.id,
    score: input.score,
    highScore: statsPayload.high_score,
    xpGained: totalXpAward,
    level: newLevel,
    achievementsUnlocked: newlyUnlocked.map((a) => a.slug),
    achievements: newlyUnlocked,
    suspicious: validation.suspicious,
  };
}

async function getPlayCount(supabase: SupabaseClient, gameId: string): Promise<number> {
  const { data } = await supabase.from("games").select("play_count").eq("id", gameId).single();
  return data?.play_count ?? 0;
}

export async function crashGameSession(
  supabase: SupabaseClient,
  user: User,
  input: { sessionId: string; message?: string; requestId?: string },
) {
  const { data: session } = await supabase
    .from("game_sessions")
    .select("id, status")
    .eq("id", input.sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) return { error: "Session not found", status: 404 as const };
  if (session.status !== "active") return { ok: true, status: session.status };

  await supabase
    .from("game_sessions")
    .update({
      status: "crashed",
      ended_at: new Date().toISOString(),
      metadata: { crashMessage: input.message ?? "unknown" },
    })
    .eq("id", session.id);

  logger.error("game.session.crashed", {
    requestId: input.requestId,
    sessionId: session.id,
    userId: user.id,
    message: input.message,
  });

  return { ok: true, status: "crashed" as const };
}
