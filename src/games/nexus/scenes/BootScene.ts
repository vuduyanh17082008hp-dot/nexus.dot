import Phaser from "phaser";
import { ensureNexusTextures } from "./textures";
import { SCENE } from "../constants";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE.BOOT);
  }

  preload(): void {
    const bus = this.registry.get("bus") as { emit?: (e: string, v: unknown) => void } | undefined;
    this.load.on("progress", (v: number) => {
      const onLoad = this.registry.get("onLoadProgress") as ((n: number) => void) | undefined;
      onLoad?.(Math.floor(v * 100));
      bus?.emit?.("hud:update", { score: 0 });
    });
  }

  create(): void {
    ensureNexusTextures(this);
    const onLoad = this.registry.get("onLoadProgress") as ((n: number) => void) | undefined;
    onLoad?.(100);
    this.scene.start(SCENE.PLAY);
  }
}
