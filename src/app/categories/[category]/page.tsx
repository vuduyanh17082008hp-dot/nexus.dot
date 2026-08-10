import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, getGamesByGenre } from "@/lib/game/catalog";
import type { GameGenre } from "@/types/database";
import { GameCard } from "@/components/game/game-card";
import { PageShell } from "@/components/layout/page-shell";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const meta = CATEGORIES.find((c) => c.slug === category);

  if (!meta) {
    notFound();
  }

  const games = getGamesByGenre(category as GameGenre);

  return (
    <PageShell title={meta.title} description={meta.description}>
      {games.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-zinc-400">No games in this category yet.</p>
          <Link href="/games" className="mt-4 inline-block text-cyan-400 hover:text-cyan-300">
            Browse all games →
          </Link>
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
