// Ember & Ladle — the kitchen itself: orders, the grill, the chopping board,
// the assembly plate, the serving window, the shift timer and the score.
// Everything the player can do goes through here, so the rules live in one
// place and the renderer and the chef only ask it what happened.
import {
  BURN_SECONDS,
  CHOP_SECONDS,
  GRILL_SECONDS,
  INGREDIENTS,
  KITCHEN_COLS,
  KITCHEN_ROWS,
  KITCHEN_TOP,
  MAX_ORDERS,
  ORDER_PATIENCE_END,
  ORDER_PATIENCE_START,
  ORDER_SPAWN_END,
  ORDER_SPAWN_START,
  PLATE_MAX_ITEMS,
  RECIPES,
  RECIPE_IDS,
  RUSH_AT_SECONDS_LEFT,
  SHIFT_SECONDS,
  STATIONS,
  TILE,
} from './config.js';

function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const item of a) counts.set(item, (counts.get(item) || 0) + 1);
  for (const item of b) {
    const left = counts.get(item) || 0;
    if (left === 0) return false;
    counts.set(item, left - 1);
  }
  return true;
}

export function recipeItems(recipeId) {
  return RECIPES[recipeId].items.slice();
}

export function recipeName(recipeId) {
  return RECIPES[recipeId].name;
}

export function recipeCoins(recipeId) {
  return RECIPES[recipeId].coins;
}

