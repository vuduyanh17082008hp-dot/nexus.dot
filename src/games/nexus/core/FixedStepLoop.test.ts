import { describe, expect, it } from "vitest";
import { FixedStepLoop } from "./FixedStepLoop";

describe("FixedStepLoop", () => {
  it("runs a stable number of sim steps for a given frame", () => {
    const loop = new FixedStepLoop(120);
    let steps = 0;
    loop.tick(1 / 60, () => {
      steps += 1;
    });
    expect(steps).toBe(2);
  });

  it("caps spiral of death with max steps per frame", () => {
    const loop = new FixedStepLoop(120);
    let steps = 0;
    loop.tick(1, () => {
      steps += 1;
    });
    expect(steps).toBeLessThanOrEqual(8);
  });
});
