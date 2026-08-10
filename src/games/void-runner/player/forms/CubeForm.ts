import type { InputFrame } from "@/games/nexus/input/InputManager";
import { VOID_CONFIG } from "../../constants";
import type { PlayerBody } from "../PlayerBody";
import { BasePlayerForm, type FormContext } from "./BasePlayerForm";

export class CubeForm extends BasePlayerForm {
  readonly id = "CUBE" as const;
  private jumpHeld = false;

  enter(body: PlayerBody, ctx: FormContext): void {
    body.setSize(VOID_CONFIG.cube.width, VOID_CONFIG.cube.height);
    body.vx = VOID_CONFIG.cube.runSpeed * ctx.speedMult;
    this.jumpHeld = false;
  }

  exit(): void {
    this.jumpHeld = false;
  }

  update(body: PlayerBody, ctx: FormContext, input: InputFrame, dt: number): void {
    const cfg = VOID_CONFIG.cube;
    body.vx = cfg.runSpeed * ctx.speedMult;

    const g = cfg.gravity * ctx.gravitySign;
    const canJump = ctx.grounded || ctx.coyoteTimer > 0;
    const wantJump = input.primaryPressed || (input.bufferedPrimary && canJump);

    if (wantJump && canJump && body.alive) {
      body.vy = cfg.jumpVelocity * ctx.gravitySign;
      body.onGround = false;
      ctx.coyoteTimer = 0;
      this.jumpHeld = true;
    }

    if (input.primaryReleased) this.jumpHeld = false;

    if (!input.primaryHeld && !this.jumpHeld) {
      if (ctx.gravitySign === 1 && body.vy < 0) body.vy *= 0.45;
      else if (ctx.gravitySign === -1 && body.vy > 0) body.vy *= 0.45;
    }

    let gravity = g;
    const rising =
      (ctx.gravitySign === 1 && body.vy < 0) || (ctx.gravitySign === -1 && body.vy > 0);
    if (!input.primaryHeld && rising) gravity *= cfg.halfJumpGravityMult;

    body.vy += gravity * dt;
    const maxFall = cfg.maxFallSpeed * ctx.gravitySign;
    if (ctx.gravitySign === 1) body.vy = Math.min(body.vy, maxFall);
    else body.vy = Math.max(body.vy, maxFall);

    body.x += body.vx * dt;
    body.y += body.vy * dt;

    if (!body.onGround) {
      body.rotation += 9 * dt * Math.sign(body.vx || 1);
    } else {
      const snapped = Math.round(body.rotation / (Math.PI / 2)) * (Math.PI / 2);
      body.rotation += (snapped - body.rotation) * Math.min(1, 22 * dt);
    }
  }
}
