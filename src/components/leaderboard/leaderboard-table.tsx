import Link from "next/link";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export interface LeaderboardRow {
  rank: number;
  username: string;
  displayName?: string;
  score: number;
  gameTitle?: string;
  gameSlug?: string;
  level?: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardRow[];
  compact?: boolean;
  className?: string;
}

export function LeaderboardTable({ entries, compact, className }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        No leaderboard entries yet. Be the first to play!
      </p>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-violet-500/10 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="pb-3 pr-4 font-medium">Rank</th>
            <th className="pb-3 pr-4 font-medium">Player</th>
            {!compact && <th className="pb-3 pr-4 font-medium">Game</th>}
            <th className="pb-3 font-medium text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={`${entry.rank}-${entry.username}`}
              className="border-b border-violet-500/5 transition hover:bg-violet-500/5"
            >
              <td className="py-3 pr-4">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    entry.rank === 1 && "bg-amber-500/20 text-amber-300",
                    entry.rank === 2 && "bg-zinc-400/20 text-zinc-300",
                    entry.rank === 3 && "bg-orange-600/20 text-orange-300",
                    entry.rank > 3 && "bg-zinc-800 text-zinc-400",
                  )}
                >
                  {entry.rank}
                </span>
              </td>
              <td className="py-3 pr-4">
                <Link
                  href={`/profile/${entry.username}`}
                  className="font-medium text-white hover:text-cyan-300"
                >
                  {entry.displayName ?? entry.username}
                </Link>
                {entry.level && (
                  <span className="ml-2 text-xs text-zinc-500">Lv.{entry.level}</span>
                )}
              </td>
              {!compact && (
                <td className="py-3 pr-4 text-zinc-400">
                  {entry.gameSlug ? (
                    <Link href={`/games/${entry.gameSlug}`} className="hover:text-cyan-300">
                      {entry.gameTitle}
                    </Link>
                  ) : (
                    entry.gameTitle ?? "—"
                  )}
                </td>
              )}
              <td className="py-3 text-right font-mono font-semibold text-cyan-300">
                {formatNumber(entry.score)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
