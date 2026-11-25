// Ember & Ladle — the hand-in program (Node 22, standard library only).
// The game is plain static files a desktop browser loads offline: game/
// holds index.html and its ES modules, no library and no network request.
// This program copies game/ and screenshots/ from beside this file into the
// output directory and writes dossier.json there, the summary the judge
// reads, using the vendored make.fun library. Run it twice and the two runs
// write the same bytes.
//
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { fileURLToPath as pathFromUrl } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = pathFromUrl(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = joinPath(repoRoot, 'game');
const shotsDir = joinPath(repoRoot, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(gameDir, joinPath(outputDir, 'game'), { recursive: true });

const outShots = joinPath(outputDir, 'screenshots');
mkdirSync(outShots, { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, outShots, { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the dossier's bytes;
// the rest refuse an entry the scorer would refuse (more than 4 screenshots
// or one over 256 KiB; more than 993 files in game/ or 48 MiB of game files
// in all, or a path under game/ over 1000 bytes: game/ counts beside the
// output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(joinPath(outputDir, 'dossier.json'), dossierBytes);
