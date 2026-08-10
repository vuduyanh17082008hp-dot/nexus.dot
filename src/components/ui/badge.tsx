import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary border border-primary/30",
        secondary: "bg-secondary/15 text-secondary border border-secondary/25",
        accent: "bg-accent/15 text-accent border border-accent/25",
        outline: "border border-border-strong text-muted bg-transparent",
        success: "bg-success/15 text-success border border-success/25",
        danger: "bg-danger/15 text-danger border border-danger/25",
        cyan: "bg-secondary/15 text-secondary border border-secondary/25",
        violet: "bg-primary/20 text-primary border border-primary/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
