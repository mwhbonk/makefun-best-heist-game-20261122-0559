// The Velvet Vault — the alarm meter.
//
// One file, one job: turn "who sees the thief right now" into the meter on the HUD. Being seen
// is forgiven for a short grace beat, flagged with SPOTTED! so the player can still dive for
// cover; hold a watcher's eye past it and the meter climbs, faster for a guard than a camera.
// Out of sight it drains slowly. When it fills, the heist is over — and it was never a surprise.

import { ALARM } from './config.js';

/** A silent alarm with a full grace beat. */
export function createAlarm() {
  return {
    level: 0,
    peak: 0,
    grace: ALARM.graceSeconds,
    seen: false,
    seenBy: '',
    unseenFor: 0,
    flash: 0,
    timesSpotted: 0,
  };
}

/** Name whoever has eyes on the thief, for the HUD: 'Guard 2', 'Camera 1', 'Guard 1 + Camera 2'. */
function watcherNames(world) {
  const names = [];
  world.guards.forEach((guard, index) => {
    if (guard.sees) names.push(`Guard ${index + 1}`);
  });
  world.cameras.forEach((camera, index) => {
    if (camera.sees) names.push(`Camera ${index + 1}`);
  });
  return names;
}

/**
 * One step of the meter. Returns { spotted, caught }: spotted is true on the step a watcher
 * first catches sight of the thief, caught when the meter fills.
 */
export function updateAlarm(world, dt) {
  const alarm = world.alarm;
  const guardsWatching = world.guards.filter((guard) => guard.sees).length;
  const camerasWatching = world.cameras.filter((camera) => camera.sees).length;
  const seen = guardsWatching + camerasWatching > 0;
  const spotted = seen && !alarm.seen;

  if (seen) {
    alarm.seenBy = watcherNames(world).join(' + ');
    alarm.unseenFor = 0;
    if (spotted) {
      alarm.timesSpotted += 1;
      alarm.flash = 1;
    }
    if (alarm.grace > 0) {
      alarm.grace -= dt;
    } else {
      const rise = Math.min(ALARM.riseCap, guardsWatching * ALARM.guardRise + camerasWatching * ALARM.cameraRise);
      alarm.level = Math.min(ALARM.max, alarm.level + rise * dt);
    }
  } else {
    alarm.unseenFor += dt;
    if (alarm.unseenFor > ALARM.graceRefillSeconds) alarm.grace = ALARM.graceSeconds;
    alarm.level = Math.max(0, alarm.level - ALARM.fall * dt);
  }
  alarm.seen = seen;
  alarm.flash = Math.max(0, alarm.flash - dt * 1.6);
  if (alarm.level > alarm.peak) alarm.peak = alarm.level;
  return { spotted, caught: alarm.level >= ALARM.max };
}
