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
  const audio = new GameAudio();
  const saveMgr = new SaveManager(GAME_SLUG);
  const achievements = new AchievementManager(GAME_SLUG, bus);
  let graphics = getGraphicsPreset(options.graphicsPreset ?? "medium");
  let booted = false;

  const boot = async () => {
    if (booted) return;
    booted = true;
    const Phaser = await import("phaser");
    const ctx = {
      bus,
      gameSlug: GAME_SLUG,
      width: 960,
      height: 540,
      graphics,
      onLoadProgress: options.onLoadProgress,
    };

    game = await createPhaserGame(Phaser, {
      parent,
      width: 960,
      height: 540,
      scenes: [BootScene, MenuScene, GameScene, UIScene],
      backgroundColor: "#0a0014",
    });

    game.registry.set("bus", bus);
    game.registry.set("ctx", ctx);
    game.registry.set("audio", audio);
    game.registry.set("saveMgr", saveMgr);
    game.registry.set("achievements", achievements);
    game.registry.set("graphics", graphics);
    game.registry.set("restart", () => bridge.onRestart());

    parent.addEventListener(
      "pointerdown",
      () => {
        void audio.unlock();
        bus.emit("audio:unlock", undefined);
      },
      { once: true },
    );
  };

  void boot();

  const bridge: NexusGameBridge = {
    onPause: () => {
      game?.scene.pause(SCENE.GAME);
      bus.emit("game:pause", true);
    },
    onResume: () => {
      game?.scene.resume(SCENE.GAME);
      bus.emit("game:pause", false);
    },
    onRestart: () => {
      game?.scene.stop(SCENE.UI);
      game?.scene.stop(SCENE.GAME);
      game?.scene.start(SCENE.MENU);
    },
    onMute: (m: boolean) => audio.setMuted(m),
    onVolume: (master, music, sfx) => audio.setVolumes(master, music, sfx),
    onGraphics: (settings) => {
      graphics = settings;
      game?.registry.set("graphics", settings);
    },
    destroy: () => {
      destroyPhaserGame(game, parent);
      game = null;
      booted = false;
    },
  };

  return bridge;
}
