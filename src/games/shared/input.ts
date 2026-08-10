import Phaser from "phaser";

type KeyMap = {
  a?: Phaser.Input.Keyboard.Key;
  d?: Phaser.Input.Keyboard.Key;
  w?: Phaser.Input.Keyboard.Key;
  s?: Phaser.Input.Keyboard.Key;
  left?: Phaser.Input.Keyboard.Key;
  right?: Phaser.Input.Keyboard.Key;
  up?: Phaser.Input.Keyboard.Key;
  down?: Phaser.Input.Keyboard.Key;
  space?: Phaser.Input.Keyboard.Key;
  esc?: Phaser.Input.Keyboard.Key;
};

/**
 * Cached keyboard keys — never call addKey every frame.
 */
export class InputManager {
  private virtual = { moveX: 0, moveY: 0, fire: false };
  private pointerDown = false;
  private keys: KeyMap = {};
  private bound = false;
  /** Ignore fire for a short window after READY→PLAYING so start click doesn't shoot */
  private fireLockUntil = 0;

  bind(scene: Phaser.Scene): void {
    if (this.bound) return;
    const kb = scene.input.keyboard;
    if (!kb) return;
    this.keys = {
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      esc: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };
    this.bound = true;
  }

  resetBinding(): void {
    this.bound = false;
    this.keys = {};
  }

  setFireLock(ms: number, now: number): void {
    this.fireLockUntil = now + ms;
  }

  setVirtualInput(input: Partial<{ moveX: number; moveY: number; fire: boolean }>): void {
    Object.assign(this.virtual, input);
  }

  setPointerDown(down: boolean): void {
    this.pointerDown = down;
  }

  poll(scene: Phaser.Scene, playerX: number, playerY: number) {
    this.bind(scene);

    const left = !!(this.keys.a?.isDown || this.keys.left?.isDown);
    const right = !!(this.keys.d?.isDown || this.keys.right?.isDown);
    const up = !!(this.keys.w?.isDown || this.keys.up?.isDown);
    const down = !!(this.keys.s?.isDown || this.keys.down?.isDown);

    let moveX = (right ? 1 : 0) - (left ? 1 : 0);
    let moveY = (down ? 1 : 0) - (up ? 1 : 0);

    if (this.virtual.moveX !== 0 || this.virtual.moveY !== 0) {
      moveX = this.virtual.moveX;
      moveY = this.virtual.moveY;
    }

    // Normalize diagonals
    const len = Math.hypot(moveX, moveY);
    if (len > 1) {
      moveX /= len;
      moveY /= len;
    }

    const pointer = scene.input.activePointer;
    const aimX = pointer.worldX - playerX;
    const aimY = pointer.worldY - playerY;

    const now = scene.time.now;
    const fireLocked = now < this.fireLockUntil;
    const rawFire =
      !!(this.keys.space?.isDown) || pointer.isDown || this.pointerDown || this.virtual.fire;
    const fire = !fireLocked && rawFire;

    const jump =
      !!(this.keys.space?.isDown) ||
      !!(this.keys.w?.isDown) ||
      !!(this.keys.up?.isDown) ||
      this.pointerDown;

    const pause = this.keys.esc ? Phaser.Input.Keyboard.JustDown(this.keys.esc) : false;

    return { moveX, moveY, aimX, aimY, fire, jump, pause };
  }

  isTouchDevice(): boolean {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }
}
