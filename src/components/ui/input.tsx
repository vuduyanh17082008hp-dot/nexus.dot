import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors",
        "border-border focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-danger focus:border-danger focus:ring-danger/25",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 rounded-lg border border-violet-500/20 bg-surface-elevated px-3 py-2 text-sm text-foreground focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-lg border border-violet-500/20 bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/20",
        className,
      )}
      {...props}
    />
  );
}
