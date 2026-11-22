// Keyboard and Mouse input handler for walking, driving, and shooting.
export const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
  shoot: false,
  interact: false, // E or F to enter/exit car
  pause: false,
  map: false,
};

let mouseX = 0;
let mouseY = 0;
let mouseDeltaX = 0;
let mouseDeltaY = 0;
let isMouseDown = false;

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    updateKey(e.code, true);
    if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    updateKey(e.code, false);
  });

  canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
    keys.shoot = true;
  });

  window.addEventListener('mouseup', () => {
    isMouseDown = false;
    keys.shoot = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
      mouseDeltaX += e.clientX - mouseX;
      mouseDeltaY += e.clientY - mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
  });

  // Touch support for mobile/tablet or pointer clicks
  canvas.addEventListener('touchstart', () => {
    keys.shoot = true;
  });
  canvas.addEventListener('touchend', () => {
    keys.shoot = false;
  });
}

function updateKey(code, isDown) {
  switch (code) {
    case 'KeyW':
    case 'ArrowUp':
      keys.forward = isDown;
      break;
    case 'KeyS':
    case 'ArrowDown':
      keys.backward = isDown;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      keys.left = isDown;
      break;
    case 'KeyD':
    case 'ArrowRight':
      keys.right = isDown;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      keys.sprint = isDown;
      break;
    case 'Space':
      if (isDown && !keys.jump) keys.jumpOnce = true;
      keys.jump = isDown;
      break;
    case 'KeyE':
    case 'KeyF':
      if (isDown && !keys.interact) keys.interactPressed = true;
      keys.interact = isDown;
      break;
    case 'KeyP':
    case 'Escape':
      if (isDown && !keys.pause) keys.pausePressed = true;
      keys.pause = isDown;
      break;
    case 'KeyM':
      if (isDown && !keys.map) keys.mapPressed = true;
      keys.map = isDown;
      break;
  }
}

export function consumeInputs() {
  const jump = keys.jumpOnce;
  const interact = keys.interactPressed;
  const pause = keys.pausePressed;
  const map = keys.mapPressed;
  keys.jumpOnce = false;
  keys.interactPressed = false;
  keys.pausePressed = false;
  keys.mapPressed = false;
  
  const dx = mouseDeltaX;
  const dy = mouseDeltaY;
  mouseDeltaX = 0;
  mouseDeltaY = 0;

  return { jump, interact, pause, map, mouseDeltaX: dx, mouseDeltaY: dy };
}
