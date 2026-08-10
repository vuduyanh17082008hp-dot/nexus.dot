import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const pxMap = { sm: 32, md: 40, lg: 48, xl: 64 };

export function Avatar({ src, alt = "Avatar", fallback, size = "md", className }: AvatarProps) {
  const initials = fallback
    ? fallback.slice(0, 2).toUpperCase()
    : alt.slice(0, 2).toUpperCase();

  if (src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full border-2 border-primary/30 bg-surface-raised",
          sizeMap[size],
          className,
        )}
      >
        <Image
          src={src}
          alt={alt}
          width={pxMap[size]}
          height={pxMap[size]}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-2 border-primary/30 bg-surface-raised font-display font-semibold text-primary",
        sizeMap[size],
        className,
      )}
      aria-label={alt}
    >
      {fallback || initials !== alt.slice(0, 2).toUpperCase() ? (
        initials
      ) : (
        <User className="h-1/2 w-1/2 text-muted" aria-hidden="true" />
      )}
    </div>
  );
}
