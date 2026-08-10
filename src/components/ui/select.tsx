import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full appearance-none rounded-lg border bg-surface px-3 py-2 pr-9 text-sm text-foreground transition-colors",
          "border-border focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger focus:border-danger focus:ring-danger/25",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
  ),
);

Select.displayName = "Select";
