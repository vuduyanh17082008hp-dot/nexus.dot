import { searchGames } from "@/lib/game/catalog";
import { GameCard } from "@/components/game/game-card";
import { PageShell } from "@/components/layout/page-shell";
import { SearchForm } from "@/components/leaderboard/leaderboard-filters";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const games = q ? searchGames(q) : [];

  return (
    <PageShell title="Search" description="Find games by title, genre, or keyword.">
      <SearchForm defaultQuery={q} />
      {!q ? (
        <p className="text-zinc-500">Enter a search term above.</p>
      ) : games.length === 0 ? (
        <p className="text-zinc-500">No results for &ldquo;{q}&rdquo;</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-zinc-500">{games.length} results for &ldquo;{q}&rdquo;</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
