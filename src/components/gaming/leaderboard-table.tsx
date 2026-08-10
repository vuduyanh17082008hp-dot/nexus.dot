import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  level: number;
  score: number;
  isCurrentUser?: boolean;
}

interface LeaderboardTableProps {
  entries: LeaderboardRow[];
  className?: string;
}

export function LeaderboardTable({ entries, className }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">No leaderboard entries yet.</p>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border glass", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Player</th>
            <th className="px-4 py-3 font-medium hidden sm:table-cell">Level</th>
            <th className="px-4 py-3 font-medium text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.userId}
              className={cn(
                "border-b border-border last:border-0 transition-colors",
                entry.isCurrentUser
                  ? "bg-primary/10 border-l-2 border-l-primary"
                  : "hover:bg-surface-raised/50",
              )}
            >
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "font-display font-bold",
                    entry.rank <= 3 ? "text-accent" : "text-muted",
                  )}
                >
                  #{entry.rank}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={entry.avatarUrl}
                    alt={entry.username}
                    fallback={entry.username.slice(0, 2)}
                    size="sm"
                  />
                  <div>
                    <span className="font-medium text-foreground">{entry.username}</span>
                    {entry.isCurrentUser && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        You
                      </Badge>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <Badge variant="outline">Lv. {entry.level}</Badge>
              </td>
              <td className="px-4 py-3 text-right font-display font-semibold text-secondary">
                {formatNumber(entry.score)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
