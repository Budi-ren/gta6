# Sunburst City: Vice Horizon

[![make.fun competition](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![make.fun rank](https://make.fun/badge/gta6-01/Budi-ren/gta6/rank.svg)](https://make.fun/bounty/gta6-01)
[![make.fun reward](https://make.fun/badge/gta6-01/Budi-ren/gta6/reward.svg)](https://make.fun/bounty/gta6-01)

An open-world crime game in the spirit of GTA 6, built for the
[make.fun "Make GTA 6" bounty](https://make.fun/bounty/gta6-01). Everything in
it is original: our own city, names, art, and sound — nothing from Rockstar.

You play a newcomer in **Sunburst City**, a sun-soaked coastal metropolis of
neon towers, palm-lined avenues, traffic, and pedestrians. Steal a car, outrun
police roadblocks, deliver against the clock, and escape with the heat still
on your tail through six story missions — from a downtown club run and a timed
taxi fare to a bank heist, a midnight courier delivery, and a coastal-highway
escape — to become a legend of Vice Horizon.

This is a full rebuild of the entry: a new city generator with districts and
landmarks, five drivable car types, police that chase and set roadblocks, a
heat meter behind the wanted stars, sprint stamina, jumping, health regen,
near-miss cash bonuses, and a celebration burst every time a mission pays out.

## How to play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and open
http://localhost:8080). No build step, no network requests at runtime: the
game is plain static files, with three.js vendored under `game/vendor/`.

- **WASD / Arrow keys** — move on foot, drive when in a car
- **Shift** — sprint (drains stamina, which refills when you slow down)
- **Space** — jump
- **Mouse click** — shoot (raises your wanted level); **drag** — look around
- **E / F** — enter / exit the nearest car
- **P / Escape** — pause
- **M** — map

Hide from cruisers to cool down: stay out of sight for a few seconds and a
wanted star drops. Near-miss a traffic car at speed while driving: +$25.
Timed missions show a countdown — run out of time and the timer resets.
Escape missions only count if the cops are actually chasing you.

## Features

- A 600×600 3D city: district-based towers (glass downtown, warm midtown,
  pastel outskirts), a road grid painted onto a single canvas texture, palm
  trees, street lamps, a beach, and visible landmarks at every mission target
  (the downtown club, the bank, the docks, the highway beacon).
- 5 car types with different speed, acceleration, and grip: Sedan, Taxi,
  Sport, Truck, Van. 14 traffic cars drive the road lanes; 5 parked cars wait
  at curbs to be stolen.
- Police AI that pursues with a limited turn rate, flashes its light bar, and
  sets roadblocks ahead of you at 3+ wanted stars. Wanted level (0–5 stars)
  is driven by a heat meter: crimes fill it, hiding drains it.
- 6 story missions in three kinds: drive-to, timed delivery, and escape.
  Cash rewards, a live HUD (money, health, stamina, wanted stars + heat bar,
  mission tracker with countdown, car plate, speedometer, minimap with roads,
  police and traffic dots), and localStorage saves so progress survives a
  reload.
- Synthesized WebAudio sound effects — gunshots, engine hum, sirens, skids,
  car doors, explosions, cash, and mission jingles — with zero audio files.
- Title, pause, wasted, and victory screens.

## Tech

- `game/src/main.js` — the loop in phases: input → walk/drive → bullets →
  AI → missions → survival meta → camera → HUD
- `game/src/city.js`, `render.js`, `vehicles.js`, `police.js` — the world
- `game/src/hud.js`, `input.js`, `audio.js`, `save.js`, `world.js`,
  `config.js`, `missions.js`, `random.js`, `shots.js` — systems
- `main.ts` — validates the entry against the scorer's caps, copies `game/` +
  `screenshots/` to `/output`, and writes `dossier.json` (Node 22, stdlib only)
- `serve.ts` — tiny static server with request logging and a `/__health` check

## Screenshots

1. `1-cover.jpg` — driving downtown, HUD + minimap + wanted level
2. `2-onfoot.jpg` — on foot among traffic and pedestrians
3. `3-chase.jpg` — police chase with roadblocks
4. `4-start.jpg` — title screen

## License

MIT — see [LICENSE](LICENSE).
