export class ScoreManager {
  private score = 0;
  private multiplier = 1;

  reset(): void {
    this.score = 0;
    this.multiplier = 1;
  }

  getScore(): number {
    return this.score;
  }

  getMultiplier(): number {
    return this.multiplier;
  }

  setMultiplier(value: number): void {
    this.multiplier = Math.max(1, value);
  }

  add(points: number): number {
    const gained = Math.floor(points * this.multiplier);
    this.score += gained;
    return gained;
  }

  addRaw(points: number): void {
    this.score += points;
  }
}
