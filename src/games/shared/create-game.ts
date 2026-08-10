import type Phaser from "phaser";
import type { EventBus } from "./event-bus";
import type { GraphicsSettings } from "@/types/game";
import { getGraphicsPreset } from "./graphics";

export interface GameBootContext {
  bus: EventBus;
  gameSlug: string;
  width: number;
  height: number;
  graphics: GraphicsSettings;
  onLoadProgress?: (pct: number) => void;
}

export interface CreateGameOptions {
  parent: HTMLElement;
  width: number;
  height: number;
  scenes: Phaser.Types.Scenes.SceneType[];
  physics?: Phaser.Types.Core.PhysicsConfig;
  backgroundColor?: string;
}

export async function createPhaserGame(
  Phaser: typeof import("phaser"),
  options: CreateGameOptions,
): Promise<Phaser.Game> {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.parent,
    width: options.width,
    height: options.height,
    backgroundColor: options.backgroundColor ?? "#0a0014",
    scene: options.scenes,
    physics: options.physics ?? {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: { disableWebAudio: false },
    banner: false,
  });

  return game;
}

export function destroyPhaserGame(game: Phaser.Game | null, parent?: HTMLElement): void {
  if (!game) return;
  try {
    game.destroy(true);
  } catch {
    /* already destroyed */
  }
  if (parent) {
    while (parent.firstChild) parent.removeChild(parent.firstChild);
  }
}

export function defaultBootContext(
  bus: EventBus,
  gameSlug: string,
  preset: GraphicsSettings["preset"] = "medium",
): GameBootContext {
  return {
    bus,
    gameSlug,
    width: 960,
    height: 540,
    graphics: getGraphicsPreset(preset),
  };
}
