import { cn } from "@/lib/utils/cn";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  animated?: boolean;
  variant?: "primary" | "secondary" | "accent";
}

export function Progress({
  value,
  max = 100,
  showLabel = false,
  animated = true,
  variant = "primary",
  className,
  ...props
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const fillColors = {
    primary: "bg-gradient-to-r from-primary to-primary/70",
    secondary: "bg-gradient-to-r from-secondary to-secondary/70",
    accent: "bg-gradient-to-r from-accent to-accent/70",
  };

  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted">
          <span>Progress</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-surface-raised border border-border"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            fillColors[variant],
            animated && "xp-bar-fill",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
