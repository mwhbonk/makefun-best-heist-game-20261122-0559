// The Velvet Vault — painting what moves: sight cones, guards, cameras, the thief, smoke, coins.
//
// One file, one job. The cones are the heart of the picture: a guard's is amber, a camera's is
// red, each drawn from the very rays that decide sight, so a cone stops at cover exactly where
// the watcher's eye does. A cone that has the thief in it burns brighter.

import { CAMERA, COLORS, GUARD, THIEF } from './config.js';
import { label, tag } from './brush.js';
import { GUARD_LISTEN, GUARD_SEARCH, GUARD_WATCH } from './guards.js';
import { sightPolygon } from './vision.js';

/** Fill and edge one sight cone from its polygon. */
function paintCone(ctx, polygon, range, rgb, hot) {
  const [x, y] = polygon;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let index = 2; index < polygon.length; index += 2) ctx.lineTo(polygon[index], polygon[index + 1]);
  ctx.closePath();
  const fill = ctx.createRadialGradient(x, y, 8, x, y, range);
  fill.addColorStop(0, `rgba(${rgb}, ${hot ? 0.62 : 0.4})`);
  fill.addColorStop(1, `rgba(${rgb}, ${hot ? 0.3 : 0.1})`);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = `rgba(${rgb}, ${hot ? 1 : 0.7})`;
  ctx.lineWidth = hot ? 3 : 1.5;
  ctx.stroke();
  ctx.restore();
}

/** Every watcher's cone, under the actors. */
export function paintCones(ctx, world) {
  for (const guard of world.guards) {
    paintCone(ctx, sightPolygon(guard, GUARD.coneHalfAngle, GUARD.coneRange, world.room.cover), GUARD.coneRange, '255, 211, 90', guard.sees);
  }
  for (const camera of world.cameras) {
    if (camera.off) continue;
    paintCone(ctx, sightPolygon(camera, CAMERA.coneHalfAngle, CAMERA.coneRange, world.room.cover), CAMERA.coneRange, '255, 80, 80', camera.sees);
  }
}

