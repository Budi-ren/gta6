// 3D City Builder: Sunburst City (Vice Horizon) with buildings, roads, palm trees, and ocean.
const THREE = window.THREE;

export function createCity(scene) {
  const cityGroup = new THREE.Group();

  // Sun-soaked ocean water plane at the edge
  const waterGeo = new THREE.PlaneGeometry(1000, 1000);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x0077be, roughness: 0.1, metalness: 0.8 });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.5, 0);
  cityGroup.add(water);

  // Ground / Asphalt base
  const groundGeo = new THREE.PlaneGeometry(600, 600);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 0);
  cityGroup.add(ground);

  // Building generator & Roads grid
  const blockSize = 50;
  const roadWidth = 14;
  const gridCount = 5; // 5x5 blocks

  const buildingColors = [0xff6b6b, 0xffbe0b, 0x3a86ff, 0x8338ec, 0xff006e, 0xf72585, 0x4cc9f0, 0x7209b7];

  for (let x = -gridCount; x <= gridCount; x++) {
    for (let z = -gridCount; z <= gridCount; z++) {
      const bx = x * (blockSize + roadWidth);
      const bz = z * (blockSize + roadWidth);

      // Skip center intersection sometimes or create road markings
      // Create building
      const width = blockSize - 4;
      const depth = blockSize - 4;
      const height = 30 + Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 70);

      const bGeo = new THREE.BoxGeometry(width, height, depth);
      const color = buildingColors[Math.abs(x + z) % buildingColors.length];
      const bMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.2,
      });
      const building = new THREE.Mesh(bGeo, bMat);
      building.position.set(bx, height / 2, bz);
      cityGroup.add(building);

      // Add simple windows or neon trims
      const trimGeo = new THREE.BoxGeometry(width + 0.5, 2, depth + 0.5);
      const trimMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
      for (let h = 10; h < height; h += 15) {
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.set(bx, h, bz);
        cityGroup.add(trim);
      }
    }
  }

  // Add decorative Palm Trees along main avenues
  const trunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 10, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
  const leavesGeo = new THREE.SphereGeometry(3, 6, 6);
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });

  for (let i = -200; i <= 200; i += 80) {
    createPalmTree(cityGroup, i, 0, -225, trunkGeo, trunkMat, leavesGeo, leavesMat);
    createPalmTree(cityGroup, i, 0, 225, trunkGeo, trunkMat, leavesGeo, leavesMat);
    createPalmTree(cityGroup, -225, 0, i, trunkGeo, trunkMat, leavesGeo, leavesMat);
    createPalmTree(cityGroup, 225, 0, i, trunkGeo, trunkMat, leavesGeo, leavesMat);
  }

  scene.add(cityGroup);
  return cityGroup;
}

function createPalmTree(group, x, y, z, trunkGeo, trunkMat, leavesGeo, leavesMat) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 5;
  tree.add(trunk);
  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.y = 10;
  leaves.scale.set(1.5, 0.6, 1.5);
  tree.add(leaves);
  tree.position.set(x, y, z);
  group.add(tree);
}
