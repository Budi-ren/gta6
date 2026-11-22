// Police AI, chasing player when wanted > 0
const THREE = window.THREE;

export function createPoliceManager(scene) {
  const policeCars = [];
  const carGeo = new THREE.BoxGeometry(3.5, 1.3, 6.8);
  const policeMat = new THREE.MeshStandardMaterial({ color: 0x111133, roughness: 0.2, metalness: 0.6 });
  
  function update(dt, playerPos, wantedLevel, policeList) {
    if (wantedLevel <= 0) {
      policeCars.forEach(p => { p.mesh.position.y = -100; });
      return;
    }

    while (policeCars.length < wantedLevel * 2) {
      const mesh = new THREE.Mesh(carGeo, policeMat);
      mesh.position.set(playerPos.x + (Math.random() - 0.5) * 80, 0.7, playerPos.z + (Math.random() - 0.5) * 80);
      scene.add(mesh);
      policeCars.push({ mesh, speed: 22 });
    }

    policeCars.forEach(p => {
      const dx = playerPos.x - p.mesh.position.x;
      const dz = playerPos.z - p.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      p.mesh.position.y = 0.7;
      if (dist > 4) {
        const angle = Math.atan2(dx, dz);
        p.mesh.rotation.y = angle;
        p.mesh.position.x += Math.sin(angle) * (20 + wantedLevel * 5) * dt;
        p.mesh.position.z += Math.cos(angle) * (20 + wantedLevel * 5) * dt;
      }
    });
  }

  return { update, policeCars };
}
