// The Velvet Vault — the wall cameras: sweeping red cones.
//
// One file, one job: a camera sits on a wall and sweeps its beam back and forth around a base
// angle, on a sine so it lingers at the ends of its sweep — the moment to cross is when it has
// just turned away. A camera sees further than a guard but never into a shadow, a vent or smoke,
// and it goes blind while the fuse is pulled.

import { CAMERA } from './config.js';
import { watcherSees } from './vision.js';

/** Cameras from a room's mount table, each starting somewhere along its sweep. */
export function createCameras(mounts) {
  return mounts.map((mount) => ({
    x: mount.x,
    y: mount.y,
    base: mount.base,
    sweep: mount.sweep,
    speed: mount.speed,
    phase: mount.phase ?? 0,
    facing: mount.base + mount.sweep * Math.sin(mount.phase ?? 0),
    sees: false,
    off: false,
  }));
}

/** Sweep each camera's beam and check it against the thief. */
export function updateCameras(world, dt) {
  const off = world.fuse.offLeft > 0;
  for (const camera of world.cameras) {
    camera.off = off;
    if (off) {
      camera.sees = false;
      continue;
    }
    camera.phase += dt * camera.speed;
    camera.facing = camera.base + camera.sweep * Math.sin(camera.phase);
    camera.sees = watcherSees(world, camera, CAMERA.coneHalfAngle, CAMERA.coneRange, 'camera');
  }
}
