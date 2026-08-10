import type { NexusGameBridge, PerformancePreset } from "@/types/game";
import type Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import { GameAudio } from "@/games/shared/audio";
import { SaveManager } from "@/games/shared/save-manager";
import { AchievementManager } from "@/games/shared/achievement-manager";
import { createPhaserGame, destroyPhaserGame } from "@/games/shared/create-game";
import { getGraphicsPreset } from "@/games/shared/graphics";
import { BootScene } from "./BootScene";
import { MenuScene } from "./MenuScene";
import { GameScene } from "./GameScene";
import { UIScene } from "./UIScene";
import { GAME_SLUG, SCENE } from "./constants";

export function bootNeonSurvivor(
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

  // Declared early so preBoot can wire restart → bridge
  const bridge: NexusGameBridge = {
    onPause: () => {
      if (!game || cancelled) return;
      if (game.scene.isActive(SCENE.GAME)) game.scene.pause(SCENE.GAME);
      bus.emit("game:pause", true);
      bus.emit("nexus:pause", undefined);
    },
    onResume: () => {
      if (!game || cancelled) return;
      if (game.scene.isPaused(SCENE.GAME)) game.scene.resume(SCENE.GAME);
      bus.emit("game:pause", false);
      bus.emit("nexus:resume", undefined);
    },
    onRestart: () => {
      if (!game || cancelled) return;
      if (game.scene.isActive(SCENE.UI) || game.scene.isPaused(SCENE.UI)) {
        game.scene.stop(SCENE.UI);
      }
      if (game.scene.isActive(SCENE.GAME) || game.scene.isPaused(SCENE.GAME)) {
        game.scene.stop(SCENE.GAME);
      }
      game.scene.start(SCENE.MENU);
    },
    onMute: (m: boolean) => audio.setMuted(m),
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

      const ctx = {
        bus,
        gameSlug: GAME_SLUG,
        width: 960,
        height: 540,
        graphics,
        onLoadProgress: options.onLoadProgress,
      };

      const instance = await createPhaserGame(PhaserMod, {
        parent,
        width: 960,
        height: 540,
        scenes: [BootScene, MenuScene, GameScene, UIScene],
        backgroundColor: "#0a0014",
        // CRITICAL: registry must exist before Boot/Menu create runs
        preBoot: (g) => {
          g.registry.set("bus", bus);
          g.registry.set("ctx", ctx);
          g.registry.set("audio", audio);
          g.registry.set("saveMgr", saveMgr);
          g.registry.set("achievements", achievements);
          g.registry.set("graphics", graphics);
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
        console.info("[NeonSurvivor] Phaser game mounted");
      }
    } catch (err) {
      console.error("[NeonSurvivor] Failed to boot", err);
      bus.emit("nexus:error", {
        message: err instanceof Error ? err.message : "Failed to start Neon Survivor",
      });
      throw err;
    } finally {
      booting = false;
    }
  };

  void boot();

  return bridge;
}
