import Phaser from "phaser";

export function generateVoidTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });

  g.fillStyle(0x00ffff, 1);
  g.fillRoundedRect(0, 0, 32, 32, 6);
  g.generateTexture("runner", 32, 32);
  g.clear();

  g.fillStyle(0xff2266, 1);
  g.fillRect(0, 0, 24, 48);
  g.generateTexture("obstacle", 24, 48);
  g.clear();

  g.fillStyle(0xffdd00, 1);
  g.fillCircle(8, 8, 8);
  g.generateTexture("coin", 16, 16);
  g.clear();

  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(3, 3, 3);
  g.generateTexture("spark", 6, 6);
  g.clear();

  g.fillStyle(0x220044, 1);
  g.fillRect(0, 0, 64, 16);
  g.generateTexture("ground", 64, 16);
  g.destroy();
}
