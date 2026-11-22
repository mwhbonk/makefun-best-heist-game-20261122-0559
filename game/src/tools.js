// The Velvet Vault — the tools: smoke pellets and tossed coins.
//
// One file, one job: the two things the thief can throw. A smoke pellet (Q) drops a cloud at the
// thief's feet that no guard or camera sees into; a coin (click) lands where the mouse points and
// its clink pulls the nearest guard off its round. Both are few, and each one used comes out of
// the payout — a clean run uses none.

import { TOOLS } from './config.js';
import { clearLine } from './geometry.js';
import { lureNearestGuard } from './guards.js';

/** Drop a smoke cloud at the thief's feet. Returns false when none are left. */
export function throwSmoke(world) {
  if (world.tools.smoke <= 0 || world.thief.inVent) return false;
  world.tools.smoke -= 1;
  world.spend += TOOLS.smoke.cost;
  world.smoke.push({ x: world.thief.x, y: world.thief.y, radius: TOOLS.smoke.radius, left: TOOLS.smoke.seconds, age: 0 });
  return true;
}

/** Toss a coin toward (x, y): it lands there, or as far as the throw reaches. */
export function tossCoin(world, x, y) {
  if (world.tools.coin <= 0 || world.thief.inVent) return false;
  const thief = world.thief;
  const dx = x - thief.x;
  const dy = y - thief.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return false;
  const reach = Math.min(distance, TOOLS.coin.range);
  let landX = thief.x + (dx / distance) * reach;
  let landY = thief.y + (dy / distance) * reach;
  // A coin thrown at cover drops in front of it.
  if (!clearLine(thief.x, thief.y, landX, landY, world.room.cover)) {
    landX = thief.x + (dx / distance) * reach * 0.6;
    landY = thief.y + (dy / distance) * reach * 0.6;
  }
  world.tools.coin -= 1;
  world.spend += TOOLS.coin.cost;
  const lured = lureNearestGuard(world, landX, landY, TOOLS.coin.lureRadius, TOOLS.coin.lureSeconds);
  world.coins.push({ x: landX, y: landY, fromX: thief.x, fromY: thief.y, age: 0, left: TOOLS.coin.lureSeconds, lured });
  return true;
}

/** Let smoke thin out, coins stop ringing and the pulled fuse reset. */
export function updateTools(world, dt) {
  for (const cloud of world.smoke) {
    cloud.left -= dt;
    cloud.age += dt;
  }
  world.smoke = world.smoke.filter((cloud) => cloud.left > 0);
  for (const coin of world.coins) {
    coin.left -= dt;
    coin.age += dt;
  }
  world.coins = world.coins.filter((coin) => coin.left > 0);
  if (world.fuse.offLeft > 0) world.fuse.offLeft = Math.max(0, world.fuse.offLeft - dt);
}
