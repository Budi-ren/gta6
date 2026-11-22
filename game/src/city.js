// Sunburst City, rebuilt district by district. The ground is a single plane
// whose road markings are painted once onto a canvas texture (cheap: one
// draw call instead of hundreds of dash meshes), and the towers are seeded
// so the skyline is identical on every load. Downtown towers are tall glass,
// the midtown ring is warm brick, the outskirts are low pastels, and the
// south edge is a beach. Mission targets get landmarks you can actually see.
import { WORLD } from './config.js';
import { setSeed, range, int, pick, chance } from './random.js';

const THREE = window.THREE;
const PITCH = WORLD.block + WORLD.road; // 64 units between block centers

const DOWNTOWN = [0x3a86ff, 0x8338ec, 0x7209b7, 0x4361ee, 0x5a189a];
const MIDTOWN = [0xff6b6b, 0xffbe0b, 0xf72585, 0xff8500, 0xfb8500];
const SUBURB = [0xffe8d6, 0xddbea9, 0xb7e4c7, 0xcaf0f8, 0xffc8dd];
const NEON = [0x00f5d4, 0xff0a54, 0xfee440, 0x9b5de5];

// Paint the asphalt, sidewalks, lane dashes and crosswalks onto one texture.
function paintGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const g = canvas.getContext('2d');
  const scale = 1024 / WORLD.size;
  const toPx = (v) => (v + WORLD.size / 2) * scale;
  g.fillStyle = '#232329';
  g.fillRect(0, 0, 1024, 1024);
  // Beach strip along the south edge.
  g.fillStyle = '#d9b380';
  g.fillRect(0, toPx(272), 1024, 1024 - toPx(272));
  // Sidewalk blocks.
  g.fillStyle = '#2f2f38';
  for (let gx = -WORLD.gridRadius; gx <= WORLD.gridRadius; gx++) {
    for (let gz = -WORLD.gridRadius; gz <= WORLD.gridRadius; gz++) {
      g.fillRect(toPx(gx * PITCH - 27), toPx(gz * PITCH - 27), 54 * scale, 54 * scale);
    }
  }
  // Lane dashes down every road center line.
  g.strokeStyle = '#e8c33a';
  g.lineWidth = 2;
  g.setLineDash([14, 18]);
  for (let k = -WORLD.gridRadius; k < WORLD.gridRadius; k++) {
    const line = k * PITCH + PITCH / 2;
    g.beginPath();
    g.moveTo(toPx(line), 0);
    g.lineTo(toPx(line), 1024);
    g.stroke();
    g.beginPath();
    g.moveTo(0, toPx(line));
    g.lineTo(1024, toPx(line));
    g.stroke();
  }
  g.setLineDash([]);
  // Crosswalk stripes at the central intersections.
  g.fillStyle = 'rgba(255,255,255,0.75)';
  for (const cx of [-32, 32]) {
    for (const cz of [-32, 32]) {
      for (let i = -3; i <= 3; i++) {
        g.fillRect(toPx(cx + i * 4 - 1), toPx(cz - 9), 2 * scale, 18 * scale);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function tower(group, cx, cz, width, depth, height, color, neon) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.25 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  body.position.set(cx, height / 2, cz);
  group.add(body);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.8 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 3, depth * 0.5), roofMat);
  roof.position.set(cx, height + 1.5, cz);
  group.add(roof);
  if (neon) {
    const glow = new THREE.MeshBasicMaterial({ color: pick(NEON) });
    const strip = new THREE.BoxGeometry(0.7, height, 0.7);
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const edge = new THREE.Mesh(strip, glow);
      edge.position.set(cx + ox * (width / 2), height / 2, cz + oz * (depth / 2));
      group.add(edge);
    }
  }
}

function palm(group, x, z) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.7, 9, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 }),
  );
  trunk.position.y = 4.5;
  tree.add(trunk);
  const fronds = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 7, 5),
    new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.8 }),
  );
  fronds.position.y = 9.4;
  fronds.scale.set(1.6, 0.55, 1.6);
  tree.add(fronds);
  tree.position.set(x, 0, z);
  group.add(tree);
}

