import { notFound } from "next/navigation";
import { getGameBySlug, GAME_CATALOG } from "@/lib/game/catalog";
import { GamePlayer } from "@/components/game/game-player";

interface PlayPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GAME_CATALOG.map((g) => ({ slug: g.slug }));
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game || game.status !== "published") {
    notFound();
  }

  return <GamePlayer game={game} />;
}
