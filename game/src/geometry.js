// The Velvet Vault — geometry.
//
// One file, one job: the few questions the rest of the game asks about shapes. Is this point in
// that rectangle? How far does a ray travel before cover or a wall stops it? Where does a circle
// end up when it walks into something solid? No game state lives here.

import { ROOM } from './config.js';

/** Is a point inside a rectangle { x, y, w, h } (edges count)? */
export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** The first rectangle of a list that holds the point, or null. */
export function rectAt(x, y, rects) {
  for (const rect of rects) if (pointInRect(x, y, rect)) return rect;
  return null;
}

/** Does a circle overlap a rectangle? */
export function circleHitsRect(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

/** Wrap an angle into -PI..PI. */
export function wrapAngle(angle) {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * How far along the ray (ox, oy) + t * (dx, dy) the rectangle is entered; Infinity when the ray
 * misses it. The slab method: clip the ray against the x slab, then the y slab.
 */
export function rayRectDistance(ox, oy, dx, dy, rect) {
  let near = 0;
  let far = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < rect.x || ox > rect.x + rect.w) return Infinity;
  } else {
    let a = (rect.x - ox) / dx;
    let b = (rect.x + rect.w - ox) / dx;
    if (a > b) [a, b] = [b, a];
    near = Math.max(near, a);
    far = Math.min(far, b);
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < rect.y || oy > rect.y + rect.h) return Infinity;
  } else {
    let a = (rect.y - oy) / dy;
    let b = (rect.y + rect.h - oy) / dy;
    if (a > b) [a, b] = [b, a];
    near = Math.max(near, a);
    far = Math.min(far, b);
  }
  return near <= far ? near : Infinity;
}

/** How far a ray cast inside the room travels before the room's wall stops it. */
function rayRoomDistance(ox, oy, dx, dy) {
  let far = Infinity;
  if (dx > 1e-9) far = Math.min(far, (ROOM.x + ROOM.w - ox) / dx);
  else if (dx < -1e-9) far = Math.min(far, (ROOM.x - ox) / dx);
  if (dy > 1e-9) far = Math.min(far, (ROOM.y + ROOM.h - oy) / dy);
  else if (dy < -1e-9) far = Math.min(far, (ROOM.y - oy) / dy);
  return Math.max(0, far);
}

/** Cast a ray at `angle` for at most `range`: the distance to the first blocker or wall. */
export function castRay(ox, oy, angle, range, blockers) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let distance = Math.min(range, rayRoomDistance(ox, oy, dx, dy));
  for (const rect of blockers) {
    const hit = rayRectDistance(ox, oy, dx, dy, rect);
    if (hit < distance) distance = hit;
  }
  return distance;
}

/** Is the straight line between two points clear of every blocker? */
export function clearLine(x1, y1, x2, y2, blockers) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (length < 0.001) return true;
  return castRay(x1, y1, Math.atan2(y2 - y1, x2 - x1), length, blockers) >= length - 0.5;
}

/**
 * Move a circle by (dx, dy) without entering a wall or a blocker: try each axis in turn, so it
 * slides along what it hits instead of sticking to it.
 */
export function moveCircle(x, y, radius, dx, dy, blockers) {
  const blocked = (cx, cy) => {
    if (cx - radius < ROOM.x || cx + radius > ROOM.x + ROOM.w) return true;
    if (cy - radius < ROOM.y || cy + radius > ROOM.y + ROOM.h) return true;
    for (const rect of blockers) if (circleHitsRect(cx, cy, radius, rect)) return true;
    return false;
  };
  if (!blocked(x + dx, y)) x += dx;
  if (!blocked(x, y + dy)) y += dy;
  return { x, y };
}
