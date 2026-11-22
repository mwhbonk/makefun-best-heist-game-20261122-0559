// The Velvet Vault — vision: who can see the thief, and the shape of what a watcher sees.
//
// One file, one job: a guard and a camera share one rule of sight. The thief is seen only inside
// the watcher's wedge, within its range, with nothing solid in between; never inside a vent or a
// smoke cloud; and in a green shadow only by a guard who is almost on top of them. The same rays
// that decide sight also draw the cone, so what the player sees is exactly what the watcher sees.

import { GUARD } from './config.js';
import { castRay, rectAt, wrapAngle } from './geometry.js';

const CONE_RAYS = 30;

/** Where the thief is hiding right now: 'vent', 'smoke', 'shadow' or '' (in the open). */
export function concealment(world) {
  const thief = world.thief;
  if (rectAt(thief.x, thief.y, world.room.vents)) return 'vent';
  for (const cloud of world.smoke) {
    if (Math.hypot(thief.x - cloud.x, thief.y - cloud.y) < cloud.radius) return 'smoke';
  }
  if (rectAt(thief.x, thief.y, world.room.shadows)) return 'shadow';
  return '';
}

/** Is the point inside the wedge, in range, with a clear line from the watcher? */
export function inSight(wx, wy, facing, halfAngle, range, tx, ty, blockers) {
  const dx = tx - wx;
  const dy = ty - wy;
  const distance = Math.hypot(dx, dy);
  if (distance > range || distance < 1) return false;
  const angle = Math.atan2(dy, dx);
  if (Math.abs(wrapAngle(angle - facing)) > halfAngle) return false;
  return castRay(wx, wy, angle, distance, blockers) >= distance - 0.5;
}

/** Does this watcher see the thief? `kind` is 'guard' or 'camera'. */
export function watcherSees(world, watcher, halfAngle, range, kind) {
  const hidden = world.hidden;
  if (hidden === 'vent' || hidden === 'smoke' || hidden === 'outside') return false;
  const thief = world.thief;
  if (hidden === 'shadow') {
    if (kind === 'camera') return false;
    if (Math.hypot(thief.x - watcher.x, thief.y - watcher.y) > GUARD.shadowReveal) return false;
  }
  return inSight(watcher.x, watcher.y, watcher.facing, halfAngle, range, thief.x, thief.y, world.room.cover);
}

/**
 * The outline of what a watcher sees: its own position, then the end of each ray across the
 * wedge, cut short where cover or a wall stops it. Returned as a flat [x0, y0, x1, y1, ...].
 */
export function sightPolygon(watcher, halfAngle, range, blockers) {
  const points = [watcher.x, watcher.y];
  for (let index = 0; index <= CONE_RAYS; index += 1) {
    const angle = watcher.facing - halfAngle + (2 * halfAngle * index) / CONE_RAYS;
    const distance = castRay(watcher.x, watcher.y, angle, range, blockers);
    points.push(watcher.x + Math.cos(angle) * distance, watcher.y + Math.sin(angle) * distance);
  }
  return points;
}
