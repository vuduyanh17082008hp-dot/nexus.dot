"use client";

import { useCallback, useEffect, useState } from "react";

interface FavoriteGame {
  game_id: string;
  created_at: string;
  games?: {
    id: string;
    slug: string;
    title: string;
    thumbnail_url: string;
    genre: string;
    is_featured: boolean;
  } | null;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/favorites");
      const json = (await res.json()) as {
        favorites?: FavoriteGame[];
        data?: FavoriteGame[];
        mode?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok && res.status !== 200) {
        throw new Error(json.error ?? "Failed to load favorites");
      }

      setDemoMode(json.mode === "demo");
      setFavorites(json.favorites ?? json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load favorites");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addFavorite = useCallback(async (gameSlug: string) => {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameSlug }),
    });
    const json = (await res.json()) as { error?: string; mode?: string };
    if (!res.ok) {
      throw new Error(json.error ?? json.mode ?? "Failed to add favorite");
    }
    await refresh();
  }, [refresh]);

  const removeFavorite = useCallback(async (gameSlug: string) => {
    const res = await fetch(`/api/favorites?gameSlug=${encodeURIComponent(gameSlug)}`, {
      method: "DELETE",
    });
    const json = (await res.json()) as { error?: string; mode?: string };
    if (!res.ok) {
      throw new Error(json.error ?? json.mode ?? "Failed to remove favorite");
    }
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    favorites,
    loading,
    error,
    demoMode,
    refresh,
    addFavorite,
    removeFavorite,
    isFavorite: (slug: string) =>
      favorites.some((f) => f.games?.slug === slug),
  };
}