function lamp(group, x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0x333338, roughness: 0.6, metalness: 0.5 }),
  );
  pole.position.set(x, 3.5, z);
  group.add(pole);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8 }),
  );
  bulb.position.set(x, 7.2, z);
  group.add(bulb);
}

export function createCity(scene) {
  setSeed(1337);
  const group = new THREE.Group();

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshStandardMaterial({ color: 0x0077be, roughness: 0.15, metalness: 0.7 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.6;
  group.add(water);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.size, WORLD.size),
    new THREE.MeshStandardMaterial({ map: paintGroundTexture(), roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  for (let gx = -WORLD.gridRadius; gx <= WORLD.gridRadius; gx++) {
    for (let gz = -WORLD.gridRadius; gz <= WORLD.gridRadius; gz++) {
      const ring = Math.max(Math.abs(gx), Math.abs(gz));
      const cx = gx * PITCH;
      const cz = gz * PITCH;
      if (gz === WORLD.gridRadius) {
        // Beach row: a low cabana instead of a tower.
        tower(group, cx, cz, 26, 18, 7 + range(0, 4), pick(SUBURB), false);
        continue;
      }
      if (ring <= 1) {
        tower(group, cx, cz, 42, 42, range(55, 130), pick(DOWNTOWN), true);
      } else if (ring <= 3) {
        if (chance(0.3)) {
          tower(group, cx - 11, cz, 20, 40, range(26, 60), pick(MIDTOWN), false);
          tower(group, cx + 11, cz, 20, 40, range(26, 60), pick(MIDTOWN), false);
        } else {
          tower(group, cx, cz, 44, 44, range(28, 70), pick(MIDTOWN), chance(0.25));
        }
      } else {
        tower(group, cx, cz, 40, 40, range(10, 28), pick(SUBURB), false);
      }
    }
  }

  // Landmarks at the mission targets, so objectives are visible from afar.
  const club = new THREE.Mesh(
    new THREE.BoxGeometry(22, 42, 22),
    new THREE.MeshStandardMaterial({ color: 0xff0a54, roughness: 0.3, metalness: 0.3 }),
  );
  club.position.set(100, 21, 100);
  group.add(club);
  const clubRing = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 15, 1.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xfee440 }),
  );
  clubRing.position.set(100, 43, 100);
  group.add(clubRing);

  const bank = new THREE.Mesh(
    new THREE.BoxGeometry(26, 52, 26),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.6 }),
  );
  bank.position.set(200, 26, -150);
  group.add(bank);

  const crateColors = [0xe63946, 0x2a9d8f, 0xe9c46a, 0x4361ee];
  for (let i = 0; i < 4; i++) {
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(9, 4, 4),
      new THREE.MeshStandardMaterial({ color: crateColors[i], roughness: 0.7 }),
    );
    crate.position.set(-62 + i * 9, 2, -180 + (i % 2) * 6);
    crate.rotation.y = i * 0.4;
    group.add(crate);
  }

  const pylon = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 26, 8),
    new THREE.MeshStandardMaterial({ color: 0xff6d00, roughness: 0.5 }),
  );
  pylon.position.set(-200, 13, -200);
  group.add(pylon);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc00 }),
  );
  beacon.position.set(-200, 27, -200);
  group.add(beacon);

  // Palms down the central avenue and along the beach.
  for (let v = -240; v <= 240; v += 60) {
    palm(group, -40, v);
    palm(group, 40, v);
    palm(group, v, 284);
  }
  // Street lamps at the central intersections.
  for (const lx of [-96, -32, 32, 96]) {
    for (const lz of [-96, -32, 32, 96]) {
      if ((lx + lz) % 128 === 0) lamp(group, lx + 6, lz + 6);
    }
  }

  scene.add(group);
  return {
    group,
    landmarks: {
      club: { x: 100, z: 100 },
      bank: { x: 200, z: -150 },
      docks: { x: -50, z: -180 },
      highway: { x: -200, z: -200 },
    },
  };
}
