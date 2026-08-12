import Phaser from "phaser";

export const VICTORY_MESSAGE = "WELL DONE BUDDY";

export type VictoryOverlayOptions = {
  width: number;
  height: number;
  /** Seconds before option prompts appear */
  holdSeconds?: number;
  isFinalRound: boolean;
  cyan?: string;
  violet?: string;
  particleKey?: string;
};

export type VictoryOverlayCallbacks = {
  onNext: () => void;
  onReplay: () => void;
  onMenu: () => void;
};

/**
 * Shared Phaser victory sequence: scale-in title → option prompts.
 * Call `begin()` once on COMPLETED; destroy on scene shutdown / restart.
 */
export class VictoryOverlay {
  private readonly scene: Phaser.Scene;
  private readonly opts: Required<
    Pick<VictoryOverlayOptions, "width" | "height" | "holdSeconds" | "isFinalRound">
  > &
    VictoryOverlayOptions;
  private root!: Phaser.GameObjects.Container;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private options!: Phaser.GameObjects.Text;
  private burst?: Phaser.GameObjects.Particles.ParticleEmitter;
  private optionsReady = false;
  private disposed = false;
  private callbacks: VictoryOverlayCallbacks | null = null;
  private keyCleanups: Array<() => void> = [];

  constructor(scene: Phaser.Scene, options: VictoryOverlayOptions) {
    this.scene = scene;
    this.opts = {
      holdSeconds: 1.25,
      cyan: "#65E8FF",
      violet: "#7C5CFF",
      particleKey: "vr-spark",
      ...options,
    };
  }

  begin(callbacks: VictoryOverlayCallbacks): void {
    if (this.disposed) return;
    this.callbacks = callbacks;
    this.optionsReady = false;

    const { width, height, cyan, violet } = this.opts;
    const cx = width / 2;
    const cy = height / 2;

    this.root = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(200);

    const veil = this.scene.add
      .rectangle(cx, cy, width, height, 0x080a12, 0.45)
      .setScrollFactor(0);
    this.root.add(veil);

    this.title = this.scene.add
      .text(cx, cy - 36, VICTORY_MESSAGE, {
        fontFamily: "Orbitron, Share Tech Mono, monospace",
        fontSize: "42px",
        color: cyan,
        align: "center",
        stroke: violet,
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setScale(0.72)
      .setAlpha(0)
      .setShadow(0, 0, cyan ?? "#65E8FF", 18, true, true);
    this.root.add(this.title);

    this.subtitle = this.scene.add
      .text(cx, cy + 18, "ROUND COMPLETE", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: violet,
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setAlpha(0);
    this.root.add(this.subtitle);

    const nextLabel = this.opts.isFinalRound ? "CONTINUE" : "NEXT ROUND";
    this.options = this.scene.add
      .text(
        cx,
        cy + 78,
        `ENTER / SPACE  →  ${nextLabel}\nR  →  PLAY AGAIN\nESC  →  RETURN TO MENU`,
        {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#F5F7FF",
          align: "center",
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setAlpha(0)
      .setVisible(false);
    this.root.add(this.options);

    this.scene.tweens.add({
      targets: this.title,
      scale: 1,
      alpha: 1,
      duration: 420,
      ease: "Back.easeOut",
    });
    this.scene.tweens.add({
      targets: this.subtitle,
      alpha: 1,
      delay: 180,
      duration: 280,
      ease: "Sine.easeOut",
    });

    this.spawnBurst(cx, cy - 20);

    this.scene.time.delayedCall(Math.floor(this.opts.holdSeconds * 1000), () => {
      if (this.disposed) return;
      this.optionsReady = true;
      this.options.setVisible(true);
      this.scene.tweens.add({
        targets: this.options,
        alpha: 1,
        duration: 220,
        ease: "Sine.easeOut",
      });
      this.bindKeys();
    });
  }

  private spawnBurst(x: number, y: number): void {
    const key = this.opts.particleKey;
    if (!key || !this.scene.textures.exists(key)) return;
    this.burst = this.scene.add.particles(x, y, key, {
      speed: { min: 80, max: 220 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.85, end: 0 },
      lifespan: 700,
      quantity: 28,
      blendMode: "ADD",
      tint: [0x65e8ff, 0x7c5cff, 0x458bff],
      emitting: false,
    });
    this.burst.setScrollFactor(0).setDepth(199);
    this.burst.explode(28);
    this.scene.time.delayedCall(800, () => {
      this.burst?.destroy();
      this.burst = undefined;
    });
  }

  private bindKeys(): void {
    const kb = this.scene.input.keyboard;
    if (!kb) return;

    const onNext = () => {
      if (!this.optionsReady || this.disposed) return;
      this.callbacks?.onNext();
    };
    const onReplay = () => {
      if (!this.optionsReady || this.disposed) return;
      this.callbacks?.onReplay();
    };
    const onMenu = () => {
      if (!this.optionsReady || this.disposed) return;
      this.callbacks?.onMenu();
    };

    const enter = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const space = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const r = kb.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const esc = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    enter.once("down", onNext);
    space.once("down", onNext);
    r.once("down", onReplay);
    esc.once("down", onMenu);

    this.keyCleanups.push(() => {
      enter.off("down", onNext);
      space.off("down", onNext);
      r.off("down", onReplay);
      esc.off("down", onMenu);
      kb.removeKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      // Do not remove SPACE / R / ESC — InputManager / scene still use them
    });
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.optionsReady = false;
    for (const fn of this.keyCleanups) fn();
    this.keyCleanups = [];
    this.burst?.destroy();
    this.burst = undefined;
    this.root?.destroy(true);
  }
}
