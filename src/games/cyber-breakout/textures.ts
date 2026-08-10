import Phaser from "phaser";

export function generateBreakoutTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });

  g.fillStyle(0x00ffff, 1);
  g.fillRoundedRect(0, 0, 96, 16, 4);
  g.generateTexture("paddle", 96, 16);
  g.clear();

  g.fillStyle(0xffffff, 1);
  g.fillCircle(6, 6, 6);
  g.generateTexture("ball", 12, 12);
  g.clear();

  g.fillStyle(0x44ccff, 1);
  g.fillRect(0, 0, 56, 20);
  g.lineStyle(2, 0x00ffff, 0.8);
  g.strokeRect(0, 0, 56, 20);
  g.generateTexture("brick", 56, 20);
  g.clear();

  g.fillStyle(0xffaa00, 1);
  g.fillCircle(6, 6, 6);
  g.generateTexture("powerup", 12, 12);
  g.clear();

  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(3, 3, 3);
  g.generateTexture("particle", 6, 6);
  g.destroy();
}
