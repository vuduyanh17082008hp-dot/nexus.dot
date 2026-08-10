import type { NexusGameBridge, PerformancePreset } from "@/types/game";
import type Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import { GameAudio } from "@/games/shared/audio";
import { createPhaserGame, destroyPhaserGame } from "@/games/shared/create-game";
import { getGraphicsPreset } from "@/games/shared/graphics";
import { BootScene } from "./scenes/BootScene";
import { PlayScene } from "./scenes/PlayScene";
import { GAME_SLUG, SCENE } from "./constants";

export function bootNexusRhythm(
  parent: HTMLElement,
  bus: EventBus,
  options: { onLoadProgress?: (pct: number) => void; graphicsPreset?: PerformancePreset } = {},
): NexusGameBridge {
  let game: Phaser.Game | null = null;
  const audio = new GameAudio();
  let graphics = getGraphicsPreset(options.graphicsPreset ?? "medium");
  let booted = false;

  const boot = async () => {
    if (booted) return;
    booted = true;
    const PhaserMod = await import("phaser");

    game = await createPhaserGame(PhaserMod, {
      parent,
      width: 960,
      height: 540,
      scenes: [BootScene, PlayScene],
      backgroundColor: "#050510",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
    });

    game.registry.set("bus", bus);
    game.registry.set("audio", audio);
    game.registry.set("graphics", graphics);
    game.registry.set("onLoadProgress", options.onLoadProgress);
    game.registry.set("gameSlug", GAME_SLUG);

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

  const getPlay = () => game?.scene.getScene(SCENE.PLAY) as PlayScene | null;

  const bridge: NexusGameBridge = {
    onPause: () => getPlay()?.requestPause(),
    onResume: () => getPlay()?.requestResume(),
    onRestart: () => getPlay()?.requestRestart(),
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
