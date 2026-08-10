import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { historyQuerySchema } from "@/lib/validation/session";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Game history requires a real backend." },
      { status: 503 },
    );
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const parsed = historyQuerySchema.safeParse({
    gameSlug: url.searchParams.get("gameSlug") || undefined,
    sort: url.searchParams.get("sort") || undefined,
    page: url.searchParams.get("page") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  const { page, limit, sort, gameSlug } = parsed.data;
  const offset = (page - 1) * limit;

  let query = auth.supabase
    .from("game_sessions")
    .select(
      "id, score, duration_seconds, status, xp_earned, started_at, ended_at, completed_at, game_version, metadata, games(slug, title, thumbnail_url)",
      { count: "exact" },
    )
    .eq("user_id", auth.user.id)
    .in("status", ["completed", "crashed", "abandoned"])
    .order("started_at", { ascending: sort === "oldest" })
    .range(offset, offset + limit - 1);

  if (gameSlug) {
    const { data: game } = await auth.supabase.from("games").select("id").eq("slug", gameSlug).maybeSingle();
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    query = query.eq("game_id", game.id);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sessions = (data ?? []).map((row) => {
    const game = row.games as { slug?: string; title?: string; thumbnail_url?: string } | null;
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      score: row.score,
      durationSeconds: row.duration_seconds,
      status: row.status,
      xpEarned: row.xp_earned,
      startedAt: row.started_at,
      endedAt: row.ended_at ?? row.completed_at,
      gameVersion: row.game_version,
      gameSlug: game?.slug,
      gameTitle: game?.title,
      thumbnailUrl: game?.thumbnail_url,
      achievementsUnlocked: Array.isArray(meta.achievementsUnlocked)
        ? meta.achievementsUnlocked
        : [],
    };
  });

  return NextResponse.json({
    sessions,
    page,
    limit,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  });
}
