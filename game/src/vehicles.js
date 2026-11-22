// Vehicles system: Traffic cars, player drivable cars, physics, steering, and entry/exit.
const THREE = window.THREE;

export function createVehiclesManager(scene) {
  const cars = [];
  const carGeo = new THREE.BoxGeometry(3.6, 1.4, 7);
  const colors = [0xff2222, 0x2255ff, 0xffbb00, 0xffffff, 0x111111, 0x33cc66];
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 8);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  // Spawn traffic cars along roads
  for (let i = 0; i < 16; i++) {
    const x = (Math.random() - 0.5) * 400;
    const z = (Math.random() - 0.5) * 400;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.5 });
    const mesh = new THREE.Mesh(carGeo, mat);
    mesh.position.set(x, 0.7, z);

    // Add wheels
    [ [-1.8, -0.4, 2], [1.8, -0.4, 2], [-1.8, -0.4, -2], [1.8, -0.4, -2] ].forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      mesh.add(wheel);
    });

    scene.add(mesh);
    cars.push({
      mesh,
      position: mesh.position,
      velocity: new THREE.Vector3(),
      speed: 0,
      maxSpeed: 35 + Math.random() * 15,
      acceleration: 15,
      steering: 0,
      rotation: Math.random() * Math.PI * 2,
      isTraffic: true,
      routeTimer: 0,
    });
  }

  function update(dt, playerPos, isDriving, drivingCar) {
    cars.forEach(car => {
      if (car === drivingCar && isDriving) {
        // Controlled by player in main.js
        return;
      }
      // AI Traffic movement
      car.routeTimer -= dt;
      if (car.routeTimer <= 0 || Math.hypot(car.position.x, car.position.z) > 250) {
        car.rotation += (Math.random() - 0.5) * Math.PI;
        car.routeTimer = 5 + Math.random() * 5;
      }
      car.speed = 12;
      car.position.x += Math.sin(car.rotation) * car.speed * dt;
      car.position.z += Math.cos(car.rotation) * car.speed * dt;
      car.mesh.position.copy(car.position);
      car.mesh.rotation.y = car.rotation;
    });
  }

  return { cars, update };
}
