// The Velvet Vault — painting the room: floor, walls, cover, shadows, vents, loot and the way out.
//
// One file, one job: everything in a room that does not move. The colour code is the game's
// language and is kept strict here: green means safe (shadows, vents, the rim of solid cover),
// gold means loot, and nothing else in the room uses either.

import { CANVAS, COLORS, ROOM } from './config.js';
import { label, money, roundedRect, tag } from './brush.js';
import { JOB_LOOT } from './loot.js';

const TILE = 40;

/** The marble floor: a soft checker of two navies, with a sheen toward the middle. */
export function paintFloor(ctx) {
  ctx.fillStyle = COLORS.night;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  for (let y = ROOM.y; y < ROOM.y + ROOM.h; y += TILE) {
    for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += TILE) {
      const even = ((x - ROOM.x) / TILE + (y - ROOM.y) / TILE) % 2 === 0;
      ctx.fillStyle = even ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
    }
  }
  const sheen = ctx.createRadialGradient(640, 424, 60, 640, 424, 720);
  sheen.addColorStop(0, 'rgba(90, 120, 200, 0.12)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = sheen;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
}

/** The gallery's outer wall: a navy band with a gold picture rail. */
export function paintWalls(ctx) {
  ctx.save();
  ctx.strokeStyle = COLORS.wall;
  ctx.lineWidth = 12;
  ctx.strokeRect(ROOM.x - 6, ROOM.y - 6, ROOM.w + 12, ROOM.h + 12);
  ctx.strokeStyle = COLORS.trim;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x - 1, ROOM.y - 1, ROOM.w + 2, ROOM.h + 2);
  ctx.restore();
}

