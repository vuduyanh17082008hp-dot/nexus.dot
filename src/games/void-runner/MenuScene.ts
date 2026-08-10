import Phaser from "phaser";
import type { EventBus } from "@/games/shared/event-bus";
import { SCENE } from "./constants";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.MENU });
  }

  create(): void {
    const { width, height } = this.scale;
    const bus = this.registry.get("bus") as EventBus;

    this.add.rectangle(width / 2, height / 2, width, height, 0x050010);
    this.add
      .text(width / 2, height * 0.32, "VOID RUNNER", {
        fontFamily: "monospace",
        fontSize: "44px",
        color: "#aa44ff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.48, "Space / W / Tap to jump", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#66ccff",
      })
      .setOrigin(0.5);

    const start = this.add
      .text(width / 2, height * 0.65, "[ START RUN ]", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#00ffff",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    start.on("pointerdown", () => {
      bus.emit("audio:unlock", undefined);
      this.scene.start(SCENE.GAME);
    });

    bus.emit("game:ready", undefined);
  }
}
