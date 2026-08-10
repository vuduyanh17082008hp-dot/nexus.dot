"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { GAME_CATALOG } from "@/lib/game/catalog";
import { getRecentGames, type RecentEntry } from "@/lib/demo/local-storage";
import { SectionHeading } from "@/components/layout/page-shell";

export function ContinuePlaying() {
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecent(getRecentGames());
    setReady(true);
  }, []);

  // Avoid SSR/client mismatch from localStorage.
  if (!ready || recent.length === 0) return null;

  return (
    <section>
      <SectionHeading title="Continue Playing" href="/recent" />
      <div className="flex gap-4 overflow-x-auto pb-2">
        {recent.map((entry) => {
          const game = GAME_CATALOG.find((g) => g.slug === entry.slug);
          return (
            <Link
              key={entry.slug}
              href={`/play/${entry.slug}`}
              className="group flex min-w-[240px] items-center gap-3 rounded-xl border border-violet-500/15 bg-surface-elevated/60 p-3 transition hover:border-cyan-500/30"
            >
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={entry.thumbnail_url}
                  alt={entry.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white group-hover:text-cyan-300">
                  {entry.title}
                </p>
                <p className="text-xs text-zinc-500">
                  {game?.genre ?? "game"} · resume
                </p>
              </div>
              <Play className="h-5 w-5 shrink-0 text-violet-400 group-hover:text-cyan-300" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
