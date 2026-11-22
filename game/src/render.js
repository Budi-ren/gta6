// Three.js Scene setup, lighting, player mesh, camera follow
const THREE = window.THREE;

export function initRenderer(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);
  scene.fog = new THREE.FogExp2(0x0f172a, 0.003);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 1500);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // Lighting (sun-soaked golden hour)
  const ambientLight = new THREE.AmbientLight(0xffedd5, 0.7);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.2);
  sunLight.position.set(150, 250, 100);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // Player character mesh on foot
  const playerGeo = new THREE.CapsuleGeometry(0.8, 1.8, 4, 8);
  const playerMat = new THREE.MeshStandardMaterial({ color: 0xff3366, roughness: 0.4 });
  const playerMesh = new THREE.Mesh(playerGeo, playerMat);
  playerMesh.position.set(0, 1.5, 0);
  scene.add(playerMesh);

  // Pedestrians
  const pedGroup = new THREE.Group();
  scene.add(pedGroup);
  const pedGeo = new THREE.CapsuleGeometry(0.6, 1.5, 4, 8);
  const pedMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.5 });
  for (let i = 0; i < 20; i++) {
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.set((Math.random() - 0.5) * 400, 1.2, (Math.random() - 0.5) * 400);
    pedGroup.add(ped);
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  return { scene, camera, renderer, playerMesh };
}
