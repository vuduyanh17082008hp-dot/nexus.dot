import { cn } from "@/lib/utils/cn";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}

const sizeMap = {
  default: "max-w-7xl",
  narrow: "max-w-3xl",
  wide: "max-w-[1400px]",
};

export function Container({ children, className, size = "default" }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeMap[size], className)}>
      {children}
    </div>
  );
}
