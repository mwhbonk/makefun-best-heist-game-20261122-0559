// The Velvet Vault — boot and the one loop.
//
// One file, one job: read the input every frame, advance the world in fixed 1/60 s steps, move
// between the screens (title, briefing, play, paused, caught, escaped, finale), play the cue for
// each event, and hand the renderer what to paint. The rules live in world.js; nothing here
// decides who sees whom.
//
// ?shot=cover|plan|lift|getaway stages that scene instead of running the loop (shots.js),
// paints it twice and sets window.__shotReady for a screenshot. ?room=1..3 starts at a room.

import { STEP } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { tallyPayout } from './payout.js';
import { createRenderer, SCREEN_BRIEFING, SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_FINALE, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './renderer.js';
import { ROOMS } from './rooms.js';
import { stageShot } from './shots.js';
import {
  createWorld,
  EVENT_CAUGHT,
  EVENT_COIN,
  EVENT_ESCAPED,
  EVENT_FUSE,
  EVENT_GRABBED,
  EVENT_HEARD,
  EVENT_LIFTED,
  EVENT_SMOKE,
  EVENT_SPOTTED,
  stepWorld,
  watchWorld,
} from './world.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

/** Paint one staged scene, twice, then tell the screenshot tool the frame is ready. */
function runShot(name) {
  const overrides = {};
  for (const key of ['seconds', 'route', 'room']) {
    if (params.has(key)) overrides[key] = Number(params.get(key));
  }
  const view = stageShot(name, overrides);
  let painted = 0;
  function paint() {
    renderer.draw(view);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

/** The game itself. */
function runGame() {
  const input = createInput(canvas);
  const audio = createAudio();
  const firstRoom = Math.max(0, Math.min(ROOMS.length - 1, (Number(params.get('room')) || 1) - 1));

  let screen = SCREEN_TITLE;
  let roomIndex = firstRoom;
  let world = createWorld(roomIndex);
  let payouts = [];
  let payout = null;
  let clockTime = 0;
  let accumulator = 0;
  let last = performance.now();
  let stride = 0;

  /** Screen readers hear each change of screen. */
  function announce(message) {
    status.textContent = message;
  }

  function show(next, message) {
    screen = next;
    input.flush();
    announce(message);
  }

  /** Stand outside a room, watching its guards walk, until the player goes in. */
  function caseRoom(index) {
    roomIndex = index;
    world = createWorld(index);
    show(SCREEN_BRIEFING, `Casing room ${index + 1}, ${world.room.name}. Press Space to go in.`);
  }

  /** Play the cue for everything that happened in one step. */
  function playEvents(events) {
    if (events & EVENT_SPOTTED) audio.spotted();
    if (events & EVENT_HEARD) audio.heard();
    if (events & EVENT_LIFTED) audio.lifted();
    if (events & EVENT_GRABBED) audio.grabbed();
    if (events & EVENT_FUSE) audio.fuse();
    if (events & EVENT_SMOKE) audio.smoke();
    if (events & EVENT_COIN) audio.coin();
    if (world.work && world.work.progress > 0 && Math.floor(world.workSeconds * 14) !== Math.floor((world.workSeconds - STEP) * 14)) audio.pickTick();
    if (world.thief.noisy && Math.floor(world.thief.stride) !== stride) {
      stride = Math.floor(world.thief.stride);
      audio.footstep();
    }
  }

  /** One fixed step of whatever screen is up. */
  function step() {
    if (screen === SCREEN_TITLE || screen === SCREEN_BRIEFING) {
      watchWorld(world, STEP);
      return;
    }
    const events = stepWorld(world, STEP, input.read());
    playEvents(events);
    if (events & EVENT_CAUGHT) {
      audio.caught();
      show(SCREEN_CAUGHT, 'Caught. Press R to try the room again.');
    } else if (events & EVENT_ESCAPED) {
      audio.escaped();
      payout = tallyPayout(world);
      show(SCREEN_ESCAPED, `Clean getaway. Payout ${payout.total} dollars. Press Space.`);
    }
  }

  /** Confirm, retry, pause and mute: the presses that move between screens. */
  function handleScreenKeys() {
    const confirm = input.took('Space') || input.took('Enter');
    const retry = input.took('KeyR');
    const pause = input.took('KeyP') || input.took('Escape');
    if (input.took('KeyM')) announce(audio.toggleMute() ? 'Sound off.' : 'Sound on.');

    if (screen === SCREEN_TITLE) {
      if (confirm || input.tookClick()) {
        audio.wake();
        payouts = [];
        caseRoom(firstRoom);
      }
    } else if (screen === SCREEN_BRIEFING) {
      if (confirm || input.tookClick()) {
        audio.wake();
        show(SCREEN_PLAY, 'You are in. The alarm is silent.');
      }
    } else if (screen === SCREEN_PLAY) {
      if (pause) show(SCREEN_PAUSED, 'Paused.');
      else if (retry) caseRoom(roomIndex);
    } else if (screen === SCREEN_PAUSED) {
      if (pause || confirm) show(SCREEN_PLAY, 'Back to the job.');
    } else if (screen === SCREEN_CAUGHT) {
      if (confirm || retry || input.tookClick()) caseRoom(roomIndex);
    } else if (screen === SCREEN_ESCAPED) {
      if (retry) caseRoom(roomIndex);
      else if (confirm || input.tookClick()) {
        payouts[roomIndex] = payout;
        if (roomIndex === ROOMS.length - 1) show(SCREEN_FINALE, 'The Maison Verre is empty.');
        else caseRoom(roomIndex + 1);
      }
    } else if (screen === SCREEN_FINALE) {
      if (confirm || input.tookClick()) {
        payouts = [];
        world = createWorld(firstRoom);
        show(SCREEN_TITLE, 'The Velvet Vault. Press Space to start.');
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    clockTime += elapsed;
    handleScreenKeys();
    if (screen === SCREEN_TITLE || screen === SCREEN_BRIEFING || screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        if (screen === SCREEN_TITLE || screen === SCREEN_BRIEFING || screen === SCREEN_PLAY) step();
      }
      if (screen === SCREEN_PLAY) audio.pulse(clockTime, world.alarm.level);
    } else {
      accumulator = 0;
    }
    renderer.draw({ world, screen, time: clockTime, payout, payouts: payouts.filter(Boolean), last: roomIndex === ROOMS.length - 1 });
  }

  // Leaving the tab pauses a running heist rather than letting the guards find you unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) show(SCREEN_PAUSED, 'Paused.');
  });

  announce('The Velvet Vault. Press Space to start.');
  requestAnimationFrame(frame);
}

if (params.has('shot')) runShot(params.get('shot'));
else runGame();
