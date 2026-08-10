import type { AchievementDef } from "@/lib/achievements/catalog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const ICON_MAP: Record<string, string> = {
  swords: "⚔️",
  shield: "🛡️",
  flame: "🔥",
  trophy: "🏆",
  footprints: "👣",
  coins: "🪙",
  sparkles: "✨",
  box: "📦",
  rocket: "🚀",
};

interface AchievementCardProps {
  achievement: AchievementDef;
  unlocked?: boolean;
  className?: string;
}

export function AchievementCard({ achievement, unlocked, className }: AchievementCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-4 transition",
        unlocked
          ? "border-cyan-500/30 bg-cyan-500/5"
          : "border-violet-500/10 bg-surface-elevated/40 opacity-70",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{ICON_MAP[achievement.icon] ?? "🏅"}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{achievement.name}</h3>
          <p className="mt-0.5 text-sm text-zinc-400">{achievement.description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Badge variant="violet">+{achievement.xp_reward} XP</Badge>
        {achievement.game_slug && (
          <Badge variant="outline">{achievement.game_slug}</Badge>
        )}
        {unlocked && <Badge variant="cyan">Unlocked</Badge>}
      </div>
    </div>
  );
}
