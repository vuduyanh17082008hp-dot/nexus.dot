import { Suspense } from "react";
import { DEMO_LEADERBOARD } from "@/lib/demo/leaderboard";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { leaderboardQuerySchema } from "@/lib/validation/game";
import {
  LeaderboardFilters,
  LeaderboardPagination,
} from "@/components/leaderboard/leaderboard-filters";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { PageShell } from "@/components/layout/page-shell";
import { PageSkeleton } from "@/components/ui/skeleton";

interface LeaderboardPageProps {
  searchParams: Promise<{
    period?: string;
    gameSlug?: string;
    page?: string;
  }>;
}

async function LeaderboardContent({
  period,
  gameSlug,
  page,
  limit,
}: {
  period: string;
  gameSlug?: string;
  page: number;
  limit: number;
}) {
  if (!isSupabaseConfigured()) {
    let entries = DEMO_LEADERBOARD;
    if (gameSlug) entries = entries.filter((e) => e.gameSlug === gameSlug);
    const rows = entries.map((e) => ({
      rank: e.rank,
      username: e.username,
      displayName: e.displayName,
      score: e.score,
      gameTitle: e.gameTitle,
      gameSlug: e.gameSlug,
      level: e.level,
    }));
    return (
      <>
        <p className="mb-4 text-sm text-amber-400/80">
          Demo leaderboard — connect Supabase for live rankings.
        </p>
        <LeaderboardTable entries={rows} />
        <LeaderboardPagination total={rows.length} limit={limit} page={page} />
      </>
    );
  }

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("leaderboard_entries")
    .select(
      "id, score, profiles(username, display_name, level), games(slug, title)",
      { count: "exact" },
    )
    .order("score", { ascending: false })
    .range(offset, offset + limit - 1);

  if (gameSlug) {
    const { data: game } = await supabase.from("games").select("id").eq("slug", gameSlug).single();
    if (game) query = query.eq("game_id", game.id);
  }

  const now = Date.now();
  if (period === "today") {
    query = query.gte("created_at", new Date(now - 24 * 60 * 60 * 1000).toISOString());
  } else if (period === "week") {
    query = query.gte("created_at", new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString());
  }

  const { data, count } = await query;

  const rows = (data ?? []).map((entry, i) => {
    const profile = entry.profiles as { username?: string; display_name?: string; level?: number } | null;
    const game = entry.games as { slug?: string; title?: string } | null;
    return {
      rank: offset + i + 1,
      username: profile?.username ?? "unknown",
      displayName: profile?.display_name ?? profile?.username,
      score: entry.score,
      gameTitle: game?.title,
      gameSlug: game?.slug,
      level: profile?.level,
    };
  });

  return (
    <>
      <LeaderboardTable entries={rows} />
      <LeaderboardPagination total={count ?? 0} limit={limit} page={page} />
    </>
  );
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const params = await searchParams;
  const parsed = leaderboardQuerySchema.safeParse({
    period: params.period,
    gameSlug: params.gameSlug,
    page: params.page,
    limit: 20,
  });

  const { period, gameSlug, page, limit } = parsed.success
    ? parsed.data
    : { period: "all" as const, gameSlug: undefined, page: 1, limit: 20 };

  return (
    <PageShell title="Leaderboard" description="Top scores across NEXUS games.">
      <Suspense fallback={<PageSkeleton />}>
        <LeaderboardFilters />
      </Suspense>
      <div className="mt-6 rounded-xl border border-violet-500/15 bg-surface-elevated/60 p-4">
        <Suspense fallback={<PageSkeleton />}>
          <LeaderboardContent period={period} gameSlug={gameSlug} page={page} limit={limit} />
        </Suspense>
      </div>
    </PageShell>
  );
}
