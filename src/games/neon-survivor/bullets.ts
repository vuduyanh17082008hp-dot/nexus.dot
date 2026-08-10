import Phaser from "phaser";
import { ObjectPool, type PoolItem } from "@/games/shared/object-pool";
import { BULLET_SPEED } from "./constants";

export interface BulletItem extends PoolItem {
  damage: number;
}

function body(sprite: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Body | null {
  return sprite.body as Phaser.Physics.Arcade.Body | null;
}

export function createBulletPool(scene: Phaser.Scene): ObjectPool<BulletItem> {
  return new ObjectPool(() => {
    const sprite = scene.physics.add.sprite(0, 0, "bullet");
    sprite.setActive(false).setVisible(false);
    const b = body(sprite);
    if (b) b.enable = false;
    return { active: false, sprite, damage: 1 };
  }, 40);
}

export function fireBullet(
  pool: ObjectPool<BulletItem>,
  x: number,
  y: number,
  angle: number,
  damage: number,
): void {
  const item = pool.acquire();
  if (!item) return;
  item.damage = damage;
  const sprite = item.sprite;
  sprite.setPosition(x, y).setRotation(angle);
  const b = body(sprite);
  if (b) {
    b.enable = true;
    b.setVelocity(Math.cos(angle) * BULLET_SPEED, Math.sin(angle) * BULLET_SPEED);
  }
}

export function updateBullets(pool: ObjectPool<BulletItem>, bounds: Phaser.Geom.Rectangle): void {
  pool.forEachActive((item) => {
    const { sprite } = item;
    if (
      sprite.x < bounds.x - 20 ||
      sprite.x > bounds.right + 20 ||
      sprite.y < bounds.y - 20 ||
      sprite.y > bounds.bottom + 20
    ) {
      pool.release(item);
    }
  });
}
