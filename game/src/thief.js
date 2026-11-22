// The Velvet Vault — the thief: movement.
//
// One file, one job: turn the player's stick into a step across the floor. Running is fast and
// loud (guards nearby hear it), creeping with Shift is slow and silent, a vent is slower still
// but out of everyone's sight, and a full loot bag weighs a little. The thief slides along cover
// and walls rather than sticking to them.

import { THIEF } from './config.js';
import { moveCircle, rectAt } from './geometry.js';

/** A thief standing at the room's way in. */
export function createThief(start) {
  return {
    x: start.x,
    y: start.y,
    facing: start.facing ?? 0,
    moving: false,
    sneaking: false,
    noisy: false,
    inVent: false,
    stride: 0,
  };
}

/** One step of movement. `input` carries moveX, moveY (each -1..1) and sneak. */
export function updateThief(world, dt, input) {
  const thief = world.thief;
  thief.inVent = rectAt(thief.x, thief.y, world.room.vents) !== null;
  thief.sneaking = Boolean(input.sneak);

  let speed = thief.inVent ? THIEF.ventSpeed : thief.sneaking ? THIEF.sneakSpeed : THIEF.runSpeed;
  if (world.loot.taken) speed *= THIEF.carryFactor;

  const length = Math.hypot(input.moveX, input.moveY);
  thief.moving = false;
  if (length > 0.01) {
    const dx = (input.moveX / length) * speed * dt;
    const dy = (input.moveY / length) * speed * dt;
    const moved = moveCircle(thief.x, thief.y, THIEF.radius, dx, dy, world.room.cover);
    const travelled = Math.hypot(moved.x - thief.x, moved.y - thief.y);
    thief.x = moved.x;
    thief.y = moved.y;
    thief.facing = Math.atan2(input.moveY, input.moveX);
    thief.moving = travelled > 0.01;
    thief.stride += travelled / 14;
  }
  thief.noisy = thief.moving && !thief.sneaking && !thief.inVent;
}
