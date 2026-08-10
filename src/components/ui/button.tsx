import { cn } from "@/lib/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-violet-400",
        secondary:
          "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20",
        ghost: "text-zinc-300 hover:bg-white/5 hover:text-white",
        danger: "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30",
        outline: "border border-violet-500/30 text-violet-200 hover:bg-violet-500/10",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
}

export function Button({ className, variant, size, href, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} type="button" {...props}>
      {children}
    </button>
  );
}
