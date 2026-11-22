// Five kinds of car, each with its own top speed, acceleration, grip and
// silhouette — a sport coupe genuinely outruns a truck, and a taxi is easy
// to spot. Traffic drives the road lanes (two-way, wrapping at the city
// edge), while a handful of parked cars sit at curbs near the spawn, ready
// to be stolen. Every car is built from boxes, cylinders and glowing lights.
import { range, int, pick } from './random.js';

const THREE = window.THREE;

export const CAR_TYPES = {
  sedan: { name: 'Sedan', top: 34, accel: 16, grip: 2.2, len: 6.4, wid: 3.2, colors: [0xdddddd, 0x2244aa, 0x882222] },
  taxi: { name: 'Taxi', top: 32, accel: 15, grip: 2.0, len: 6.4, wid: 3.2, colors: [0xffcc00] },
  sport: { name: 'Sport', top: 48, accel: 24, grip: 3.2, len: 6.0, wid: 3.0, colors: [0xff2244, 0x00ccff] },
  truck: { name: 'Truck', top: 26, accel: 11, grip: 1.6, len: 8.4, wid: 3.4, colors: [0x557755, 0x775555] },
  van: { name: 'Van', top: 28, accel: 12, grip: 1.8, len: 7.2, wid: 3.4, colors: [0x888888, 0x334455] },
};

// Road center lines sit halfway between block centers (pitch 64).
function laneLines() {
  const lines = [];
  for (let k = -5; k <= 4; k++) lines.push(k * 64 + 32);
  return lines;
}

function buildCarMesh(spec, color) {
  const car = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.55 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(spec.wid, 1.05, spec.len), paint);
  body.position.y = 0.75;
  car.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(spec.wid * 0.82, 0.85, spec.len * 0.42),
    new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.15, metalness: 0.7 }),
  );
  cabin.position.set(0, 1.55, -spec.len * 0.06);
  car.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.42, 10);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });
  for (const [wx, wz] of [
    [-spec.wid / 2, spec.len * 0.32],
    [spec.wid / 2, spec.len * 0.32],
    [-spec.wid / 2, -spec.len * 0.32],
    [spec.wid / 2, -spec.len * 0.32],
  ]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.52, wz);
    car.add(wheel);
  }
  const lampGeo = new THREE.BoxGeometry(0.55, 0.28, 0.12);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6c9 });
  for (const hx of [-spec.wid * 0.28, spec.wid * 0.28]) {
    const lamp = new THREE.Mesh(lampGeo, headMat);
    lamp.position.set(hx, 0.85, spec.len / 2 + 0.02);
    car.add(lamp);
  }
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  for (const hx of [-spec.wid * 0.28, spec.wid * 0.28]) {
    const lamp = new THREE.Mesh(lampGeo, tailMat);
    lamp.position.set(hx, 0.85, -spec.len / 2 - 0.02);
    car.add(lamp);
  }
  return car;
}

function spawnCar(scene, typeName, x, z, heading, traffic, lane) {
  const spec = CAR_TYPES[typeName];
  const mesh = buildCarMesh(spec, pick(spec.colors));
  mesh.position.set(x, 0, z);
  mesh.rotation.y = heading;
  scene.add(mesh);
  return {
    mesh,
    position: mesh.position,
    rotation: heading,
    speed: traffic ? range(10, 16) : 0,
    maxSpeed: spec.top,
    acceleration: spec.accel,
    grip: spec.grip,
    type: typeName,
    name: spec.name,
    isTraffic: traffic,
    lane,
    nearMissed: false,
  };
}

export function createVehiclesManager(scene) {
  const cars = [];
  const lines = laneLines();
  const trafficKinds = ['sedan', 'sedan', 'taxi', 'sport', 'van', 'truck'];

  for (let i = 0; i < 14; i++) {
    const axis = i % 2 === 0 ? 'x' : 'z';
    const line = pick(lines);
    const offset = pick([-3.5, 3.5]);
    const dir = pick([-1, 1]);
    const typeName = pick(trafficKinds);
    const x = axis === 'x' ? range(-280, 280) : line + offset;
    const z = axis === 'z' ? range(-280, 280) : line + offset;
    const heading = axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : dir > 0 ? 0 : Math.PI;
    cars.push(spawnCar(scene, typeName, x, z, heading, true, { axis, dir }));
  }

  // Parked cars at curbs: the first thing a new player can steal.
  const parkedSpots = [
    { x: 36, z: 44, type: 'sedan' },
    { x: 28, z: -20, type: 'taxi' },
    { x: 26, z: -12, type: 'sport' },
    { x: -8, z: -26, type: 'van' },
    { x: 40, z: 40, type: 'truck' },
  ];
  for (const spot of parkedSpots) {
    cars.push(spawnCar(scene, spot.type, spot.x, spot.z, range(0, Math.PI * 2), false, null));
  }

  function update(dt, playerPos, isDriving, drivingCar) {
    for (const car of cars) {
      if (car === drivingCar && isDriving) continue;
      if (!car.isTraffic || !car.lane) continue;
      const step = car.speed * car.lane.dir * dt;
      if (car.lane.axis === 'x') {
        car.position.x += step;
        if (car.position.x > 295) car.position.x = -295;
        if (car.position.x < -295) car.position.x = 295;
      } else {
        car.position.z += step;
        if (car.position.z > 295) car.position.z = -295;
        if (car.position.z < -295) car.position.z = 295;
      }
      car.mesh.position.copy(car.position);
      car.mesh.rotation.y = car.rotation;
    }
  }

  return { cars, update };
}

// Nearest car to a point, traffic or parked, within maxDist units.
export function nearestCar(cars, x, z, maxDist) {
  let best = null;
  let bestDist = maxDist;
  for (const car of cars) {
    const d = Math.hypot(car.position.x - x, car.position.z - z);
    if (d < bestDist) {
      bestDist = d;
      best = car;
    }
  }
  return best;
}
