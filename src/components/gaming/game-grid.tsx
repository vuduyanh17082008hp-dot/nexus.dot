import { cn } from "@/lib/utils/cn";
import type { Game } from "@/types/database";
import { GameCard } from "@/components/gaming/game-card";

interface GameGridProps {
  games: Game[];
  className?: string;
  columns?: 2 | 3 | 4;
}

const colMap = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

export function GameGrid({ games, className, columns = 3 }: GameGridProps) {
  if (games.length === 0) return null;

  return (
    <div className={cn("grid gap-4 md:gap-6", colMap[columns], className)}>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
