// The live run state: one object the loop reads and every system mutates.
// New in this rebuild: stamina, a heat meter behind the wanted stars, a
// hide timer that lets the heat decay, mission countdowns, and run stats.
import { PLAYER, WANTED } from './config.js';
import { MISSIONS } from './missions.js';

export function createWorldState() {
  return {
    health: PLAYER.healthMax,
    money: 500,
    wanted: 0,
    heat: 0, // 0..1; wanted stars are derived from it
    hiddenFor: 0, // seconds spent hidden from every cruiser
    hurtAt: -999, // game time of the last damage taken
    stamina: PLAYER.staminaMax,
    isDriving: false,
    drivingCar: null,
    carName: '',
    hasGun: true,
    playerPos: { x: 32, y: 1.5, z: 32 }, // spawn at the central intersection, not inside the (0,0) tower
    playerHeading: 0, // radians, 0 faces +z
    vy: 0, // vertical velocity while jumping
    grounded: true,
    carSpeed: 0,
    missionIndex: 0,
    currentMission: MISSIONS[0],
    missionTimeLeft: 0, // seconds left on timed missions, 0 otherwise
    stats: {
      carsStolen: 0,
      shotsFired: 0,
      nearMisses: 0,
      distanceDriven: 0,
      missionsDone: 0,
      bestWanted: 0,
    },
    toast: '',
    toastUntil: 0,
    autoDrive: false, // screenshot staging: enter a car at once
    time: 0, // seconds since the run started
    pedestrians: [],
    bullets: [],
  };
}

// Add heat from a crime; wanted stars follow the heat meter upward.
export function addHeat(world, amount) {
  world.heat = Math.min(1, world.heat + amount);
  world.hiddenFor = 0;
  const stars = Math.ceil(world.heat * WANTED.max);
  if (stars > world.wanted) {
    world.wanted = stars;
    world.stats.bestWanted = Math.max(world.stats.bestWanted, stars);
  }
}

// Move the run to the next mission. Returns the new mission, or null when
// the story is finished. Timed missions get their countdown armed here.
export function advanceMission(world) {
  world.missionIndex += 1;
  world.stats.missionsDone += 1;
  if (world.missionIndex >= MISSIONS.length) {
    world.currentMission = null;
    world.missionTimeLeft = 0;
    return null;
  }
  const next = MISSIONS[world.missionIndex];
  world.currentMission = next;
  world.missionTimeLeft = next.timeLimit || 0;
  return next;
}

// Drop one wanted star and sync the heat meter to the new level.
export function coolDown(world) {
  if (world.wanted <= 0) return;
  world.wanted -= 1;
  world.heat = world.wanted / WANTED.max;
  world.hiddenFor = 0;
}
