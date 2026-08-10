import { NextResponse } from "next/server";
import { GAME_CATALOG } from "@/lib/game/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoReadResponse } from "@/lib/supabase/api-helpers";
import { leaderboardQuerySchema } from "@/lib/validation/game";

function periodStart(period: "today" | "week" | "all"): string | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "today") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  now.setDate(now.getDate() - 7);
  return now.toISOString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = leaderboardQuerySchema.safeParse({
    gameSlug: searchParams.get("gameSlug") ?? undefined,
    period: searchParams.get("period") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  const { gameSlug, period, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  if (!isSupabaseConfigured()) {
    return demoReadResponse(
      {
        entries: [],
        page,
        limit,
        total: 0,
        gameSlug: gameSlug ?? null,
        period,
      },
      "Leaderboard data unavailable in demo mode. Connect Supabase for live rankings.",
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("leaderboard_entries")
    .select(
      "id, user_id, game_id, score, metadata, created_at, profiles(username, display_name, avatar_url, level), games(slug, title)",
      { count: "exact" },
    )
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (gameSlug) {
    const game = GAME_CATALOG.find((g) => g.slug === gameSlug);
    if (game) {
      query = query.eq("game_id", game.id);
    } else {
      const { data: dbGame } = await supabase.from("games").select("id").eq("slug", gameSlug).single();
      if (dbGame) query = query.eq("game_id", dbGame.id);
    }
  }

  const since = periodStart(period);
  if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: true,
    entries: data ?? [],
    page,
    limit,
    total: count ?? 0,
    gameSlug: gameSlug ?? null,
    period,
  });
}
