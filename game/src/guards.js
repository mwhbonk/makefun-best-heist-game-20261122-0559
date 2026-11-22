// The Velvet Vault — the guards: patrol routes, ears, and what they do when they see something.
//
// One file, one job. A guard walks its waypoints and waits a beat at each. A running thief
// nearby makes it stop and turn to listen; a tossed coin pulls it off its route; a thief in its
// cone makes it stand and stare (the alarm climbs), and once the thief slips away it walks to
// where it last saw them and searches before going back to its round. Every state shows on the
// guard itself ('?' listening, '!' watching), so a player can read a guard before moving.

import { GUARD, THIEF } from './config.js';
import { moveCircle, wrapAngle } from './geometry.js';
import { watcherSees } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_LISTEN = 'listen';
export const GUARD_SEARCH = 'search';
export const GUARD_WATCH = 'watch';

/** Guards from a room's patrol table: each starts at its first waypoint, facing down its route. */
export function createGuards(patrols) {
  return patrols.map((patrol) => {
    const [x, y] = patrol.points[0];
    const [nextX, nextY] = patrol.points[1] ?? patrol.points[0];
    return {
      x,
      y,
      facing: Math.atan2(nextY - y, nextX - x),
      points: patrol.points,
      leg: 0,
      pause: 0,
      pauseSeconds: patrol.pause ?? 1.2,
      state: GUARD_PATROL,
      target: null,
      timer: 0,
      sees: false,
      stride: 0,
    };
  });
}

/** Turn toward an angle at the guard's turn rate, never snapping. */
function turnToward(guard, wanted, dt) {
  const turn = wrapAngle(wanted - guard.facing);
  const most = GUARD.turnRate * dt;
  guard.facing = wrapAngle(guard.facing + Math.max(-most, Math.min(most, turn)));
}

/** Walk toward a point, sliding round cover; returns the distance still to go. */
function walkToward(world, guard, x, y, speed, dt) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.01) return 0;
  const step = Math.min(distance, speed * dt);
  const moved = moveCircle(guard.x, guard.y, GUARD.radius - 3, (dx / distance) * step, (dy / distance) * step, world.room.cover);
  guard.x = moved.x;
  guard.y = moved.y;
  guard.stride += step / 16;
  turnToward(guard, Math.atan2(dy, dx), dt);
  return distance - step;
}

/** Send a guard to look at a spot for a while (a coin's clink, or where the thief was). */
export function sendToSearch(guard, x, y, seconds) {
  guard.state = GUARD_SEARCH;
  guard.target = [x, y];
  guard.timer = seconds;
}

/** One step for every guard. Returns true when some guard heard the thief this step. */
export function updateGuards(world, dt) {
  const thief = world.thief;
  let heard = false;
  for (const guard of world.guards) {
    guard.sees = watcherSees(world, guard, GUARD.coneHalfAngle, GUARD.coneRange, 'guard');

    if (guard.sees) {
      // Eyes on the thief: stand, stare, remember the spot.
      guard.state = GUARD_WATCH;
      guard.target = [thief.x, thief.y];
      turnToward(guard, Math.atan2(thief.y - guard.y, thief.x - guard.x), dt);
      continue;
    }
    if (guard.state === GUARD_WATCH) sendToSearch(guard, guard.target[0], guard.target[1], GUARD.searchSeconds);

    if (guard.state === GUARD_PATROL && thief.noisy) {
      const distance = Math.hypot(thief.x - guard.x, thief.y - guard.y);
      if (distance < THIEF.noiseRadius) {
        guard.state = GUARD_LISTEN;
        guard.target = [thief.x, thief.y];
        guard.timer = GUARD.listenSeconds;
        heard = true;
      }
    }

    if (guard.state === GUARD_LISTEN) {
      turnToward(guard, Math.atan2(guard.target[1] - guard.y, guard.target[0] - guard.x), dt);
      guard.timer -= dt;
      if (guard.timer <= 0) guard.state = GUARD_PATROL;
    } else if (guard.state === GUARD_SEARCH) {
      const left = walkToward(world, guard, guard.target[0], guard.target[1], GUARD.investigateSpeed, dt);
      guard.timer -= left < 6 ? dt : dt * 0.35;
      if (guard.timer <= 0) guard.state = GUARD_PATROL;
    } else if (guard.pause > 0) {
      guard.pause -= dt;
    } else {
      const [x, y] = guard.points[(guard.leg + 1) % guard.points.length];
      const speed = world.loot.taken ? GUARD.alertSpeed : GUARD.speed;
      if (walkToward(world, guard, x, y, speed, dt) < 2) {
        guard.leg = (guard.leg + 1) % guard.points.length;
        guard.pause = guard.pauseSeconds;
      }
    }
  }
  return heard;
}

/** A coin's clink: the nearest guard within earshot leaves its round to look. */
export function lureNearestGuard(world, x, y, radius, seconds) {
  let nearest = null;
  let nearestDistance = radius;
  for (const guard of world.guards) {
    if (guard.state === GUARD_WATCH) continue;
    const distance = Math.hypot(guard.x - x, guard.y - y);
    if (distance < nearestDistance) {
      nearest = guard;
      nearestDistance = distance;
    }
  }
  if (nearest) sendToSearch(nearest, x, y, seconds);
  return nearest !== null;
}
