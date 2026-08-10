import { NEXUS_CONFIG } from "./GameConfig";

export class FixedStepLoop {
  private accumulator = 0;
  private readonly step: number;
  private readonly maxFrame: number;

  constructor(hz = NEXUS_CONFIG.simHz) {
    this.step = 1 / hz;
    this.maxFrame = NEXUS_CONFIG.maxFrameDt;
  }

  /** Consume real frame delta; invoke update(fixedDt) N times. Returns alpha for interpolation. */
  tick(frameDt: number, update: (fixedDt: number) => void): number {
    const dt = Math.min(Math.max(frameDt, 0), this.maxFrame);
    this.accumulator += dt;
    let guard = 0;
    while (this.accumulator >= this.step && guard < 8) {
      update(this.step);
      this.accumulator -= this.step;
      guard += 1;
    }
    return this.accumulator / this.step;
  }

  reset(): void {
    this.accumulator = 0;
  }
}
