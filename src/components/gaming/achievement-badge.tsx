import {
  Award,
  Box,
  Coins,
  Flame,
  Footprints,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AchievementDef } from "@/lib/achievements/catalog";

const iconMap: Record<string, LucideIcon> = {
  swords: Swords,
  shield: Shield,
  flame: Flame,
  trophy: Trophy,
  footprints: Footprints,
  coins: Coins,
  sparkles: Sparkles,
  box: Box,
  rocket: Rocket,
};

interface AchievementBadgeProps {
  achievement: AchievementDef;
  unlocked?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: { wrapper: "h-10 w-10", icon: "h-4 w-4", text: "text-[10px]" },
  md: { wrapper: "h-14 w-14", icon: "h-6 w-6", text: "text-xs" },
  lg: { wrapper: "h-20 w-20", icon: "h-8 w-8", text: "text-sm" },
};

export function AchievementBadge({
  achievement,
  unlocked = false,
  size = "md",
  className,
}: AchievementBadgeProps) {
  const Icon = iconMap[achievement.icon] ?? Award;
  const styles = sizeStyles[size];

  return (
    <div
      className={cn("flex flex-col items-center gap-2 text-center", className)}
      title={`${achievement.name}: ${achievement.description}`}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border transition-all",
          styles.wrapper,
          unlocked
            ? "border-accent/40 bg-accent/10 text-accent glow-accent"
            : "border-border bg-surface-raised text-muted opacity-50 grayscale",
        )}
      >
        <Icon className={styles.icon} aria-hidden="true" />
      </div>
      <span className={cn("font-medium text-foreground line-clamp-1 max-w-[80px]", styles.text)}>
        {achievement.name}
      </span>
    </div>
  );
}
