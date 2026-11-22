// Sunburst City: Vice Horizon — game loop, rebuilt around clear phases.
// Each frame runs: input → on-foot or driving → bullets → AI → missions →
// survival meta (stamina, health regen, wanted decay) → camera → HUD.
// New in this rebuild: sprint stamina, jumping with gravity, a heat meter
// behind the wanted stars, near-miss cash bonuses, timed and escape
// missions, and a confetti burst every time a mission pays out.
import { SCREENS, PLAYER, WANTED, POLICE } from './config.js';
import { createWorldState, addHeat, advanceMission, coolDown } from './world.js';
import { initRenderer } from './render.js';
import { createCity } from './city.js';
import { createVehiclesManager, nearestCar } from './vehicles.js';
import { createPoliceManager } from './police.js';
import { updateHUD, flashToast } from './hud.js';
import { initInput, keys, consumeInputs } from './input.js';
import { audio } from './audio.js';
import { loadGameSave, saveGameData } from './save.js';
import { stageShot } from './shots.js';
import { MISSIONS } from './missions.js';

const THREE = window.THREE;
const canvas = document.getElementById('game');

const screenEls = {
  title: document.getElementById('screen-title'),
  paused: document.getElementById('screen-paused'),
  over: document.getElementById('screen-over'),
  victory: document.getElementById('screen-victory'),
};

let screen = SCREENS.title;
function show(name) {
  screen = name;
  for (const [key, el] of Object.entries(screenEls)) {
    if (el) el.classList.toggle('hidden', key !== name);
  }
}

// --- Systems ---------------------------------------------------------------
initInput(canvas);
const { scene, camera, renderer, playerMesh, updatePeds, smoothFollow } = initRenderer(canvas);
createCity(scene);
const vehicles = createVehiclesManager(scene);
const police = createPoliceManager(scene);
let world = createWorldState();

const saved = loadGameSave();
if (saved && saved.missionsCompleted > 0 && saved.missionsCompleted < MISSIONS.length) {
  world.money = saved.money;
  world.missionIndex = saved.missionsCompleted;
  world.currentMission = MISSIONS[saved.missionsCompleted];
  world.missionTimeLeft = world.currentMission.timeLimit || 0;
}
if (saved && saved.muted) audio.setMuted(true);

// Debug hook for playtests and screenshots (read-only from outside).
window.__sunburst = {
  get world() {
    return world;
  },
  vehicles,
  police,
  MISSIONS,
  get screen() {
    return screen;
  },
  get viewYaw() {
    return viewYaw;
  },
  set viewYaw(value) {
    viewYaw = value;
  },
};

// --- Projectiles and celebration -------------------------------------------
const bullets = [];
const sparks = [];
const bulletGeo = new THREE.SphereGeometry(0.22, 8, 6);
const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffe14d });
const sparkGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
const sparkPalette = [0xff3366, 0xffcc00, 0x33ff99, 0x3399ff, 0xff9933];

function fireBullet() {
  const dir = new THREE.Vector3(Math.sin(viewYaw), 0, Math.cos(viewYaw));
  const mesh = new THREE.Mesh(bulletGeo, bulletMat);
  mesh.position.set(world.playerPos.x, world.playerPos.y + 0.6, world.playerPos.z);
  scene.add(mesh);
  bullets.push({ mesh, dir, life: 1.2 });
  audio.playGunshot();
  addHeat(world, 0.34);
  world.stats.shotsFired += 1;
}

function burstSparks(at) {
  for (let i = 0; i < 28; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: sparkPalette[i % sparkPalette.length] });
    const mesh = new THREE.Mesh(sparkGeo, mat);
    mesh.position.set(at.x, at.y + 1, at.z);
    scene.add(mesh);
    sparks.push({
      mesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 14, Math.random() * 10 + 3, (Math.random() - 0.5) * 14),
      life: 1.1 + Math.random() * 0.5,
    });
  }
}

