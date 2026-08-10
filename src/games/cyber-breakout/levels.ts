import type { LevelDef } from "./constants";

export const LEVELS: LevelDef[] = [
  {
    label: "Grid Alpha",
    rows: 4,
    cols: 10,
    pattern: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    label: "Neon Wall",
    rows: 5,
    cols: 10,
    pattern: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 3, 3, 1, 1, 1, 1],
      [1, 1, 3, 1, 1, 1, 1, 3, 1, 1],
      [1, 3, 1, 1, 1, 1, 1, 1, 3, 1],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ],
  },
  {
    label: "Void Gate",
    rows: 6,
    cols: 10,
    pattern: [
      [1, 2, 1, 2, 1, 1, 2, 1, 2, 1],
      [2, 1, 2, 1, 3, 3, 1, 2, 1, 2],
      [1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
      [1, 1, 1, 2, 2, 2, 2, 1, 1, 1],
      [3, 1, 1, 1, 1, 1, 1, 1, 1, 3],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ],
  },
  {
    label: "Cipher",
    rows: 6,
    cols: 10,
    pattern: [
      [2, 1, 1, 1, 2, 2, 1, 1, 1, 2],
      [1, 3, 1, 3, 1, 1, 3, 1, 3, 1],
      [1, 1, 2, 1, 1, 1, 1, 2, 1, 1],
      [1, 3, 1, 3, 2, 2, 3, 1, 3, 1],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [1, 1, 2, 2, 3, 3, 2, 2, 1, 1],
    ],
  },
  {
    label: "Final Node",
    rows: 7,
    cols: 10,
    pattern: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 3, 1, 1, 1, 1, 1, 1, 3, 2],
      [2, 1, 2, 1, 3, 3, 1, 2, 1, 2],
      [2, 1, 1, 2, 1, 1, 2, 1, 1, 2],
      [2, 1, 2, 1, 3, 3, 1, 2, 1, 2],
      [2, 3, 1, 1, 1, 1, 1, 1, 3, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ],
  },
];

export function brickColor(code: number): number {
  switch (code) {
    case 2:
      return 0xff3366;
    case 3:
      return 0xffaa00;
    default:
      return 0x44ccff;
  }
}

export function brickPoints(code: number): number {
  switch (code) {
    case 2:
      return 30;
    case 3:
      return 50;
    default:
      return 10;
  }
}

export function brickHp(code: number): number {
  return code === 2 ? 2 : 1;
}
