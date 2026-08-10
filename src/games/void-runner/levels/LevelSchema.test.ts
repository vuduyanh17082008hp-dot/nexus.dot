import { describe, expect, it } from "vitest";
import { parseVoidLevelData } from "./LevelSchema";
import voidSignal from "./void-signal.json";

describe("void-runner level schema", () => {
  it("parses VOID SIGNAL official level", () => {
    const level = parseVoidLevelData(voidSignal);
    expect(level.metadata.id).toBe("void-signal");
    expect(level.metadata.name).toBe("VOID SIGNAL");
    expect(level.metadata.difficulty).toBe("EASY");
    expect(level.settings.startForm).toBe("CUBE");
    expect(level.objects.some((o) => o.type === "FINISH")).toBe(true);
    expect(level.objects.some((o) => o.type === "FORM_PORTAL")).toBe(true);
    expect(level.objects.some((o) => o.type === "CHECKPOINT")).toBe(true);
    expect(level.objects.filter((o) => o.type === "SPIKE").length).toBeGreaterThan(5);
    expect(level.song.bpm).toBeGreaterThan(100);
    expect(level.song.durationSeconds).toBeGreaterThanOrEqual(60);
    expect(level.song.durationSeconds).toBeLessThanOrEqual(90);
  });

  it("rejects unknown object types", () => {
    expect(() =>
      parseVoidLevelData({
        ...voidSignal,
        objects: [{ id: "x", type: "EVIL_SCRIPT", x: 0, y: 0 }],
      }),
    ).toThrow();
  });
});
