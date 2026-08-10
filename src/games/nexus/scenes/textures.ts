import type Phaser from "phaser";

export function ensureNexusTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  if (!scene.textures.exists("nx-core")) {
    g.clear();
    g.fillStyle(0x22d3ee, 1);
    g.fillRoundedRect(0, 0, 28, 28, 6);
    g.lineStyle(2, 0xa78bfa, 1);
    g.strokeRoundedRect(0, 0, 28, 28, 6);
    g.fillStyle(0x7c3aed, 0.9);
    g.fillCircle(14, 14, 6);
    g.generateTexture("nx-core", 28, 28);
  }

  if (!scene.textures.exists("nx-platform")) {
    g.clear();
    g.fillStyle(0x1e1b4b, 1);
    g.fillRect(0, 0, 64, 32);
    g.fillStyle(0x7c3aed, 0.7);
    g.fillRect(0, 0, 64, 4);
    g.generateTexture("nx-platform", 64, 32);
  }

  if (!scene.textures.exists("nx-spike")) {
    g.clear();
    g.fillStyle(0xf97316, 1);
    g.fillTriangle(18, 0, 0, 28, 36, 28);
    g.lineStyle(1, 0xffedd5, 0.8);
    g.strokeTriangle(18, 0, 0, 28, 36, 28);
    g.generateTexture("nx-spike", 36, 28);
  }

  if (!scene.textures.exists("nx-pad")) {
    g.clear();
    g.fillStyle(0x22d3ee, 1);
    g.fillRoundedRect(0, 0, 48, 16, 4);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(8, 4, 32, 4);
    g.generateTexture("nx-pad", 48, 16);
  }

  if (!scene.textures.exists("nx-portal")) {
    g.clear();
    g.fillStyle(0xa78bfa, 0.35);
    g.fillRoundedRect(0, 0, 40, 80, 12);
    g.lineStyle(3, 0x22d3ee, 1);
    g.strokeRoundedRect(2, 2, 36, 76, 12);
    g.generateTexture("nx-portal", 40, 80);
  }

  if (!scene.textures.exists("nx-finish")) {
    g.clear();
    g.fillStyle(0x22d3ee, 0.25);
    g.fillRect(0, 0, 48, 120);
    g.lineStyle(3, 0x22d3ee, 1);
    g.strokeRect(2, 2, 44, 116);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(20, 10, 8, 100);
    g.generateTexture("nx-finish", 48, 120);
  }

  if (!scene.textures.exists("nx-core-gem")) {
    g.clear();
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(12, 12, 10);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(9, 9, 3);
    g.generateTexture("nx-core-gem", 24, 24);
  }

  g.destroy();
}
