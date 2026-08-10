import type { VoidLevelObject } from "../levels/LevelSchema";
import type { PlayerBody } from "../player/PlayerBody";

export interface Aabb {
  x: number;
  y: number;
  w: number;
  h: number;
  shrink?: number;
  lethal?: boolean;
  solid?: boolean;
  kind: VoidLevelObject["type"];
  id: string;
  padStrength?: number;
  form?: string;
  meta?: Record<string, unknown>;
}

export function objectToAabb(obj: VoidLevelObject): Aabb {
  const w = obj.width * obj.scaleX;
  const h = obj.height * obj.scaleY;
  const lethal = obj.type === "SPIKE";
  const solid = obj.type === "BLOCK" || obj.type === "PLATFORM";
  return {
    id: obj.id,
    kind: obj.type,
    x: obj.x,
    y: obj.y,
    w,
    h,
    lethal,
    solid,
    shrink: lethal ? 0.55 : 1,
    padStrength: obj.type === "PAD_JUMP" ? Number(obj.properties.strength ?? 1.15) : undefined,
    form: obj.type === "FORM_PORTAL" ? String(obj.properties.form ?? "CUBE") : undefined,
    meta: obj.properties,
  };
}

function overlaps(ax: number, ay: number, aw: number, ah: number, b: Aabb): boolean {
  const shrink = b.shrink ?? 1;
  const bw = b.w * shrink;
  const bh = b.h * shrink;
  const bl = b.x - bw / 2;
  const br = b.x + bw / 2;
  const bt = b.y - bh / 2;
  const bb = b.y + bh / 2;
  const al = ax - aw / 2;
  const ar = ax + aw / 2;
  const at = ay - ah / 2;
  const ab = ay + ah / 2;
  return al < br && ar > bl && at < bb && ab > bt;
}

export interface CollisionResult {
  grounded: boolean;
  groundY?: number;
  died: boolean;
  finish: boolean;
  padBoost?: number;
  collectibleIds: string[];
  gravityFlip?: boolean;
  formChange?: string;
  checkpointId?: string;
}

export function resolveCollisions(
  body: PlayerBody,
  solids: Aabb[],
  hazards: Aabb[],
  specials: Aabb[],
  gravitySign: 1 | -1,
): CollisionResult {
  const result: CollisionResult = {
    grounded: false,
    died: false,
    finish: false,
    collectibleIds: [],
  };

  for (const s of solids) {
    if (!overlaps(body.x, body.y, body.width, body.height, s)) continue;

    const dx = body.x - s.x;
    const dy = body.y - s.y;
    const px = s.w / 2 + body.width / 2 - Math.abs(dx);
    const py = s.h / 2 + body.height / 2 - Math.abs(dy);

    if (px < py) {
      body.x += Math.sign(dx || 1) * px;
      body.vx = Math.max(body.vx, 0);
    } else if (gravitySign === 1) {
      if (dy < 0) {
        body.y -= py;
        if (body.vy < 0) body.vy = 0;
      } else {
        body.y += py;
        if (body.vy > 0) body.vy = 0;
        result.grounded = true;
        result.groundY = s.y - s.h / 2 - body.height / 2;
      }
    } else if (dy > 0) {
      body.y += py;
      if (body.vy > 0) body.vy = 0;
    } else {
      body.y -= py;
      if (body.vy < 0) body.vy = 0;
      result.grounded = true;
      result.groundY = s.y + s.h / 2 + body.height / 2;
    }
  }

  for (const h of hazards) {
    if (overlaps(body.x, body.y, body.width, body.height, h)) {
      result.died = true;
      break;
    }
  }

  for (const sp of specials) {
    if (!overlaps(body.x, body.y, body.width, body.height, sp)) continue;
    if (sp.kind === "FINISH") result.finish = true;
    if (sp.kind === "PAD_JUMP" && sp.padStrength) result.padBoost = sp.padStrength;
    if (sp.kind === "COLLECTIBLE") result.collectibleIds.push(sp.id);
    if (sp.kind === "PORTAL_GRAVITY") result.gravityFlip = true;
    if (sp.kind === "FORM_PORTAL" && sp.form) result.formChange = sp.form;
    if (sp.kind === "CHECKPOINT") result.checkpointId = sp.id;
  }

  return result;
}
