// The Velvet Vault — the rooms: three galleries of the Maison Verre, as plain data.
//
// One file, one job: where everything stands in each room. Cover (solid: it stops feet and
// eyes), shadows (green floor no camera sees into), vents (slow, hidden crawls), the guards'
// rounds, the cameras' mounts, the loot on its pedestal, the side pieces, the fuse box, and the
// three planned ways across that the briefing draws. The rules never mention a room by name:
// a new room is one more entry here.
//
// Coordinates are canvas pixels inside ROOM (x 40..1240, y 104..744). Rectangles are
// { x, y, w, h }; cover also carries a `kind` the renderer dresses it by.

const DOWN = Math.PI / 2;
const UP = -Math.PI / 2;
const LEFT = Math.PI;

export const ROOMS = [
  {
    name: 'The Foyer',
    blurb: 'Two guards, two cameras, one crown. Learn their rounds.',
    start: { x: 100, y: 660, facing: UP },
    exit: { x: 40, y: 618, w: 46, h: 86 },
    loot: { x: 1130, y: 182, name: 'Saffron Crown', value: 900 },
    extras: [
      { x: 590, y: 168, name: 'Gilt Snuffbox', value: 200 },
      { x: 1185, y: 700, name: 'Ivory Fan', value: 250 },
    ],
    fuse: { x: 180, y: 120 },
    cover: [
      { x: 300, y: 104, w: 22, h: 210, kind: 'wall' },
      { x: 300, y: 450, w: 22, h: 230, kind: 'wall' },
      { x: 450, y: 230, w: 64, h: 54, kind: 'case' },
      { x: 690, y: 230, w: 64, h: 54, kind: 'case' },
      { x: 560, y: 420, w: 64, h: 64, kind: 'plinth' },
      { x: 420, y: 560, w: 240, h: 14, kind: 'rope' },
      { x: 800, y: 600, w: 140, h: 30, kind: 'bench' },
      { x: 900, y: 300, w: 46, h: 46, kind: 'column' },
      { x: 1040, y: 440, w: 60, h: 60, kind: 'case' },
      { x: 1052, y: 104, w: 18, h: 182, kind: 'wall' },
      { x: 1070, y: 270, w: 110, h: 16, kind: 'wall' },
    ],
    shadows: [
      { x: 330, y: 110, w: 100, h: 80 },
      { x: 960, y: 652, w: 120, h: 88 },
      { x: 1150, y: 300, w: 86, h: 90 },
    ],
    vents: [{ x: 230, y: 694, w: 480, h: 46 }],
    guards: [
      { points: [[400, 370], [880, 370]], pause: 1.4 },
      { points: [[1000, 410], [1000, 640]], pause: 1.6 },
    ],
    cameras: [
      { x: 600, y: 104, base: DOWN, sweep: 0.75, speed: 0.6, phase: 0 },
      { x: 1240, y: 560, base: LEFT, sweep: 0.5, speed: 0.7, phase: 1.5 },
    ],
    routes: [
      { key: 'A', name: 'Front hall', note: 'fast, in the open', points: [[100, 660], [190, 382], [400, 330], [620, 330], [800, 345], [960, 380], [1030, 308], [1210, 306], [1210, 232], [1156, 204]] },
      { key: 'B', name: 'Under the frames', note: 'shadow to shadow, past a camera', points: [[100, 660], [190, 382], [336, 382], [392, 300], [400, 160], [880, 160], [1022, 190], [1028, 306], [1210, 306], [1210, 232], [1156, 204]] },
      { key: 'C', name: 'Vent crawl', note: 'slow, unseen, long way round', points: [[100, 660], [250, 716], [690, 716], [760, 652], [1000, 692], [1190, 560], [1190, 340], [1210, 300], [1210, 232], [1156, 204]] },
    ],
  },
  {
    name: 'The Long Gallery',
    blurb: 'Three guards walk three lanes. The opal sits at the far end.',
    start: { x: 96, y: 424, facing: 0 },
    exit: { x: 40, y: 380, w: 46, h: 88 },
    loot: { x: 1150, y: 424, name: 'Moon Opal', value: 1500 },
    extras: [
      { x: 655, y: 150, name: 'Jade Finch', value: 250 },
      { x: 650, y: 566, name: 'Pearl Dagger', value: 300 },
    ],
    fuse: { x: 130, y: 120 },
    cover: [
      { x: 300, y: 330, w: 300, h: 14, kind: 'rope' },
      { x: 300, y: 510, w: 300, h: 14, kind: 'rope' },
      { x: 700, y: 330, w: 240, h: 14, kind: 'rope' },
      { x: 700, y: 510, w: 240, h: 14, kind: 'rope' },
      { x: 440, y: 350, w: 52, h: 52, kind: 'plinth' },
      { x: 800, y: 350, w: 52, h: 52, kind: 'plinth' },
      { x: 380, y: 190, w: 70, h: 50, kind: 'case' },
      { x: 620, y: 190, w: 70, h: 50, kind: 'case' },
      { x: 860, y: 190, w: 70, h: 50, kind: 'case' },
      { x: 400, y: 600, w: 130, h: 30, kind: 'bench' },
      { x: 760, y: 600, w: 130, h: 30, kind: 'bench' },
      { x: 1010, y: 270, w: 90, h: 60, kind: 'case' },
      { x: 1010, y: 512, w: 46, h: 46, kind: 'column' },
      { x: 1082, y: 330, w: 16, h: 68, kind: 'wall' },
      { x: 1082, y: 450, w: 16, h: 68, kind: 'wall' },
    ],
    shadows: [
      { x: 480, y: 110, w: 110, h: 72 },
      { x: 740, y: 110, w: 110, h: 72 },
      { x: 1130, y: 110, w: 104, h: 90 },
      { x: 1000, y: 652, w: 110, h: 88 },
      { x: 60, y: 560, w: 100, h: 90 },
    ],
    vents: [
      { x: 240, y: 694, w: 330, h: 46 },
      { x: 800, y: 694, w: 190, h: 46 },
    ],
    guards: [
      { points: [[250, 462], [880, 462]], pause: 1.3 },
      { points: [[978, 200], [978, 640]], pause: 1.5 },
      { points: [[880, 272], [300, 272]], pause: 1.6 },
    ],
    cameras: [
      { x: 560, y: 104, base: DOWN, sweep: 0.8, speed: 0.55, phase: 0.4 },
      { x: 680, y: 744, base: UP, sweep: 0.85, speed: 0.5, phase: 2 },
      { x: 1240, y: 250, base: LEFT, sweep: 0.3, speed: 0.7, phase: 1 },
    ],
    routes: [
      { key: 'A', name: 'Velvet lane', note: 'straight down the carpet, behind the guard', points: [[96, 424], [540, 424], [650, 424], [980, 424], [1112, 424], [1128, 398]] },
      { key: 'B', name: 'Gallery wall', note: 'alcove to alcove under camera 1', points: [[96, 424], [150, 300], [280, 150], [535, 150], [795, 150], [980, 160], [1168, 172], [1164, 394]] },
      { key: 'C', name: 'Vent crawl', note: 'two vents, one open gap', points: [[96, 424], [150, 600], [270, 716], [560, 716], [700, 716], [810, 716], [980, 716], [1055, 690], [1168, 600], [1166, 458]] },
    ],
  },
  {
    name: 'The Vault',
    blurb: 'The heron is walled in. Three ways through the wall; a guard circles it.',
    start: { x: 100, y: 680, facing: UP },
    exit: { x: 40, y: 640, w: 46, h: 84 },
    loot: { x: 650, y: 430, name: 'The Glass Heron', value: 2500 },
    extras: [
      { x: 1185, y: 702, name: 'Black Pearl', value: 350 },
      { x: 330, y: 150, name: 'Sun Medal', value: 300 },
    ],
    fuse: { x: 1180, y: 120 },
    cover: [
      { x: 520, y: 320, w: 90, h: 20, kind: 'wall' },
      { x: 670, y: 320, w: 90, h: 20, kind: 'wall' },
      { x: 520, y: 508, w: 160, h: 20, kind: 'wall' },
      { x: 520, y: 340, w: 20, h: 60, kind: 'wall' },
      { x: 520, y: 460, w: 20, h: 48, kind: 'wall' },
      { x: 740, y: 320, w: 20, h: 208, kind: 'wall' },
      { x: 230, y: 240, w: 60, h: 60, kind: 'case' },
      { x: 300, y: 560, w: 60, h: 60, kind: 'case' },
      { x: 900, y: 200, w: 70, h: 50, kind: 'crate' },
      { x: 980, y: 560, w: 70, h: 50, kind: 'crate' },
      { x: 560, y: 640, w: 160, h: 28, kind: 'bench' },
      { x: 1100, y: 380, w: 46, h: 46, kind: 'column' },
    ],
    shadows: [
      { x: 392, y: 398, w: 70, h: 64 },
      { x: 780, y: 110, w: 110, h: 80 },
      { x: 900, y: 652, w: 120, h: 88 },
      { x: 60, y: 290, w: 84, h: 90 },
    ],
    vents: [
      { x: 330, y: 694, w: 560, h: 46 },
      { x: 616, y: 196, w: 48, h: 124 },
    ],
    guards: [
      { points: [[470, 280], [810, 280], [810, 570], [470, 570]], pause: 0.7 },
      { points: [[170, 150], [170, 560]], pause: 1.5 },
      { points: [[1170, 660], [1170, 180]], pause: 1.5 },
    ],
    cameras: [
      { x: 640, y: 104, base: DOWN, sweep: 0.9, speed: 0.6, phase: 0 },
      { x: 1240, y: 424, base: LEFT, sweep: 0.6, speed: 0.5, phase: 1.2 },
      { x: 300, y: 744, base: UP, sweep: 0.8, speed: 0.65, phase: 2.4 },
    ],
    routes: [
      { key: 'A', name: 'Side door', note: 'through the west gap, past the circling guard', points: [[100, 680], [200, 600], [380, 430], [478, 430], [580, 430], [628, 430]] },
      { key: 'B', name: 'Vent drop', note: 'over the top and down the shaft', points: [[100, 680], [120, 300], [200, 170], [600, 160], [640, 190], [640, 330], [646, 400]] },
      { key: 'C', name: 'Service vent', note: 'under the floor, in by the south gap', points: [[100, 680], [340, 716], [880, 716], [960, 690], [850, 600], [710, 560], [710, 480], [668, 444]] },
    ],
  },
];
