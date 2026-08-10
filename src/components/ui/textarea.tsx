import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors resize-y",
        "border-border focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-danger focus:border-danger focus:ring-danger/25",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
