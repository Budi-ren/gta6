// HUD: money, health and stamina bars, wanted stars with a heat meter
// underneath, mission tracker with a countdown for timed jobs, the car
// plate, the speedometer, a toast line for events, and a live minimap that
// draws the road grid, the mission marker, cruisers and traffic around you.
let toastUntil = 0;

export function flashToast(message, seconds = 2.5) {
  const el = document.getElementById('hud-toast');
  if (!el) return;
  el.textContent = message;
  el.style.opacity = '1';
  toastUntil = Date.now() + seconds * 1000;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setBar(id, fraction, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = `${Math.max(0, Math.min(100, fraction * 100))}%`;
  if (color) el.style.background = color;
}

export function updateHUD(world, extra) {
  const policeCars = (extra && extra.policeCars) || [];
  const trafficCars = (extra && extra.trafficCars) || [];

  setText('hud-money', `$${world.money}`);
  const healthColor = world.health > 50 ? '#33dd55' : world.health > 25 ? '#ff9933' : '#ff3344';
  setBar('hud-health', world.health / 100, healthColor);
  setBar('hud-stamina', world.stamina / 100, '#33ccff');
  setBar('hud-heat', world.heat, '#ffcc00');

  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < world.wanted ? '★' : '☆';
  setText('hud-wanted', stars);

  if (world.currentMission) {
    setText('hud-mission-title', world.currentMission.title);
    setText('hud-mission-desc', world.currentMission.desc);
  } else {
    setText('hud-mission-title', 'ALL MISSIONS DONE');
    setText('hud-mission-desc', 'Sunburst City is yours. Enjoy the sunset, legend.');
  }

  const timerEl = document.getElementById('hud-timer');
  if (timerEl) {
    if (world.currentMission && world.currentMission.type === 'timed' && world.missionTimeLeft > 0) {
      timerEl.style.display = 'block';
      timerEl.textContent = `TIME ${Math.ceil(world.missionTimeLeft)}s`;
      timerEl.style.color = world.missionTimeLeft < 10 ? '#ff5566' : '#ffffff';
    } else {
      timerEl.style.display = 'none';
    }
  }

  setText('hud-weapon', `WEAPON: ${world.hasGun ? 'PISTOL' : 'PUNCH'}`);

  const carEl = document.getElementById('hud-car');
  if (carEl) {
    if (world.isDriving && world.drivingCar) {
      carEl.style.display = 'block';
      carEl.textContent = world.drivingCar.name.toUpperCase();
    } else {
      carEl.style.display = 'none';
    }
  }

  const speedEl = document.getElementById('hud-speedometer');
  if (speedEl) {
    if (world.isDriving) {
      speedEl.style.display = 'block';
      speedEl.textContent = `SPEED: ${Math.round(world.carSpeed)} MPH`;
    } else {
      speedEl.style.display = 'none';
    }
  }

  const toastEl = document.getElementById('hud-toast');
  if (toastEl && Date.now() > toastUntil) toastEl.style.opacity = '0';

  drawMinimap(world, policeCars, trafficCars);
}

function drawMinimap(world, policeCars, trafficCars) {
  const canvas = document.getElementById('minimap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const scale = 0.24;
  const px = world.playerPos.x;
  const pz = world.playerPos.z;
  const toX = (x) => cx + (x - px) * scale;
  const toY = (z) => cy + (z - pz) * scale;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  // Road grid.
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  for (let k = -5; k <= 4; k++) {
    const line = k * 64 + 32;
    ctx.beginPath();
    ctx.moveTo(toX(line), 0);
    ctx.lineTo(toX(line), h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, toY(line));
    ctx.lineTo(w, toY(line));
    ctx.stroke();
  }

  // Mission marker, pulsing.
  if (world.currentMission && world.currentMission.targetPos) {
    const pulse = 5 + Math.sin(world.time * 4) * 2;
    ctx.fillStyle = '#ff7700';
    ctx.beginPath();
    ctx.arc(toX(world.currentMission.targetPos.x), toY(world.currentMission.targetPos.z), pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  // Traffic as grey dots, cruisers as flashing blue dots.
  ctx.fillStyle = '#9aa0a6';
  for (const car of trafficCars) {
    ctx.beginPath();
    ctx.arc(toX(car.position.x), toY(car.position.z), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const flashOn = Math.floor(world.time * 3) % 2 === 0;
  ctx.fillStyle = flashOn ? '#3388ff' : '#ff3344';
  for (const cruiser of policeCars) {
    if (cruiser.mesh.position.y < -50) continue;
    ctx.beginPath();
    ctx.arc(toX(cruiser.position.x), toY(cruiser.position.z), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player, always centered.
  ctx.fillStyle = '#55ff55';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
}
