import { PlayerController } from "../src/games/void-runner/player/PlayerController";
import { resolveCollisions, objectToAabb } from "../src/games/void-runner/world/CollisionSystem";
import type { InputFrame } from "../src/games/nexus/input/InputManager";
import type { VoidLevelObject } from "../src/games/void-runner/levels/LevelSchema";

const floorObj = {
  id: "floor-0",
  type: "PLATFORM",
  x: 500,
  y: 510,
  width: 1100,
  height: 40,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  properties: {},
} as VoidLevelObject;

const floor = objectToAabb(floorObj);
const player = new PlayerController();
player.spawn(120, 420, 1, "normal", "CUBE");
const dt = 1 / 120;
let groundedFrames = 0;
let jumped = false;
let yMin = 9999;
let firstGroundFrame = -1;

for (let i = 0; i < 200; i++) {
  const press = i === 90;
  const input: InputFrame = {
    primaryPressed: press,
    primaryHeld: press,
    primaryReleased: false,
    restartPressed: false,
    pausePressed: false,
    bufferedPrimary: press,
  };
  player.markGrounded(false);
  player.update(input, dt);
  const hit = resolveCollisions(player.body, [floor], [], [], 1);
  if (hit.grounded) {
    if (firstGroundFrame < 0) firstGroundFrame = i;
    player.markGrounded(true);
    if (hit.groundY !== undefined) player.body.y = hit.groundY;
    groundedFrames += 1;
  }
  if (input.primaryPressed || input.bufferedPrimary) player.tryGroundJump();
  if (player.didJumpThisStep) jumped = true;
  yMin = Math.min(yMin, player.body.y);
}

console.log(
  JSON.stringify(
    {
      groundedFrames,
      firstGroundFrame,
      jumped,
      yMin,
      y: player.body.y,
      onGround: player.body.onGround,
    },
    null,
    2,
  ),
);

if (!jumped || groundedFrames === 0) {
  process.exitCode = 1;
}
