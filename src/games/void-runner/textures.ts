import type Phaser from "phaser";
import { VOID_PALETTE } from "./constants";

export function ensureVoidTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  if (!scene.textures.exists("vr-cube")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.cyan, 1);
    g.fillRoundedRect(0, 0, 28, 28, 5);
    g.lineStyle(2, VOID_PALETTE.violet, 1);
    g.strokeRoundedRect(0, 0, 28, 28, 5);
    g.fillStyle(VOID_PALETTE.violet, 0.85);
    g.fillCircle(14, 14, 5);
    g.generateTexture("vr-cube", 28, 28);
  }

  if (!scene.textures.exists("vr-ship")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.cyan, 1);
    g.fillTriangle(32, 11, 0, 0, 0, 22);
    g.fillStyle(VOID_PALETTE.violet, 0.9);
    g.fillCircle(10, 11, 4);
    g.generateTexture("vr-ship", 32, 22);
  }

  if (!scene.textures.exists("vr-ball")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.cyan, 1);
    g.fillCircle(13, 13, 13);
    g.fillStyle(VOID_PALETTE.violet, 0.7);
    g.fillCircle(10, 10, 4);
    g.generateTexture("vr-ball", 26, 26);
  }

  if (!scene.textures.exists("vr-ufo")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.blue, 1);
    g.fillEllipse(15, 14, 30, 14);
    g.fillStyle(VOID_PALETTE.cyan, 1);
    g.fillCircle(15, 10, 7);
    g.generateTexture("vr-ufo", 30, 24);
  }

  if (!scene.textures.exists("vr-wave")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.cyan, 1);
    g.fillTriangle(26, 8, 0, 0, 0, 16);
    g.generateTexture("vr-wave", 26, 16);
  }

  if (!scene.textures.exists("vr-robot")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.blue, 1);
    g.fillRoundedRect(2, 0, 26, 34, 4);
    g.fillStyle(VOID_PALETTE.cyan, 1);
    g.fillRect(8, 8, 14, 8);
    g.generateTexture("vr-robot", 30, 34);
  }

  if (!scene.textures.exists("vr-spider")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.violet, 1);
    g.fillRoundedRect(4, 6, 20, 16, 4);
    g.fillStyle(VOID_PALETTE.cyan, 1);
    g.fillCircle(10, 10, 3);
    g.fillCircle(18, 10, 3);
    g.generateTexture("vr-spider", 28, 28);
  }

  if (!scene.textures.exists("vr-platform")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.ground, 1);
    g.fillRect(0, 0, 64, 32);
    g.fillStyle(VOID_PALETTE.groundEdge, 0.95);
    g.fillRect(0, 0, 64, 5);
    g.fillStyle(VOID_PALETTE.cyan, 0.25);
    g.fillRect(0, 5, 64, 2);
    g.generateTexture("vr-platform", 64, 32);
  }

  if (!scene.textures.exists("vr-spike")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.hazard, 1);
    g.fillTriangle(18, 0, 0, 28, 36, 28);
    g.lineStyle(1, 0xffc0cb, 0.9);
    g.strokeTriangle(18, 0, 0, 28, 36, 28);
    g.generateTexture("vr-spike", 36, 28);
  }

  if (!scene.textures.exists("vr-pad")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.pad, 1);
    g.fillRoundedRect(0, 0, 48, 16, 4);
    g.fillStyle(0xffffff, 0.45);
    g.fillRect(8, 4, 32, 4);
    g.generateTexture("vr-pad", 48, 16);
  }

  if (!scene.textures.exists("vr-form-portal")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.violet, 0.4);
    g.fillRoundedRect(0, 0, 40, 80, 14);
    g.lineStyle(3, VOID_PALETTE.cyan, 1);
    g.strokeRoundedRect(2, 2, 36, 76, 12);
    g.fillStyle(VOID_PALETTE.cyan, 0.7);
    g.fillCircle(20, 40, 8);
    g.generateTexture("vr-form-portal", 40, 80);
  }

  if (!scene.textures.exists("vr-gravity-portal")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.blue, 0.35);
    g.fillRoundedRect(0, 0, 40, 80, 12);
    g.lineStyle(3, VOID_PALETTE.violet, 1);
    g.strokeRoundedRect(2, 2, 36, 76, 12);
    g.generateTexture("vr-gravity-portal", 40, 80);
  }

  if (!scene.textures.exists("vr-finish")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.cyan, 0.28);
    g.fillRect(0, 0, 48, 120);
    g.lineStyle(3, VOID_PALETTE.cyan, 1);
    g.strokeRect(2, 2, 44, 116);
    g.fillStyle(VOID_PALETTE.text, 0.9);
    g.fillRect(20, 10, 8, 100);
    g.generateTexture("vr-finish", 48, 120);
  }

  if (!scene.textures.exists("vr-gem")) {
    g.clear();
    g.fillStyle(0xffd166, 1);
    g.fillCircle(12, 12, 10);
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(9, 9, 3);
    g.generateTexture("vr-gem", 24, 24);
  }

  if (!scene.textures.exists("vr-checkpoint")) {
    g.clear();
    g.fillStyle(VOID_PALETTE.blue, 0.35);
    g.fillRoundedRect(0, 0, 28, 48, 6);
    g.lineStyle(2, VOID_PALETTE.cyan, 1);
    g.strokeRoundedRect(1, 1, 26, 46, 5);
    g.generateTexture("vr-checkpoint", 28, 48);
  }

  if (!scene.textures.exists("vr-spark")) {
    g.clear();
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(3, 3, 3);
    g.generateTexture("vr-spark", 6, 6);
  }

  g.destroy();
}

export function textureForForm(form: string): string {
  switch (form) {
    case "SHIP":
      return "vr-ship";
    case "BALL":
      return "vr-ball";
    case "UFO":
      return "vr-ufo";
    case "WAVE":
      return "vr-wave";
    case "ROBOT":
      return "vr-robot";
    case "SPIDER":
      return "vr-spider";
    default:
      return "vr-cube";
  }
}
