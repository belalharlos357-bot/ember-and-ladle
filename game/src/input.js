// Ember & Ladle — input: WASD and arrow keys to walk, Space or E to use a
// station, P or Escape to pause, Enter to start, R to restart; the mouse
// clicks a station to use it or the floor to walk there. Keys are read as a
// held set plus a pressed queue the loop consumes once per frame.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_USE = 'use';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';

const MOVE_KEYS = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

const ACTION_KEYS = {
  Space: ACTION_USE,
  KeyE: ACTION_USE,
  Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyR: ACTION_RESTART,
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = [];
  let click = null;

  function keyDown(event) {
    if (event.repeat) return;
    if (MOVE_KEYS[event.code] || ACTION_KEYS[event.code]) event.preventDefault();
    held.add(event.code);
    const action = ACTION_KEYS[event.code];
    if (action) pressed.push(action);
  }

  function keyUp(event) {
    held.delete(event.code);
  }

  function mouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', mouseDown);

  function moveVector() {
    let x = 0;
    let y = 0;
    for (const code of held) {
      const dir = MOVE_KEYS[code];
      if (!dir) continue;
      x += dir[0];
      y += dir[1];
    }
    return { x, y };
  }

  function takePressed() {
    const actions = pressed.slice();
    pressed.length = 0;
    return actions;
  }

  function takeClick() {
    const found = click;
    click = null;
    return found;
  }

  return {
    get moveX() { return moveVector().x; },
    get moveY() { return moveVector().y; },
    takePressed,
    takeClick,
  };
}
