// The Velvet Vault — the payout: what a getaway is worth.
//
// One file, one job: add up a finished room. The take is the loot carried out; the getaway bonus
// melts from the second the case is empty, so a planned way out pays; the ghost bonus is for
// never holding a watcher's eye past the grace beat; tools and alarm come off the top. The
// breakdown is returned line by line so the results screen can show exactly why.

import { PAYOUT } from './config.js';

/** The payout lines of a finished room and the rank they earn. */
export function tallyPayout(world) {
  const sinceLift = world.loot.taken ? Math.max(0, world.time - world.loot.takenAt) : 0;
  const getaway = Math.max(0, Math.round(PAYOUT.getawayBonus - PAYOUT.getawayMeltPerSecond * sinceLift));
  const ghost = world.alarm.peak < 0.5 ? PAYOUT.ghostBonus : 0;
  const alarmCost = Math.round(world.alarm.peak * PAYOUT.alarmPenaltyPerPoint);
  const total = Math.max(0, world.take + getaway + ghost - world.spend - alarmCost);
  const best = world.room.loot.value + world.room.extras.reduce((sum, extra) => sum + extra.value, 0) + PAYOUT.getawayBonus + PAYOUT.ghostBonus;
  const share = total / best;
  let rank = 'Smash and grab';
  if (share > 0.82 && ghost > 0) rank = 'Ghost';
  else if (share > 0.62) rank = 'Professional';
  else if (share > 0.4) rank = 'Journeyman';
  return {
    take: world.take,
    getaway,
    getawaySeconds: sinceLift,
    ghost,
    tools: world.spend,
    alarmCost,
    peak: Math.round(world.alarm.peak),
    seconds: world.time,
    total,
    rank,
  };
}