/** Green floor a camera never sees into, hatched so it reads as "hide here". */
export function paintShadows(ctx, shadows) {
  for (const zone of shadows) {
    ctx.save();
    roundedRect(ctx, zone.x, zone.y, zone.w, zone.h, 8);
    ctx.fillStyle = COLORS.safeFill;
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = 'rgba(75, 227, 160, 0.22)';
    ctx.lineWidth = 2;
    for (let offset = -zone.h; offset < zone.w; offset += 12) {
      ctx.beginPath();
      ctx.moveTo(zone.x + offset, zone.y + zone.h);
      ctx.lineTo(zone.x + offset + zone.h, zone.y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = COLORS.safe;
    ctx.lineWidth = 1.5;
    roundedRect(ctx, zone.x, zone.y, zone.w, zone.h, 8);
    ctx.stroke();
    ctx.restore();
    label(ctx, 'SHADOW', zone.x + zone.w / 2, zone.y + zone.h - 10, { size: 10, color: COLORS.safe, align: 'center', weight: '700' });
  }
}

/** Vent crawls: dark grating with a green edge, slow but out of everyone's sight. */
export function paintVents(ctx, vents) {
  for (const vent of vents) {
    ctx.save();
    roundedRect(ctx, vent.x, vent.y, vent.w, vent.h, 6);
    ctx.fillStyle = '#050b18';
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = 'rgba(75, 227, 160, 0.28)';
    ctx.lineWidth = 2;
    const wide = vent.w >= vent.h;
    for (let offset = 6; offset < (wide ? vent.w : vent.h); offset += 10) {
      ctx.beginPath();
      if (wide) {
        ctx.moveTo(vent.x + offset, vent.y);
        ctx.lineTo(vent.x + offset, vent.y + vent.h);
      } else {
        ctx.moveTo(vent.x, vent.y + offset);
        ctx.lineTo(vent.x + vent.w, vent.y + offset);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = COLORS.safe;
    ctx.lineWidth = 2;
    roundedRect(ctx, vent.x, vent.y, vent.w, vent.h, 6);
    ctx.stroke();
    ctx.restore();
    tag(ctx, 'VENT', vent.x + vent.w / 2, vent.y + vent.h / 2, { size: 10, fill: COLORS.safe, color: '#04130c' });
  }
}

/** One piece of solid cover, dressed by its kind, with the green rim that says "safe behind this". */
function paintCoverPiece(ctx, piece, index) {
  const { x, y, w, h, kind } = piece;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  roundedRect(ctx, x + 4, y + 6, w, h, 5);
  ctx.fill();

  if (kind === 'wall') {
    ctx.fillStyle = '#26345e';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = COLORS.trim;
    if (w >= h) ctx.fillRect(x, y + h / 2 - 1, w, 2);
    else ctx.fillRect(x + w / 2 - 1, y, 2, h);
  } else if (kind === 'case') {
    roundedRect(ctx, x, y, w, h, 5);
    ctx.fillStyle = '#16243f';
    ctx.fill();
    roundedRect(ctx, x + 5, y + 5, w - 10, h - 10, 4);
    ctx.fillStyle = 'rgba(150, 205, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // The exhibit under the glass: a small vase, a different glaze in each case.
    ctx.fillStyle = ['#d86f4a', '#7a9be0', '#b783d6', '#6fc7a6'][index % 4];
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 2, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + w / 2 - 4, y + h / 2 - 15, 8, 7);
  } else if (kind === 'plinth') {
    roundedRect(ctx, x, y, w, h, 4);
    ctx.fillStyle = '#cfd3e2';
    ctx.fill();
    roundedRect(ctx, x + 7, y + 7, w - 14, h - 14, 3);
    ctx.fillStyle = '#aab0c8';
    ctx.fill();
    ctx.fillStyle = '#e9ebf4';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 4.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'bench') {
    roundedRect(ctx, x, y, w, h, 6);
    ctx.fillStyle = '#5b3a2a';
    ctx.fill();
    ctx.fillStyle = '#7a4f38';
    ctx.fillRect(x + 6, y + 5, w - 12, 4);
    ctx.fillRect(x + 6, y + h - 9, w - 12, 4);
  } else if (kind === 'column') {
    ctx.fillStyle = '#d7dae8';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9aa1bd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2 - 7, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'rope') {
    // A velvet rope between brass posts.
    ctx.strokeStyle = COLORS.velvet;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 7, y + h / 2);
    ctx.lineTo(x + w - 7, y + h / 2);
    ctx.stroke();
    ctx.fillStyle = '#e0b65a';
    const posts = Math.max(2, Math.round(Math.max(w, h) / 80) + 1);
    for (let post = 0; post < posts; post += 1) {
      const along = post / (posts - 1);
      ctx.beginPath();
      ctx.arc(x + 7 + (w - 14) * along, y + h / 2, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    roundedRect(ctx, x, y, w, h, 3);
    ctx.fillStyle = '#6a5333';
    ctx.fill();
    ctx.strokeStyle = '#8c7147';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + w - 4, y + h - 4);
    ctx.moveTo(x + w - 4, y + 4);
    ctx.lineTo(x + 4, y + h - 4);
    ctx.stroke();
  }

  // The green rim: solid cover stops a guard's eye.
  ctx.strokeStyle = 'rgba(75, 227, 160, 0.55)';
  ctx.lineWidth = 1.5;
  if (kind === 'column') {
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2 + 2, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    roundedRect(ctx, x - 2, y - 2, w + 4, h + 4, 6);
    ctx.stroke();
  }
  ctx.restore();
}

/** All the solid cover in a room. */
export function paintCover(ctx, cover) {
  cover.forEach((piece, index) => paintCoverPiece(ctx, piece, index));
}

/** The getaway door: a lit threshold in the wall, loud once the loot is in the bag. */
export function paintExit(ctx, exit, lootTaken, time) {
  const pulse = lootTaken ? 0.55 + 0.45 * Math.sin(time * 6) : 0.35;
  ctx.save();
  ctx.fillStyle = `rgba(75, 227, 160, ${0.14 + 0.2 * pulse})`;
  roundedRect(ctx, exit.x, exit.y, exit.w, exit.h, 6);
  ctx.fill();
  ctx.strokeStyle = COLORS.safe;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORS.safe;
  ctx.fillRect(exit.x - 8, exit.y, 6, exit.h);
  ctx.restore();
  tag(ctx, lootTaken ? 'GETAWAY' : 'DOOR', exit.x + exit.w / 2 + 14, exit.y - 12, { size: 11, fill: COLORS.safe, color: '#04130c' });
}

/** A cut-gem shape centred on (x, y). */
function gemPath(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.85, y - size * 0.25);
  ctx.lineTo(x + size * 0.5, y + size * 0.85);
  ctx.lineTo(x - size * 0.5, y + size * 0.85);
  ctx.lineTo(x - size * 0.85, y - size * 0.25);
  ctx.closePath();
}

/** The loot on its pedestal, glowing gold; an empty pedestal once it is lifted. */
export function paintLoot(ctx, world, time) {
  const loot = world.room.loot;
  ctx.save();
  if (!world.loot.taken) {
    const glow = ctx.createRadialGradient(loot.x, loot.y, 4, loot.x, loot.y, 78 + 8 * Math.sin(time * 3));
    glow.addColorStop(0, 'rgba(255, 215, 106, 0.6)');
    glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(loot.x - 90, loot.y - 90, 180, 180);
  }
  ctx.fillStyle = '#d7dae8';
  ctx.beginPath();
  ctx.arc(loot.x, loot.y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.trim;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (world.loot.taken) {
    ctx.fillStyle = '#5b6282';
    ctx.beginPath();
    ctx.arc(loot.x, loot.y, 9, 0, Math.PI * 2);
    ctx.fill();
  } else {
    gemPath(ctx, loot.x, loot.y, 14);
    ctx.fillStyle = COLORS.loot;
    ctx.fill();
    ctx.strokeStyle = '#fff6d0';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  if (world.loot.taken) tag(ctx, 'EMPTY', loot.x, loot.y - 36, { size: 10, fill: '#5b6282', color: '#eef2ff' });
  else tag(ctx, `LOOT · ${loot.name.toUpperCase()} ${money(loot.value)}`, loot.x, loot.y - 40, { size: 11, fill: COLORS.loot, color: '#2a1c00' });
}

/** Side pieces (small gold gems with a price) and the fuse box. */
export function paintExtras(ctx, world, time) {
  for (const extra of world.extras) {
    if (extra.taken) continue;
    ctx.save();
    const twinkle = 0.6 + 0.4 * Math.sin(time * 4 + extra.x);
    ctx.globalAlpha = twinkle;
    gemPath(ctx, extra.x, extra.y, 9);
    ctx.fillStyle = COLORS.loot;
    ctx.fill();
    ctx.restore();
    label(ctx, money(extra.value), extra.x, extra.y + 19, { size: 10, color: COLORS.loot, align: 'center', weight: '700' });
  }
  const fuse = world.room.fuse;
  if (!fuse) return;
  ctx.save();
  roundedRect(ctx, fuse.x - 15, fuse.y - 12, 30, 24, 4);
  ctx.fillStyle = world.fuse.used ? '#3a4058' : '#e8c23a';
  ctx.fill();
  ctx.strokeStyle = '#12182c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#12182c';
  ctx.beginPath();
  ctx.moveTo(fuse.x + 2, fuse.y - 9);
  ctx.lineTo(fuse.x - 6, fuse.y + 2);
  ctx.lineTo(fuse.x - 1, fuse.y + 2);
  ctx.lineTo(fuse.x - 3, fuse.y + 9);
  ctx.lineTo(fuse.x + 6, fuse.y - 2);
  ctx.lineTo(fuse.x + 1, fuse.y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  label(ctx, world.fuse.used ? 'FUSE PULLED' : 'FUSE BOX', fuse.x, fuse.y + 22, { size: 10, color: world.fuse.used ? COLORS.dim : '#e8c23a', align: 'center', weight: '700' });
}

/** The ring that fills while E is held on a job, and the prompt when a job is in reach. */
export function paintWork(ctx, world) {
  const work = world.work;
  if (!work) return;
  const radius = work.kind === JOB_LOOT ? 32 : 22;
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.arc(work.x, work.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(work.x, work.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * work.progress);
  ctx.stroke();
  ctx.restore();
  const text = work.progress > 0 ? (work.kind === JOB_LOOT ? 'PICKING THE LOCK…' : 'WORKING…') : 'HOLD E';
  tag(ctx, text, work.x, work.y + radius + 16, { size: 11, fill: '#ffffff', color: '#0a1022' });
}
