import { NEXUS_CONFIG } from "../core/GameConfig";

export class PlayerBody {
  x = 0;
  y = 0;
  prevX = 0;
  prevY = 0;
  vx = 0;
  vy = 0;
  width = NEXUS_CONFIG.core.width;
  height = NEXUS_CONFIG.core.height;
  alive = true;
  finished = false;
  rotation = 0;
  onGround = false;

  get left() {
    return this.x - this.width / 2;
  }
  get right() {
    return this.x + this.width / 2;
  }
  get top() {
    return this.y - this.height / 2;
  }
  get bottom() {
    return this.y + this.height / 2;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
  }

  snapshotPrev(): void {
    this.prevX = this.x;
    this.prevY = this.y;
  }
}