function stepProjectiles(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.life -= dt;
    b.mesh.position.addScaledVector(b.dir, 80 * dt);
    if (b.life <= 0) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
    }
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life -= dt;
    s.vel.y -= 7 * dt;
    s.mesh.position.addScaledVector(s.vel, dt);
    s.mesh.rotation.x += dt * 5;
    s.mesh.rotation.y += dt * 7;
    s.mesh.scale.setScalar(Math.max(0.05, s.life));
    if (s.life <= 0) {
      scene.remove(s.mesh);
      sparks.splice(i, 1);
    }
  }
}

// --- Car entry / exit --------------------------------------------------------
function enterCar(maxDist = 7) {
  const car = nearestCar(vehicles.cars, world.playerPos.x, world.playerPos.z, maxDist);
  if (!car) return false;
  world.isDriving = true;
  world.drivingCar = car;
  world.carName = car.name;
  playerMesh.visible = false;
  audio.playDoor();
  world.stats.carsStolen += 1;
  if (world.wanted === 0) addHeat(world, 0.2); // theft gets reported: one star
  flashToast(`Stole a ${car.name} — drive!`);
  return true;
}

function exitCar() {
  const car = world.drivingCar;
  if (car) {
    const side = { x: Math.cos(car.rotation), z: -Math.sin(car.rotation) };
    world.playerPos.x = car.position.x + side.x * 3;
    world.playerPos.z = car.position.z + side.z * 3;
    world.playerPos.y = 1.5;
    viewYaw = car.rotation;
  }
  world.isDriving = false;
  world.drivingCar = null;
  world.carName = '';
  world.carSpeed = 0;
  playerMesh.visible = true;
  audio.playDoor();
}

// --- Movement ----------------------------------------------------------------
let viewYaw = 0; // camera + movement basis; drag orbits it

function walkStep(dt, input) {
  const sprinting = keys.sprint && world.stamina > 1;
  const speed = sprinting ? PLAYER.sprint : PLAYER.walk;
  if (sprinting) {
    world.stamina = Math.max(0, world.stamina - PLAYER.staminaDrain * dt);
  } else {
    world.stamina = Math.min(PLAYER.staminaMax, world.stamina + PLAYER.staminaRegen * dt);
  }

  const fwd = { x: Math.sin(viewYaw), z: Math.cos(viewYaw) };
  const right = { x: -Math.cos(viewYaw), z: Math.sin(viewYaw) };
  let mx = 0;
  let mz = 0;
  if (keys.forward) {
    mx += fwd.x;
    mz += fwd.z;
  }
  if (keys.backward) {
    mx -= fwd.x;
    mz -= fwd.z;
  }
  if (keys.right) {
    mx += right.x;
    mz += right.z;
  }
  if (keys.left) {
    mx -= right.x;
    mz -= right.z;
  }
  const len = Math.hypot(mx, mz);
  if (len > 0) {
    world.playerPos.x += (mx / len) * speed * dt;
    world.playerPos.z += (mz / len) * speed * dt;
    world.playerHeading = Math.atan2(mx, mz);
  }

  if (input.jump && world.grounded) {
    world.vy = PLAYER.jumpSpeed;
    world.grounded = false;
  }
  if (!world.grounded) {
    world.vy -= PLAYER.gravity * dt;
    world.playerPos.y += world.vy * dt;
    if (world.playerPos.y <= 1.5) {
      world.playerPos.y = 1.5;
      world.vy = 0;
      world.grounded = true;
    }
  }

  playerMesh.position.set(world.playerPos.x, world.playerPos.y, world.playerPos.z);
  playerMesh.rotation.y = world.playerHeading;
  world.carSpeed = 0;
}

