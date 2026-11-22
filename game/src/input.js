// The Velvet Vault — input: keyboard and mouse.
//
// One file, one job: turn key and mouse events into what the rules step with. Held keys become
// the stick (WASD or arrows), the creep (Shift) and the job at hand (E); presses become one-shot
// actions (Q smoke, click coin, Space/Enter confirm, R retry, P pause, M mute, 1-3 pick a room)
// that are handed out once and then cleared. The mouse is mapped into canvas pixels, so a coin
// lands where the pointer is whatever size the window is.

import { CANVAS } from './config.js';

const MOVE_KEYS = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

/** Listen on the window and the canvas; returns the reader the main loop polls. */
export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const mouse = { x: CANVAS.width / 2, y: CANVAS.height / 2, clicked: false };

  function toCanvas(event) {
    const box = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - box.left) / box.width) * CANVAS.width;
    mouse.y = ((event.clientY - box.top) / box.height) * CANVAS.height;
  }

  window.addEventListener('keydown', (event) => {
    if (event.code in MOVE_KEYS || event.code === 'Space') event.preventDefault();
    if (!event.repeat) pressed.add(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('mousemove', toCanvas);
  canvas.addEventListener('mousedown', (event) => {
    toCanvas(event);
    if (event.button === 0) mouse.clicked = true;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    mouse,
    /** Was this key pressed since the last call? Consumed by asking. */
    took(code) {
      return pressed.delete(code);
    },
    /** Was the mouse clicked since the last call? Consumed by asking. */
    tookClick() {
      const clicked = mouse.clicked;
      mouse.clicked = false;
      return clicked;
    },
    /** Forget every pending press (on a screen change, so one press never counts twice). */
    flush() {
      pressed.clear();
      mouse.clicked = false;
    },
    /** The stick, creep and job keys as the rules read them, plus this frame's throws. */
    read() {
      let moveX = 0;
      let moveY = 0;
      for (const code of held) {
        const move = MOVE_KEYS[code];
        if (move) {
          moveX += move[0];
          moveY += move[1];
        }
      }
      return {
        moveX: Math.sign(moveX),
        moveY: Math.sign(moveY),
        sneak: held.has('ShiftLeft') || held.has('ShiftRight'),
        act: held.has('KeyE'),
        smoke: pressed.delete('KeyQ'),
        coin: this.tookClick() ? { x: mouse.x, y: mouse.y } : null,
      };
    },
  };
}