/** A guard: blue uniform, peaked cap pointing where it looks, and its mood over its head. */
function paintGuard(ctx, guard, index) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(3, 6, GUARD.radius, GUARD.radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(guard.facing);
  // Shoulders, then the cap with its peak forward.
  ctx.fillStyle = '#2f55b0';
  ctx.beginPath();
  ctx.ellipse(0, 0, GUARD.radius - 2, GUARD.radius + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.guard;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#16264f';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(4, -6, 8, 12);
  // The torch in its hand.
  ctx.fillStyle = '#fff3b8';
  ctx.beginPath();
  ctx.arc(GUARD.radius + 1, 7, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const mood = guard.state === GUARD_WATCH ? '!' : guard.state === GUARD_LISTEN || guard.state === GUARD_SEARCH ? '?' : '';
  if (mood) {
    ctx.save();
    ctx.fillStyle = mood === '!' ? COLORS.camera : COLORS.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - 30, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    label(ctx, mood, guard.x, guard.y - 29, { size: 16, color: '#1a1200', align: 'center', weight: '900' });
  } else {
    tag(ctx, `GUARD ${index + 1}`, guard.x, guard.y - 27, { size: 9, fill: COLORS.guard, color: '#2a1c00' });
  }
}

/** A wall camera: bracket on the wall, housing turned to where it looks, red light when live. */
function paintCamera(ctx, camera, index) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.fillStyle = '#39405c';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(camera.facing);
  ctx.fillStyle = camera.off ? '#565c74' : '#e9ecf7';
  ctx.fillRect(-4, -7, 24, 14);
  ctx.fillStyle = '#12182c';
  ctx.fillRect(17, -5, 6, 10);
  ctx.fillStyle = camera.off ? '#2a2f44' : COLORS.camera;
  ctx.beginPath();
  ctx.arc(2, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const inward = { x: Math.cos(camera.base) * 30, y: Math.sin(camera.base) * 30 };
  tag(ctx, camera.off ? `CAM ${index + 1} OFF` : `CAM ${index + 1}`, camera.x + inward.x * 0.2 + (inward.x === 0 ? 34 : 0), camera.y + inward.y * 0.5 + (Math.abs(inward.y) < 1 ? -18 : 0), {
    size: 9,
    fill: camera.off ? '#565c74' : COLORS.camera,
    color: '#1c0303',
  });
}

/** The thief: a dark figure ringed in teal so it never melts into the floor, bag on its back. */
function paintThief(ctx, world, time) {
  const thief = world.thief;
  ctx.save();
  if (thief.noisy) {
    // Running is loud: the ring shows how far the footsteps carry.
    const ripple = (time * 1.6) % 1;
    ctx.strokeStyle = `rgba(53, 224, 208, ${0.35 * (1 - ripple)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 20 + ripple * (THIEF.noiseRadius - 20), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.translate(thief.x, thief.y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(3, 6, THIEF.radius, THIEF.radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(thief.facing);
  if (world.loot.taken) {
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.arc(-THIEF.radius + 1, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  const sway = thief.moving ? Math.sin(thief.stride * 3) * 1.5 : 0;
  ctx.fillStyle = '#0b1324';
  ctx.beginPath();
  ctx.ellipse(0, sway, THIEF.radius - 2, THIEF.radius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = world.hidden ? COLORS.safe : COLORS.thief;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Hood and the pale strip of a face looking ahead.
  ctx.fillStyle = '#1b2a4a';
  ctx.beginPath();
  ctx.arc(1, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4d9c0';
  ctx.fillRect(4, -3.5, 4, 7);
  ctx.restore();
  tag(ctx, world.hidden ? `WREN · ${world.hidden.toUpperCase()}` : 'WREN', thief.x, thief.y - 26, { size: 9, fill: world.hidden ? COLORS.safe : COLORS.thief, color: '#02201c' });
}

/** Smoke clouds: soft grey puffs that thin as they run out. */
function paintSmoke(ctx, world) {
  for (const cloud of world.smoke) {
    const fade = Math.min(1, cloud.left / 1.2) * Math.min(1, cloud.age / 0.25);
    ctx.save();
    for (let puff = 0; puff < 9; puff += 1) {
      const angle = puff * 0.7 + cloud.age * 0.3;
      const reach = puff === 0 ? 0 : cloud.radius * 0.52;
      const px = cloud.x + Math.cos(angle) * reach;
      const py = cloud.y + Math.sin(angle) * reach;
      const puffFill = ctx.createRadialGradient(px, py, 4, px, py, cloud.radius * 0.62);
      puffFill.addColorStop(0, `rgba(205, 214, 235, ${0.42 * fade})`);
      puffFill.addColorStop(1, 'rgba(205, 214, 235, 0)');
      ctx.fillStyle = puffFill;
      ctx.beginPath();
      ctx.arc(px, py, cloud.radius * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.setLineDash([5, 6]);
    ctx.strokeStyle = `rgba(75, 227, 160, ${0.7 * fade})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    label(ctx, 'SMOKE', cloud.x, cloud.y + cloud.radius - 12, { size: 10, color: COLORS.safe, align: 'center', weight: '700', alpha: fade });
  }
}

/** Tossed coins: the arc of the throw for a moment, then the coin ringing on the marble. */
function paintCoins(ctx, world) {
  for (const coin of world.coins) {
    ctx.save();
    if (coin.age < 0.5) {
      ctx.strokeStyle = `rgba(255, 215, 106, ${0.7 * (1 - coin.age / 0.5)})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(coin.fromX, coin.fromY);
      ctx.lineTo(coin.x, coin.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const ring = (coin.age * 1.4) % 1;
    ctx.strokeStyle = `rgba(255, 215, 106, ${0.6 * (1 - ring)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 8 + ring * 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    label(ctx, 'clink', coin.x, coin.y - 16, { size: 11, color: COLORS.loot, align: 'center', font: 'Georgia, serif', weight: 'italic 600' });
  }
}

/** Everything that moves, in the order it stacks: clouds and coins, watchers, then the thief. */
export function paintActors(ctx, world, time) {
  paintCoins(ctx, world);
  world.cameras.forEach((camera, index) => paintCamera(ctx, camera, index));
  world.guards.forEach((guard, index) => paintGuard(ctx, guard, index));
  paintThief(ctx, world, time);
  paintSmoke(ctx, world);
}