let skidTimer = 0;
function driveStep(dt) {
  const car = world.drivingCar;
  if (!car) return;

  if (keys.left) car.rotation += car.grip * dt;
  if (keys.right) car.rotation -= car.grip * dt;

  if (keys.forward) {
    car.speed += car.acceleration * dt;
  } else if (keys.backward) {
    car.speed -= car.acceleration * 0.6 * dt;
  } else {
    car.speed -= car.speed * 1.4 * dt;
  }
  car.speed = Math.max(-car.maxSpeed * 0.35, Math.min(car.maxSpeed, car.speed));

  skidTimer -= dt;
  if ((keys.left || keys.right) && Math.abs(car.speed) > 20 && skidTimer <= 0) {
    audio.playSkid();
    skidTimer = 0.5;
  }

  car.position.x += Math.sin(car.rotation) * car.speed * dt;
  car.position.z += Math.cos(car.rotation) * car.speed * dt;
  car.mesh.position.copy(car.position);
  car.mesh.rotation.y = car.rotation;

  world.playerPos.x = car.position.x;
  world.playerPos.y = car.position.y;
  world.playerPos.z = car.position.z;
  world.carSpeed = Math.abs(car.speed) * 1.8;
  world.stats.distanceDriven += Math.abs(car.speed) * dt;

  if (Math.abs(car.speed) > 5) audio.playEngine(90 + Math.abs(car.speed) * 2);
}

// --- Missions ------------------------------------------------------------------
let escapeToastAt = -99;
function missionStep(dt) {
  const mission = world.currentMission;
  if (!mission) return;

  if (mission.type === 'timed') {
    world.missionTimeLeft -= dt;
    if (world.missionTimeLeft <= 0) {
      world.missionTimeLeft = mission.timeLimit;
      flashToast('OUT OF TIME — the fare walked away. Timer reset!');
      return;
    }
  }

  const dist = Math.hypot(
    world.playerPos.x - mission.targetPos.x,
    world.playerPos.z - mission.targetPos.z,
  );
  if (dist >= 12) return;

  if (mission.type === 'escape' && world.wanted === 0) {
    if (world.time - escapeToastAt > 4) {
      escapeToastAt = world.time;
      flashToast('You need heat! Stir up trouble, then come back.');
    }
    return;
  }
  completeMission(mission);
}

function completeMission(mission) {
  world.money += mission.reward;
  audio.playCash();
  audio.playMissionJingle();
  burstSparks(world.playerPos);
  flashToast(`MISSION COMPLETE  +$${mission.reward}`);
  saveGameData({
    money: world.money,
    missionsCompleted: world.missionIndex + 1,
    bestWanted: world.stats.bestWanted,
    carsStolen: world.stats.carsStolen,
    nearMisses: world.stats.nearMisses,
  });
  const next = advanceMission(world);
  if (next === null) {
    show(SCREENS.victory);
  }
}

// --- Survival meta: regen, wanted decay, near misses, ramming ---------------
let sirenTimer = 0;
function metaStep(dt) {
  if (world.health < PLAYER.healthMax && world.time - world.hurtAt > PLAYER.regenDelay) {
    world.health = Math.min(PLAYER.healthMax, world.health + PLAYER.regenRate * dt);
  }

  if (world.wanted > 0) {
    let nearest = Infinity;
    for (const cruiser of police.policeCars) {
      if (cruiser.mesh.position.y < -50) continue;
      const d = Math.hypot(
        cruiser.position.x - world.playerPos.x,
        cruiser.position.z - world.playerPos.z,
      );
      if (d < nearest) nearest = d;
    }
    if (nearest > WANTED.hideRadius) {
      world.hiddenFor += dt;
      if (world.hiddenFor >= WANTED.hideSeconds) coolDown(world);
    } else {
      world.hiddenFor = 0;
    }
  }

  sirenTimer -= dt;
  if (world.wanted > 0 && sirenTimer <= 0) {
    audio.playSiren();
    sirenTimer = 1.1;
  }

  if (world.isDriving) {
    for (const car of vehicles.cars) {
      if (!car.isTraffic || car === world.drivingCar) continue;
      const d = Math.hypot(car.position.x - world.playerPos.x, car.position.z - world.playerPos.z);
      if (d < 4.5 && Math.abs(world.drivingCar.speed) > 20 && !car.nearMissed) {
        car.nearMissed = true;
        world.stats.nearMisses += 1;
        world.money += 25;
        flashToast('NEAR MISS  +$25');
        audio.playPickup();
      } else if (d > 12) {
        car.nearMissed = false;
      }
    }
  }

  if (world.wanted > 0) {
    for (const cruiser of police.policeCars) {
      if (cruiser.mesh.position.y < -50) continue;
      const d = Math.hypot(
        cruiser.position.x - world.playerPos.x,
        cruiser.position.z - world.playerPos.z,
      );
      if (d < POLICE.ramRange) damagePlayer(POLICE.ramDamage * dt);
    }
  }
}

