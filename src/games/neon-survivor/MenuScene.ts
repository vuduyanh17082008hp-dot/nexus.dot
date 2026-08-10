import Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import { SCENE } from "./constants";

/**
 * READY screen. Starts NeonGame and lets GameScene own UI launch.
 * Important: do NOT call scene.launch() after scene.start() — start() shuts
 * this scene down and queued launches from here are unreliable.
 */
export class MenuScene extends Phaser.Scene {
  private started = false;

  constructor() {
    super({ key: SCENE.MENU });
  }

  create(): void {
    const { width, height } = this.scale;
    const bus = this.registry.get("bus") as EventBus;
    this.started = false;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0014);
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x330066, 0.4);
    for (let x = 0; x < width; x += 40) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 40) grid.lineBetween(0, y, width, y);

    this.add
      .text(width / 2, height * 0.3, "NEON SURVIVOR", {
        fontFamily: "monospace",
        fontSize: "42px",
        color: "#00ffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.45, "WASD move · Mouse aim · Click/Space shoot", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#aa88ff",
      })
      .setOrigin(0.5);

    const startBtn = this.add
      .text(width / 2, height * 0.62, "[ CLICK TO START ]", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ff44aa",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on("pointerover", () => startBtn.setColor("#00ffff"));
    startBtn.on("pointerout", () => startBtn.setColor("#ff44aa"));

    const begin = () => this.beginGame(bus);

    // Anywhere on the canvas starts the game (not only the label)
    this.input.once("pointerdown", begin);
    startBtn.once("pointerdown", begin);

    const space = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    space?.once("down", begin);

    if (process.env.NODE_ENV === "development") {
      console.info("[NeonSurvivor] READY");
    }

    bus.emit("game:ready", undefined);
  }

  private beginGame(bus: EventBus): void {
    if (this.started) return;
    this.started = true;

    bus.emit("audio:unlock", undefined);

    if (process.env.NODE_ENV === "development") {
      console.info("[NeonSurvivor] START → PLAYING");
    }

    // Only start GAME here. GameScene.create() launches UI.
    this.scene.start(SCENE.GAME);
  }
}
