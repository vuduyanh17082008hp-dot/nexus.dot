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

    this.add.rectangle(width / 2, height / 2, width, height, 0x080018);
    this.add
      .text(width / 2, height * 0.3, "CYBER BREAKOUT", {
        fontFamily: "monospace",
        fontSize: "40px",
        color: "#00ffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.45, "Move paddle · Break all blocks · 5 stages", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#aa88ff",
      })
      .setOrigin(0.5);

    const start = this.add
      .text(width / 2, height * 0.62, "[ LAUNCH ]", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ff44aa",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    start.on("pointerdown", () => {
      bus.emit("audio:unlock", undefined);
      this.registry.set("levelIndex", 0);
      this.scene.start(SCENE.GAME);
    });

    bus.emit("game:ready", undefined);
  }
}
