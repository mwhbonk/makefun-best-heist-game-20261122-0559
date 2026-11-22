// The Velvet Vault — the renderer: one frame, bottom layer to top.
//
// One file, one job: put the painters in order. Floor, then the green safe floor (shadows and
// vents), the door and the loot, then the sight cones, then solid cover over them, then
// everyone who moves, the HUD, and last whatever screen is laid over the room.

import { CANVAS } from './config.js';
import { paintActors, paintCones } from './paint-actors.js';
import { paintHud, paintLegend } from './paint-hud.js';
import { paintCover, paintExit, paintExtras, paintFloor, paintLoot, paintShadows, paintVents, paintWalls, paintWork } from './paint-room.js';
import { paintBriefing, paintCaught, paintFinale, paintLiftBanner, paintPaused, paintPayout, paintSpotted, paintTitle } from './paint-screens.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_BRIEFING = 'briefing';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_ESCAPED = 'escaped';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_FINALE = 'finale';

/** A renderer for the game's canvas, fixed at the game's own resolution. */
export function createRenderer(canvas) {
  canvas.width = CANVAS.width;
  canvas.height = CANVAS.height;
  const ctx = canvas.getContext('2d');

  /** Paint the room and everything in it. */
  function paintRoom(world, time) {
    paintFloor(ctx);
    paintShadows(ctx, world.room.shadows);
    paintVents(ctx, world.room.vents);
    paintExit(ctx, world.room.exit, world.loot.taken, time);
    paintExtras(ctx, world, time);
    paintLoot(ctx, world, time);
    paintCones(ctx, world);
    paintCover(ctx, world.room.cover);
    paintWalls(ctx);
    paintActors(ctx, world, time);
    paintWork(ctx, world);
  }

  return {
    /**
     * Draw one frame. `view` is { world, screen, time, payout, payouts }: payout is the room
     * just finished (escaped screen), payouts every room finished so far (finale).
     */
    draw(view) {
      const { world, screen, time } = view;
      ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
      paintRoom(world, time);
      paintHud(ctx, world, time);
      paintLegend(ctx);
      if (screen === SCREEN_PLAY) {
        paintSpotted(ctx, world);
        paintLiftBanner(ctx, world);
      } else if (screen === SCREEN_TITLE) paintTitle(ctx, time);
      else if (screen === SCREEN_BRIEFING) paintBriefing(ctx, world, time);
      else if (screen === SCREEN_PAUSED) paintPaused(ctx);
      else if (screen === SCREEN_CAUGHT) paintCaught(ctx, world);
      else if (screen === SCREEN_ESCAPED) paintPayout(ctx, world, view.payout, view.last);
      else if (screen === SCREEN_FINALE) paintFinale(ctx, view.payouts);
    },
  };
}
