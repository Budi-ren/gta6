// Police AI: cruisers spawn at a distance and steer toward the player with
// a limited turn rate (so a fast car can out-turn them), their light bars
// flash red/blue, and at three stars or more they set roadblocks ahead of
// the player's heading. When the heat is gone the cruisers park off-screen.
import { POLICE } from './config.js';
import { range, pick } from './random.js';

const THREE = window.THREE;

function buildCruiser() {
  const car = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 1.15, 6.6),
    new THREE.MeshStandardMaterial({ color: 0x14143c, roughness: 0.25, metalness: 0.6 }),
  );
  body.position.y = 0.78;
  car.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.85, 3.0),
    new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.2, metalness: 0.5 }),
  );
  cabin.position.set(0, 1.6, -0.3);
  car.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.42, 10);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });
  for (const [wx, wz] of [[-1.65, 2.1], [1.65, 2.1], [-1.65, -2.1], [1.65, -2.1]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.52, wz);
    car.add(wheel);
  }
  const barGeo = new THREE.BoxGeometry(0.8, 0.3, 0.5);
  const redMat = new THREE.MeshBasicMaterial({ color: 0x550000 });
  const blueMat = new THREE.MeshBasicMaterial({ color: 0x000055 });
  const red = new THREE.Mesh(barGeo, redMat);
  red.position.set(-0.55, 2.2, -0.3);
  car.add(red);
  const blue = new THREE.Mesh(barGeo, blueMat);
  blue.position.set(0.55, 2.2, -0.3);
  car.add(blue);
  return { group: car, redMat, blueMat };
}

function turnToward(current, target, maxStep) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > maxStep) return current + maxStep;
  if (diff < -maxStep) return current - maxStep;
  return target;
}

export function createPoliceManager(scene) {
  const policeCars = [];
  const roadblocks = [];

  function hide(mesh) {
    mesh.position.y = -100;
  }

  function spawnCruiser(playerPos) {
    const built = buildCruiser();
    const angle = range(0, Math.PI * 2);
    const dist = range(60, 90);
    built.group.position.set(
      playerPos.x + Math.sin(angle) * dist,
      0,
      playerPos.z + Math.cos(angle) * dist,
    );
    scene.add(built.group);
    const cruiser = {
      mesh: built.group,
      position: built.group.position,
      rotation: 0,
      speed: 0,
      redMat: built.redMat,
      blueMat: built.blueMat,
      phase: pick([0, 1]),
    };
    policeCars.push(cruiser);
    return cruiser;
  }

  function spawnRoadblock(playerPos, heading) {
    const built = buildCruiser();
    const px = playerPos.x + heading.x * 38;
    const pz = playerPos.z + heading.z * 38;
    built.group.position.set(px, 0, pz);
    built.group.rotation.y = Math.atan2(heading.x, heading.z) + Math.PI / 2;
    scene.add(built.group);
    const block = {
      mesh: built.group,
      position: built.group.position,
      rotation: built.group.rotation.y,
      speed: 0,
      redMat: built.redMat,
      blueMat: built.blueMat,
      phase: 0,
    };
    roadblocks.push(block);
    return block;
  }

  function flash(cruiser, time, index) {
    const on = Math.floor(time * 3 + index + cruiser.phase) % 2 === 0;
    cruiser.redMat.color.setHex(on ? 0xff2222 : 0x550000);
    cruiser.blueMat.color.setHex(on ? 0x000055 : 0x2266ff);
  }

  function update(dt, playerPos, wanted, list, heading, time) {
    if (wanted <= 0) {
      for (const cruiser of policeCars) hide(cruiser.mesh);
      for (const block of roadblocks) hide(block.mesh);
      roadblocks.length = 0;
      return;
    }

    const targetCount = Math.min(wanted + 1, POLICE.maxCruisers);
    while (policeCars.length < targetCount) spawnCruiser(playerPos);

    for (let i = 0; i < policeCars.length; i++) {
      const cruiser = policeCars[i];
      if (i >= targetCount) {
        hide(cruiser.mesh);
        continue;
      }
      cruiser.mesh.position.y = 0;
      const dx = playerPos.x - cruiser.position.x;
      const dz = playerPos.z - cruiser.position.z;
      const dist = Math.hypot(dx, dz);
      const desired = Math.atan2(dx, dz);
      cruiser.rotation = turnToward(cruiser.rotation, desired, 3.0 * dt);
      cruiser.speed = Math.min(20 + wanted * 4, 46);
      cruiser.position.x += Math.sin(cruiser.rotation) * cruiser.speed * dt;
      cruiser.position.z += Math.cos(cruiser.rotation) * cruiser.speed * dt;
      cruiser.mesh.position.copy(cruiser.position);
      cruiser.mesh.rotation.y = cruiser.rotation;
      flash(cruiser, time, i);
    }

    if (wanted >= POLICE.roadblockAt) {
      while (roadblocks.length < 2) {
        spawnRoadblock(playerPos, heading);
      }
      for (let i = 0; i < roadblocks.length; i++) {
        roadblocks[i].mesh.position.y = 0;
        flash(roadblocks[i], time, i + 4);
      }
    } else if (roadblocks.length > 0) {
      for (const block of roadblocks) hide(block.mesh);
      roadblocks.length = 0;
    }
  }

  function clear() {
    for (const cruiser of policeCars) hide(cruiser.mesh);
    for (const block of roadblocks) hide(block.mesh);
    roadblocks.length = 0;
  }

  return { update, policeCars, roadblocks, clear };
}
