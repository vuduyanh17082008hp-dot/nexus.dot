import type Phaser from "phaser";
import type { EventBus } from "./event-bus";

export class PauseManager {
  private paused = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly bus: EventBus,
  ) {}

  isPaused(): boolean {
    return this.paused;
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.scene.scene.pause(this.scene.scene.key);
    this.bus.emit("game:pause", true);
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.scene.scene.resume(this.scene.scene.key);
    this.bus.emit("game:pause", false);
  }

  toggle(): void {
    if (this.paused) this.resume();
    else this.pause();
  }

  forceUnpause(): void {
    this.paused = false;
    this.scene.scene.resume(this.scene.scene.key);
  }
}
