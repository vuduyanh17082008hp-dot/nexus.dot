export const NEXUS_CONFIG = {
  width: 960,
  height: 540,
  /** Deterministic simulation rate */
  simHz: 120,
  get simDt() {
    return 1 / this.simHz;
  },
  maxFrameDt: 0.05,
  inputBufferMs: 70,
  coyoteMs: 50,
  speeds: {
    "0.75": 0.75,
    "1.0": 1.0,
    "1.25": 1.25,
    "1.5": 1.5,
    "1.8": 1.8,
    "2.1": 2.1,
  },
  core: {
    runSpeed: 420,
    jumpVelocity: -720,
    gravity: 2200,
    maxFallSpeed: 1400,
    halfJumpGravityMult: 2.2,
    width: 28,
    height: 28,
  },
  camera: {
    lookahead: 180,
    lerp: 0.12,
  },
} as const;

export type SpeedTier = keyof typeof NEXUS_CONFIG.speeds;
