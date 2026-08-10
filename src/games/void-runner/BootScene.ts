import Phaser from "phaser";
import { SCENE } from "./constants";
import { ensureVoidTextures } from "./textures";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.BOOT });
  }

  preload(): void {
    const onLoad = this.registry.get("onLoadProgress") as ((n: number) => void) | undefined;
    this.load.on("progress", (v: number) => onLoad?.(Math.floor(v * 100)));
    // Tiny asset so the loader completes reliably
    this.load.image(
      "vr-dummy",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    );
  }

  create(): void {
    ensureVoidTextures(this);
    const onLoad = this.registry.get("onLoadProgress") as ((n: number) => void) | undefined;
    onLoad?.(100);
    this.scene.start(SCENE.PLAY);
  }
}
