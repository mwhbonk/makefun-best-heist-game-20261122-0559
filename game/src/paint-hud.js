// The Velvet Vault — painting the HUD: the alarm meter, the loot, the tools and the colour key.
//
// One file, one job: the strip above the room and the legend below it. The alarm meter sits
// dead centre because it is the one number the whole heist turns on; beside it the HUD says in
// words who has eyes on the thief, or what is hiding them.

import { ALARM, CANVAS, COLORS, HUD_HEIGHT, ROOM, TOOLS } from './config.js';
import { ROOMS } from './rooms.js';
import { clock, label, money, roundedRect, SERIF } from './brush.js';

const METER = { x: 452, y: 22, w: 392, h: 30, cells: 20 };

/** The alarm meter: twenty cells, green then amber then red, with the caught line at the end. */
function paintAlarmMeter(ctx, alarm, time) {
  const level = alarm.level / ALARM.max;
  label(ctx, 'ALARM', METER.x - 14, METER.y + METER.h / 2, { size: 19, color: level > 0.66 ? COLORS.camera : COLORS.ink, align: 'right', weight: '800' });
  ctx.save();
  roundedRect(ctx, METER.x - 4, METER.y - 4, METER.w + 8, METER.h + 8, 8);
  ctx.fillStyle = '#04070f';
  ctx.fill();
  ctx.strokeStyle = level > 0.66 && Math.sin(time * 12) > 0 ? COLORS.camera : '#3b4670';
  ctx.lineWidth = 2;
  ctx.stroke();
  const cell = METER.w / METER.cells;
  for (let index = 0; index < METER.cells; index += 1) {
    const from = index / METER.cells;
    const lit = Math.max(0, Math.min(1, (level - from) * METER.cells));
    const color = from < 0.4 ? COLORS.safe : from < 0.7 ? COLORS.guard : COLORS.camera;
    ctx.fillStyle = '#131b33';
    ctx.fillRect(METER.x + index * cell + 1.5, METER.y, cell - 3, METER.h);
    if (lit > 0) {
      ctx.fillStyle = color;
      ctx.fillRect(METER.x + index * cell + 1.5, METER.y, (cell - 3) * lit, METER.h);
    }
  }
  ctx.restore();
  label(ctx, `${Math.round(alarm.level)}%`, METER.x + METER.w + 14, METER.y + METER.h / 2, { size: 17, color: COLORS.ink, weight: '800' });
}

/** The line under the meter: who sees the thief, or what hides them. */
function paintStatus(ctx, world) {
  const alarm = world.alarm;
  const x = METER.x + METER.w / 2;
  const y = 72;
  if (alarm.seen) {
    const text = alarm.grace > 0 ? `SPOTTED by ${alarm.seenBy} — break the line of sight!` : `${alarm.seenBy.toUpperCase()} HAS EYES ON YOU`;
    label(ctx, text, x, y, { size: 14, color: COLORS.camera, align: 'center', weight: '800' });
  } else if (world.hidden) {
    const where = { vent: 'IN THE VENT — nobody sees in here', smoke: 'IN SMOKE — nobody sees through it', shadow: 'IN SHADOW — cameras are blind here', outside: 'AT THE DOOR — the room has not seen you yet' }[world.hidden];
    label(ctx, where, x, y, { size: 14, color: COLORS.safe, align: 'center', weight: '700' });
  } else if (world.fuse.offLeft > 0) {
    label(ctx, `CAMERAS DARK for ${world.fuse.offLeft.toFixed(1)}s`, x, y, { size: 14, color: '#e8c23a', align: 'center', weight: '700' });
  } else if (world.loot.taken) {
    label(ctx, 'THE CASE IS EMPTY — guards are quicker now. Get to the door.', x, y, { size: 14, color: COLORS.loot, align: 'center', weight: '700' });
  } else {
    label(ctx, 'UNSEEN — read the cones, then move', x, y, { size: 14, color: COLORS.dim, align: 'center', weight: '600' });
  }
}

