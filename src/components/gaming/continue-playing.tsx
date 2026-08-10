import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface ContinuePlayingItem {
  slug: string;
  title: string;
  thumbnailUrl: string;
  progress?: number;
  lastPlayed?: string;
}

interface ContinuePlayingProps {
  items: ContinuePlayingItem[];
  className?: string;
}

export function ContinuePlaying({ items, className }: ContinuePlayingProps) {
  if (items.length === 0) return null;

  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="font-display text-xl font-semibold text-foreground">Continue Playing</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {items.map((item) => (
          <Card
            key={item.slug}
            className="shrink-0 w-64 snap-start overflow-hidden group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-3 p-3">
              <Link href={`/play/${item.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/play/${item.slug}`}>
                  <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </Link>
                {item.lastPlayed && (
                  <p className="text-xs text-muted mt-0.5">{item.lastPlayed}</p>
                )}
                {item.progress !== undefined && (
                  <div className="mt-2 h-1 w-full rounded-full bg-surface-raised overflow-hidden">
                    <div
                      className="h-full rounded-full bg-secondary"
                      style={{ width: `${Math.min(100, item.progress)}%` }}
                    />
                  </div>
                )}
              </div>
              <Button
                href={`/play/${item.slug}`}
                size="icon"
                variant="ghost"
                className="shrink-0"
                aria-label={`Play ${item.title}`}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
