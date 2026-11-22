# Sunburst City: Vice Horizon

[![make.fun competition](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![make.fun rank](https://make.fun/badge/gta6-01/Budi-ren/gta6/rank.svg)](https://make.fun/bounty/gta6-01)
[![make.fun reward](https://make.fun/badge/gta6-01/Budi-ren/gta6/reward.svg)](https://make.fun/bounty/gta6-01)

An open-world crime game in the spirit of GTA 6, built for the
[make.fun "Make GTA 6" bounty](https://make.fun/bounty/gta6-01). Everything in
it is original: our own city, names, art, and sound — nothing from Rockstar.

You play a newcomer in **Sunburst City**, a sun-soaked coastal metropolis of
neon towers, palm-lined avenues, traffic, and pedestrians. Steal a car, outrun
the police, and work your way through four story missions — from a downtown
club run to a bank heist and a coastal-highway escape — to become a legend of
Vice Horizon.

## How to play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and open
http://localhost:8080). No build step, no network requests at runtime: the
game is plain static files, with three.js vendored under `game/vendor/`.

- **WASD / Arrow keys** — move on foot, drive when in a car
- **Shift** — sprint
- **E / F** — enter / exit the nearest car
- **Mouse click** — shoot (raises your wanted level)
- **P / Escape** — pause
- **M** — map

## Features

- A 600×600 3D city: 121 procedurally built towers with neon trims, a road
  grid, palm trees, and an ocean horizon, rendered in three.js with golden-hour
  lighting and fog.
- 16 traffic cars with AI routing, plus police cars that spawn and chase you
  as your wanted level (0–5 stars) rises.
- 4 story missions with cash rewards, a live HUD (money, health, wanted
  stars, mission tracker, minimap, speedometer), and localStorage saves so
  your progress survives a reload.
- Synthesized WebAudio sound effects — gunshots, engine hum, explosions,
  cash, and mission jingles — with zero audio files.
- Title, pause, wasted, and victory screens.

## Tech

- `game/src/main.js` — core game loop: input, driving, shooting, missions
- `game/src/city.js`, `render.js`, `vehicles.js`, `police.js` — world building
- `game/src/hud.js`, `input.js`, `audio.js`, `save.js`, `world.js`,
  `config.js`, `missions.js`, `random.js`, `shots.js` — systems
- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes
  `dossier.json` (Node 22, standard library only)

## Screenshots

1. `1-cover.jpg` — driving through downtown, HUD + minimap + wanted level
2. `2-onfoot.jpg` — on foot among traffic and pedestrians
3. `3-chase.jpg` — police chase
4. `4-start.jpg` — title screen

## License

MIT — see [LICENSE](LICENSE).
