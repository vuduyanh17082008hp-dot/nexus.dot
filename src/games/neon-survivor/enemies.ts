import Phaser from "phaser";
import { ObjectPool, type PoolItem } from "@/games/shared/object-pool";
import { ENEMY_BASE_SPEED } from "./constants";

export interface EnemyItem extends PoolItem {
  hp: number;
  speed: number;
}

function body(sprite: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Body | null {
  return sprite.body as Phaser.Physics.Arcade.Body | null;
}

export function createEnemyPool(scene: Phaser.Scene): ObjectPool<EnemyItem> {
  return new ObjectPool(() => {
    const sprite = scene.physics.add.sprite(0, 0, "enemy");
    sprite.setActive(false).setVisible(false);
    const b = body(sprite);
    if (b) b.enable = false;
    return { active: false, sprite, hp: 1, speed: ENEMY_BASE_SPEED };
  }, 60);
}

export function spawnEnemy(
  pool: ObjectPool<EnemyItem>,
  x: number,
  y: number,
  hp: number,
  speed: number,
): void {
  const item = pool.acquire();
  if (!item) return;
  item.hp = hp;
  item.speed = speed;
  const sprite = item.sprite;
  sprite.setPosition(x, y).setTint(Phaser.Display.Color.HSVToRGB((hp * 0.05) % 1, 0.8, 1).color);
  const b = body(sprite);
  if (b) {
    b.enable = true;
    b.setCircle(6);
  }
}

export function updateEnemies(
  pool: ObjectPool<EnemyItem>,
  playerX: number,
  playerY: number,
): void {
  pool.forEachActive((item) => {
    const { sprite, speed } = item;
    const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, playerX, playerY);
    const b = body(sprite);
    if (b) b.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  });
}

export function spawnAtEdge(
  pool: ObjectPool<EnemyItem>,
  width: number,
  height: number,
  hp: number,
  speed: number,
): void {
  const edge = Phaser.Math.Between(0, 3);
  let x = 0;
  let y = 0;
  const pad = 30;
  switch (edge) {
    case 0:
      x = Phaser.Math.Between(0, width);
      y = -pad;
      break;
    case 1:
      x = width + pad;
      y = Phaser.Math.Between(0, height);
      break;
    case 2:
      x = Phaser.Math.Between(0, width);
      y = height + pad;
      break;
    default:
      x = -pad;
      y = Phaser.Math.Between(0, height);
  }
  spawnEnemy(pool, x, y, hp, speed);
}
