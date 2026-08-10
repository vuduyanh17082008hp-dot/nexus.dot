"use client";

import Link from "next/link";
import { Heart, Gamepad2, Trophy } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useFavorites } from "@/hooks/use-favorites";
import { getRecentGames } from "@/lib/demo/local-storage";
import { GAME_CATALOG } from "@/lib/game/catalog";
import { XpBar } from "@/components/user/xp-bar";
import { GameCard } from "@/components/game/game-card";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export function DashboardClient() {
  const { profile, loading, configured } = useUser();
  const { favorites } = useFavorites();
  const [recentSlugs] = useState(() => getRecentGames().map((r) => r.slug));

  const xp = profile?.xp ?? 1240;
  const level = profile?.level ?? 5;
  const name = profile?.display_name ?? profile?.username ?? "Player";

  const favFromCatalog = favorites.length
    ? favorites
        .map((f) => GAME_CATALOG.find((g) => g.slug === f.games?.slug))
        .filter(Boolean)
    : [];

  const recentGames = recentSlugs
    .map((s) => GAME_CATALOG.find((g) => g.slug === s))
    .filter(Boolean)
    .slice(0, 3);

  if (loading && configured) {
    return <PageShell title="Dashboard"><p className="text-zinc-500">Loading...</p></PageShell>;
  }

  return (
    <PageShell title={`Welcome, ${name}`} description="Your gaming hub at a glance.">
      {!configured && (
        <p className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          Demo mode — sign in with Supabase to sync progress across devices.
        </p>
      )}

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">Level {level}</p>
              <p className="text-2xl font-bold text-white">{xp.toLocaleString()} XP</p>
            </div>
            <XpBar xp={xp} className="w-full max-w-md" />
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Gamepad2, label: "Games Available", value: GAME_CATALOG.length },
          { icon: Heart, label: "Favorites", value: favFromCatalog.length || favorites.length },
          { icon: Trophy, label: "Recent Sessions", value: recentSlugs.length },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-5">
              <Icon className="h-8 w-8 text-violet-400" />
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recently Played</h2>
          <Link href="/recent" className="text-sm text-cyan-400">View all →</Link>
        </div>
        {recentGames.length === 0 ? (
          <Button href="/play/neon-survivor">Start Playing</Button>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentGames.map((game) => game && <GameCard key={game.slug} game={game} />)}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Favorites</h2>
          <Link href="/favorites" className="text-sm text-cyan-400">View all →</Link>
        </div>
        {favFromCatalog.length === 0 ? (
          <p className="text-sm text-zinc-500">No favorites yet. Heart a game while playing!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favFromCatalog.map((game) => game && <GameCard key={game.slug} game={game} />)}
          </div>
        )}
      </section>
    </PageShell>
  );
}
