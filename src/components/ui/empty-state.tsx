import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-raised border border-border">
          <Icon className="h-7 w-7 text-muted" aria-hidden="true" />
        </div>
      )}
      <div className="space-y-2 max-w-sm">
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {actionLabel && actionHref && (
        <Button href={actionHref} variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
