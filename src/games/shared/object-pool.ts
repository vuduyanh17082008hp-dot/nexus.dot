import type Phaser from "phaser";

export interface PoolItem {
  active: boolean;
  sprite: Phaser.Physics.Arcade.Sprite;
}

export class ObjectPool<T extends PoolItem> {
  private items: T[] = [];

  constructor(
    private readonly factory: () => T,
    initialSize = 20,
  ) {
    for (let i = 0; i < initialSize; i++) {
      const item = factory();
      item.active = false;
      item.sprite.setActive(false).setVisible(false);
      this.items.push(item);
    }
  }

  acquire(): T | null {
    const free = this.items.find((i) => !i.active);
    if (free) {
      free.active = true;
      free.sprite.setActive(true).setVisible(true);
      return free;
    }
    const item = this.factory();
    item.active = true;
    this.items.push(item);
    return item;
  }

  release(item: T): void {
    item.active = false;
    item.sprite.setActive(false).setVisible(false);
    const body = item.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.enable = false;
      body.setVelocity(0, 0);
    }
  }

  forEachActive(fn: (item: T) => void): void {
    for (const item of this.items) {
      if (item.active) fn(item);
    }
  }

  releaseAll(): void {
    for (const item of this.items) {
      if (item.active) this.release(item);
    }
  }
}
