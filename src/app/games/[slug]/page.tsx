import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, Users } from "lucide-react";
import { getGameBySlug, GAME_CATALOG, getGamesByGenre } from "@/lib/game/catalog";
import { formatNumber } from "@/lib/utils/format";
import { GameCard } from "@/components/game/game-card";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GameDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GAME_CATALOG.map((g) => ({ slug: g.slug }));
}

export default async function GameDetailPage({ params }: GameDetailProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game || game.status !== "published") {
    notFound();
  }

  const related = getGamesByGenre(game.genre).filter((g) => g.slug !== game.slug);

  return (
    <PageShell wide>
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-violet-500/20">
        <div className="relative h-48 md:h-64">
          <Image src={game.banner_url} alt="" fill className="object-cover opacity-40" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="relative -mt-16 flex flex-col gap-6 px-6 pb-6 md:flex-row md:items-end">
          <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-xl border border-cyan-500/20 md:h-40 md:w-64">
            <Image src={game.thumbnail_url} alt={game.title} fill className="object-cover" sizes="256px" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge variant="cyan">{game.genre}</Badge>
              {game.is_featured && <Badge variant="violet">Featured</Badge>}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">{game.title}</h1>
            <p className="mt-2 max-w-2xl text-zinc-400">{game.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {game.rating}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {formatNumber(game.play_count)} plays
              </span>
            </div>
            <Button href={`/play/${game.slug}`} size="lg" className="mt-6">
              <Play className="h-5 w-5" /> Play Now
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Genre", value: game.genre },
          { label: "Rating", value: `${game.rating} / 5` },
          { label: "Total Plays", value: formatNumber(game.play_count) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-violet-500/15 bg-surface-elevated/60 p-4 text-center"
          >
            <p className="text-xs uppercase tracking-wider text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold capitalize text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Related Games</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </div>
        </section>
      )}

      <Link href="/games" className="mt-8 inline-block text-sm text-cyan-400 hover:text-cyan-300">
        ← Back to library
      </Link>
    </PageShell>
  );
}
