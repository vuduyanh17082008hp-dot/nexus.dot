import Phaser from "phaser";

export function spawnParticles(scene: Phaser.Scene, x: number, y: number, color: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const p = scene.add.image(x, y, "particle").setTint(color);
    scene.tweens.add({
      targets: p,
      x: x + Phaser.Math.Between(-25, 25),
      y: y + Phaser.Math.Between(-25, 25),
      alpha: 0,
      duration: 350,
      onComplete: () => p.destroy(),
    });
  }
}

export function screenShake(scene: Phaser.Scene): void {
  scene.cameras.main.shake(100, 0.006);
}
