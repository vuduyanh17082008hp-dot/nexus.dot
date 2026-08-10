import { GAME_CATALOG, sortGames } from "@/lib/game/catalog";
import { GameCard } from "@/components/game/game-card";
import { PageShell } from "@/components/layout/page-shell";

export default function NewPage() {
  const games = sortGames(GAME_CATALOG.filter((g) => g.status === "published"), "newest");

  return (
    <PageShell title="New Releases" description="Fresh titles added to the NEXUS catalog.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
    </PageShell>
  );
}
