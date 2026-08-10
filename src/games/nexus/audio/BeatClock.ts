/** Phase 2 foundation — beat timing from BPM + offset (works without audio asset). */
export class BeatClock {
  private elapsed = 0;

  constructor(
    readonly bpm: number,
    readonly offsetMs: number = 0,
  ) {}

  reset(): void {
    this.elapsed = 0;
  }

  update(dt: number): void {
    this.elapsed += dt;
  }

  get songTime(): number {
    return Math.max(0, this.elapsed - this.offsetMs / 1000);
  }

  get beat(): number {
    const spb = 60 / this.bpm;
    return this.songTime / spb;
  }

  get beatPhase(): number {
    return this.beat % 1;
  }

  get isBeatPulse(): boolean {
    return this.beatPhase < 0.08;
  }
}
