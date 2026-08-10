import { describe, expect, it } from "vitest";
import { parseLevelData } from "./LevelSchema";
import bootSequence from "../levels/boot-sequence.json";

describe("level schema", () => {
  it("parses Boot Sequence official level", () => {
    const level = parseLevelData(bootSequence);
    expect(level.metadata.id).toBe("boot-sequence");
    expect(level.metadata.difficulty).toBe("EASY");
    expect(level.objects.length).toBeGreaterThan(10);
    expect(level.objects.some((o) => o.type === "FINISH")).toBe(true);
    expect(level.objects.some((o) => o.type === "SPIKE")).toBe(true);
  });

  it("rejects unknown object types", () => {
    expect(() =>
      parseLevelData({
        ...bootSequence,
        objects: [{ id: "x", type: "EVIL_SCRIPT", x: 0, y: 0 }],
      }),
    ).toThrow();
  });
});
