import { NextResponse } from "next/server";
import { evaluateAchievements } from "@/lib/achievements/catalog";
import { GAME_CATALOG } from "@/lib/game/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { demoModeResponse, requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { clampSessionValues, sessionSubmitSchema } from "@/lib/validation/game";
import { calculateSessionXP, getLevelFromXP } from "@/lib/xp/curve";
import type { Json } from "@/types/database";

function getGameIdBySlug(slug: string): string | undefined {
  return GAME_CATALOG.find((g) => g.slug === slug)?.id;
}

function toNumericMeta(metadata: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      result[key] = value;
    } else if (typeof value === "boolean") {
      result[key] = value ? 1 : 0;
    }
  }
  return result;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return demoModeResponse("Session submission requires Supabase. Scores are not persisted in demo mode.", 503);
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sessionSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid session payload" }, { status: 400 });
  }

  const session = clampSessionValues(parsed.data);
  const gameId = getGameIdBySlug(session.gameSlug);

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, slug")
    .eq("slug", session.gameSlug)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const resolvedGameId = game.id ?? gameId;
  if (!resolvedGameId) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const { data: existingSessionsToday } = await supabase
    .from("game_sessions")
    .select("id")
    .eq("user_id", user.id)
    .gte("started_at", startOfDay.toISOString())
    .limit(1);

  const { data: existingStats } = await supabase
    .from("game_stats")
    .select("*")
    .eq("user_id", user.id)
    .eq("game_id", resolvedGameId)
    .maybeSingle();

  const isHighScore = session.score > (existingStats?.high_score ?? 0);
  const isDailyFirst = !existingSessionsToday?.length;

  const xpGained = calculateSessionXP({
    score: session.score,
    durationSeconds: session.durationSeconds,
    isHighScore,
    isDailyFirst,
  });

  const numericMeta = toNumericMeta(session.metadata);
  if (session.score > 0) numericMeta.score = session.score;

  const { data: insertedSession, error: sessionError } = await supabase
    .from("game_sessions")
    .insert({
      user_id: user.id,
      game_id: resolvedGameId,
      score: session.score,
      duration_seconds: session.durationSeconds,
      metadata: session.metadata as Json,
      completed_at: now.toISOString(),
    })
    .select("id")
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  const statsPayload = {
    user_id: user.id,
    game_id: resolvedGameId,
    games_played: (existingStats?.games_played ?? 0) + 1,
    total_score: Number(existingStats?.total_score ?? 0) + session.score,
    high_score: Math.max(existingStats?.high_score ?? 0, session.score),
    wins: (existingStats?.wins ?? 0) + (numericMeta.victory ? 1 : 0),
    losses: (existingStats?.losses ?? 0) + (numericMeta.victory ? 0 : 1),
    kills: (existingStats?.kills ?? 0) + (numericMeta.kills ?? 0),
    deaths: (existingStats?.deaths ?? 0) + (numericMeta.deaths ?? 0),
    playtime_seconds: (existingStats?.playtime_seconds ?? 0) + session.durationSeconds,
    updated_at: now.toISOString(),
  };

  const { error: statsError } = await supabase.from("game_stats").upsert(statsPayload, {
    onConflict: "user_id,game_id",
  });

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  if (isHighScore) {
    await supabase.from("leaderboard_entries").insert({
      user_id: user.id,
      game_id: resolvedGameId,
      score: session.score,
      metadata: session.metadata as Json,
    });
  }

  const { data: profile } = await supabase.from("profiles").select("xp, level").eq("id", user.id).single();
  const currentXp = profile?.xp ?? 0;
  let bonusXp = 0;

  const { data: achievementRows } = await supabase.from("achievements").select("id, slug, xp_reward");
  const { data: unlockedRows } = await supabase
    .from("user_achievements")
    .select("achievement_id, achievements(slug)")
    .eq("user_id", user.id);

  const unlockedSlugs = new Set(
    (unlockedRows ?? [])
      .map((row) => {
        const achievement = row.achievements as { slug?: string } | null;
        return achievement?.slug;
      })
      .filter(Boolean),
  );

  const matched = evaluateAchievements(session.gameSlug, numericMeta);
  const newlyUnlocked: { slug: string; name: string; xp_reward: number }[] = [];

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
        name: achievement.name,
        xp_reward: row.xp_reward ?? achievement.xp_reward,
      });
    }
  }

  const totalXp = currentXp + xpGained + bonusXp;
  const newLevel = getLevelFromXP(totalXp);

  await supabase
    .from("profiles")
    .update({ xp: totalXp, level: newLevel, updated_at: now.toISOString() })
    .eq("id", user.id);

  return NextResponse.json({
    sessionId: insertedSession.id,
    score: session.score,
    highScore: statsPayload.high_score,
    xpGained: xpGained + bonusXp,
    level: newLevel,
    achievementsUnlocked: newlyUnlocked.map((a) => a.slug),
    achievements: newlyUnlocked,
    clamped: session.score !== parsed.data.score || session.durationSeconds !== parsed.data.durationSeconds,
  });
}
