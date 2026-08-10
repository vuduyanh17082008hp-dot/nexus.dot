import Phaser from "phaser";

export class InputManager {
  private virtual = { moveX: 0, moveY: 0, fire: false };
  private pointerDown = false;

  setVirtualInput(input: Partial<{ moveX: number; moveY: number; fire: boolean }>): void {
    Object.assign(this.virtual, input);
  }

  setPointerDown(down: boolean): void {
    this.pointerDown = down;
  }

  poll(scene: Phaser.Scene, playerX: number, playerY: number) {
    const kb = scene.input.keyboard;
    const left = kb?.addKey("A").isDown || kb?.addKey("LEFT").isDown;
    const right = kb?.addKey("D").isDown || kb?.addKey("RIGHT").isDown;
    const up = kb?.addKey("W").isDown || kb?.addKey("UP").isDown;
    const down = kb?.addKey("S").isDown || kb?.addKey("DOWN").isDown;

    let moveX = (right ? 1 : 0) - (left ? 1 : 0);
    let moveY = (down ? 1 : 0) - (up ? 1 : 0);

    if (this.virtual.moveX !== 0 || this.virtual.moveY !== 0) {
      moveX = this.virtual.moveX;
      moveY = this.virtual.moveY;
    }

    const pointer = scene.input.activePointer;
    const aimX = pointer.worldX - playerX;
    const aimY = pointer.worldY - playerY;
    const spaceKey = kb?.addKey("SPACE");
    const fire = (spaceKey?.isDown ?? false) || pointer.isDown || this.pointerDown || this.virtual.fire;

    const jump =
      (spaceKey?.isDown ?? false) ||
      kb?.addKey("W").isDown ||
      kb?.addKey("UP").isDown ||
      this.pointerDown;

    const escKey = kb?.addKey("ESC");
    const pause = escKey ? Phaser.Input.Keyboard.JustDown(escKey) : false;

    return { moveX, moveY, aimX, aimY, fire, jump, pause };
  }

  isTouchDevice(): boolean {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }
}
