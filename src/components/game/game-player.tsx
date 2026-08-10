"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  HelpCircle,
  Maximize,
  Minimize,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { GameShell } from "@/games/shared/GameShell";
import type { NexusGameBridge } from "@/games/shared/GameShell";
import type { GameEndResult, GameHudStats, PerformancePreset } from "@/types/game";
import type { Game } from "@/types/database";
import { evaluateAchievements } from "@/lib/achievements/catalog";
import { calculateSessionXP } from "@/lib/xp/curve";
import { DEMO_LEADERBOARD } from "@/lib/demo/leaderboard";
import {
  addRecentGame,
  getLocalHighScore,
  isLocalFavorite,
  saveLocalSession,
  toggleLocalFavorite,
} from "@/lib/demo/local-storage";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

interface GamePlayerProps {
  game: Game;
}

interface SessionResponse {
  score: number;
  xpGained: number;
  highScore: number;
  achievementsUnlocked: string[];
  achievements?: Array<{ slug: string; name: string; xp_reward: number }>;
  mode?: string;
  message?: string;
}

export function GamePlayer({ game }: GamePlayerProps) {
  const bridgeRef = useRef<NexusGameBridge | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [fullscreen, setFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [preset, setPreset] = useState<PerformancePreset>("medium");
  const [hud, setHud] = useState<GameHudStats>({ score: 0 });
  const [gameOver, setGameOver] = useState<GameEndResult | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    addRecentGame({
      slug: game.slug,
      title: game.title,
      thumbnail_url: game.thumbnail_url,
    });
    setFavorited(isLocalFavorite(game.slug));
  }, [game]);

  const togglePause = useCallback(() => {
    const bridge = bridgeRef.current;
    if (!bridge) return;
    if (paused) {
      bridge.onResume();
      setPaused(false);
    } else {
      bridge.onPause();
      setPaused(true);
    }
  }, [paused]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    bridgeRef.current?.onMute(next);
    setMuted(next);
  }, [muted]);

  const handleVolume = useCallback((v: number) => {
    setVolume(v);
    bridgeRef.current?.onVolume(v, v * 0.85, v);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  const handleFavorite = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites", {
        method: favorited ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug: game.slug }),
      });
      if (res.ok) {
        setFavorited(!favorited);
        return;
      }
    } catch {
      /* demo fallback */
    }
    const added = toggleLocalFavorite(game.slug);
    setFavorited(added);
  }, [favorited, game.slug]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/play/${game.slug}`;
    if (navigator.share) {
      await navigator.share({ title: game.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [game]);

  const submitSession = useCallback(
    async (result: GameEndResult) => {
      setSubmitting(true);
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const numericMeta: Record<string, number> = {};
      for (const [k, v] of Object.entries(result.metadata)) {
        if (typeof v === "number") numericMeta[k] = v;
        else if (typeof v === "boolean") numericMeta[k] = v ? 1 : 0;
      }
      numericMeta.score = result.score;

      const localHigh = getLocalHighScore(game.slug);
      const isHighScore = result.score > localHigh;
      const achievements = evaluateAchievements(game.slug, numericMeta);
      const xpGained =
        calculateSessionXP({
          score: result.score,
          durationSeconds,
          isHighScore,
          isDailyFirst: true,
        }) + achievements.reduce((s, a) => s + a.xp_reward, 0);

      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameSlug: game.slug,
            score: result.score,
            durationSeconds,
            metadata: result.metadata,
          }),
        });
        const json = (await res.json()) as SessionResponse;
        if (res.ok) {
          setSessionResult(json);
          setSubmitting(false);
          return;
        }
      } catch {
        /* demo fallback */
      }

      const localResult: SessionResponse = {
        score: result.score,
        xpGained,
        highScore: Math.max(localHigh, result.score),
        achievementsUnlocked: achievements.map((a) => a.slug),
        achievements: achievements.map((a) => ({
          slug: a.slug,
          name: a.name,
          xp_reward: a.xp_reward,
        })),
        mode: "demo",
        message: "Score saved locally in demo mode.",
      };
      saveLocalSession(game.slug, {
        score: localResult.score,
        xpGained: localResult.xpGained,
        highScore: localResult.highScore,
        achievementsUnlocked: localResult.achievementsUnlocked ?? [],
      });
      setSessionResult(localResult);
      setSubmitting(false);
    },
    [game.slug],
  );

  const handleGameOver = useCallback(
    (result: GameEndResult) => {
      setGameOver(result);
      setPaused(false);
      void submitSession(result);
    },
    [submitSession],
  );

  const handleRestart = useCallback(() => {
    bridgeRef.current?.onRestart();
    setGameOver(null);
    setSessionResult(null);
    setPaused(false);
    setHud(
      game.slug === "void-runner"
        ? { score: 0, progress: 0, best: getLocalHighScore(game.slug) || 0, attempt: 1, form: "CUBE" }
        : { score: 0, wave: 1, highScore: getLocalHighScore(game.slug) || undefined },
    );
    startTimeRef.current = Date.now();
  }, [game.slug]);

  const handleReady = useCallback(() => {
    bridgeRef.current?.onVolume(volume, volume * 0.85, volume);
    setHud((prev) =>
      game.slug === "void-runner"
        ? {
            score: prev.score ?? 0,
            progress: prev.progress ?? 0,
            best: getLocalHighScore(game.slug) || prev.best || 0,
            attempt: prev.attempt ?? 1,
            form: prev.form ?? "CUBE",
          }
        : {
            ...prev,
            score: prev.score ?? 0,
            wave: prev.wave ?? 1,
            highScore: getLocalHighScore(game.slug) || prev.highScore,
          },
    );
  }, [volume, game.slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && paused) togglePause();
      if (e.key === "p" || e.key === "P") togglePause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, togglePause]);

  const previewEntries = DEMO_LEADERBOARD.filter((e) => e.gameSlug === game.slug)
    .slice(0, 3)
    .map((e) => ({
      rank: e.rank,
      username: e.username,
      displayName: e.displayName,
      score: e.score,
      level: e.level,
    }));

  const isVoidRunner = game.slug === "void-runner";
  const isRhythm = isVoidRunner || game.slug === "boot-sequence";

  return (
    <div
      className={cn(
        "mx-auto max-w-7xl space-y-6 px-4 py-6",
        isVoidRunner && "rounded-2xl bg-gradient-to-b from-[#10131F] via-[#080A12] to-[#080A12]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/games/${game.slug}`}
            className={cn(
              "mb-1 inline-flex items-center gap-1 text-sm hover:text-[#65E8FF]",
              isVoidRunner ? "text-[#9AA4BC]" : "text-zinc-500 hover:text-cyan-300",
            )}
          >
            <ArrowLeft className="h-4 w-4" /> Back to details
          </Link>
          <h1
            className={cn(
              "text-2xl font-bold md:text-3xl",
              isVoidRunner ? "font-display tracking-wide text-[#F5F7FF]" : "text-white",
            )}
          >
            {game.title}
          </h1>
          {isVoidRunner && (
            <p className="mt-1 text-sm text-[#9AA4BC]">VOID SIGNAL · One-button auto-run</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="icon" onClick={togglePause} aria-label={paused ? "Resume" : "Pause"}>
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowHelp(!showHelp)} aria-label="Controls help">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavorite}
            aria-label="Favorite"
            className={favorited ? "text-pink-400" : ""}
          >
            <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} aria-label="Fullscreen">
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          {isVoidRunner && (
            <Button href="/editor/void-runner" variant="outline" size="sm">
              Editor
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            Performance
          </Button>
        </div>
      </div>

      {showSettings && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-4 rounded-xl border p-4",
            isVoidRunner
              ? "border-[#7C5CFF]/25 bg-[#171B2A]"
              : "border-violet-500/20 bg-surface-elevated",
          )}
        >
          <label className={cn("text-sm", isVoidRunner ? "text-[#9AA4BC]" : "text-zinc-400")}>
            Master volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => handleVolume(Number(e.target.value))}
              className="ml-2 w-32 accent-[#65E8FF]"
            />
          </label>
          <label className={cn("text-sm", isVoidRunner ? "text-[#9AA4BC]" : "text-zinc-400")}>
            Quality
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as PerformancePreset)}
              className={cn(
                "ml-2 rounded border px-2 py-1 text-sm",
                isVoidRunner
                  ? "border-[#7C5CFF]/25 bg-[#10131F] text-[#F5F7FF]"
                  : "border-violet-500/20 bg-surface",
              )}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
      )}

      {showHelp && (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm",
            isVoidRunner
              ? "border-[#65E8FF]/20 bg-[#65E8FF]/5 text-[#F5F7FF]"
              : "border-cyan-500/20 bg-cyan-500/5 text-zinc-300",
          )}
        >
          {isRhythm ? (
            <>
              <p><strong>Space / W / ↑ / Click / Tap</strong> — Primary (jump / thrust)</p>
              <p><strong>R</strong> — Fast restart</p>
              <p><strong>P / Esc</strong> — Pause</p>
              {isVoidRunner && (
                <>
                  <p><strong>C</strong> — Toggle practice mode</p>
                  <p><strong>Z / X</strong> or <strong>[ / ]</strong> — Prev / next checkpoint (practice)</p>
                </>
              )}
            </>
          ) : (
            <>
              <p><strong>WASD / Arrow keys</strong> — Move</p>
              <p><strong>Mouse / Touch</strong> — Aim &amp; fire (Neon Survivor)</p>
              <p><strong>Space</strong> — Action / Jump</p>
              <p><strong>P / Esc</strong> — Pause</p>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div ref={containerRef} className="relative">
          <GameShell
            ref={bridgeRef}
            gameSlug={game.slug}
            graphicsPreset={preset}
            showMobileControls
            onGameOver={handleGameOver}
            onHudUpdate={setHud}
            onReady={handleReady}
          />

          {paused && !gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-[#080A12]/75 backdrop-blur-sm">
              <Pause className="mb-4 h-12 w-12 text-[#7C5CFF]" />
              <p className="text-lg font-semibold text-[#F5F7FF]">PAUSED</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Button onClick={togglePause}>Resume</Button>
                <Button variant="secondary" onClick={handleRestart}>
                  Restart
                </Button>
                <Button href={`/games/${game.slug}`} variant="ghost">
                  Exit
                </Button>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#080A12]/88 backdrop-blur-md p-4">
              <div className="w-full max-w-md space-y-4 text-center">
                <h2 className="text-2xl font-bold text-[#F5F7FF]">
                  {isVoidRunner ? "Signal Locked" : "Game Over"}
                </h2>
                <p className="text-4xl font-mono font-bold text-[#65E8FF]">
                  {formatNumber(gameOver.score)}
                </p>
                {submitting ? (
                  <p className="text-sm text-[#9AA4BC]">Saving session...</p>
                ) : sessionResult ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-[#7C5CFF]">+{sessionResult.xpGained} XP</p>
                    <p className="text-[#9AA4BC]">
                      High score: {formatNumber(sessionResult.highScore)}
                    </p>
                    {sessionResult.mode === "demo" && (
                      <p className="text-xs text-amber-400/80">{sessionResult.message}</p>
                    )}
                    {sessionResult.achievements && sessionResult.achievements.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {sessionResult.achievements.map((a) => (
                          <Badge key={a.slug} variant="cyan">
                            {a.name} (+{a.xp_reward} XP)
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
                <div className="flex justify-center gap-3 pt-2">
                  <Button onClick={handleRestart}>Restart</Button>
                  <Button href={`/games/${game.slug}`} variant="secondary">
                    Back
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div
            className={cn(
              "rounded-xl border p-4",
              isVoidRunner
                ? "border-[#7C5CFF]/20 bg-[#171B2A]"
                : "border-violet-500/15 bg-surface-elevated",
            )}
          >
            <h3
              className={cn(
                "mb-3 text-sm font-semibold uppercase tracking-wider",
                isVoidRunner ? "text-[#9AA4BC]" : "text-zinc-500",
              )}
            >
              {isVoidRunner ? "Live Run" : "Live Stats"}
            </h3>
            <dl className="space-y-2 text-sm">
              {isVoidRunner ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-[#9AA4BC]">Progress</dt>
                    <dd className="font-mono text-[#65E8FF]">{hud.progress ?? hud.score ?? 0}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#9AA4BC]">Best</dt>
                    <dd className="font-mono text-[#7C5CFF]">
                      {hud.best ?? hud.highScore ?? 0}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#9AA4BC]">Attempt</dt>
                    <dd className="font-mono text-[#F5F7FF]">{hud.attempt ?? 1}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#9AA4BC]">Form</dt>
                    <dd className="font-mono text-[#458BFF]">{hud.form ?? "CUBE"}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Score</dt>
                    <dd className="font-mono text-cyan-300">{formatNumber(hud.score)}</dd>
                  </div>
                  {hud.highScore !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Best</dt>
                      <dd className="font-mono text-violet-300">{formatNumber(hud.highScore)}</dd>
                    </div>
                  )}
                  {hud.wave !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Wave</dt>
                      <dd>{hud.wave}</dd>
                    </div>
                  )}
                  {hud.level !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Level</dt>
                      <dd>{hud.level}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>

          <div
            className={cn(
              "rounded-xl border p-4",
              isVoidRunner
                ? "border-[#7C5CFF]/20 bg-[#171B2A]"
                : "border-violet-500/15 bg-surface-elevated",
            )}
          >
            <h3
              className={cn(
                "mb-3 text-sm font-semibold uppercase tracking-wider",
                isVoidRunner ? "text-[#9AA4BC]" : "text-zinc-500",
              )}
            >
              Leaderboard Preview
            </h3>
            <LeaderboardTable entries={previewEntries} compact />
            <Link
              href={`/leaderboard?gameSlug=${game.slug}`}
              className="mt-3 block text-center text-xs text-[#65E8FF] hover:text-[#F5F7FF]"
            >
              View full leaderboard →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
