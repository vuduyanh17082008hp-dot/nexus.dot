import Image from "next/image";
import { Play, Star, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import type { Game } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FeaturedPanelProps {
  game: Game;
}

export function FeaturedPanel({ game }: FeaturedPanelProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border glass noise-overlay">
      <div className="relative aspect-[21/9] min-h-[280px] md:min-h-[360px]">
        <Image
          src={game.banner_url}
          alt={game.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <Badge variant="accent" className="w-fit mb-4">
            Featured Game
          </Badge>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground text-glow-primary max-w-xl">
            {game.title}
          </h2>
          <p className="mt-3 max-w-lg text-sm md:text-base text-muted">
            {game.short_description}
          </p>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5 capitalize">
              {game.genre}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden="true" />
              {formatNumber(game.play_count)} plays
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 text-accent fill-accent/30" aria-hidden="true" />
              {game.rating.toFixed(1)}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={`/play/${game.slug}`} size="lg" className="gap-2">
              <Play className="h-4 w-4" aria-hidden="true" />
              Play Now
            </Button>
            <Button href={`/games/${game.slug}`} variant="outline" size="lg">
              View Details
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
