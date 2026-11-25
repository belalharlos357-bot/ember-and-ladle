// Ember & Ladle — boot and the one loop: input is read every frame, the
// kitchen advances in fixed 1/60 s steps (several in a slow frame, none in a
// fast one), and the renderer paints what is there. The game moves between
// four screens: title, play, paused and shift over.
//
// ?seed=N fixes the order pattern. ?shot=cover|midgame|rush|serve (with
// &seed=N) stages that scene instead of running the loop, paints it twice and
// sets window.__shotReady for a screenshot.
import { INTERACT_RANGE, STEP } from './config.js';
import { createRandom } from './random.js';
import { createSoundBoard } from './audio.js';
import { createKitchen } from './world.js';
import { createChef } from './chef.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, ACTION_USE, createInput } from './input.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, createRenderer } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const kitchen = createKitchen(createRandom(seed));
const chef = createChef(kitchen);
const renderer = createRenderer(canvas);
const sounds = createSoundBoard();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem('ember-and-ladle-best') ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem('ember-and-ladle-best', String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

// A screenshot scene: stage it, paint it twice and raise the flag.
function runShot(name) {
  const scene = stageShot(name, kitchen, chef);
  let painted = 0;
  function paint() {
    renderer.draw(kitchen, chef, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function describe() {
    if (screen === SCREEN_TITLE) return 'Ember and Ladle: a cozy rush kitchen. Press Enter to start the shift.';
    if (screen === SCREEN_OVER) {
      return `Shift over. ${kitchen.coins} coins, ${kitchen.served} dishes served, ${kitchen.stars()} stars. Press Enter to cook again.`;
    }
    const holding = chef.carriedLabel();
    return `Playing. ${Math.ceil(kitchen.timeLeft)} seconds left, ${kitchen.coins} coins, ${kitchen.orders.length} orders open${holding ? `, holding ${holding}` : ''}.`;
  }

  function playSounds(names) {
    for (const name of names) {
      if (typeof sounds[name] === 'function') sounds[name]();
    }
  }

  function step(dt) {
    const events = kitchen.tick(dt);
    playSounds(events);
    chef.update(dt, input);
  }

  function useStation() {
    const result = chef.interact();
    if (result.sound) playSounds([result.sound]);
    if (result.message) kitchen.setMessage(result.message, 3);
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;

    for (const action of input.takePressed()) {
      if (action === ACTION_CONFIRM) {
        if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
          sounds.unlock();
          sounds.start();
          kitchen.startShift();
          chef.reset();
          screen = SCREEN_PLAY;
        }
      } else if (action === ACTION_PAUSE) {
        if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
        else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      } else if (action === ACTION_RESTART) {
        if (screen !== SCREEN_TITLE) {
          kitchen.startShift();
          chef.reset();
          screen = SCREEN_PLAY;
        }
      } else if (action === ACTION_USE && screen === SCREEN_PLAY) {
        sounds.unlock();
        useStation();
      }
    }

    const click = input.takeClick();
    if (click && screen === SCREEN_PLAY) {
      sounds.unlock();
      // A click on a station the chef already stands beside uses it; any
      // other click is a walk order, and Space uses the station once there.
      const clicked = kitchen.nearestStation(click.x, click.y);
      const beside = kitchen.nearestStation(chef.x, chef.y);
      if (clicked.station && clicked.dist <= INTERACT_RANGE && beside.station === clicked.station && beside.dist <= INTERACT_RANGE) {
        useStation();
      } else {
        chef.setWalkTarget(click.x, click.y);
      }
    }

    if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        step(STEP);
        accumulator -= STEP;
      }
      if (kitchen.over) {
        screen = SCREEN_OVER;
        if (kitchen.coins > best) {
          best = kitchen.coins;
          saveBest(best);
        }
        playSounds(['start']);
      }
    } else {
      accumulator = 0;
    }

    renderer.draw(kitchen, chef, screen, best);
    live.screen = screen;
    const text = describe();
    if (status.textContent !== text) status.textContent = text;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// The game itself, for play-testing from the console or a script.
const live = { screen: SCREEN_TITLE, kitchen, chef };
window.__ember = live;

if (shot) runShot(shot);
else runGame();
