import type { Game, GameGenre } from "@/types/database";

export const GAME_CATALOG: Game[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "neon-survivor",
    title: "Neon Survivor",
    description:
      "A top-down survival shooter in a collapsing neon grid. Survive endless waves, collect power-ups, and carve through the horde.",
    short_description: "Top-down survival shooter with escalating waves.",
    genre: "survival",
    thumbnail_url: "/games/neon-survivor.svg",
    banner_url: "/games/neon-survivor-banner.svg",
    status: "published",
    is_featured: true,
    play_count: 12840,
    rating: 4.8,
    created_at: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "void-runner",
    title: "Void Runner",
    description:
      "Sprint through an endless cyber void. Jump obstacles, collect coins, and push your high score as speed ramps up.",
    short_description: "Endless runner through the cyber void.",
    genre: "arcade",
    thumbnail_url: "/games/void-runner.svg",
    banner_url: "/games/void-runner-banner.svg",
    status: "published",
    is_featured: true,
    play_count: 9420,
    rating: 4.6,
    created_at: "2026-02-02T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "cyber-breakout",
    title: "Cyber Breakout",
    description:
      "A modern Breakout experience with physics, power-ups, particle juice, and multi-stage campaigns.",
    short_description: "Modern Breakout with levels and power-ups.",
    genre: "puzzle",
    thumbnail_url: "/games/cyber-breakout.svg",
    banner_url: "/games/cyber-breakout-banner.svg",
    status: "published",
    is_featured: false,
    play_count: 7155,
    rating: 4.7,
    created_at: "2026-03-15T00:00:00.000Z",
  },
];

export const CATEGORIES: { slug: GameGenre; title: string; description: string }[] = [
  { slug: "action", title: "Action", description: "High-intensity combat and reflexes." },
  { slug: "arcade", title: "Arcade", description: "Pick-up-and-play classics reinvented." },
  { slug: "strategy", title: "Strategy", description: "Think ahead. Outplay everyone." },
  { slug: "puzzle", title: "Puzzle", description: "Precision, timing, and clever clears." },
  { slug: "racing", title: "Racing", description: "Speed, lanes, and perfect lines." },
  { slug: "survival", title: "Survival", description: "Last as long as you can." },
];

export function getGameBySlug(slug: string): Game | undefined {
  return GAME_CATALOG.find((g) => g.slug === slug);
}

export function getGamesByGenre(genre: GameGenre): Game[] {
  return GAME_CATALOG.filter((g) => g.genre === genre && g.status === "published");
}

export function searchGames(query: string): Game[] {
  const q = query.trim().toLowerCase();
  if (!q) return GAME_CATALOG.filter((g) => g.status === "published");
  return GAME_CATALOG.filter((g) => {
    if (g.status !== "published") return false;
    return (
      g.title.toLowerCase().includes(q) ||
      g.genre.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.short_description.toLowerCase().includes(q)
    );
  });
}

export type SortKey = "trending" | "newest" | "most-played" | "highest-rated";

export function sortGames(games: Game[], sort: SortKey): Game[] {
  const list = [...games];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    case "most-played":
      return list.sort((a, b) => b.play_count - a.play_count);
    case "highest-rated":
      return list.sort((a, b) => b.rating - a.rating);
    case "trending":
    default:
      return list.sort((a, b) => b.play_count * b.rating - a.play_count * a.rating);
  }
}