/** One tool chip: name, how many are left, the key, and what using it costs. */
function paintTool(ctx, x, name, left, key, cost) {
  const spent = left === 0;
  ctx.save();
  roundedRect(ctx, x, 14, 104, 66, 8);
  ctx.fillStyle = spent ? '#0c1224' : '#141d3a';
  ctx.fill();
  ctx.strokeStyle = spent ? '#27304f' : '#4a5a92';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  const color = spent ? '#56618a' : COLORS.ink;
  label(ctx, name, x + 10, 30, { size: 13, color, weight: '800' });
  label(ctx, left === null ? '' : `×${left}`, x + 94, 30, { size: 15, color: spent ? '#56618a' : COLORS.thief, align: 'right', weight: '800' });
  label(ctx, key, x + 10, 50, { size: 11, color: COLORS.dim });
  label(ctx, `costs ${money(cost)}`, x + 10, 66, { size: 11, color: spent ? '#56618a' : '#ff9d7a' });
}

/** The whole strip above the room. */
export function paintHud(ctx, world, time) {
  ctx.save();
  const bar = ctx.createLinearGradient(0, 0, 0, HUD_HEIGHT);
  bar.addColorStop(0, '#0d1430');
  bar.addColorStop(1, '#080d1e');
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, CANVAS.width, HUD_HEIGHT);
  ctx.fillStyle = COLORS.trim;
  ctx.fillRect(0, HUD_HEIGHT - 2, CANVAS.width, 2);
  ctx.restore();

  label(ctx, 'THE VELVET VAULT', 24, 28, { size: 22, color: COLORS.trim, font: SERIF, weight: '700' });
  label(ctx, `ROOM ${world.roomIndex + 1} OF ${ROOMS.length} · ${world.room.name.toUpperCase()}`, 24, 52, { size: 12, color: COLORS.ink, weight: '700' });
  const lootLine = world.loot.taken ? `${world.room.loot.name} — IN THE BAG` : `${world.room.loot.name} — on its pedestal`;
  label(ctx, lootLine, 24, 72, { size: 12, color: COLORS.loot, weight: '700' });
  label(ctx, `TAKE ${money(world.take)}`, 318, 28, { size: 14, color: COLORS.loot, align: 'right', weight: '800' });
  label(ctx, clock(world.time), 318, 52, { size: 14, color: COLORS.ink, align: 'right', weight: '700' });

  paintAlarmMeter(ctx, world.alarm, time);
  paintStatus(ctx, world);

  paintTool(ctx, 932, 'SMOKE', world.tools.smoke, 'Q · hides you', TOOLS.smoke.cost);
  paintTool(ctx, 1044, 'COIN', world.tools.coin, 'click · lures', TOOLS.coin.cost);
  paintTool(ctx, 1156, 'FUSE', world.fuse.used ? 0 : 1, 'E at box · cams off', TOOLS.fuse.cost);
}

/** The colour key and the controls, under the room. */
export function paintLegend(ctx) {
  const y = ROOM.y + ROOM.h + 30;
  let x = 44;
  const swatch = (color, text) => {
    ctx.save();
    roundedRect(ctx, x, y - 8, 16, 16, 4);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    label(ctx, text, x + 22, y, { size: 12, color: COLORS.ink, weight: '700' });
    ctx.save();
    ctx.font = '700 12px sans-serif';
    x += 22 + ctx.measureText(text).width + 30;
    ctx.restore();
  };
  swatch(COLORS.safe, 'SAFE: shadow · vent · cover');
  swatch(COLORS.guard, 'GUARD SIGHT');
  swatch(COLORS.camera, 'CAMERA');
  swatch(COLORS.loot, 'LOOT');
  label(ctx, 'WASD move · SHIFT creep (silent) · hold E pick/grab · Q smoke · CLICK toss coin · P pause', CANVAS.width - 44, y, {
    size: 12,
    color: COLORS.dim,
    align: 'right',
  });
}
