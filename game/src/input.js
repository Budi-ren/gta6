// Keyboard + mouse input, built around a binding table: each gameplay action
// maps to one or more physical codes, and the loop reads the `keys` object
// for held state plus consumeInputs() for edge-triggered presses (jump,
// enter/exit, pause, map fire exactly once per key press).
const BINDINGS = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  jump: ['Space'],
  shoot: ['Mouse0'],
  interact: ['KeyE', 'KeyF'],
  pause: ['KeyP', 'Escape'],
  map: ['KeyM'],
};

export const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
  shoot: false,
  interact: false,
  pause: false,
  map: false,
};

const heldCodes = new Set();
const edgeCodes = new Set();
let dragX = 0;
let dragY = 0;
let dragging = false;
let lastPointer = { x: 0, y: 0 };

function actionFor(code) {
  for (const entry of Object.entries(BINDINGS)) {
    if (entry[1].includes(code)) return entry[0];
  }
  return null;
}

function refreshHeld() {
  for (const [action, codes] of Object.entries(BINDINGS)) {
    keys[action] = codes.some((code) => heldCodes.has(code));
  }
}

export function initInput(canvas) {
  window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
    if (!heldCodes.has(event.code)) edgeCodes.add(event.code);
    heldCodes.add(event.code);
    refreshHeld();
  });

  window.addEventListener('keyup', (event) => {
    heldCodes.delete(event.code);
    refreshHeld();
  });

  canvas.addEventListener('mousedown', (event) => {
    dragging = true;
    keys.shoot = true;
    // A click is an edge too: record it so a fast click can never fall
    // between two frames at low frame rates.
    edgeCodes.add('Mouse0');
    lastPointer = { x: event.clientX, y: event.clientY };
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
    keys.shoot = false;
  });

  canvas.addEventListener('mousemove', (event) => {
    if (!dragging) return;
    dragX += event.clientX - lastPointer.x;
    dragY += event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
  });

  canvas.addEventListener('touchstart', () => {
    keys.shoot = true;
    edgeCodes.add('Mouse0');
  }, { passive: true });
  canvas.addEventListener('touchend', () => {
    keys.shoot = false;
  });
}

function edge(action) {
  return BINDINGS[action].some((code) => edgeCodes.has(code));
}

// Returns the presses that happened since the last call, plus how far the
// mouse was dragged (camera orbit), then clears both for the next frame.
export function consumeInputs() {
  const out = {
    jump: edge('jump'),
    interact: edge('interact'),
    pause: edge('pause'),
    map: edge('map'),
    shoot: edge('shoot'),
    lookX: dragX,
    lookY: dragY,
  };
  edgeCodes.clear();
  dragX = 0;
  dragY = 0;
  return out;
}

// Kept for callers that probe bindings: which action does this code trigger?
export function boundAction(code) {
  return actionFor(code);
}
