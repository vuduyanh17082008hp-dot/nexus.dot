import { Play, Zap, Trophy, Shield } from "lucide-react";
import {
  GAME_CATALOG,
  CATEGORIES,
  sortGames,
  getGamesByGenre,
} from "@/lib/game/catalog";
import { DEMO_LEADERBOARD } from "@/lib/demo/leaderboard";
import { FeaturedPanel } from "@/components/game/featured-panel";
import { GameCard } from "@/components/game/game-card";
import { CategoryCard } from "@/components/game/category-card";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { ContinuePlaying } from "@/components/library/continue-playing";
import { SectionHeading } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const featured = GAME_CATALOG.find((g) => g.is_featured) ?? GAME_CATALOG[0];
  const trending = sortGames(GAME_CATALOG.filter((g) => g.status === "published"), "trending");
  const newest = sortGames(GAME_CATALOG.filter((g) => g.status === "published"), "newest");

  const leaderboardRows = DEMO_LEADERBOARD.slice(0, 5).map((e) => ({
    rank: e.rank,
    username: e.username,
    displayName: e.displayName,
    score: e.score,
    gameTitle: e.gameTitle,
    gameSlug: e.gameSlug,
    level: e.level,
  }));

  return (
    <div className="space-y-16 pb-16">
      <section className="relative overflow-hidden border-b border-violet-500/10">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-cyan-400/80">
            Browser Gaming Platform
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl md:leading-tight">
            <span className="nexus-gradient-text">PLAY.</span>{" "}
            <span className="text-white">COMPETE.</span>{" "}
            <span className="nexus-gradient-text">ASCEND.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-zinc-400">
            Instant-play arcade experiences. Climb leaderboards, unlock achievements, and level up your profile.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/play/neon-survivor" size="lg">
              <Play className="h-5 w-5" /> Play Now
            </Button>
            <Button href="/games" variant="secondary" size="lg">
              Explore Games
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4">
        <FeaturedPanel game={featured} />

        <ContinuePlaying />

        <section>
          <SectionHeading title="Trending Now" href="/trending" />
          <div className="flex gap-4 overflow-x-auto pb-2">
            {trending.map((game) => (
              <GameCard key={game.slug} game={game} variant="compact" />
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title="Categories" href="/games" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.slug}
                slug={cat.slug}
                title={cat.title}
                description={cat.description}
                count={getGamesByGenre(cat.slug).length}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title="Top Players" href="/leaderboard" />
          <div className="rounded-xl border border-violet-500/15 bg-surface-elevated/60 p-4">
            <LeaderboardTable entries={leaderboardRows} />
          </div>
        </section>

        <section>
          <SectionHeading title="Recently Added" href="/new" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newest.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title="Platform Features" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "Instant Play", desc: "No downloads. Launch games in your browser." },
              { icon: Trophy, title: "Leaderboards", desc: "Compete daily, weekly, and all-time." },
              { icon: Shield, title: "Achievements", desc: "Earn XP and unlock badges across games." },
              { icon: Play, title: "3 Games Live", desc: "Neon Survivor, Void Runner, Cyber Breakout." },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-violet-500/15 bg-surface-elevated/40 p-5"
              >
                <Icon className="h-8 w-8 text-violet-400" />
                <h3 className="mt-3 font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 to-cyan-950/20 p-8 text-center md:p-12">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Ready to ascend?</h2>
          <p className="mx-auto mt-3 max-w-lg text-zinc-400">
            Jump into Neon Survivor or explore the full library. Your next high score is one click away.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button href="/play/neon-survivor" size="lg">
              Play Neon Survivor
            </Button>
            <Button href="/leaderboard" variant="secondary" size="lg">
              View Leaderboard
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
