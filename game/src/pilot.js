// The Velvet Vault — the pilot: a scripted thief that plays by the real rules.
//
// One file, one job: steer the thief along one of a room's planned routes through the same
// step function a player uses. It is what stages the screenshots (shots.js) and what the tests
// use to prove every room can be finished. It reads the cones the way a careful player does:
// it creeps when a guard is in earshot, and waits rather than step into a watcher's sight.

import { CAMERA, GUARD, THIEF } from './config.js';
import { rectAt } from './geometry.js';
import { jobInReach } from './loot.js';
import { inSight } from './vision.js';

const ARRIVE = 9;
const LOOK_AHEAD = 44;
const PATIENCE_SECONDS = 14;

/** Would a thief standing at (x, y) be in some watcher's sight right now? */
export function exposedAt(world, x, y) {
  const room = world.room;
  if (rectAt(x, y, room.vents)) return false;
  for (const cloud of world.smoke) if (Math.hypot(x - cloud.x, y - cloud.y) < cloud.radius) return false;
  const shadow = rectAt(x, y, room.shadows) !== null;
  for (const guard of world.guards) {
    if (shadow && Math.hypot(x - guard.x, y - guard.y) > GUARD.shadowReveal) continue;
    // A guard standing at the end of its round, or off it, is about to turn: any way it could
    // face counts as watched until it walks on.
    const turning = guard.pause > 0 || guard.state !== 'patrol';
    const halfAngle = turning ? Math.PI : GUARD.coneHalfAngle + 0.12;
    if (inSight(guard.x, guard.y, guard.facing, halfAngle, GUARD.coneRange + 16, x, y, room.cover)) return true;
  }
  if (shadow) return false;
  for (const camera of world.cameras) {
    if (camera.off) continue;
    if (inSight(camera.x, camera.y, camera.facing, CAMERA.coneHalfAngle + 0.1, CAMERA.coneRange + 16, x, y, room.cover)) return true;
  }
  return false;
}

/**
 * A pilot for one run of a room: in along `route`, pick the lock, back out the same way.
 * `careful` false makes it a hurried thief that never waits (the kind that gets spotted).
 */
export function createPilot(world, route, { careful = true } = {}) {
  const way = route.points.map(([x, y]) => [x, y]);
  const exit = world.room.exit;
  const back = way.slice(0, -1).reverse();
  back.push([exit.x + exit.w / 2 - 6, exit.y + exit.h / 2]);
  let path = way;
  let index = 1;
  let waited = 0;
  let leaving = false;

  return {
    /** The input for the next step of the world. */
    next(dt) {
      const thief = world.thief;
      const input = { moveX: 0, moveY: 0, sneak: false, act: false, smoke: false, coin: null };
      if (world.loot.taken && !leaving) {
        leaving = true;
        path = back;
        index = 0;
      }
      if (index >= path.length) {
        // At the end of the way in: work the lock.
        input.act = jobInReach(world) !== null;
        return input;
      }
      const [tx, ty] = path[index];
      const dx = tx - thief.x;
      const dy = ty - thief.y;
      const distance = Math.hypot(dx, dy);
      if (distance < ARRIVE) {
        index += 1;
        return this.next(dt);
      }
      const ahead = Math.min(distance, LOOK_AHEAD);
      const stepX = thief.x + (dx / distance) * ahead;
      const stepY = thief.y + (dy / distance) * ahead;
      const seenNow = world.alarm.seen;
      if (careful && !seenNow && waited < PATIENCE_SECONDS && exposedAt(world, stepX, stepY) && !exposedAt(world, thief.x, thief.y)) {
        waited += dt;
        return input;
      }
      waited = Math.max(0, waited - dt * 2);
      input.moveX = dx / distance;
      input.moveY = dy / distance;
      if (careful && !seenNow) {
        for (const guard of world.guards) {
          if (Math.hypot(guard.x - thief.x, guard.y - thief.y) < THIEF.noiseRadius + 24) input.sneak = true;
        }
      }
      return input;
    },
  };
}
