import { getLevelProgress } from "@/lib/xp/curve";
import { cn } from "@/lib/utils/cn";

interface XpBarProps {
  xp: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function XpBar({ xp, showLabel = true, size = "md", className }: XpBarProps) {
  const { level, xpIntoLevel, xpForNext, progress } = getLevelProgress(xp);

  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-violet-300">Level {level}</span>
          <span className="text-zinc-500">
            {xpIntoLevel} / {xpForNext} XP
          </span>
        </div>
      )}
      <div className={cn("overflow-hidden rounded-full bg-violet-950/80", heights[size])}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