export function createKitchen(random) {
  const solid = new Set();
  for (const station of STATIONS) {
    for (let c = station.col; c < station.col + station.w; c += 1) {
      for (let r = station.row; r < station.row + station.h; r += 1) solid.add(`${c},${r}`);
    }
  }
  // The counters run around the whole edge: the top row, the bottom row and
  // the right column are solid wall and counter even where no named station
  // sits, so the chef's floor is the open middle.
  for (let c = 0; c < KITCHEN_COLS; c += 1) {
    solid.add(`${c},0`);
    solid.add(`${c},${KITCHEN_ROWS - 1}`);
  }
  for (let r = 1; r < KITCHEN_ROWS - 1; r += 1) solid.add(`${KITCHEN_COLS - 1},${r}`);

  const kitchen = {
    random,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    rush: false,
    rushAnnounced: false,
    over: false,
    started: false,
    orders: [],
    nextOrderId: 1,
    spawnTimer: 4,
    grill: [
      { item: null, t: 0 },
      { item: null, t: 0 },
    ],
    board: { item: null, t: 0 },
    assembly: { items: [] },
    particles: [],
    popups: [],
    message: { text: '', until: 0 },
    lastTickSecond: -1,
  };

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = random.next() * Math.PI * 2;
      const v = speed * (0.4 + random.next() * 0.8);
      kitchen.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 40,
        life: 0.55 + random.next() * 0.35,
        maxLife: 0.9,
        color,
        size: 2.5 + random.next() * 3.5,
        gravity: 260,
      });
    }
  }

  function smoke(x, y) {
    kitchen.particles.push({
      x: x + (random.next() - 0.5) * 20,
      y,
      vx: (random.next() - 0.5) * 12,
      vy: -34 - random.next() * 22,
      life: 0.9 + random.next() * 0.5,
      maxLife: 1.4,
      color: '#cfc4b4',
      size: 7 + random.next() * 7,
      gravity: -30,
    });
  }

  function popup(x, y, text, color) {
    kitchen.popups.push({ x, y, text, life: 1.4, maxLife: 1.4, color: color || '#ffb703', size: 26 });
  }

  function setMessage(text, seconds) {
    kitchen.message = { text, until: kitchen.elapsed + (seconds || 3) };
  }

  function spawnInterval() {
    const progress = kitchen.elapsed / SHIFT_SECONDS;
    return ORDER_SPAWN_START + (ORDER_SPAWN_END - ORDER_SPAWN_START) * progress;
  }

  function patienceFor() {
    const progress = kitchen.elapsed / SHIFT_SECONDS;
    return ORDER_PATIENCE_START + (ORDER_PATIENCE_END - ORDER_PATIENCE_START) * progress;
  }

  function pickRecipe() {
    const entries = RECIPE_IDS.map((id) => ({ id, weight: RECIPES[id].weight }));
    return random.weighted(entries).id;
  }

  function spawnOrder(forceRecipeId) {
    if (kitchen.orders.length >= MAX_ORDERS) return null;
    const recipeId = forceRecipeId || pickRecipe();
    const patience = patienceFor();
    const order = {
      id: kitchen.nextOrderId,
      recipeId,
      patience,
      patienceMax: patience,
      coins: RECIPES[recipeId].coins,
    };
    kitchen.nextOrderId += 1;
    kitchen.orders.push(order);
    return order;
  }

  function orderForPlate(items) {
    for (const order of kitchen.orders) {
      if (sameItems(items, RECIPES[order.recipeId].items)) return order;
    }
    return null;
  }

  function plateReady(items) {
    return orderForPlate(items) !== null;
  }

  function reset() {
    kitchen.timeLeft = SHIFT_SECONDS;
    kitchen.elapsed = 0;
    kitchen.coins = 0;
    kitchen.served = 0;
    kitchen.lost = 0;
    kitchen.combo = 0;
    kitchen.bestCombo = 0;
    kitchen.rush = false;
    kitchen.rushAnnounced = false;
    kitchen.over = false;
    kitchen.started = false;
    kitchen.orders = [];
    kitchen.nextOrderId = 1;
    kitchen.spawnTimer = 4;
    kitchen.grill = [
      { item: null, t: 0 },
      { item: null, t: 0 },
    ];
    kitchen.board = { item: null, t: 0 };
    kitchen.assembly = { items: [] };
    kitchen.particles = [];
    kitchen.popups = [];
    kitchen.message = { text: '', until: 0 };
    kitchen.lastTickSecond = -1;
  }

  function startShift() {
    reset();
    kitchen.started = true;
    spawnOrder('classic');
    spawnOrder();
    setMessage('First orders are in — grab a bun and start building!', 4);
  }

  // One simulation step. Returns the sound names the step asks for, so the
  // loop can play them; particles and popups are kept here for the renderer.
  function tick(dt) {
    const sounds = [];
    if (!kitchen.started || kitchen.over) return sounds;
    kitchen.elapsed += dt;
    kitchen.timeLeft = Math.max(0, SHIFT_SECONDS - kitchen.elapsed);

    const whole = Math.ceil(kitchen.timeLeft);
    if (kitchen.timeLeft <= 10 && whole !== kitchen.lastTickSecond) {
      kitchen.lastTickSecond = whole;
      sounds.push('tick');
    }

    if (!kitchen.rush && kitchen.timeLeft <= RUSH_AT_SECONDS_LEFT) {
      kitchen.rush = true;
      if (!kitchen.rushAnnounced) {
        kitchen.rushAnnounced = true;
        sounds.push('rush');
        setMessage('RUSH HOUR! Orders are coming in fast — keep the grill hot!', 4);
      }
    }

    // New orders arrive on a timer that quickens through the shift.
    kitchen.spawnTimer -= dt * (kitchen.rush ? 1.35 : 1);
    if (kitchen.spawnTimer <= 0) {
      spawnOrder();
      kitchen.spawnTimer = spawnInterval();
    }

    // Patience drains; a starved order walks out and breaks the combo.
    for (let i = kitchen.orders.length - 1; i >= 0; i -= 1) {
      const order = kitchen.orders[i];
      order.patience -= dt * (kitchen.rush ? 1.25 : 1);
      if (order.patience <= 0) {
        kitchen.orders.splice(i, 1);
        kitchen.lost += 1;
        kitchen.combo = 0;
        sounds.push('lost');
        setMessage(`${RECIPES[order.recipeId].name} walked out — the combo is gone.`, 3);
      }
    }

    // The grill cooks; a patty left too long burns.
    for (let slot = 0; slot < kitchen.grill.length; slot += 1) {
      const cell = kitchen.grill[slot];
      if (cell.item === 'patty') {
        cell.t += dt;
        if (Math.floor(cell.t * 2) !== Math.floor((cell.t - dt) * 2) && cell.t < GRILL_SECONDS) {
          smoke(stationCenter(9 + slot, 0).x, stationCenter(9 + slot, 0).y - 10);
        }
        if (cell.t >= GRILL_SECONDS && cell.t - dt < GRILL_SECONDS) {
          sounds.push('grillDone');
          popup(stationCenter(9 + slot, 0).x, stationCenter(9 + slot, 0).y - 26, 'Ready!', '#7cc46a');
        }
      }
    }

    // The board chops on its own once an ingredient is laid down.
    if (kitchen.board.item) {
      const before = kitchen.board.t;
      kitchen.board.t += dt;
      if (Math.floor(kitchen.board.t / 0.45) !== Math.floor(before / 0.45)) {
        sounds.push('chop');
        burst(stationCenter(4, 7).x + 16, stationCenter(4, 7).y - 6, INGREDIENTS[kitchen.board.item].color, 4, 90);
      }
      if (kitchen.board.t >= CHOP_SECONDS && before < CHOP_SECONDS) {
        sounds.push('chopDone');
        popup(stationCenter(4, 7).x + 16, stationCenter(4, 7).y - 30, 'Chopped!', '#7cc46a');
      }
    }

    // Particles and popups age out.
    for (let i = kitchen.particles.length - 1; i >= 0; i -= 1) {
      const p = kitchen.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      if (p.life <= 0) kitchen.particles.splice(i, 1);
    }
    for (let i = kitchen.popups.length - 1; i >= 0; i -= 1) {
      const p = kitchen.popups[i];
      p.life -= dt;
      p.y -= 34 * dt;
      if (p.life <= 0) kitchen.popups.splice(i, 1);
    }

    if (kitchen.timeLeft <= 0) {
      kitchen.over = true;
      kitchen.started = false;
    }
    return sounds;
  }

  function stationCenter(col, row) {
    return { x: col * TILE + TILE / 2, y: KITCHEN_TOP + row * TILE + TILE / 2 };
  }

  function isSolid(col, row) {
    if (col < 0 || col >= KITCHEN_COLS || row < 0 || row >= KITCHEN_ROWS) return true;
    return solid.has(`${col},${row}`);
  }

  function stationAtTile(col, row) {
    for (const station of STATIONS) {
      if (col >= station.col && col < station.col + station.w && row >= station.row && row < station.row + station.h) return station;
    }
    return null;
  }

  function stationTiles(station) {
    const tiles = [];
    for (let c = station.col; c < station.col + station.w; c += 1) {
      for (let r = station.row; r < station.row + station.h; r += 1) tiles.push({ col: c, row: r });
    }
    return tiles;
  }

  // The nearest station tile to a point, with its distance, for interaction.
  function nearestStation(x, y) {
    let best = null;
    let bestDist = Infinity;
    for (const station of STATIONS) {
      for (const tile of stationTiles(station)) {
        const centre = stationCenter(tile.col, tile.row);
        const dist = Math.hypot(centre.x - x, centre.y - y);
        if (dist < bestDist) {
          bestDist = dist;
          best = station;
        }
      }
    }
    return { station: best, dist: bestDist };
  }

  function grillState(slot) {
    const cell = kitchen.grill[slot];
    if (!cell.item) return 'empty';
    if (cell.t >= BURN_SECONDS) return 'burnt';
    if (cell.t >= GRILL_SECONDS) return 'cooked';
    return 'cooking';
  }

  function boardState() {
    if (!kitchen.board.item) return 'empty';
    return kitchen.board.t >= CHOP_SECONDS ? 'chopped' : 'chopping';
  }

  function servePlate(items, atX, atY) {
    const order = orderForPlate(items);
    if (!order) return null;
    kitchen.orders = kitchen.orders.filter((o) => o !== order);
    const tip = Math.round(order.coins * 0.5 * Math.max(0, order.patience / order.patienceMax));
    const comboBonus = Math.min(10, kitchen.combo * 2);
    const earned = order.coins + tip + comboBonus;
    kitchen.coins += earned;
    kitchen.served += 1;
    kitchen.combo += 1;
    kitchen.bestCombo = Math.max(kitchen.bestCombo, kitchen.combo);
    burst(atX, atY - 10, '#ffd166', 14, 160);
    popup(atX, atY - 44, `+${earned}`, '#ffb703');
    if (kitchen.combo >= 2) popup(atX, atY - 74, `Combo x${kitchen.combo}!`, '#ff8fa3');
    return { order, earned, tip, combo: kitchen.combo };
  }

  function stars() {
    if (kitchen.coins >= 150) return 3;
    if (kitchen.coins >= 100) return 2;
    if (kitchen.coins >= 55) return 1;
    return 0;
  }

  // The kitchen object itself is the public state: the chef, the renderer and
  // the screenshot stager all read and write these same fields, so nothing
  // goes stale behind a copy.
  Object.assign(kitchen, {
    burst,
    smoke,
    popup,
    setMessage,
    spawnOrder,
    orderForPlate,
    plateReady,
    reset,
    startShift,
    tick,
    stationCenter,
    isSolid,
    stationAtTile,
    nearestStation,
    grillState,
    boardState,
    servePlate,
    stars,
  });
  return kitchen;
}
