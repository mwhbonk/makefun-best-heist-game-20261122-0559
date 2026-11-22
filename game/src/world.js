// The Velvet Vault — the world: one room's state and the single step that runs it.
//
// One file, one job: build the state of a room from its entry in rooms.js, and advance it one
// fixed step at a time. The step only wires the subsystems together, in the order a player
// would expect: the thief moves, works and throws; the guards and cameras look; the alarm
// settles; then the way out is checked. It reports what happened as an event mask, so sound and
// screen changes live outside the rules.

import { ROOMS } from './rooms.js';
import { pointInRect } from './geometry.js';
import { createAlarm, updateAlarm } from './alarm.js';
import { createCameras, updateCameras } from './cameras.js';
import { createGuards, updateGuards } from './guards.js';
import { JOB_EXTRA, JOB_FUSE, JOB_LOOT, updateWork } from './loot.js';
import { createThief, updateThief } from './thief.js';
import { throwSmoke, tossCoin, updateTools } from './tools.js';
import { concealment } from './vision.js';
import { TOOLS } from './config.js';

export const EVENT_SPOTTED = 1;
export const EVENT_CAUGHT = 2;
export const EVENT_ESCAPED = 4;
export const EVENT_LIFTED = 8;
export const EVENT_GRABBED = 16;
export const EVENT_FUSE = 32;
export const EVENT_SMOKE = 64;
export const EVENT_COIN = 128;
export const EVENT_HEARD = 256;

/** An idle stick: what the world steps with when nobody is at the controls. */
export const NO_INPUT = { moveX: 0, moveY: 0, sneak: false, act: false, smoke: false, coin: null };

/** A fresh world for room `index`: thief at the door, loot on its pedestal, alarm silent. */
export function createWorld(index) {
  const room = ROOMS[index];
  return {
    roomIndex: index,
    room,
    time: 0,
    over: false,
    thief: createThief(room.start),
    guards: createGuards(room.guards),
    cameras: createCameras(room.cameras),
    alarm: createAlarm(),
    loot: { taken: false, takenAt: 0 },
    extras: room.extras.map((extra) => ({ ...extra, taken: false })),
    fuse: { used: false, offLeft: 0 },
    tools: { smoke: TOOLS.smoke.count, coin: TOOLS.coin.count },
    smoke: [],
    coins: [],
    work: null,
    workSeconds: 0,
    hidden: '',
    take: 0,
    spend: 0,
  };
}

/**
 * The room going about its night while the thief still stands outside the door (the title and
 * the briefing): guards walk and cameras sweep, nobody can see the thief, no clock runs. The
 * player chooses the moment to go in by watching this.
 */
export function watchWorld(world, dt) {
  world.hidden = 'outside';
  updateGuards(world, dt);
  updateCameras(world, dt);
}

/**
 * One fixed step. `input` is { moveX, moveY, sneak, act, smoke, coin } where smoke is true on
 * the step Q is pressed and coin is { x, y } on the step the mouse is clicked. Returns the
 * events of this step as a mask of the EVENT_ constants.
 */
export function stepWorld(world, dt, input) {
  if (world.over) return 0;
  let events = 0;
  world.time += dt;

  updateThief(world, dt, input);
  world.hidden = concealment(world);

  const finished = updateWork(world, dt, input);
  if (finished === JOB_LOOT) events |= EVENT_LIFTED;
  else if (finished === JOB_EXTRA) events |= EVENT_GRABBED;
  else if (finished === JOB_FUSE) events |= EVENT_FUSE;

  if (input.smoke && throwSmoke(world)) {
    events |= EVENT_SMOKE;
    world.hidden = concealment(world);
  }
  if (input.coin && tossCoin(world, input.coin.x, input.coin.y)) events |= EVENT_COIN;
  updateTools(world, dt);

  if (updateGuards(world, dt)) events |= EVENT_HEARD;
  updateCameras(world, dt);

  const alarm = updateAlarm(world, dt);
  if (alarm.spotted) events |= EVENT_SPOTTED;
  if (alarm.caught) {
    world.over = true;
    return events | EVENT_CAUGHT;
  }
  if (world.loot.taken && pointInRect(world.thief.x, world.thief.y, world.room.exit)) {
    world.over = true;
    return events | EVENT_ESCAPED;
  }
  return events;
}
