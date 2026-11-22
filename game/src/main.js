// Sunburst City: Vice Horizon - Core 3D Game Loop
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_VICTORY } from './config.js';
import { createWorldState } from './world.js';
import { initRenderer } from './render.js';
import { createCity } from './city.js';
import { createVehiclesManager } from './vehicles.js';
import { createPoliceManager } from './police.js';
import { updateHUD } from './hud.js';
import { initInput, keys, consumeInputs } from './input.js';
import { audio } from './audio.js';
import { loadGameSave, saveGameData } from './save.js';
import { stageShot } from './shots.js';
import { MISSIONS } from './missions.js';

const THREE = window.THREE;

// DOM Elements & Screen Management
const canvas = document.getElementById('game');
const screenTitle = document.getElementById('screen-title');
const screenPaused = document.getElementById('screen-paused');
const screenOver = document.getElementById('screen-over');
const screenVictory = document.getElementById('screen-victory');

let currentScreen = SCREEN_TITLE;

function setScreen(screen) {
  currentScreen = screen;
  screenTitle?.classList.toggle('hidden', screen !== SCREEN_TITLE);
  screenPaused?.classList.toggle('hidden', screen !== SCREEN_PAUSED);
  screenOver?.classList.toggle('hidden', screen !== SCREEN_OVER);
  screenVictory?.classList.toggle('hidden', screen !== SCREEN_VICTORY);
}

// Initialize Systems
initInput(canvas);
const { scene, camera, renderer, playerMesh } = initRenderer(canvas);
const city = createCity(scene);
const vehicles = createVehiclesManager(scene);
const police = createPoliceManager(scene);
let world = createWorldState();

// Load Saved Progress
const savedData = loadGameSave();
if (savedData) {
  world.money = savedData.money ?? 500;
  if (savedData.missionsCompleted && savedData.missionsCompleted < MISSIONS.length) {
    world.currentMissionIndex = savedData.missionsCompleted;
    world.currentMission = MISSIONS[world.currentMissionIndex];
  }
}

// Setup Event Listeners for UI
document.getElementById('btn-start')?.addEventListener('click', () => {
  setScreen(SCREEN_PLAY);
});

document.getElementById('btn-resume')?.addEventListener('click', () => {
  setScreen(SCREEN_PLAY);
});

document.getElementById('btn-restart')?.addEventListener('click', () => {
  resetGame();
  setScreen(SCREEN_PLAY);
});

document.getElementById('btn-retry')?.addEventListener('click', () => {
  resetGame();
  setScreen(SCREEN_PLAY);
});

document.getElementById('btn-play-again')?.addEventListener('click', () => {
  resetGame();
  setScreen(SCREEN_PLAY);
});

function resetGame() {
  world = createWorldState();
  playerMesh.position.set(0, 1.5, 0);
  playerMesh.visible = true;
  world.isDriving = false;
  world.drivingCar = null;
}

// Bullet particles / rays container
const bullets = [];
const bulletGeo = new THREE.SphereGeometry(0.2, 8, 8);
const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

function fireBullet(fromPos, dir) {
  audio.playGunshot();
  const bMesh = new THREE.Mesh(bulletGeo, bulletMat);
  bMesh.position.copy(fromPos);
  bMesh.position.y += 0.5;
  scene.add(bMesh);
  bullets.push({
    mesh: bMesh,
    dir: dir.clone().normalize(),
    life: 1.2,
  });
}

// Check URL query parameters for screenshot staging (?shot=start|play|end)
const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot');

if (shotParam) {
  const staged = stageShot(shotParam, world);
  setScreen(staged.screen);
}

let lastTime = performance.now();
let cameraAngleY = 0;

