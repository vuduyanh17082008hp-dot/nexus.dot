import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import type { Game } from "@/types/database";
import { formatNumber } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface GameCardProps {
  game: Game;
  variant?: "grid" | "list" | "compact";
  className?: string;
}

export function GameCard({ game, variant = "grid", className }: GameCardProps) {
  if (variant === "list") {
    return (
      <div
        className={cn(
          "group flex gap-4 rounded-xl border border-violet-500/15 bg-surface-elevated/60 p-3 transition hover:border-cyan-500/30 hover:bg-surface-elevated",
          className,
        )}
      >
        <Link href={`/games/${game.slug}`} className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg">
          <Image src={game.thumbnail_url} alt={game.title} fill className="object-cover" sizes="128px" />
        </Link>
        <Link href={`/games/${game.slug}`} className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="truncate font-semibold text-white group-hover:text-cyan-300">{game.title}</h3>
          <p className="line-clamp-1 text-sm text-zinc-400">{game.short_description}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <Badge variant="cyan">{game.genre}</Badge>
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {game.rating}
            </span>
            <span>{formatNumber(game.play_count)} plays</span>
          </div>
        </Link>
        <Link
          href={`/play/${game.slug}`}
          className="flex shrink-0 items-center self-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          <Play className="mr-1 h-4 w-4" /> Play
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-violet-500/15 bg-surface-elevated/60 transition hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5",
        variant === "compact" && "min-w-[200px] shrink-0",
        className,
      )}
    >
      <Link href={`/games/${game.slug}`} className="relative block aspect-video overflow-hidden">
        <Image
          src={game.thumbnail_url}
          alt={game.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 300px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {game.is_featured && (
          <Badge variant="violet" className="absolute left-2 top-2">
            Featured
          </Badge>
        )}
      </Link>
      <Link
        href={`/play/${game.slug}`}
        className="absolute bottom-[calc(33%+0.5rem)] right-2 z-10 flex items-center gap-1 rounded-lg bg-violet-600/90 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-violet-500"
      >
        <Play className="h-3 w-3" /> Play
      </Link>
      <Link href={`/games/${game.slug}`} className="flex flex-1 flex-col p-3">
        <h3 className="truncate font-semibold text-white group-hover:text-cyan-300">{game.title}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{game.short_description}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-zinc-500">
          <Badge variant="outline">{game.genre}</Badge>
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {game.rating}
          </span>
        </div>
      </Link>
    </div>
  );
}
