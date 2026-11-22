// Renderer, dusk lighting, the player character, wandering pedestrians,
// and a smoothed third-person camera rig. Shadows stay off on purpose:
// under software rendering they cost more frames than they are worth, and
// the dusk hemisphere light carries the look on its own.
import { range, int, pick, chance } from './random.js';

const THREE = window.THREE;
const PED_SHIRTS = [0x38bdf8, 0xfbbf24, 0xf472b6, 0xa3e635, 0xfb7185, 0xc084fc];

export function initRenderer(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2b1b4d);
  scene.fog = new THREE.FogExp2(0x2b1b4d, 0.0022);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 1600);
  camera.position.set(0, 10, -18);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = false;

  const hemi = new THREE.HemisphereLight(0xffd9a0, 0x403060, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb36b, 1.15);
  sun.position.set(180, 220, 120);
  scene.add(sun);

  // Player: teal jacket, skin-tone head, dark cap — built from primitives.
  const playerMesh = new THREE.Group();
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.75, 1.5, 4, 10),
    new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.45 }),
  );
  torso.position.y = 1.35;
  playerMesh.add(torso);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xf2c89b, roughness: 0.6 }),
  );
  head.position.y = 2.85;
  playerMesh.add(head);
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 }),
  );
  cap.position.y = 3.2;
  playerMesh.add(cap);
  playerMesh.position.set(0, 0, 0);
  scene.add(playerMesh);

  // Pedestrians: small capsule walkers that drift around the blocks.
  const peds = [];
  const pedGeo = new THREE.CapsuleGeometry(0.55, 1.3, 4, 8);
  for (let i = 0; i < 18; i++) {
    const shirt = new THREE.Mesh(
      pedGeo,
      new THREE.MeshStandardMaterial({ color: pick(PED_SHIRTS), roughness: 0.55 }),
    );
    const walker = new THREE.Group();
    walker.add(shirt);
    shirt.position.y = 1.15;
    const skull = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8b98a, roughness: 0.6 }),
    );
    skull.position.y = 2.4;
    walker.add(skull);
    walker.position.set(range(-260, 260), 0, range(-260, 260));
    scene.add(walker);
    peds.push({ mesh: walker, heading: range(0, Math.PI * 2), speed: range(1.2, 2.6), turnIn: range(1, 4) });
  }

  function updatePeds(dt) {
    for (const ped of peds) {
      ped.turnIn -= dt;
      if (ped.turnIn <= 0 || Math.abs(ped.mesh.position.x) > 280 || Math.abs(ped.mesh.position.z) > 280) {
        ped.heading += range(-1.4, 1.4);
        if (Math.abs(ped.mesh.position.x) > 280) ped.heading = Math.PI - ped.heading;
        if (Math.abs(ped.mesh.position.z) > 280) ped.heading = -ped.heading;
        ped.turnIn = range(2, 5);
      }
      ped.mesh.position.x += Math.sin(ped.heading) * ped.speed * dt;
      ped.mesh.position.z += Math.cos(ped.heading) * ped.speed * dt;
      ped.mesh.rotation.y = ped.heading;
    }
  }

  // Eased chase camera: the camera glides to its slot behind the focus
  // instead of snapping, so turns and car entries feel smooth.
  const desired = new THREE.Vector3();
  function smoothFollow(focus, heading, distance, height, dt, snap) {
    const fx = Math.sin(heading);
    const fz = Math.cos(heading);
    desired.set(focus.x - fx * distance, focus.y + height, focus.z - fz * distance);
    if (snap) {
      camera.position.copy(desired);
    } else {
      const k = 1 - Math.exp(-6 * dt);
      camera.position.lerp(desired, k);
    }
    camera.lookAt(focus.x, focus.y + 1.5, focus.z);
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  return { scene, camera, renderer, playerMesh, updatePeds, smoothFollow };
}
