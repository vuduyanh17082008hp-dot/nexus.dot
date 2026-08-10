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
import { GAME_SLUG, SCENE } from "./constants";

export function bootVoidRunner(
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
    game = await createPhaserGame(Phaser, {
      parent,
      width: 960,
      height: 540,
      scenes: [BootScene, MenuScene, GameScene],
      backgroundColor: "#050010",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      preBoot: (g) => {
        g.registry.set("bus", bus);
        g.registry.set("ctx", { onLoadProgress: options.onLoadProgress, graphics });
        g.registry.set("audio", audio);
        g.registry.set("saveMgr", saveMgr);
        g.registry.set("achievements", achievements);
        g.registry.set("graphics", graphics);
        g.registry.set("restart", () => bridge.onRestart());
      },
    });

    parent.addEventListener("pointerdown", () => void audio.unlock(), { once: true });
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
      game?.scene.stop(SCENE.GAME);
      game?.scene.start(SCENE.MENU);
    },
    onMute: (m) => audio.setMuted(m),
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
