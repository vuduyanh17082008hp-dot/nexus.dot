import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

export interface StatItem {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  suffix?: string;
}

interface StatsStripProps {
  stats: StatItem[];
  className?: string;
}

export function StatsStrip({ stats, className }: StatsStripProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4",
        className,
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass rounded-xl p-4 border border-border transition-colors hover:border-primary/20"
        >
          <div className="flex items-center gap-2 text-muted">
            {stat.icon && <stat.icon className="h-4 w-4 text-secondary" aria-hidden="true" />}
            <span className="text-xs uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}
            {stat.suffix && (
              <span className="ml-1 text-sm font-normal text-muted">{stat.suffix}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
