"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

const PERIODS = ["today", "week", "all"] as const;
const GAMES = [
  { slug: "", label: "All Games" },
  { slug: "neon-survivor", label: "Neon Survivor" },
  { slug: "void-runner", label: "Void Runner" },
  { slug: "cyber-breakout", label: "Cyber Breakout" },
];

export function LeaderboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const period = searchParams.get("period") ?? "all";
  const gameSlug = searchParams.get("gameSlug") ?? "";
  const page = searchParams.get("page") ?? "1";

  const update = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (!v) params.delete(k);
        else params.set(k, v);
      }
      if (!patch.page) params.set("page", "1");
      startTransition(() => router.push(`/leaderboard?${params.toString()}`));
    },
    [router, searchParams],
  );

  return (
    <div className={cn("space-y-4", pending && "opacity-70")}>
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => update({ period: p, page: "1" })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm capitalize transition",
              period === p
                ? "bg-violet-500/25 text-violet-200"
                : "bg-zinc-800 text-zinc-400 hover:text-white",
            )}
          >
            {p === "all" ? "All Time" : p}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {GAMES.map((g) => (
          <button
            key={g.slug || "all"}
            type="button"
            onClick={() => update({ gameSlug: g.slug, page: "1" })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition",
              gameSlug === g.slug
                ? "bg-cyan-500/20 text-cyan-300"
                : "bg-zinc-800/80 text-zinc-400 hover:text-white",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
      <input type="hidden" value={page} readOnly />
    </div>
  );
}

export function LeaderboardPagination({ total, limit, page }: { total: number; limit: number; page: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/leaderboard?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className="rounded-lg border border-violet-500/20 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-zinc-500">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
        className="rounded-lg border border-violet-500/20 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

export function SearchForm({ defaultQuery }: { defaultQuery: string }) {
  const router = useRouter();

  return (
    <form
      className="mb-6"
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q") as string;
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Input name="q" defaultValue={defaultQuery} placeholder="Search games..." className="max-w-lg" />
    </form>
  );
}
