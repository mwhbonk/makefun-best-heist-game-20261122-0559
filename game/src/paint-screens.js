// The Velvet Vault — painting the screens laid over the room: title, briefing, pause, the
// caught moment, the getaway's payout and the finale.
//
// One file, one job: everything that is not the room itself. The briefing draws the three
// planned routes over the real room, so a player picks a way across before the clock starts;
// the payout screen lists every line of the score, so a getaway shows exactly what the planning
// earned.

import { CANVAS, COLORS, ROOM } from './config.js';
import { ROOMS } from './rooms.js';
import { clock, label, money, roundedRect, SERIF, tag } from './brush.js';

export const ROUTE_COLORS = { A: '#ffffff', B: '#6fd3ff', C: '#c59bff' };

const MIDDLE = CANVAS.width / 2;

/** Dim the room so a card reads over it. */
function veil(ctx, alpha, color = '4, 7, 16') {
  ctx.fillStyle = `rgba(${color}, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
}

/** A framed card centred on the screen; returns its top edge. */
function card(ctx, width, height, edge = COLORS.trim) {
  const x = MIDDLE - width / 2;
  const y = (CANVAS.height - height) / 2 + 10;
  ctx.save();
  roundedRect(ctx, x, y, width, height, 14);
  ctx.fillStyle = 'rgba(9, 14, 32, 0.95)';
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  return y;
}

/** The title card, over a room where the guards are already walking their rounds. */
export function paintTitle(ctx, time) {
  veil(ctx, 0.58);
  const top = card(ctx, 760, 430);
  label(ctx, 'THE VELVET VAULT', MIDDLE, top + 78, { size: 68, color: COLORS.trim, align: 'center', font: SERIF, weight: '700' });
  label(ctx, 'One night. Three rooms of the Maison Verre. Nobody sees you leave.', MIDDLE, top + 136, { size: 19, color: COLORS.ink, align: 'center', font: SERIF, weight: '400' });
  const lines = [
    [COLORS.guard, 'Guards watch an amber cone. Cameras sweep a red one. Cover cuts both short.'],
    [COLORS.safe, 'Green is safe: shadows hide you from cameras, vents hide you from everyone.'],
    [COLORS.loot, 'Pick the lock on the gold pedestal, then make it back to the door.'],
    [COLORS.thief, 'Every room has three routes. Smoke, coins and the fuse box help — at a price.'],
  ];
  lines.forEach(([color, text], index) => {
    const y = top + 192 + index * 34;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(MIDDLE - 330, y, 6, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, text, MIDDLE - 312, y, { size: 16, color: COLORS.ink, weight: '500' });
  });
  const blink = 0.8 + 0.2 * Math.sin(time * 4);
  label(ctx, 'SPACE or CLICK — case the first room', MIDDLE, top + 356, { size: 22, color: COLORS.safe, align: 'center', weight: '800', alpha: blink });
  label(ctx, 'WASD / arrows move · SHIFT creep · hold E to work · Q smoke · click to toss a coin · M mute', MIDDLE, top + 398, { size: 13, color: COLORS.dim, align: 'center' });
}

/** The three planned routes of a room, dashed over the floor, each with its letter. */
export function paintRoutes(ctx, room, time) {
  room.routes.forEach((route, index) => {
    const color = ROUTE_COLORS[route.key];
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.setLineDash([14, 10]);
    ctx.lineDashOffset = -time * 30;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    route.points.forEach(([x, y], point) => (point === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
    ctx.restore();
    const [bx, by] = route.points[Math.min(route.points.length - 2, 2 + (index % 2))];
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx, by, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    label(ctx, route.key, bx, by + 1, { size: 18, color: '#0a1022', align: 'center', weight: '900' });
  });
}

/** The briefing: the room as it stands, the routes over it, and the plan in words. */
export function paintBriefing(ctx, world, time) {
  const room = world.room;
  veil(ctx, 0.3);
  paintRoutes(ctx, room, time);

  // The header takes the HUD's place: this is planning, not play.
  ctx.save();
  ctx.fillStyle = '#0a1024';
  ctx.fillRect(0, 0, CANVAS.width, 90);
  ctx.fillStyle = COLORS.trim;
  ctx.fillRect(0, 90, CANVAS.width, 2);
  ctx.restore();
  label(ctx, `CASING ROOM ${world.roomIndex + 1} OF ${ROOMS.length}`, 28, 26, { size: 14, color: COLORS.dim, weight: '800' });
  label(ctx, room.name, 28, 58, { size: 34, color: COLORS.trim, font: SERIF, weight: '700' });
  label(ctx, room.blurb, 400, 30, { size: 16, color: COLORS.ink, weight: '500' });
  label(ctx, `The mark: ${room.loot.name}, ${money(room.loot.value)}. Side pieces pay extra. In by the door, out by the door.`, 400, 60, { size: 14, color: COLORS.loot, weight: '600' });

  // The plan, in the legend's place: one column a route.
  ctx.save();
  ctx.fillStyle = '#0a1024';
  ctx.fillRect(0, ROOM.y + ROOM.h + 8, CANVAS.width, 48);
  ctx.restore();
  room.routes.forEach((route, index) => {
    const x = 44 + index * 300;
    const y = ROOM.y + ROOM.h + 22;
    ctx.fillStyle = ROUTE_COLORS[route.key];
    ctx.beginPath();
    ctx.arc(x + 10, y + 9, 12, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, route.key, x + 10, y + 10, { size: 15, color: '#0a1022', align: 'center', weight: '900' });
    label(ctx, route.name.toUpperCase(), x + 30, y, { size: 13, color: ROUTE_COLORS[route.key], weight: '800' });
    label(ctx, route.note, x + 30, y + 18, { size: 12, color: COLORS.dim });
  });
  const blink = 0.8 + 0.2 * Math.sin(time * 4);
  label(ctx, 'SPACE — go in', CANVAS.width - 44, ROOM.y + ROOM.h + 32, { size: 20, color: COLORS.safe, align: 'right', weight: '800', alpha: blink });
}

/** Pause. */
export function paintPaused(ctx) {
  veil(ctx, 0.6);
  const top = card(ctx, 420, 150);
  label(ctx, 'PAUSED', MIDDLE, top + 58, { size: 40, color: COLORS.ink, align: 'center', font: SERIF, weight: '700' });
  label(ctx, 'P or SPACE — back to the job', MIDDLE, top + 108, { size: 16, color: COLORS.safe, align: 'center', weight: '700' });
}

/** In play: the red edge and the SPOTTED! call while a watcher has the thief. */
export function paintSpotted(ctx, world) {
  const alarm = world.alarm;
  if (!alarm.seen && alarm.flash <= 0) return;
  const strength = alarm.seen ? 0.35 + 0.4 * (alarm.level / 100) : alarm.flash * 0.3;
  ctx.save();
  const edge = ctx.createRadialGradient(MIDDLE, 424, 260, MIDDLE, 424, 760);
  edge.addColorStop(0, 'rgba(255, 60, 60, 0)');
  edge.addColorStop(1, `rgba(255, 60, 60, ${strength})`);
  ctx.fillStyle = edge;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  ctx.restore();
  if (alarm.seen && alarm.grace > 0) {
    tag(ctx, 'SPOTTED!  break line of sight', MIDDLE, ROOM.y + 26, { size: 20, fill: COLORS.camera, color: '#1c0303' });
  } else if (alarm.seen) {
    tag(ctx, `${alarm.seenBy.toUpperCase()} SEES YOU — ALARM RISING`, MIDDLE, ROOM.y + 26, { size: 18, fill: COLORS.camera, color: '#1c0303' });
  }
}

/** In play: the call when the pedestal is emptied. */
export function paintLiftBanner(ctx, world) {
  if (!world.loot.taken) return;
  const since = world.time - world.loot.takenAt;
  if (since > 3.2) return;
  const alpha = Math.min(1, (3.2 - since) / 0.6);
  tag(ctx, `${world.room.loot.name.toUpperCase()} IN THE BAG — now the getaway`, MIDDLE, ROOM.y + 64, { size: 20, fill: COLORS.loot, color: '#2a1c00', alpha });
}

/** The caught screen: who caught you, and that the room can be tried again at once. */
export function paintCaught(ctx, world) {
  veil(ctx, 0.62, '40, 4, 8');
  const top = card(ctx, 620, 300, COLORS.camera);
  label(ctx, 'CAUGHT', MIDDLE, top + 70, { size: 62, color: COLORS.camera, align: 'center', font: SERIF, weight: '700' });
  const who = world.alarm.seenBy || 'The alarm';
  label(ctx, `${who} held you in sight until the alarm filled.`, MIDDLE, top + 128, { size: 18, color: COLORS.ink, align: 'center' });
  label(ctx, `${clock(world.time)} inside · spotted ${world.alarm.timesSpotted} time${world.alarm.timesSpotted === 1 ? '' : 's'} · ${world.loot.taken ? 'the loot goes back on its pedestal' : 'the loot never left its pedestal'}`, MIDDLE, top + 162, {
    size: 14,
    color: COLORS.dim,
    align: 'center',
  });
  label(ctx, 'Cones stop at cover. Shadows blind cameras. Try another route.', MIDDLE, top + 204, { size: 15, color: COLORS.safe, align: 'center', weight: '600' });
  label(ctx, 'R or SPACE — case the room again', MIDDLE, top + 252, { size: 20, color: COLORS.ink, align: 'center', weight: '800' });
}

/** The payout of a getaway, line by line. */
export function paintPayout(ctx, world, payout, last) {
  veil(ctx, 0.6);
  const top = card(ctx, 640, 440, COLORS.safe);
  label(ctx, 'CLEAN GETAWAY', MIDDLE, top + 56, { size: 46, color: COLORS.safe, align: 'center', font: SERIF, weight: '700' });
  label(ctx, `${world.room.name} · out in ${clock(payout.seconds)} · rank: ${payout.rank.toUpperCase()}`, MIDDLE, top + 100, { size: 16, color: COLORS.ink, align: 'center', weight: '700' });
  const rows = [
    ['The take (loot carried out)', payout.take, COLORS.loot],
    [`Getaway bonus (door in ${payout.getawaySeconds.toFixed(1)}s after the lift)`, payout.getaway, COLORS.safe],
    [payout.ghost > 0 ? 'Ghost bonus (never held in sight)' : `Ghost bonus (lost: alarm peaked at ${payout.peak}%)`, payout.ghost, COLORS.safe],
    ['Tools used (smoke, coins, fuse)', -payout.tools, '#ff9d7a'],
    [`Alarm raised (peak ${payout.peak}%)`, -payout.alarmCost, '#ff9d7a'],
  ];
  rows.forEach(([text, amount, color], index) => {
    const y = top + 150 + index * 36;
    label(ctx, text, MIDDLE - 270, y, { size: 16, color: COLORS.ink, weight: '500' });
    label(ctx, amount === 0 ? '—' : money(amount), MIDDLE + 270, y, { size: 18, color: amount === 0 ? COLORS.dim : color, align: 'right', weight: '800' });
  });
  ctx.fillStyle = COLORS.trim;
  ctx.fillRect(MIDDLE - 270, top + 328, 540, 2);
  label(ctx, 'PAYOUT', MIDDLE - 270, top + 358, { size: 20, color: COLORS.trim, weight: '800' });
  label(ctx, money(payout.total), MIDDLE + 270, top + 358, { size: 30, color: COLORS.trim, align: 'right', font: SERIF, weight: '700' });
  label(ctx, last ? 'SPACE — count the night\'s work' : 'SPACE — on to the next room   ·   R — run it again', MIDDLE, top + 406, { size: 17, color: COLORS.ink, align: 'center', weight: '800' });
}

/** The finale: the whole night, room by room. */
export function paintFinale(ctx, payouts) {
  veil(ctx, 0.72);
  const top = card(ctx, 660, 400);
  label(ctx, 'THE MAISON VERRE IS EMPTY', MIDDLE, top + 60, { size: 40, color: COLORS.trim, align: 'center', font: SERIF, weight: '700' });
  let night = 0;
  payouts.forEach((payout, index) => {
    const y = top + 124 + index * 44;
    night += payout.total;
    label(ctx, `${ROOMS[index].name} — ${ROOMS[index].loot.name}`, MIDDLE - 280, y, { size: 17, color: COLORS.ink, weight: '600' });
    label(ctx, payout.rank, MIDDLE + 110, y, { size: 15, color: COLORS.safe, align: 'right', weight: '700' });
    label(ctx, money(payout.total), MIDDLE + 280, y, { size: 20, color: COLORS.loot, align: 'right', weight: '800' });
  });
  ctx.fillStyle = COLORS.trim;
  ctx.fillRect(MIDDLE - 280, top + 262, 560, 2);
  label(ctx, 'THE NIGHT\'S WORK', MIDDLE - 280, top + 298, { size: 20, color: COLORS.trim, weight: '800' });
  label(ctx, money(night), MIDDLE + 280, top + 298, { size: 34, color: COLORS.trim, align: 'right', font: SERIF, weight: '700' });
  label(ctx, 'SPACE — do it again, cleaner', MIDDLE, top + 356, { size: 18, color: COLORS.ink, align: 'center', weight: '800' });
}
