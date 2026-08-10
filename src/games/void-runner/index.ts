import type { NexusGameBridge, PerformancePreset } from "@/types/game";
import type Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import { GameAudio } from "@/games/shared/audio";
import { SaveManager } from "@/games/shared/save-manager";
import { AchievementManager } from "@/games/shared/achievement-manager";
import { createPhaserGame, destroyPhaserGame } from "@/games/shared/create-game";
import { getGraphicsPreset } from "@/games/shared/graphics";
import { BootScene } from "./BootScene";
import { PlayScene } from "./PlayScene";
import { GAME_SLUG, SCENE, VOID_PALETTE } from "./constants";

export function bootVoidRunner(
  parent: HTMLElement,
  bus: EventBus,
  options: { onLoadProgress?: (pct: number) => void; graphicsPreset?: PerformancePreset } = {},
): NexusGameBridge {
  let game: Phaser.Game | null = null;
  let cancelled = false;
  let booting = false;
  const audio = new GameAudio();
  const saveMgr = new SaveManager(GAME_SLUG);
  const achievements = new AchievementManager(GAME_SLUG, bus);
  let graphics = getGraphicsPreset(options.graphicsPreset ?? "medium");

  const getPlay = () => game?.scene.getScene(SCENE.PLAY) as PlayScene | undefined;

  const bridge: NexusGameBridge = {
    onPause: () => getPlay()?.requestPause(),
    onResume: () => getPlay()?.requestResume(),
    onRestart: () => getPlay()?.requestRestart(),
    onMute: (m) => audio.setMuted(m),
    onVolume: (master, music, sfx) => audio.setVolumes(master, music, sfx),
    onGraphics: (settings) => {
      graphics = settings;
      game?.registry.set("graphics", settings);
    },
    destroy: () => {
      cancelled = true;
      destroyPhaserGame(game, parent);
      game = null;
      booting = false;
    },
  };

  const boot = async () => {
    if (booting || game || cancelled) return;
    booting = true;

    try {
      const PhaserMod = await import("phaser");
      if (cancelled) return;

      const instance = await createPhaserGame(PhaserMod, {
        parent,
        width: 960,
        height: 540,
        scenes: [BootScene, PlayScene],
        backgroundColor: "#080A12",
        physics: {
          default: "arcade",
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        preBoot: (g) => {
          g.registry.set("bus", bus);
          g.registry.set("audio", audio);
          g.registry.set("saveMgr", saveMgr);
          g.registry.set("achievements", achievements);
          g.registry.set("graphics", graphics);
          g.registry.set("onLoadProgress", options.onLoadProgress);
          g.registry.set("gameSlug", GAME_SLUG);
          g.registry.set("restart", () => bridge.onRestart());
        },
      });

      if (cancelled) {
        destroyPhaserGame(instance, parent);
        return;
      }

      game = instance;
      parent.addEventListener(
        "pointerdown",
        () => {
          void audio.unlock();
          bus.emit("audio:unlock", undefined);
        },
        { once: true },
      );

      if (process.env.NODE_ENV === "development") {
        console.info("[VoidRunner] Phaser game mounted", {
          bg: VOID_PALETTE.bg.toString(16),
        });
      }
    } catch (err) {
      console.error("[VoidRunner] Failed to boot", err);
      bus.emit("nexus:error", {
        message: err instanceof Error ? err.message : "Failed to start Void Runner",
      });
      throw err;
    } finally {
      booting = false;
    }
  };

  void boot();
  return bridge;
}
