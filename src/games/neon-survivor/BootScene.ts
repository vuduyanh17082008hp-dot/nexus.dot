import Phaser from "phaser";
import { SCENE } from "./constants";
import { generateNeonTextures } from "./textures";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.BOOT });
  }

  preload(): void {
    const ctx = this.registry.get("ctx") as { onLoadProgress?: (n: number) => void };
    this.load.on("progress", (v: number) => ctx?.onLoadProgress?.(Math.floor(v * 100)));
    this.load.image("dummy", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");
  }

  create(): void {
    generateNeonTextures(this);
    this.scene.start(SCENE.MENU);
  }
}
