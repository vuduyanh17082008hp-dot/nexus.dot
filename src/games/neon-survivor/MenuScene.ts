import Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import { SCENE } from "./constants";

/**
 * READY screen. Starts NeonGame; GameScene launches UI.
 * Do NOT call scene.launch() after scene.start() from this scene.
 */
export class MenuScene extends Phaser.Scene {
  private started = false;

  constructor() {
    super({ key: SCENE.MENU });
  }

  create(): void {
    const { width, height } = this.scale;
    const bus = this.registry.get("bus") as EventBus | undefined;
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

    // Anywhere on the canvas starts the game
    this.input.once("pointerdown", begin);
    startBtn.once("pointerdown", begin);

    const space = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    space?.once("down", begin);

    if (process.env.NODE_ENV === "development") {
      console.info("[NeonSurvivor] READY");
    }

    // Always clear React loading overlay — even if bus was missing earlier
    try {
      bus?.emit("game:ready", undefined);
    } catch (err) {
      console.error("[NeonSurvivor] game:ready emit failed", err);
    }
  }

  private beginGame(bus: EventBus | undefined): void {
    if (this.started) return;
    this.started = true;

    try {
      bus?.emit("audio:unlock", undefined);
    } catch {
      /* ignore */
    }

    if (process.env.NODE_ENV === "development") {
      console.info("[NeonSurvivor] START → PLAYING");
    }

    this.scene.start(SCENE.GAME);
  }
}
