import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-violet-500/10", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video" />
        ))}
      </div>
    </div>
  );
}