function damagePlayer(amount) {
  world.health -= amount;
  world.hurtAt = world.time;
  if (world.health <= 0) {
    world.health = 0;
    audio.playExplosion();
    saveGameData({ money: world.money, bestWanted: world.stats.bestWanted });
    show(SCREENS.over);
  }
}

// --- Run reset -----------------------------------------------------------------
function resetRun() {
  for (const b of bullets) scene.remove(b.mesh);
  for (const s of sparks) scene.remove(s.mesh);
  bullets.length = 0;
  sparks.length = 0;
  police.clear();
  const fresh = createWorldState();
  const keep = loadGameSave();
  fresh.money = keep.money;
  if (keep.missionsCompleted > 0 && keep.missionsCompleted < MISSIONS.length) {
    fresh.missionIndex = keep.missionsCompleted;
    fresh.currentMission = MISSIONS[keep.missionsCompleted];
    fresh.missionTimeLeft = fresh.currentMission.timeLimit || 0;
  }
  world = fresh;
  viewYaw = 0;
  playerMesh.position.set(32, 1.5, 32);
  playerMesh.rotation.y = 0;
  playerMesh.visible = true;
}

// --- Buttons -------------------------------------------------------------------
document.getElementById('btn-start')?.addEventListener('click', () => {
  audio.playClick();
  show(SCREENS.play);
});
document.getElementById('btn-resume')?.addEventListener('click', () => {
  audio.playClick();
  show(SCREENS.play);
});
document.getElementById('btn-restart')?.addEventListener('click', () => {
  resetRun();
  show(SCREENS.play);
});
document.getElementById('btn-retry')?.addEventListener('click', () => {
  resetRun();
  show(SCREENS.play);
});
document.getElementById('btn-play-again')?.addEventListener('click', () => {
  resetRun();
  show(SCREENS.play);
});

// --- Screenshot staging ---------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot');
if (shotParam) {
  const staged = stageShot(shotParam, world, vehicles);
  show(staged.screen);
  if (world.autoDrive) enterCar(40);
}

// --- Frame loop -------------------------------------------------------------------
let lastTime = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  world.time += dt;

  const input = consumeInputs();
  viewYaw -= input.lookX * 0.004;

  if (input.pause) {
    if (screen === SCREENS.play) {
      show(SCREENS.paused);
      saveGameData({ money: world.money, bestWanted: world.stats.bestWanted });
    } else if (screen === SCREENS.paused) {
      show(SCREENS.play);
    }
  }

  if (screen === SCREENS.play) {
    if (input.interact) {
      if (world.isDriving) exitCar();
      else enterCar();
    }

    if (world.isDriving && world.drivingCar) driveStep(dt);
    else walkStep(dt, input);

    if (input.shoot && !world.isDriving) fireBullet();

    stepProjectiles(dt);

    const headingVec = world.isDriving && world.drivingCar
      ? { x: Math.sin(world.drivingCar.rotation), z: Math.cos(world.drivingCar.rotation) }
      : { x: Math.sin(viewYaw), z: Math.cos(viewYaw) };
    vehicles.update(dt, world.playerPos, world.isDriving, world.drivingCar);
    police.update(dt, world.playerPos, world.wanted, police.policeCars, headingVec, world.time);
    updatePeds(dt);

    missionStep(dt);
    metaStep(dt);

    if (world.isDriving && world.drivingCar) {
      smoothFollow(world.drivingCar.position, world.drivingCar.rotation, 20, 9, dt, false);
    } else {
      smoothFollow(world.playerPos, viewYaw, 18, 10, dt, false);
    }

    updateHUD(world, { policeCars: police.policeCars, trafficCars: vehicles.cars });
  }

  renderer.render(scene, camera);
  if (shotParam) window.__shotReady = true;
}

requestAnimationFrame(frame);
