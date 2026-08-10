export interface VolumeSettings {
  master: number;
  music: number;
  sfx: number;
}

type OscType = OscillatorType;

export class GameAudio {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private muted = false;
  private volumes: VolumeSettings = { master: 1, music: 0.7, sfx: 0.85 };

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.unlocked = true;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  setVolumes(master: number, music: number, sfx: number): void {
    this.volumes = {
      master: clamp(master),
      music: clamp(music),
      sfx: clamp(sfx),
    };
  }

  playTone(
    freq: number,
    duration = 0.08,
    type: OscType = "square",
    channel: "sfx" | "music" = "sfx",
    gain = 0.12,
  ): void {
    if (this.muted || !this.ctx || !this.unlocked) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const vol =
      this.volumes.master *
      (channel === "music" ? this.volumes.music : this.volumes.sfx) *
      gain;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playShoot(): void {
    this.playTone(880, 0.05, "square", "sfx", 0.08);
  }

  playHit(): void {
    this.playTone(220, 0.1, "sawtooth", "sfx", 0.1);
  }

  playCollect(): void {
    this.playTone(660, 0.06, "sine", "sfx", 0.1);
    setTimeout(() => this.playTone(990, 0.06, "sine", "sfx", 0.08), 50);
  }

  playJump(): void {
    this.playTone(400, 0.08, "triangle", "sfx", 0.1);
    setTimeout(() => this.playTone(600, 0.1, "triangle", "sfx", 0.08), 40);
  }

  playDeath(): void {
    this.playTone(180, 0.25, "sawtooth", "sfx", 0.15);
  }

  playVictory(): void {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.15, "sine", "music", 0.1), i * 120);
    });
  }

  playBounce(): void {
    this.playTone(320, 0.05, "triangle", "sfx", 0.08);
  }

  playPowerUp(): void {
    [440, 554, 659].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.08, "sine", "sfx", 0.1), i * 60);
    });
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}
