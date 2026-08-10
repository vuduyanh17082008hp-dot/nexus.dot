import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { GameGenre } from "@/types/database";
import { Card } from "@/components/ui/card";

interface CategoryCardProps {
  slug: GameGenre;
  title: string;
  description: string;
  gameCount?: number;
  className?: string;
}

const genreGradients: Record<GameGenre, string> = {
  action: "from-red-500/20 to-orange-500/10",
  arcade: "from-secondary/20 to-primary/10",
  strategy: "from-emerald-500/20 to-teal-500/10",
  puzzle: "from-purple-500/20 to-pink-500/10",
  racing: "from-yellow-500/20 to-orange-500/10",
  survival: "from-primary/20 to-secondary/10",
};

export function CategoryCard({ slug, title, description, gameCount, className }: CategoryCardProps) {
  return (
    <Link href={`/games?genre=${slug}`}>
      <Card
        className={cn(
          "group relative overflow-hidden p-5 transition-all hover:border-primary/40 hover:glow-primary",
          className,
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-100",
            genreGradients[slug],
          )}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-2 text-sm text-muted line-clamp-2">{description}</p>
          <div className="mt-4 flex items-center justify-between">
            {gameCount !== undefined && (
              <span className="text-xs text-muted-foreground">{gameCount} games</span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary group-hover:gap-2 transition-all">
              Browse
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
