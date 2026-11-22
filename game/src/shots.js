// The Velvet Vault — the screenshot scenes behind ?shot=cover|plan|lift|getaway.
//
// One file, one job: stage a real moment of the game for a screenshot. Each scene builds a
// fresh world and plays it forward through the real step function with the pilot at the
// controls, so the frame is what a run of the game really looks like, and the same scene always
// gives the same frame (the rules use no randomness). Nothing here draws: it returns the view
// the renderer paints.

import { STEP } from './config.js';
import { ROOMS } from './rooms.js';
import { tallyPayout } from './payout.js';
import { createPilot } from './pilot.js';
import { SCREEN_BRIEFING, SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY } from './renderer.js';
import { createWorld, EVENT_CAUGHT, EVENT_ESCAPED, stepWorld, watchWorld } from './world.js';

/**
 * The scenes. `room` and `route` pick the run; the run stops at `seconds`, or earlier when
 * `until` says so; `script` is the tools the thief throws on the way, each at its second.
 */
const SCENES = {
  // The cover: a hurried run down the Long Gallery's carpet, caught by a camera's beam with
  // the alarm a third full: thief, guards, cones, cameras, the opal and the meter in one frame.
  cover: { room: 1, route: 0, careful: false, seconds: 14, until: (world) => world.alarm.level >= 34 },
  // The briefing: the Vault with its three routes drawn.
  plan: { room: 2, briefing: true, seconds: 6 },
  // The lock: picking the pedestal in the Vault with a guard coming round.
  lift: { room: 2, route: 0, careful: true, seconds: 80, until: (world) => world.work !== null && world.work.progress > 0.55 },
  // The getaway: out of the Foyer with the crown by the shadowed wall, and what it paid.
  getaway: { room: 0, route: 1, careful: true, seconds: 240 },
};

/** Play a scene's run; returns the world as the last step left it and the events it ended on. */
function playScene(scene) {
  const world = createWorld(scene.room);
  const pilot = createPilot(world, ROOMS[scene.room].routes[scene.route], { careful: scene.careful });
  const script = (scene.script ?? []).map((cue) => ({ ...cue, done: false }));
  let ended = 0;
  for (let step = 0; step < scene.seconds / STEP; step += 1) {
    const input = pilot.next(STEP);
    for (const cue of script) {
      if (cue.done || world.time < cue.at) continue;
      cue.done = true;
      if (cue.tool === 'smoke') input.smoke = true;
      else input.coin = { x: cue.x, y: cue.y };
    }
    const events = stepWorld(world, STEP, input);
    if (events & (EVENT_CAUGHT | EVENT_ESCAPED)) {
      ended = events;
      break;
    }
    if (scene.until && scene.until(world)) break;
  }
  return { world, ended };
}

/**
 * Stage the named scene (any other name is the cover) and return the renderer's view of it.
 * `overrides` lets a scene be tuned from the address bar: seconds, route, room.
 */
export function stageShot(name, overrides = {}) {
  const scene = { ...(SCENES[name] ?? SCENES.cover), ...overrides };
  if (scene.briefing) {
    const world = createWorld(scene.room);
    for (let step = 0; step < scene.seconds / STEP; step += 1) watchWorld(world, STEP);
    return { world, screen: SCREEN_BRIEFING, time: scene.seconds, payout: null, payouts: [], last: false };
  }
  const { world, ended } = playScene(scene);
  const view = { world, screen: SCREEN_PLAY, time: world.time, payout: null, payouts: [], last: false };
  if (ended & EVENT_ESCAPED) {
    view.screen = SCREEN_ESCAPED;
    view.payout = tallyPayout(world);
    view.last = scene.room === ROOMS.length - 1;
  } else if (ended & EVENT_CAUGHT) {
    view.screen = SCREEN_CAUGHT;
  }
  return view;
}
