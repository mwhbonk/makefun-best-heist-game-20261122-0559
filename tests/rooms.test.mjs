// The Velvet Vault — checks that run in Node, no browser needed: `node tests/rooms.test.mjs`.
//
// It proves three things about every room in rooms.js with the real rules: the planned routes
// and the guards' rounds never walk through cover, the pilot can finish the room along at least
// one route without being caught, and a hurried thief who ignores the cones does get caught or
// pays for it in alarm — so the cones matter.

import { GUARD, STEP, THIEF } from '../game/src/config.js';
import { circleHitsRect } from '../game/src/geometry.js';
import { tallyPayout } from '../game/src/payout.js';
import { createPilot } from '../game/src/pilot.js';
import { ROOMS } from '../game/src/rooms.js';
import { createWorld, EVENT_CAUGHT, EVENT_ESCAPED, stepWorld } from '../game/src/world.js';

let failures = 0;
function check(ok, message) {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${message}`);
}

/** Does a polyline, walked by a circle of this radius, stay clear of every blocker? */
function pathIsClear(points, radius, blockers) {
  for (let index = 1; index < points.length; index += 1) {
    const [x1, y1] = points[index - 1];
    const [x2, y2] = points[index];
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3);
    for (let step = 0; step <= steps; step += 1) {
      const x = x1 + ((x2 - x1) * step) / steps;
      const y = y1 + ((y2 - y1) * step) / steps;
      for (const rect of blockers) if (circleHitsRect(x, y, radius, rect)) return `blocked at ${Math.round(x)},${Math.round(y)} by ${rect.kind}`;
    }
  }
  return '';
}

/** Run one room with the pilot; returns how it ended. */
function run(roomIndex, routeIndex, careful) {
  const world = createWorld(roomIndex);
  const pilot = createPilot(world, ROOMS[roomIndex].routes[routeIndex], { careful });
  for (let step = 0; step < 300 / STEP; step += 1) {
    const events = stepWorld(world, STEP, pilot.next(STEP));
    if (events & EVENT_CAUGHT) return { end: 'caught', world };
    if (events & EVENT_ESCAPED) return { end: 'escaped', world, payout: tallyPayout(world) };
  }
  return { end: 'timeout', world };
}

ROOMS.forEach((room, roomIndex) => {
  console.log(`\n== Room ${roomIndex + 1}: ${room.name}`);
  check(room.routes.length === 3, 'has three planned routes');
  check(room.guards.length >= 2 && room.cameras.length >= 2, 'has guards and cameras');
  room.routes.forEach((route) => {
    const blocked = pathIsClear(route.points, THIEF.radius, room.cover);
    check(blocked === '', `route ${route.key} (${route.name}) is walkable ${blocked}`);
  });
  room.guards.forEach((guard, index) => {
    const loop = guard.points.length > 2 ? [...guard.points, guard.points[0]] : guard.points;
    const blocked = pathIsClear(loop, GUARD.radius - 3, room.cover);
    check(blocked === '', `guard ${index + 1}'s round is walkable ${blocked}`);
  });

  let escapes = 0;
  room.routes.forEach((route, routeIndex) => {
    const result = run(roomIndex, routeIndex, true);
    if (result.end === 'escaped') escapes += 1;
    const detail = result.payout ? `payout ${result.payout.total}, rank ${result.payout.rank}, peak alarm ${result.payout.peak}%, ${result.payout.seconds.toFixed(1)}s` : `alarm ${Math.round(result.world.alarm.level)}%, t=${result.world.time.toFixed(1)}s, at ${Math.round(result.world.thief.x)},${Math.round(result.world.thief.y)}, loot ${result.world.loot.taken}`;
    console.log(`     careful pilot, route ${route.key}: ${result.end} (${detail})`);
  });
  check(escapes >= 1, `a careful thief can finish the room (${escapes} of 3 routes)`);

  let punished = 0;
  room.routes.forEach((route, routeIndex) => {
    const result = run(roomIndex, routeIndex, false);
    if (result.end !== 'escaped' || result.payout.peak > 0) punished += 1;
    console.log(`     hurried pilot, route ${route.key}: ${result.end} (peak alarm ${Math.round(result.world.alarm.peak)}%)`);
  });
  check(punished >= 1, `a hurried thief pays for it (${punished} of 3 routes)`);
});

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
