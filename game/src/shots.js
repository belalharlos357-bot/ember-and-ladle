// Ember & Ladle — the screenshot scenes behind ?shot=cover|midgame|rush|serve.
// Each one builds a real, reachable kitchen state through the kitchen's own
// functions (orders, the grill, the board, the assembly plate) and parks the
// chef where a player would stand, so the frame is what a short shift really
// looks like. The same seed always gives the same frame.
import { CHOP_SECONDS, GRILL_SECONDS, SHIFT_SECONDS, TILE } from './config.js';
import { SCREEN_PLAY } from './render.js';

function tileCentre(col, row) {
  return { x: col * TILE + TILE / 2, y: 160 + row * TILE + TILE / 2 };
}

function orderWith(kitchen, recipeId, patienceRatio) {
  const order = kitchen.spawnOrder(recipeId);
  if (order) order.patience = order.patienceMax * patienceRatio;
  return order;
}

function baseShift(kitchen, chef, secondsLeft, coins, combo) {
  kitchen.startShift();
  kitchen.orders = [];
  kitchen.elapsed = SHIFT_SECONDS - secondsLeft;
  kitchen.timeLeft = secondsLeft;
  kitchen.coins = coins;
  kitchen.combo = combo;
  kitchen.bestCombo = Math.max(combo, 2);
  kitchen.spawnTimer = 8;
  chef.carrying = null;
  chef.walkTarget = null;
}

export function stageShot(name, kitchen, chef) {
  if (name === 'midgame') {
    baseShift(kitchen, chef, 70, 58, 2);
    orderWith(kitchen, 'classic', 0.62);
    orderWith(kitchen, 'cheese', 0.45);
    orderWith(kitchen, 'garden', 0.8);
    orderWith(kitchen, 'double', 0.55);
    kitchen.grill[0] = { item: 'patty', t: GRILL_SECONDS + 1 };
    kitchen.grill[1] = { item: 'patty', t: 3 };
    kitchen.board = { item: 'tomato', t: 0.7 };
    kitchen.assembly.items = ['bun', 'tomato_chopped', 'lettuce_chopped'];
    const spot = tileCentre(9, 1);
    chef.x = spot.x;
    chef.y = spot.y;
    chef.dirX = 0;
    chef.dirY = -1;
    kitchen.setMessage('The grill is ready — grab that patty!', 4);
    return { screen: SCREEN_PLAY, best: 58 };
  }

  if (name === 'rush') {
    baseShift(kitchen, chef, 42, 96, 3);
    kitchen.rush = true;
    kitchen.rushAnnounced = true;
    orderWith(kitchen, 'double', 0.18);
    orderWith(kitchen, 'classic', 0.24);
    orderWith(kitchen, 'cheese', 0.15);
    orderWith(kitchen, 'garden', 0.3);
    kitchen.grill[0] = { item: 'patty', t: 12.5 };
    kitchen.grill[1] = { item: 'patty', t: 5 };
    kitchen.board = { item: null, t: 0 };
    kitchen.assembly.items = [];
    chef.carrying = { kind: 'plate', items: ['bun', 'patty_cooked', 'tomato_chopped', 'lettuce_chopped'] };
    const spot = tileCentre(15, 1);
    chef.x = spot.x;
    chef.y = spot.y;
    chef.dirX = 0;
    chef.dirY = -1;
    kitchen.setMessage('RUSH HOUR! Orders are coming in fast — keep the grill hot!', 4);
    return { screen: SCREEN_PLAY, best: 96 };
  }

  if (name === 'serve') {
    baseShift(kitchen, chef, 58, 114, 2);
    orderWith(kitchen, 'cheese', 0.5);
    orderWith(kitchen, 'classic', 0.7);
    kitchen.grill[0] = { item: 'patty', t: 2.5 };
    kitchen.grill[1] = { item: null, t: 0 };
    kitchen.board = { item: 'lettuce', t: CHOP_SECONDS };
    kitchen.assembly.items = ['bun', 'patty_cooked', 'cheese', 'onion_chopped'];
    const spot = tileCentre(10, 5);
    chef.x = spot.x;
    chef.y = spot.y;
    chef.dirX = 0;
    chef.dirY = -1;
    const plateAt = kitchen.stationCenter(9, 4);
    kitchen.popup(plateAt.x + TILE + 96, plateAt.y - 18, '+18', '#ffb703');
    kitchen.setMessage('That plate matches an order — serve it!', 4);
    return { screen: SCREEN_PLAY, best: 114 };
  }

  // The cover: a burger mid-assembly, a patty on the grill, a chopped
  // lettuce waiting on the board, three orders on the board.
  baseShift(kitchen, chef, 105, 34, 2);
  orderWith(kitchen, 'classic', 0.75);
  orderWith(kitchen, 'cheese', 0.55);
  orderWith(kitchen, 'garden', 0.85);
  kitchen.grill[0] = { item: 'patty', t: 4 };
  kitchen.grill[1] = { item: null, t: 0 };
  kitchen.board = { item: 'tomato', t: 0.7 };
  kitchen.assembly.items = ['bun', 'patty_cooked', 'tomato_chopped'];
  chef.carrying = { kind: 'ingredient', id: 'lettuce_chopped' };
  const spot = tileCentre(9, 5);
  chef.x = spot.x;
  chef.y = spot.y;
  chef.dirX = 0;
  chef.dirY = -1;
  kitchen.setMessage('First orders are in — grab a bun and start building!', 4);
  return { screen: SCREEN_PLAY, best: 34 };
}
