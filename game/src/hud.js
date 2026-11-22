// HUD updates and live minimap rendering
export function updateHUD(state) {
  const moneyEl = document.getElementById('hud-money');
  const healthEl = document.getElementById('hud-health');
  const wantedEl = document.getElementById('hud-wanted');
  const missionTitleEl = document.getElementById('hud-mission-title');
  const missionDescEl = document.getElementById('hud-mission-desc');
  const weaponEl = document.getElementById('hud-weapon');
  const speedEl = document.getElementById('hud-speedometer');

  if (moneyEl) moneyEl.textContent = `$${state.money}`;
  if (healthEl) healthEl.style.width = `${Math.max(0, Math.min(100, state.health))}%`;
  if (wantedEl) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      stars += i < state.wanted ? '★' : '☆';
    }
    wantedEl.textContent = stars;
  }
  if (missionTitleEl && state.currentMission) {
    missionTitleEl.textContent = state.currentMission.title;
    missionDescEl.textContent = state.currentMission.desc;
  }
  if (weaponEl) {
    weaponEl.textContent = `WEAPON: ${state.hasGun ? 'PISTOL' : 'PUNCH'}`;
  }
  if (speedEl) {
    if (state.isDriving) {
      speedEl.style.display = 'block';
      speedEl.textContent = `SPEED: ${Math.round(state.carSpeed)} MPH`;
    } else {
      speedEl.style.display = 'none';
    }
  }

  renderMinimap(state);
}

function renderMinimap(state) {
  const canvas = document.getElementById('minimap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  const scale = 0.25;
  const cx = w / 2;
  const cy = h / 2;

  // Draw player dot
  ctx.fillStyle = '#55ff55';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  // Draw mission objective marker if any
  if (state.currentMission && state.currentMission.targetPos) {
    const tx = cx + (state.currentMission.targetPos.x - state.playerPos.x) * scale;
    const ty = cy + (state.currentMission.targetPos.z - state.playerPos.z) * scale;
    ctx.fillStyle = '#ff7700';
    ctx.beginPath();
    ctx.arc(tx, ty, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
