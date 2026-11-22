// Sunburst City: Vice Horizon — a gta6-01 entry (Node 22, standard library only).
//
// The game is plain static files (game/index.html and its ES modules, three.js
// vendored under game/vendor/, no network requests at runtime). This program
// validates the entry against the scorer's caps, copies game/ and screenshots/
// beside this file to /output, and writes /output/dossier.json with the
// vendored make.fun library — the summary the judge reads.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse.
const CAPS = {
  textMaxBytes: 163840,
  shotsMax: 4,
  shotMaxBytes: 262144,
  gameMaxFiles: 993,
  gameMaxBytes: 50331648,
  gamePathMaxBytes: 1000,
};
const SHOT_NAMES = ['1-cover.jpg', '2-onfoot.jpg', '3-chase.jpg', '4-start.jpg'];

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

// Walk a directory tree and total its files and bytes.
function measureTree(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = measureTree(full);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}

function validateGame() {
  const gameDir = join(here, 'game');
  if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing');
  const { files, bytes } = measureTree(gameDir);
  if (files > CAPS.gameMaxFiles) fail(`game/ has ${files} files, cap is ${CAPS.gameMaxFiles}`);
  if (bytes > CAPS.gameMaxBytes) fail(`game/ is ${kib(bytes)}, cap is ${kib(CAPS.gameMaxBytes)}`);
  return { files, bytes };
}

function validateShots() {
  const shotsDir = join(here, 'screenshots');
  const found = [];
  for (const name of SHOT_NAMES) {
    const full = join(shotsDir, name);
    if (!existsSync(full)) fail(`screenshots/${name} is missing`);
    const size = statSync(full).size;
    if (size > CAPS.shotMaxBytes) fail(`screenshots/${name} is ${kib(size)}, cap is ${kib(CAPS.shotMaxBytes)}`);
    found.push({ name, size });
  }
  return found;
}

function main() {
  const game = validateGame();
  const shots = validateShots();

  mkdirSync(outDir, { recursive: true });
  cpSync(join(here, 'game'), join(outDir, 'game'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

  writeFileSync(
    join(outDir, 'dossier.json'),
    buildDossier(outDir, {
      text_max_bytes: CAPS.textMaxBytes,
      screenshots: { max: CAPS.shotsMax, max_bytes: CAPS.shotMaxBytes },
      game_max_files: CAPS.gameMaxFiles,
      game_max_bytes: CAPS.gameMaxBytes,
      game_path_max_bytes: CAPS.gamePathMaxBytes,
    }),
  );

  console.log(`Sunburst City packaged into ${outDir}`);
  console.log(`  game/: ${game.files} files, ${kib(game.bytes)} (caps: ${CAPS.gameMaxFiles} files, ${kib(CAPS.gameMaxBytes)})`);
  for (const shot of shots) console.log(`  screenshots/${shot.name}: ${kib(shot.size)}`);
  console.log(`  dossier.json written`);
}

main();