// Main Game Loop
function gameLoop(time) {
  requestAnimationFrame(gameLoop);

  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  const inputs = consumeInputs();

  // Toggle Pause screen
  if (inputs.pause) {
    if (currentScreen === SCREEN_PLAY) setScreen(SCREEN_PAUSED);
    else if (currentScreen === SCREEN_PAUSED) setScreen(SCREEN_PLAY);
  }

  if (currentScreen === SCREEN_PLAY) {
    // 1. Vehicle Interaction (Enter / Exit with E or F)
    if (inputs.interact) {
      if (!world.isDriving) {
        // Find nearest car within 7 units
        let nearest = null;
        let minDist = 7;
        for (const car of vehicles.cars) {
          const d = Math.hypot(car.position.x - world.playerPos.x, car.position.z - world.playerPos.z);
          if (d < minDist) {
            minDist = d;
            nearest = car;
          }
        }
        if (nearest) {
          world.isDriving = true;
          world.drivingCar = nearest;
          playerMesh.visible = false;
        }
      } else {
        // Exit car
        world.isDriving = false;
        if (world.drivingCar) {
          playerMesh.position.set(world.drivingCar.position.x + 3, 1.5, world.drivingCar.position.z);
        }
        playerMesh.visible = true;
        world.drivingCar = null;
        world.carSpeed = 0;
      }
    }

    // 2. Player Movement or Car Driving
    if (world.isDriving && world.drivingCar) {
      const car = world.drivingCar;

      // Steering
      if (keys.left) car.rotation += 2.0 * dt;
      if (keys.right) car.rotation -= 2.0 * dt;

      // Throttle & Brake
      const accel = car.acceleration || 18;
      if (keys.forward) car.speed += accel * dt;
      else if (keys.backward) car.speed -= accel * dt;
      else car.speed *= 0.98; // Drag

      car.speed = Math.max(-12, Math.min(50, car.speed));

      // Move car
      car.position.x += Math.sin(car.rotation) * car.speed * dt;
      car.position.z += Math.cos(car.rotation) * car.speed * dt;
      car.mesh.position.copy(car.position);
      car.mesh.rotation.y = car.rotation;

      // Sync world position & speed
      world.playerPos.x = car.position.x;
      world.playerPos.y = car.position.y;
      world.playerPos.z = car.position.z;
      world.carSpeed = Math.abs(car.speed) * 1.8;

      if (Math.abs(car.speed) > 5) {
        audio.playEngine(90 + Math.abs(car.speed) * 2);
      }

      // Camera follow vehicle
      const camDist = 18;
      const camHeight = 8;
      camera.position.x = car.position.x - Math.sin(car.rotation) * camDist;
      camera.position.y = car.position.y + camHeight;
      camera.position.z = car.position.z - Math.cos(car.rotation) * camDist;
      camera.lookAt(car.position.x, car.position.y + 1.5, car.position.z);

    } else {
      // Walking / Running on Foot
      const moveSpeed = keys.sprint ? 22 : 12;
      let dx = 0;
      let dz = 0;

      if (keys.forward) dz -= 1;
      if (keys.backward) dz += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;

      if (dx !== 0 || dz !== 0) {
        const len = Math.hypot(dx, dz);
        dx /= len;
        dz /= len;

        playerMesh.position.x += dx * moveSpeed * dt;
        playerMesh.position.z += dz * moveSpeed * dt;

        // Turn player towards movement
        const moveAngle = Math.atan2(dx, dz);
        playerMesh.rotation.y = moveAngle;
      }

      world.playerPos.x = playerMesh.position.x;
      world.playerPos.y = playerMesh.position.y;
      world.playerPos.z = playerMesh.position.z;
      world.carSpeed = 0;

      // Shooting
      if (keys.shoot) {
        keys.shoot = false; // Trigger once per click/press
        const forwardDir = new THREE.Vector3(
          Math.sin(playerMesh.rotation.y),
          0,
          Math.cos(playerMesh.rotation.y)
        );
        fireBullet(playerMesh.position, forwardDir);

        // Raise wanted level on gunfire
        if (Math.random() < 0.25 && world.wanted < 5) {
          world.wanted += 1;
        }
      }

      // Camera follow character
      camera.position.x = playerMesh.position.x;
      camera.position.y = playerMesh.position.y + 10;
      camera.position.z = playerMesh.position.z + 18;
      camera.lookAt(playerMesh.position.x, playerMesh.position.y + 1, playerMesh.position.z);
    }

    // 3. Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt;
      b.mesh.position.addScaledVector(b.dir, 80 * dt);

      if (b.life <= 0) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
      }
    }

    // 4. Update AI Vehicles & Police
    vehicles.update(dt, world.playerPos, world.isDriving, world.drivingCar);
    police.update(dt, world.playerPos, world.wanted, police.policeCars);

    // Check collision / damage from police
    if (world.wanted > 0) {
      police.policeCars.forEach(p => {
        const dist = Math.hypot(p.mesh.position.x - world.playerPos.x, p.mesh.position.z - world.playerPos.z);
        if (dist < 4) {
          world.health -= 12 * dt;
        }
      });
    }

    // Check Health / Wasted
    if (world.health <= 0) {
      world.health = 0;
      setScreen(SCREEN_OVER);
      audio.playExplosion();
    }

    // 5. Missions Check
    if (world.currentMission && world.currentMission.targetPos) {
      const distToTarget = Math.hypot(
        world.playerPos.x - world.currentMission.targetPos.x,
        world.playerPos.z - world.currentMission.targetPos.z
      );

      if (distToTarget < 10) {
        // Complete Mission
        world.money += world.currentMission.reward;
        audio.playCash();
        audio.playMissionJingle();

        world.currentMissionIndex += 1;
        if (world.currentMissionIndex < MISSIONS.length) {
          world.currentMission = MISSIONS[world.currentMissionIndex];
        } else {
          world.currentMission = null;
          setScreen(SCREEN_VICTORY);
        }

        saveGameData({
          money: world.money,
          missionsCompleted: world.currentMissionIndex,
          bestWanted: world.wanted,
        });
      }
    }

    // 6. Update HUD
    updateHUD(world);
  }

  renderer.render(scene, camera);

  if (shotParam) {
    window.__shotReady = true;
  }
}

// Start loop
requestAnimationFrame(gameLoop);
