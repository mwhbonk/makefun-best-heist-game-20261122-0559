// The Velvet Vault — tuning.
//
// One file, one job: every number the game balances on lives here, so a balance change is one
// edit, never a hunt through the logic. Nothing in this file touches the screen or the clock.
// Room layouts (cover, patrols, cameras, routes) are data of their own, in rooms.js.

export const CANVAS = { width: 1280, height: 800 };
export const STEP = 1 / 60;

// The playfield every room shares: a HUD strip above it, a legend strip below it.
export const ROOM = { x: 40, y: 104, w: 1200, h: 640 };
export const HUD_HEIGHT = 92;

// The thief. Running is fast and loud; creeping (Shift) is slow and silent; a vent is slower still.
export const THIEF = {
  radius: 13,
  runSpeed: 215,
  sneakSpeed: 108,
  ventSpeed: 96,
  carryFactor: 0.93,
  noiseRadius: 150,
  reach: 46,
};

// Guards watch a wedge of floor in front of them; cover cuts the wedge short.
export const GUARD = {
  radius: 15,
  speed: 78,
  alertSpeed: 108,
  investigateSpeed: 128,
  coneRange: 250,
  coneHalfAngle: 0.6,
  turnRate: 5.5,
  listenSeconds: 1.3,
  searchSeconds: 2.6,
  shadowReveal: 82,
};

// Wall cameras see further than a guard but in a narrower beam, and never into a shadow.
export const CAMERA = { coneRange: 340, coneHalfAngle: 0.34 };

// The alarm meter. Being seen is forgiven for a grace beat ("SPOTTED!"), then the meter climbs;
// out of sight it drains slowly. Full meter: caught.
export const ALARM = {
  max: 100,
  guardRise: 44,
  cameraRise: 30,
  riseCap: 62,
  fall: 4.5,
  graceSeconds: 0.8,
  graceRefillSeconds: 1.2,
};

// How long each job at hand takes while E is held and the thief stands still.
export const WORK = { lootSeconds: 2.6, extraSeconds: 0.9, fuseSeconds: 1.4 };

// Tools, each at a cost taken out of the payout.
export const TOOLS = {
  smoke: { count: 2, cost: 150, radius: 104, seconds: 5.5 },
  coin: { count: 3, cost: 60, range: 430, lureRadius: 400, lureSeconds: 4.5 },
  fuse: { cost: 250, seconds: 8, alarmJolt: 12 },
};

// The payout: the take, plus a getaway bonus that melts from the moment the case is empty,
// plus a ghost bonus for never being seen past the grace beat, less tools and alarm.
export const PAYOUT = {
  getawayBonus: 600,
  getawayMeltPerSecond: 18,
  ghostBonus: 400,
  alarmPenaltyPerPoint: 5,
};

// The palette, read at a glance: green is safe, amber is a guard's eye, red is a camera,
// gold is loot. Everything else stays in the navy of a gallery at night.
export const COLORS = {
  night: '#060a16',
  floorA: '#111c38',
  floorB: '#0d1730',
  wall: '#1c2748',
  trim: '#c9a24a',
  safe: '#4be3a0',
  safeFill: 'rgba(75, 227, 160, 0.16)',
  guard: '#ffd35a',
  guardFill: 'rgba(255, 211, 90, 0.22)',
  camera: '#ff5a5a',
  cameraFill: 'rgba(255, 90, 90, 0.2)',
  loot: '#ffd76a',
  velvet: '#8e2440',
  ink: '#eef2ff',
  dim: '#93a0c4',
  thief: '#35e0d0',
};
