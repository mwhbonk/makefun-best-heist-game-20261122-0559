// The Velvet Vault — a heist in three rooms, handed in as a make.fun program/v1 entry.
//
// This file is the hand-in, not the game. The game is game/index.html and the ES modules under
// game/src/, static files a desktop browser plays with no network request and no build step.
// What this program does when the grader runs it:
//   1. copies game/ into the output directory, byte for byte;
//   2. copies the screenshots of the game (screenshots/, made by shots.json's scenes) beside it;
//   3. writes dossier.json with the kit's library: the summary of both that the judge reads.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To play the game locally: `node serve.ts`, then open http://localhost:8080.
// To check the rooms can be finished: `node tests/rooms.test.mjs`.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameSource = join(repoRoot, 'game');
const shotsSource = join(repoRoot, 'screenshots');
const gameOut = join(outputDir, 'game');
const shotsOut = join(outputDir, 'screenshots');

// The scorer's limits, as the competition's gate states them. The text limit decides how much
// of the source the dossier can carry; the rest are limits past which the scorer refuses an
// entry outright: over 4 screenshots or one above 256 KiB, over 993 files or 48 MiB under
// game/, or a path under game/ longer than 1000 bytes.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outputDir, { recursive: true });

// 1. The game, as it stands in this repository.
cpSync(gameSource, gameOut, { recursive: true });

// 2. Its screenshots. A repository without any still hands in: the directory is made empty.
mkdirSync(shotsOut, { recursive: true });
if (existsSync(shotsSource)) cpSync(shotsSource, shotsOut, { recursive: true });

// 3. The dossier, built by the kit's own code so the gate's rebuild of it matches exactly.
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_CAPS));
