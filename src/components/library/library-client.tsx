"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Clock } from "lucide-react";
import { GAME_CATALOG } from "@/lib/game/catalog";
import { getLocalFavorites, getRecentGames } from "@/lib/demo/local-storage";
import { GameCard } from "@/components/game/game-card";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

interface LibraryClientProps {
  mode: "library" | "favorites" | "recent";
}

export function LibraryClient({ mode }: LibraryClientProps) {
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [apiFavorites, setApiFavorites] = useState<string[]>([]);
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    setFavoriteSlugs(getLocalFavorites());
    setRecentSlugs(getRecentGames().map((r) => r.slug));

    void fetch("/api/favorites")
      .then((r) => r.json())
      .then((json: { favorites?: Array<{ games?: { slug: string } | null }>; mode?: string; data?: unknown[] }) => {
        setDemoMode(json.mode === "demo" || !json.favorites?.length);
        const slugs = (json.favorites ?? [])
          .map((f) => f.games?.slug)
          .filter(Boolean) as string[];
        if (slugs.length) setApiFavorites(slugs);
      })
      .catch(() => undefined);
  }, []);

  const favSlugs = apiFavorites.length ? apiFavorites : favoriteSlugs;
  const favoriteGames = GAME_CATALOG.filter((g) => favSlugs.includes(g.slug));
  const recentGames = recentSlugs
    .map((slug) => GAME_CATALOG.find((g) => g.slug === slug))
    .filter(Boolean) as typeof GAME_CATALOG;

  if (mode === "favorites") {
    return (
      <PageShell title="Favorites" description="Games you've marked as favorites.">
        {demoMode && (
          <p className="mb-4 text-sm text-amber-400/80">
            Demo mode — favorites stored locally in your browser.
          </p>
        )}
        {favoriteGames.length === 0 ? (
          <div className="py-16 text-center">
            <Heart className="mx-auto h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-zinc-400">No favorites yet.</p>
            <Button href="/games" className="mt-4" variant="secondary">
              Browse Games
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteGames.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        )}
      </PageShell>
    );
  }

  if (mode === "recent") {
    return (
      <PageShell title="Recently Played" description="Pick up where you left off.">
        {recentGames.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="mx-auto h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-zinc-400">No recent games. Start playing!</p>
            <Button href="/play/neon-survivor" className="mt-4">
              Play Neon Survivor
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentGames.map((game) => (
              <Link
                key={game.slug}
                href={`/play/${game.slug}`}
                className="flex items-center gap-4 rounded-xl border border-violet-500/15 bg-surface-elevated/60 p-4 transition hover:border-cyan-500/30"
              >
                <div className="relative h-16 w-24 overflow-hidden rounded-lg">
                  <Image src={game.thumbnail_url} alt={game.title} fill className="object-cover" sizes="96px" />
                </div>
                <div>
                  <p className="font-semibold text-white">{game.title}</p>
                  <p className="text-sm text-zinc-500">{game.short_description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell title="Your Library" description="Favorites and recently played games.">
      {demoMode && (
        <p className="mb-6 text-sm text-amber-400/80">
          Demo mode — data stored locally. Sign in with Supabase for cloud sync.
        </p>
      )}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Favorites</h2>
        {favoriteGames.length === 0 ? (
          <p className="text-sm text-zinc-500">No favorites yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteGames.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Recently Played</h2>
        {recentGames.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent games.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentGames.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
