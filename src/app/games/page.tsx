import { Suspense } from "react";
import { searchGames, sortGames, type SortKey } from "@/lib/game/catalog";
import type { GameGenre } from "@/types/database";
import { GamesToolbar } from "@/components/games/games-toolbar";
import { GameCard } from "@/components/game/game-card";
import { PageShell } from "@/components/layout/page-shell";
import { PageSkeleton } from "@/components/ui/skeleton";

interface GamesPageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    sort?: string;
    view?: string;
  }>;
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const genre = params.genre ?? "";
  const sort = (params.sort as SortKey) || "trending";
  const view = params.view === "list" ? "list" : "grid";

  let games = searchGames(q);
  if (genre) {
    games = games.filter((g) => g.genre === (genre as GameGenre));
  }
  games = sortGames(games, sort);

  return (
    <PageShell title="Game Library" description="Search, filter, and discover every title on NEXUS.">
      <Suspense fallback={<PageSkeleton />}>
        <GamesToolbar />
      </Suspense>
      <p className="mb-6 text-sm text-zinc-500">{games.length} games</p>
      {games.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">No games match your filters.</p>
      ) : view === "list" ? (
        <div className="space-y-3">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} variant="list" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
