import Image from "next/image";
import { Play, Star, Users } from "lucide-react";
import type { Game } from "@/types/database";
import { formatNumber } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FeaturedPanelProps {
  game: Game;
}

export function FeaturedPanel({ game }: FeaturedPanelProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-violet-500/20 nexus-glow">
      <div className="absolute inset-0">
        <Image src={game.banner_url} alt="" fill className="object-cover opacity-30" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-10">
        <div className="relative mx-auto h-40 w-64 shrink-0 overflow-hidden rounded-xl border border-cyan-500/20 md:mx-0 md:h-48 md:w-80">
          <Image src={game.thumbnail_url} alt={game.title} fill className="object-cover" sizes="320px" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="violet">Featured</Badge>
            <Badge variant="cyan">{game.genre}</Badge>
          </div>
          <h2 className="text-3xl font-bold text-white md:text-4xl">{game.title}</h2>
          <p className="max-w-xl text-zinc-400">{game.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {game.rating} rating
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {formatNumber(game.play_count)} plays
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={`/play/${game.slug}`} size="lg">
              <Play className="h-5 w-5" /> Play Now
            </Button>
            <Button href={`/games/${game.slug}`} variant="secondary" size="lg">
              View Details
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
