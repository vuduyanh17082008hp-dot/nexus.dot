import { cn } from "@/lib/utils/cn";
import { getLevelProgress } from "@/lib/xp/curve";
import { formatNumber } from "@/lib/utils/format";
import { Progress } from "@/components/ui/progress";

interface XpBarProps {
  xp: number;
  showDetails?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function XpBar({ xp, showDetails = true, className, size = "md" }: XpBarProps) {
  const { level, xpIntoLevel, xpForNext, progress } = getLevelProgress(xp);
  const pct = progress * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-display font-semibold text-secondary">
            Level {level}
          </span>
          <span className="text-muted">
            {formatNumber(xpIntoLevel)} / {formatNumber(xpForNext)} XP
          </span>
        </div>
      )}
      <Progress
        value={pct}
        animated
        variant="secondary"
        className={size === "sm" ? "[&>div:first-child]:hidden" : undefined}
      />
    </div>
  );
}
