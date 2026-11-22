// The Velvet Vault — the jobs at hand: the pedestal lock, the side pieces and the fuse box.
//
// One file, one job: everything the thief does by holding E while standing still. Picking the
// pedestal's lock takes seconds in the open (that is the heist's big risk); a side piece is a
// quick grab for the greedy; pulling the fuse blinds every camera for a while but jolts the
// alarm and costs a cut of the payout. Step away and the work is lost.

import { THIEF, TOOLS, WORK } from './config.js';

export const JOB_LOOT = 'loot';
export const JOB_EXTRA = 'extra';
export const JOB_FUSE = 'fuse';

/** The job within reach of the thief, nearest first, or null. */
export function jobInReach(world) {
  const thief = world.thief;
  const room = world.room;
  let best = null;
  let bestDistance = THIEF.reach;
  const offer = (kind, x, y, seconds, ref) => {
    const distance = Math.hypot(thief.x - x, thief.y - y);
    if (distance < bestDistance) {
      best = { kind, x, y, seconds, ref };
      bestDistance = distance;
    }
  };
  if (!world.loot.taken) offer(JOB_LOOT, room.loot.x, room.loot.y, WORK.lootSeconds, null);
  world.extras.forEach((extra, index) => {
    if (!extra.taken) offer(JOB_EXTRA, extra.x, extra.y, WORK.extraSeconds, index);
  });
  if (!world.fuse.used && room.fuse) offer(JOB_FUSE, room.fuse.x, room.fuse.y, WORK.fuseSeconds, null);
  return best;
}

/**
 * One step of work. Returns the kind of job finished this step ('' when none), and leaves
 * world.work = { kind, x, y, progress 0..1 } for the HUD ring while a job is under way.
 */
export function updateWork(world, dt, input) {
  const job = jobInReach(world);
  const working = job !== null && input.act && !world.thief.moving;
  if (!working) {
    world.work = job ? { kind: job.kind, x: job.x, y: job.y, progress: 0 } : null;
    world.workSeconds = 0;
    return '';
  }
  if (!world.work || world.work.kind !== job.kind || world.work.x !== job.x) world.workSeconds = 0;
  world.workSeconds += dt;
  world.work = { kind: job.kind, x: job.x, y: job.y, progress: Math.min(1, world.workSeconds / job.seconds) };
  if (world.workSeconds < job.seconds) return '';

  world.workSeconds = 0;
  world.work = null;
  if (job.kind === JOB_LOOT) {
    world.loot.taken = true;
    world.loot.takenAt = world.time;
    world.take += world.room.loot.value;
  } else if (job.kind === JOB_EXTRA) {
    const extra = world.extras[job.ref];
    extra.taken = true;
    world.take += extra.value;
  } else {
    world.fuse.used = true;
    world.fuse.offLeft = TOOLS.fuse.seconds;
    world.spend += TOOLS.fuse.cost;
    world.alarm.level = Math.min(99, world.alarm.level + TOOLS.fuse.alarmJolt);
  }
  return job.kind;
}
