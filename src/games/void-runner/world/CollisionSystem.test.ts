import { describe, expect, it } from "vitest";
import { PlayerBody } from "../player/PlayerBody";
import { resolveCollisions, type Aabb } from "./CollisionSystem";

function platform(partial: Partial<Aabb> & Pick<Aabb, "x" | "y" | "w" | "h">): Aabb {
  return {
    id: "p",
    kind: "PLATFORM",
    solid: true,
    ...partial,
  };
}

describe("resolveCollisions grounding", () => {
  it("marks grounded when landing on top of a platform (Y-down)", () => {
    const body = new PlayerBody();
    body.setSize(28, 28);
    body.setPosition(120, 480);
    body.vy = 400;

    const floor = platform({ x: 500, y: 510, w: 1100, h: 40 });
    const hit = resolveCollisions(body, [floor], [], [], 1);

    expect(hit.grounded).toBe(true);
    expect(hit.groundY).toBe(510 - 20 - 14);
    expect(body.y).toBe(hit.groundY);
    expect(body.vy).toBe(0);
  });

  it("does not mark grounded when hitting a ceiling from below", () => {
    const body = new PlayerBody();
    body.setSize(28, 28);
    body.setPosition(120, 100);
    body.vy = -400;

    const ceiling = platform({ x: 500, y: 70, w: 1000, h: 40 });
    const hit = resolveCollisions(body, [ceiling], [], [], 1);

    expect(hit.grounded).toBe(false);
    expect(body.vy).toBe(0);
    expect(body.y).toBeGreaterThan(70);
  });
});
