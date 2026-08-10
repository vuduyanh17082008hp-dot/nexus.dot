import Phaser from "phaser";
import type { PowerUpKind } from "./constants";
import { POWERUP_COLORS } from "./constants";

export interface ActivePowerUp {
  kind: PowerUpKind;
  expiresAt: number;
}

export class PowerUpManager {
  private sprites: Phaser.Physics.Arcade.Group;
  private active: ActivePowerUp[] = [];

  constructor(private scene: Phaser.Scene) {
    this.sprites = scene.physics.add.group();
  }

  spawn(x: number, y: number): void {
    const kinds: PowerUpKind[] = ["health", "rapid", "damage", "speed"];
    const kind = Phaser.Utils.Array.GetRandom(kinds);
    const sprite = this.scene.physics.add.sprite(x, y, `powerup-${kind}`);
    sprite.setData("kind", kind);
    sprite.setTint(POWERUP_COLORS[kind]);
    this.sprites.add(sprite);
  }

  getGroup(): Phaser.Physics.Arcade.Group {
    return this.sprites;
  }

  collect(kind: PowerUpKind, now: number): void {
    const durations: Record<PowerUpKind, number> = {
      health: 0,
      rapid: 8000,
      damage: 8000,
      speed: 6000,
    };
    if (kind !== "health") {
      this.active.push({ kind, expiresAt: now + durations[kind] });
    }
  }

  tick(now: number): { rapid: boolean; damage: number; speedMult: number } {
    this.active = this.active.filter((p) => p.expiresAt > now);
    const rapid = this.active.some((p) => p.kind === "rapid");
    const damageBoost = this.active.some((p) => p.kind === "damage");
    const speedBoost = this.active.some((p) => p.kind === "speed");
    return {
      rapid,
      damage: damageBoost ? 2 : 1,
      speedMult: speedBoost ? 1.5 : 1,
    };
  }
}

export function burstParticles(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  count: number,
): void {
  if (count <= 0) return;
  for (let i = 0; i < count; i++) {
    const p = scene.add.image(x, y, "particle").setTint(color);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(20, 60);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      scale: 0,
      duration: Phaser.Math.Between(200, 500),
      onComplete: () => p.destroy(),
    });
  }
}

export function screenShake(scene: Phaser.Scene, intensity = 0.008, duration = 120): void {
  scene.cameras.main.shake(duration, intensity);
}
