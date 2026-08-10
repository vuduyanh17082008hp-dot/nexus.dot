"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type {
  GameEndResult,
  GameHudStats,
  GraphicsSettings,
  NexusGameBridge,
  PerformancePreset,
} from "@/types/game";
import { EventBus } from "./event-bus";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

export interface GameShellProps {
  gameSlug: string;
  className?: string;
  graphicsPreset?: PerformancePreset;
  onGameOver?: (result: GameEndResult) => void;
  onHudUpdate?: (stats: GameHudStats) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
  showMobileControls?: boolean;
}

type BootFn = (
  parent: HTMLElement,
  bus: EventBus,
  options: {
    onLoadProgress?: (pct: number) => void;
    graphicsPreset?: PerformancePreset;
  },
) => NexusGameBridge;

const BOOT_MAP: Record<string, () => Promise<BootFn>> = {
  "boot-sequence": () => import("@/games/nexus").then((m) => m.bootNexusRhythm),
  "neon-survivor": () => import("@/games/neon-survivor").then((m) => m.bootNeonSurvivor),
  "void-runner": () => import("@/games/void-runner").then((m) => m.bootVoidRunner),
  "cyber-breakout": () => import("@/games/cyber-breakout").then((m) => m.bootCyberBreakout),
};

export const GameShell = forwardRef<NexusGameBridge | null, GameShellProps>(function GameShell(
  {
    gameSlug,
    className,
    graphicsPreset = "medium",
    onGameOver,
    onHudUpdate,
    onReady,
    onError,
    showMobileControls,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<NexusGameBridge | null>(null);
  const busRef = useRef<EventBus | null>(null);
  const onErrorRef = useRef(onError);
  const onGameOverRef = useRef(onGameOver);
  const onHudUpdateRef = useRef(onHudUpdate);
  const onReadyRef = useRef(onReady);
  const [loading, setLoading] = useState(true);
  const [loadPct, setLoadPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorObj, setErrorObj] = useState<Error | null>(null);
  const initRef = useRef(false);
  const reportedRef = useRef(false);

  useImperativeHandle(ref, () => bridgeRef.current!, []);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onHudUpdateRef.current = onHudUpdate;
    onReadyRef.current = onReady;
  }, [onGameOver, onHudUpdate, onReady]);

  const reportError = useCallback((err: Error) => {
    setError(err.message);
    setErrorObj(err);
    setLoading(false);
    if (!reportedRef.current) {
      reportedRef.current = true;
      onErrorRef.current?.(err);
    }
  }, []);

  const handleVirtualMove = useCallback((x: number, y: number) => {
    const el = containerRef.current?.querySelector("[data-virtual-input]") as HTMLElement | null;
    el?.dispatchEvent(new CustomEvent("virtual-move", { detail: { x, y } }));
  }, []);

  const handleVirtualFire = useCallback((down: boolean) => {
    const el = containerRef.current?.querySelector("[data-virtual-input]") as HTMLElement | null;
    el?.dispatchEvent(new CustomEvent("virtual-fire", { detail: { down } }));
  }, []);

  const handleRetry = useCallback(() => {
    reportedRef.current = false;
    setError(null);
    setErrorObj(null);
    setLoading(true);
    setLoadPct(0);
    initRef.current = false;
    bridgeRef.current?.destroy();
    bridgeRef.current = null;
    busRef.current?.clear();
    busRef.current = null;
    window.location.reload();
  }, []);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent || initRef.current) return;
    initRef.current = true;

    const bus = new EventBus();
    busRef.current = bus;

    const bootLoader = BOOT_MAP[gameSlug];
    if (!bootLoader) {
      const err = new Error(`Unknown game: ${gameSlug}`);
      reportError(err);
      return;
    }

    let destroyed = false;

    const onRuntimeError = (event: ErrorEvent) => {
      if (destroyed) return;
      reportError(event.error instanceof Error ? event.error : new Error(event.message));
    };

    const onRuntimeRejection = (event: PromiseRejectionEvent) => {
      if (destroyed) return;
      const reason = event.reason;
      reportError(reason instanceof Error ? reason : new Error(String(reason ?? "Game runtime error")));
    };

    window.addEventListener("error", onRuntimeError);
    window.addEventListener("unhandledrejection", onRuntimeRejection);

    bootLoader()
      .then((bootFn) => {
        if (destroyed) return;
        const bridge = bootFn(parent, bus, {
          onLoadProgress: setLoadPct,
          graphicsPreset,
        });
        bridgeRef.current = bridge;

        bus.on("game:ready", () => {
          setLoading(false);
          onReadyRef.current?.();
        });
        bus.on("hud:update", (stats) => onHudUpdateRef.current?.(stats));
        bus.on("game:over", (result) => onGameOverRef.current?.(result));
        bus.on("nexus:error", (payload) => {
          reportError(new Error(payload.message));
        });
      })
      .catch((err: unknown) => {
        reportError(err instanceof Error ? err : new Error("Failed to load game"));
      });

    return () => {
      destroyed = true;
      initRef.current = false;
      window.removeEventListener("error", onRuntimeError);
      window.removeEventListener("unhandledrejection", onRuntimeRejection);
      bridgeRef.current?.destroy();
      bridgeRef.current = null;
      bus.clear();
      busRef.current = null;
    };
    // Callbacks are read via refs — do not remount Phaser when parent re-renders
  }, [gameSlug, graphicsPreset, reportError]);

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-[#080A12]", className)}>
      <div ref={containerRef} className="h-full w-full" data-virtual-input />
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080A12]/90 backdrop-blur-sm">
          <div className="mb-3 h-1 w-48 overflow-hidden rounded-full bg-[#171B2A]">
            <div
              className="h-full bg-[#65E8FF] transition-all duration-200"
              style={{ width: `${loadPct}%` }}
            />
          </div>
          <p className="text-sm text-[#9AA4BC]">Loading {loadPct}%</p>
        </div>
      )}
      {error && !onError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#080A12]/95 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-red-400" />
          <div>
            <p className="font-semibold text-[#F5F7FF]">Game failed to load</p>
            <p className="mt-1 text-sm text-red-300">{error}</p>
            {errorObj?.stack && (
              <p className="mt-2 max-h-24 overflow-auto text-xs text-[#9AA4BC]">{errorObj.stack.split("\n")[0]}</p>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}
      {showMobileControls && !loading && !error && (
        <div className="pointer-events-none absolute inset-0 md:hidden">
          {gameSlug === "neon-survivor" ? (
            <>
              <div
                className="pointer-events-auto absolute bottom-6 left-6 h-24 w-24 rounded-full border border-cyan-500/30 bg-cyan-500/10"
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleVirtualMove(
                    (t.clientX - rect.left - rect.width / 2) / (rect.width / 2),
                    (t.clientY - rect.top - rect.height / 2) / (rect.height / 2),
                  );
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const t = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleVirtualMove(
                    Math.max(-1, Math.min(1, (t.clientX - rect.left - rect.width / 2) / (rect.width / 2))),
                    Math.max(-1, Math.min(1, (t.clientY - rect.top - rect.height / 2) / (rect.height / 2))),
                  );
                }}
                onTouchEnd={() => handleVirtualMove(0, 0)}
              />
              <button
                type="button"
                className="pointer-events-auto absolute bottom-6 right-6 h-16 w-16 rounded-full border border-violet-400/40 bg-violet-500/20 text-xs text-violet-200"
                onTouchStart={() => handleVirtualFire(true)}
                onTouchEnd={() => handleVirtualFire(false)}
              >
                FIRE
              </button>
            </>
          ) : (
            <button
              type="button"
              className="pointer-events-auto absolute bottom-8 right-8 h-20 w-20 rounded-full border border-[#65E8FF]/40 bg-[#7C5CFF]/25 text-xs font-semibold text-[#F5F7FF]"
              onTouchStart={() => handleVirtualFire(true)}
              onTouchEnd={() => handleVirtualFire(false)}
            >
              JUMP
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export type { GraphicsSettings, NexusGameBridge };
