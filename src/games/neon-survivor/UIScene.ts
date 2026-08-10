import Phaser from "phaser";
import type { GameHudStats } from "@/types/game";
import { SCENE } from "./constants";

export class UIScene extends Phaser.Scene {
  private waveText!: Phaser.GameObjects.Text;
  private unsub: (() => void) | null = null;

  constructor() {
    super({ key: SCENE.UI, active: false, visible: false });
  }

  create(): void {
    const bus = this.registry.get("bus") as {
      on: (e: "hud:update", cb: (s: GameHudStats) => void) => () => void;
    };

    this.waveText = this.add
      .text(16, 16, "", { fontFamily: "monospace", fontSize: "14px", color: "#00ffff" })
      .setScrollFactor(0)
      .setDepth(50);

    this.unsub = bus.on("hud:update", (stats) => {
      this.waveText.setText(`WAVE ${stats.wave ?? 1}  KILLS ${stats.kills ?? 0}  HP ${stats.health ?? 100}`);
    });
  }

  shutdown(): void {
    this.unsub?.();
    this.unsub = null;
  }
}
