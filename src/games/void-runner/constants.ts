export const GAME_SLUG = "void-runner";

export const SCENE = {
  BOOT: "VoidBoot",
  PLAY: "VoidPlay",
} as const;

export type VoidGameState =
  | "READY"
  | "COUNTDOWN"
  | "PLAYING"
  | "PAUSED"
  | "DEAD"
  | "COMPLETED"
  | "PRACTICE";

export const VOID_PALETTE = {
  bg: 0x080a12,
  surface: 0x10131f,
  elevated: 0x171b2a,
  violet: 0x7c5cff,
  cyan: 0x65e8ff,
  blue: 0x458bff,
  text: 0xf5f7ff,
  muted: 0x9aa4bc,
  hazard: 0xff4d6d,
  pad: 0x65e8ff,
  ground: 0x2a3350,
  groundEdge: 0x7c5cff,
} as const;

export const VOID_CONFIG = {
  width: 960,
  height: 540,
  simHz: 120,
  maxFrameDt: 0.05,
  inputBufferMs: 120,
  coyoteMs: 70,
  countdownSeconds: 1.2,
  deathRestartSeconds: 0.7,
  camera: {
    lookahead: 200,
    lerp: 0.14,
  },
  speeds: {
    "0.75": 0.75,
    "1.0": 1.0,
    "1.25": 1.25,
    "1.5": 1.5,
    "1.8": 1.8,
    "2.1": 2.1,
  },
  cube: {
    runSpeed: 430,
    jumpVelocity: -740,
    gravity: 2300,
    maxFallSpeed: 1450,
    halfJumpGravityMult: 2.15,
    width: 28,
    height: 28,
  },
  ship: {
    runSpeed: 430,
    thrust: 2100,
    gravity: 1600,
    maxFallSpeed: 1100,
    maxRiseSpeed: 1000,
    width: 32,
    height: 22,
  },
  ball: {
    runSpeed: 430,
    bounceVelocity: -620,
    gravity: 2400,
    maxFallSpeed: 1500,
    width: 26,
    height: 26,
  },
  ufo: {
    runSpeed: 430,
    hopVelocity: -520,
    gravity: 1800,
    maxFallSpeed: 1200,
    width: 30,
    height: 24,
  },
  wave: {
    runSpeed: 430,
    riseSpeed: 520,
    fallSpeed: 520,
    width: 26,
    height: 16,
  },
  robot: {
    runSpeed: 430,
    jumpVelocity: -700,
    gravity: 2200,
    maxFallSpeed: 1400,
    hoverThrust: 900,
    width: 30,
    height: 34,
  },
  spider: {
    runSpeed: 400,
    jumpVelocity: -680,
    gravity: 2100,
    maxFallSpeed: 1350,
    width: 28,
    height: 28,
  },
} as const;

export type VoidSpeedTier = keyof typeof VOID_CONFIG.speeds;
