import { NEXUS_CONFIG } from "../core/GameConfig";

export interface InputFrame {
  primaryPressed: boolean;
  primaryHeld: boolean;
  primaryReleased: boolean;
  restartPressed: boolean;
  pausePressed: boolean;
  bufferedPrimary: boolean;
}

export class InputManager {
  private primaryDown = false;
  private primaryWasDown = false;
  private restartDown = false;
  private restartWasDown = false;
  private pauseDown = false;
  private pauseWasDown = false;
  private bufferTimer = 0;
  private readonly bufferSeconds: number;
  private disposed = false;
  private readonly cleanups: Array<() => void> = [];

  constructor(bufferMs = NEXUS_CONFIG.inputBufferMs) {
    this.bufferSeconds = bufferMs / 1000;
  }

  attach(target: HTMLElement | Window = window): void {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
        e.preventDefault();
        this.primaryDown = true;
        this.bufferTimer = this.bufferSeconds;
      }
      if (e.code === "KeyR") this.restartDown = true;
      if (e.code === "Escape" || e.code === "KeyP") this.pauseDown = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
        this.primaryDown = false;
      }
      if (e.code === "KeyR") this.restartDown = false;
      if (e.code === "Escape" || e.code === "KeyP") this.pauseDown = false;
    };
    const onPointerDown = (e: Event) => {
      e.preventDefault();
      this.primaryDown = true;
      this.bufferTimer = this.bufferSeconds;
    };
    const onPointerUp = () => {
      this.primaryDown = false;
    };

    target.addEventListener("keydown", onKeyDown as EventListener);
    target.addEventListener("keyup", onKeyUp as EventListener);
    if (target !== window) {
      target.addEventListener("pointerdown", onPointerDown);
      target.addEventListener("pointerup", onPointerUp);
      target.addEventListener("pointerleave", onPointerUp);
    } else {
      window.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointerup", onPointerUp);
    }

    this.cleanups.push(() => {
      target.removeEventListener("keydown", onKeyDown as EventListener);
      target.removeEventListener("keyup", onKeyUp as EventListener);
      target.removeEventListener("pointerdown", onPointerDown);
      target.removeEventListener("pointerup", onPointerUp);
      target.removeEventListener("pointerleave", onPointerUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    });
  }

  beginFrame(dt: number): InputFrame {
    if (this.bufferTimer > 0) this.bufferTimer = Math.max(0, this.bufferTimer - dt);

    const primaryPressed = this.primaryDown && !this.primaryWasDown;
    const primaryReleased = !this.primaryDown && this.primaryWasDown;
    const restartPressed = this.restartDown && !this.restartWasDown;
    const pausePressed = this.pauseDown && !this.pauseWasDown;
    const bufferedPrimary = primaryPressed || this.bufferTimer > 0;

    this.primaryWasDown = this.primaryDown;
    this.restartWasDown = this.restartDown;
    this.pauseWasDown = this.pauseDown;

    // Consume buffer on press edge for this frame reporting
    if (primaryPressed) this.bufferTimer = this.bufferSeconds;

    return {
      primaryPressed,
      primaryHeld: this.primaryDown,
      primaryReleased,
      restartPressed,
      pausePressed,
      bufferedPrimary,
    };
  }

  consumeBuffer(): void {
    this.bufferTimer = 0;
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const fn of this.cleanups) fn();
    this.cleanups.length = 0;
  }
}
