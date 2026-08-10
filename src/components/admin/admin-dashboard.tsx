"use client";

import { useCallback, useEffect, useState } from "react";
import { GAME_CATALOG } from "@/lib/game/catalog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface AdminStats {
  users: number;
  sessions: number;
  games: number;
  leaderboardEntries: number;
}

function initialFeatured(): Record<string, boolean> {
  const initial: Record<string, boolean> = {};
  GAME_CATALOG.forEach((g) => {
    initial[g.slug] = g.is_featured;
  });
  return initial;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [featured, setFeatured] = useState<Record<string, boolean>>(initialFeatured);
  const [demoMode, setDemoMode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((json: { stats?: AdminStats; data?: AdminStats; mode?: string; message?: string }) => {
        setDemoMode(json.mode === "demo");
        setStats(json.stats ?? json.data ?? null);
        if (json.message) setMessage(json.message);
      });
  }, []);

  const toggleFeatured = useCallback(async (slug: string) => {
    const next = !featured[slug];
    setFeatured((prev) => ({ ...prev, [slug]: next }));

    try {
      const res = await fetch("/api/admin/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, isFeatured: next }),
      });
      const json = (await res.json()) as { mode?: string; message?: string; error?: string };
      if (!res.ok) {
        setFeatured((prev) => ({ ...prev, [slug]: !next }));
        setMessage(json.message ?? json.error ?? "Update failed");
      }
    } catch {
      setMessage("Demo mode — changes are local only.");
    }
  }, [featured]);

  return (
    <div className="space-y-8">
      {demoMode && message && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          {message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Users", value: stats?.users ?? 0 },
          { label: "Sessions", value: stats?.sessions ?? 0 },
          { label: "Games", value: stats?.games ?? GAME_CATALOG.length },
          { label: "Leaderboard", value: stats?.leaderboardEntries ?? 0 },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">{item.label}</p>
              <p className="mt-1 text-3xl font-bold text-white">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">Featured Games</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {GAME_CATALOG.map((game) => (
            <div
              key={game.slug}
              className="flex items-center justify-between rounded-lg border border-violet-500/10 px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">{game.title}</p>
                <p className="text-xs text-zinc-500">{game.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => void toggleFeatured(game.slug)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  featured[game.slug]
                    ? "bg-violet-500/25 text-violet-200"
                    : "bg-zinc-800 text-zinc-400",
                )}
              >
                {featured[game.slug] ? "Featured" : "Not featured"}
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
