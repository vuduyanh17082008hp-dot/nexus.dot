import Link from "next/link";
import type { GameGenre } from "@/types/database";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<GameGenre, string> = {
  action: "⚔️",
  arcade: "🕹️",
  strategy: "♟️",
  puzzle: "🧩",
  racing: "🏎️",
  survival: "🛡️",
};

interface CategoryCardProps {
  slug: GameGenre;
  title: string;
  description: string;
  count?: number;
}

export function CategoryCard({ slug, title, description, count }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${slug}`}
      className={cn(
        "group flex flex-col rounded-xl border border-violet-500/15 bg-surface-elevated/60 p-5 transition",
        "hover:border-cyan-500/30 hover:bg-surface-elevated hover:shadow-lg hover:shadow-violet-500/5",
      )}
    >
      <span className="text-3xl">{ICONS[slug]}</span>
      <h3 className="mt-3 font-semibold text-white group-hover:text-cyan-300">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
      {count !== undefined && (
        <span className="mt-auto pt-3 text-xs text-zinc-500">{count} games</span>
      )}
    </Link>
  );
}
