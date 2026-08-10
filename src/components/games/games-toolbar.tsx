"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import { CATEGORIES } from "@/lib/game/catalog";
import type { SortKey } from "@/lib/game/catalog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "most-played", label: "Most Played" },
  { value: "highest-rated", label: "Highest Rated" },
];

export function GamesToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const genre = searchParams.get("genre") ?? "";
  const sort = (searchParams.get("sort") as SortKey) || "trending";
  const view = searchParams.get("view") === "list" ? "list" : "grid";

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      startTransition(() => {
        router.push(`/games?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div className={cn("space-y-4", pending && "opacity-70")}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            defaultValue={q}
            placeholder="Search games..."
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParams({ q: (e.target as HTMLInputElement).value || null });
              }
            }}
          />
        </div>
        <Select
          value={sort}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateParams({ sort: e.target.value })}
          className="sm:w-44"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <div className="flex rounded-lg border border-violet-500/20">
          <button
            type="button"
            onClick={() => updateParams({ view: "grid" })}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-l-lg transition",
              view === "grid" ? "bg-violet-500/20 text-cyan-300" : "text-zinc-500 hover:text-white",
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => updateParams({ view: "list" })}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-r-lg transition",
              view === "list" ? "bg-violet-500/20 text-cyan-300" : "text-zinc-500 hover:text-white",
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateParams({ genre: null })}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition",
            !genre ? "bg-violet-500/25 text-violet-200" : "bg-zinc-800 text-zinc-400 hover:text-white",
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => updateParams({ genre: cat.slug })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              genre === cat.slug
                ? "bg-cyan-500/20 text-cyan-300"
                : "bg-zinc-800 text-zinc-400 hover:text-white",
            )}
          >
            {cat.title}
          </button>
        ))}
      </div>
    </div>
  );
}
