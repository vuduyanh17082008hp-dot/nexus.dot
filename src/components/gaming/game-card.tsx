"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Play, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import type { Game } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFavorites } from "@/hooks/use-favorites";

interface GameCardProps {
  game: Game;
  className?: string;
}

export function GameCard({ game, className }: GameCardProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [favLoading, setFavLoading] = useState(false);
  const favorited = isFavorite(game.slug);

  const toggleFavorite = async () => {
    setFavLoading(true);
    try {
      if (favorited) {
        await removeFavorite(game.slug);
      } else {
        await addFavorite(game.slug);
      }
    } catch {
      /* demo mode may fail silently */
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <Card className={cn("group relative overflow-hidden transition-all hover:border-primary/30 hover:glow-primary", className)}>
      <div className="relative aspect-video overflow-hidden bg-surface-raised">
        <Link href={`/games/${game.slug}`} className="block h-full">
          <Image
            src={game.thumbnail_url}
            alt={game.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        {game.is_featured && (
          <Badge variant="accent" className="absolute top-3 left-3">
            Featured
          </Badge>
        )}
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={favLoading}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          className={cn(
            "absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full glass transition-colors",
            favorited ? "text-accent" : "text-muted hover:text-accent",
          )}
        >
          <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <Link href={`/games/${game.slug}`}>
            <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              {game.title}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-muted capitalize">{game.genre}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {formatNumber(game.play_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-accent fill-accent/30" aria-hidden="true" />
            {game.rating.toFixed(1)}
          </span>
        </div>

        <Button href={`/play/${game.slug}`} size="sm" className="w-full gap-2">
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          Play
        </Button>
      </div>
    </Card>
  );
}
