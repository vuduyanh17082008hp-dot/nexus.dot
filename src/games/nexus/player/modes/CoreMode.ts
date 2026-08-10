import { NEXUS_CONFIG } from "../../core/GameConfig";
import type { InputFrame } from "../../input/InputManager";
import type { PlayerBody } from "../PlayerBody";
import type { ModeContext, PlayerMode } from "./BaseMode";

export class CoreMode implements PlayerMode {
  readonly id = "CORE" as const;
  private jumpHeld = false;

  enter(body: PlayerBody, ctx: ModeContext): void {
    body.vx = NEXUS_CONFIG.core.runSpeed * ctx.speedMult;
    this.jumpHeld = false;
  }

  exit(): void {
    this.jumpHeld = false;
  }

  reset(body: PlayerBody, ctx: ModeContext): void {
    this.enter(body, ctx);
  }

  update(body: PlayerBody, ctx: ModeContext, input: InputFrame, dt: number): void {
    body.vx = NEXUS_CONFIG.core.runSpeed * ctx.speedMult;

    const g = NEXUS_CONFIG.core.gravity * ctx.gravitySign;
    const canJump = ctx.grounded || ctx.coyoteTimer > 0;
    const wantJump = input.primaryPressed || (input.bufferedPrimary && canJump);

    if (wantJump && canJump && body.alive) {
      body.vy = NEXUS_CONFIG.core.jumpVelocity * ctx.gravitySign;
      body.onGround = false;
      ctx.coyoteTimer = 0;
      this.jumpHeld = true;
    }

    if (input.primaryReleased) this.jumpHeld = false;

    // Variable jump height: cut upward velocity when released early
    if (!input.primaryHeld && this.jumpHeld === false) {
      if (ctx.gravitySign === 1 && body.vy < 0) {
        body.vy *= 0.45;
      } else if (ctx.gravitySign === -1 && body.vy > 0) {
        body.vy *= 0.45;
      }
    }

    let gravity = g;
    const rising =
      (ctx.gravitySign === 1 && body.vy < 0) || (ctx.gravitySign === -1 && body.vy > 0);
    if (!input.primaryHeld && rising) {
      gravity *= NEXUS_CONFIG.core.halfJumpGravityMult;
    }

    body.vy += gravity * dt;
    const maxFall = NEXUS_CONFIG.core.maxFallSpeed * ctx.gravitySign;
    if (ctx.gravitySign === 1) {
      body.vy = Math.min(body.vy, maxFall);
    } else {
      body.vy = Math.max(body.vy, maxFall);
    }

    body.x += body.vx * dt;
    body.y += body.vy * dt;

    if (!body.onGround) {
      body.rotation += 8 * dt * Math.sign(body.vx || 1);
    } else {
      // snap to cardinal when grounded
      const snapped = Math.round(body.rotation / (Math.PI / 2)) * (Math.PI / 2);
      body.rotation += (snapped - body.rotation) * Math.min(1, 20 * dt);
    }
  }
}
