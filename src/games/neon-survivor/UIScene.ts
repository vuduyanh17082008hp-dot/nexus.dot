import Phaser from "phaser";
import type { GameHudStats } from "@/types/game";
import { SCENE } from "./constants";

export class UIScene extends Phaser.Scene {
  private waveText!: Phaser.GameObjects.Text;
  private unsub: (() => void) | null = null;

  constructor() {
    super({ key: SCENE.UI });
  }

  create(): void {
    const bus = this.registry.get("bus") as {
      on: (e: "hud:update", cb: (s: GameHudStats) => void) => () => void;
    };

    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");

    this.waveText = this.add
      .text(16, 16, "WAVE 1  KILLS 0  HP 100", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#00ffff",
      })
      .setScrollFactor(0)
      .setDepth(50);

    this.unsub = bus.on("hud:update", (stats) => {
      this.waveText.setText(
        `WAVE ${stats.wave ?? 1}  KILLS ${stats.kills ?? 0}  HP ${stats.health ?? 100}`,
      );
    });

    this.events.once("shutdown", () => {
      this.unsub?.();
      this.unsub = null;
    });
  }
}
