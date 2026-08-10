import Phaser from "phaser";

export function generateNeonTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });

  g.fillStyle(0x00ffff, 1);
  g.fillCircle(8, 8, 8);
  g.generateTexture("player", 16, 16);
  g.clear();

  g.fillStyle(0xff2266, 1);
  g.fillCircle(6, 6, 6);
  g.generateTexture("enemy", 12, 12);
  g.clear();

  g.fillStyle(0xffff00, 1);
  g.fillRect(0, 0, 8, 4);
  g.generateTexture("bullet", 8, 4);
  g.clear();

  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(4, 4, 4);
  g.generateTexture("particle", 8, 8);
  g.clear();

  for (const [key, color] of Object.entries({
    health: 0x22ff88,
    rapid: 0xffaa00,
    damage: 0xff3366,
    speed: 0x44ccff,
  })) {
    g.fillStyle(color, 1);
    g.fillRect(0, 0, 12, 12);
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeRect(0, 0, 12, 12);
    g.generateTexture(`powerup-${key}`, 12, 12);
    g.clear();
  }

  g.destroy();
}
