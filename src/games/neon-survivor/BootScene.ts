import Phaser from "phaser";
import { SCENE } from "./constants";
import { generateNeonTextures } from "./textures";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.BOOT });
  }

  preload(): void {
    const ctx = this.registry.get("ctx") as { onLoadProgress?: (n: number) => void } | undefined;
    ctx?.onLoadProgress?.(30);
    this.load.on("progress", (v: number) => ctx?.onLoadProgress?.(30 + Math.floor(v * 60)));
  }

  create(): void {
    const ctx = this.registry.get("ctx") as { onLoadProgress?: (n: number) => void } | undefined;
    generateNeonTextures(this);
    ctx?.onLoadProgress?.(100);

    if (process.env.NODE_ENV === "development") {
      console.info("[NeonSurvivor] Boot complete → Menu");
    }

    this.scene.start(SCENE.MENU);
  }
}
