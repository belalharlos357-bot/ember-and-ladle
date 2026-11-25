// Ember & Ladle — the chef: walking the kitchen floor, colliding with the
// counters, and the one context-sensitive interaction (Space, E or a click)
// that picks up, places, chops, grills, assembles and serves.
import {
  CHEF_RADIUS,
  CHEF_SPEED,
  INGREDIENTS,
  INTERACT_RANGE,
  KITCHEN_COLS,
  KITCHEN_ROWS,
  KITCHEN_TOP,
  PLATE_MAX_ITEMS,
  TILE,
} from './config.js';

export function createChef(kitchen) {
  const chef = {
    x: 640,
    y: 576,
    dirX: 0,
    dirY: 1,
    carrying: null,
    walkTarget: null,
    moving: false,
  };

  function reset() {
    chef.x = 640;
    chef.y = 576;
    chef.dirX = 0;
    chef.dirY = 1;
    chef.carrying = null;
    chef.walkTarget = null;
    chef.moving = false;
  }

  function tileCol(x) {
    return Math.floor(x / TILE);
  }

  function tileRow(y) {
    return Math.floor((y - KITCHEN_TOP) / TILE);
  }

  // Axis-separated collision: the chef is a square of half-size CHEF_RADIUS;
  // after each axis move, any overlapping solid tile pushes it back out.
  function collideAxis(axis, delta) {
    const half = CHEF_RADIUS;
    const minCol = tileCol(chef.x - half);
    const maxCol = tileCol(chef.x + half);
    const minRow = tileRow(chef.y - half);
    const maxRow = tileRow(chef.y + half);
    for (let col = minCol; col <= maxCol; col += 1) {
      for (let row = minRow; row <= maxRow; row += 1) {
        if (!kitchen.isSolid(col, row)) continue;
        const tileLeft = col * TILE;
        const tileRight = tileLeft + TILE;
        const tileTop = KITCHEN_TOP + row * TILE;
        const tileBottom = tileTop + TILE;
        const overlapX = Math.min(chef.x + half, tileRight) - Math.max(chef.x - half, tileLeft);
        const overlapY = Math.min(chef.y + half, tileBottom) - Math.max(chef.y - half, tileTop);
        if (overlapX <= 0 || overlapY <= 0) continue;
        if (axis === 'x') {
          chef.x += delta > 0 ? -overlapX : overlapX;
        } else {
          chef.y += delta > 0 ? -overlapY : overlapY;
        }
      }
    }
  }

  function moveToward(tx, ty, dt) {
    const dx = tx - chef.x;
    const dy = ty - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) return true;
    const step = Math.min(dist, CHEF_SPEED * dt);
    const vx = (dx / dist) * step;
    const vy = (dy / dist) * step;
    chef.x += vx;
    collideAxis('x', vx);
    chef.y += vy;
    collideAxis('y', vy);
    chef.dirX = dx / dist;
    chef.dirY = dy / dist;
    chef.moving = true;
    return false;
  }

  function update(dt, input) {
    chef.moving = false;
    const mx = input.moveX;
    const my = input.moveY;
    if (mx !== 0 || my !== 0) {
      chef.walkTarget = null;
      const len = Math.hypot(mx, my);
      const vx = (mx / len) * CHEF_SPEED * dt;
      const vy = (my / len) * CHEF_SPEED * dt;
      chef.x += vx;
      collideAxis('x', vx);
      chef.y += vy;
      collideAxis('y', vy);
      chef.dirX = mx / len;
      chef.dirY = my / len;
      chef.moving = true;
      return;
    }
    if (chef.walkTarget) {
      const target = chef.walkTarget.points[chef.walkTarget.index];
      if (!target) {
        chef.walkTarget = null;
      } else if (moveToward(target.x, target.y, dt)) {
        chef.walkTarget.index += 1;
        if (chef.walkTarget.index >= chef.walkTarget.points.length) chef.walkTarget = null;
      }
    }
  }

  // Walk orders use a breadth-first path over the floor tiles, so a click on
  // the far side of the assembly island walks around it instead of pushing
  // against it. The path is tile centres, ending on the exact clicked point.
  function findPath(fromCol, fromRow, toCol, toRow) {
    const key = (c, r) => `${c},${r}`;
    const prev = new Map();
    const seen = new Set([key(fromCol, fromRow)]);
    const queue = [[fromCol, fromRow]];
    while (queue.length) {
      const [c, r] = queue.shift();
      if (c === toCol && r === toRow) {
        const tiles = [];
        let cur = key(c, r);
        while (cur) {
          const [cc, rr] = cur.split(',').map(Number);
          tiles.unshift([cc, rr]);
          cur = prev.get(cur);
        }
        return tiles;
      }
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nc >= KITCHEN_COLS || nr < 0 || nr >= KITCHEN_ROWS) continue;
        if (kitchen.isSolid(nc, nr) || seen.has(key(nc, nr))) continue;
        seen.add(key(nc, nr));
        prev.set(key(nc, nr), key(c, r));
        queue.push([nc, nr]);
      }
    }
    return null;
  }

  function setWalkTarget(x, y) {
    const col = tileCol(x);
    const row = tileRow(y);
    if (col < 0 || col >= KITCHEN_COLS || row < 0 || row >= KITCHEN_ROWS) return;
    if (kitchen.isSolid(col, row)) return;
    const fromCol = tileCol(chef.x);
    const fromRow = tileRow(chef.y);
    const tiles = findPath(fromCol, fromRow, col, row);
    if (!tiles) return;
    const points = tiles.slice(1).map(([c, r]) => ({
      x: c * TILE + TILE / 2,
      y: KITCHEN_TOP + r * TILE + TILE / 2,
    }));
    points.push({ x, y });
    chef.walkTarget = { points, index: 0 };
  }

  function carriedLabel() {
    if (!chef.carrying) return null;
    if (chef.carrying.kind === 'plate') {
      const names = chef.carrying.items.map((id) => INGREDIENTS[id].name);
      return names.length ? `Plate: ${names.join(', ')}` : 'Empty plate';
    }
    return INGREDIENTS[chef.carrying.id].name;
  }

  // The one interaction. Returns { sound, message } for the loop to play and
  // show, or { sound: 'error', message } when the action cannot happen.
  function interact() {
    const found = kitchen.nearestStation(chef.x, chef.y);
    if (!found.station || found.dist > INTERACT_RANGE) return { sound: null, message: '' };
    const station = found.station;
    const carrying = chef.carrying;

    if (station.kind === 'crate') {
      if (carrying) return { sound: 'error', message: 'Hands full — put this down first.' };
      chef.carrying = { kind: 'ingredient', id: station.item };
      return { sound: 'pickup', message: `Picked up ${INGREDIENTS[station.item].name}.` };
    }

    if (station.kind === 'grill') {
      const cell = kitchen.grill[station.slot];
      const state = kitchen.grillState(station.slot);
      if (state === 'burnt') {
        if (carrying) return { sound: 'error', message: 'That patty is burnt — clear it with empty hands.' };
        kitchen.grill[station.slot] = { item: null, t: 0 };
        const centre = kitchen.stationCenter(station.col, station.row);
        kitchen.smoke(centre.x, centre.y - 8);
        return { sound: 'place', message: 'Tossed the burnt patty.' };
      }
      if (state === 'empty') {
        if (!carrying || carrying.kind !== 'ingredient' || carrying.id !== 'patty') {
          return { sound: 'error', message: 'The grill takes a raw patty.' };
        }
        kitchen.grill[station.slot] = { item: 'patty', t: 0 };
        chef.carrying = null;
        return { sound: 'sizzle', message: 'Patty on the grill — 6 seconds.' };
      }
      if (state === 'cooking') {
        return { sound: null, message: 'Still cooking — give it a moment.' };
      }
      if (!carrying) {
        kitchen.grill[station.slot] = { item: null, t: 0 };
        chef.carrying = { kind: 'ingredient', id: 'patty_cooked' };
        return { sound: 'pickup', message: 'Picked up the grilled patty.' };
      }
      return { sound: 'error', message: 'Hands full — put this down first.' };
    }

    if (station.kind === 'board') {
      const state = kitchen.boardState();
      if (state === 'chopped') {
        if (carrying) return { sound: 'error', message: 'Hands full — put this down first.' };
        const chopped = INGREDIENTS[kitchen.board.item].chopped;
        kitchen.board = { item: null, t: 0 };
        chef.carrying = { kind: 'ingredient', id: chopped };
        return { sound: 'pickup', message: `Picked up ${INGREDIENTS[chopped].name}.` };
      }
      if (state === 'chopping') {
        return { sound: null, message: 'Still chopping…' };
      }
      if (!carrying || carrying.kind !== 'ingredient') {
        return { sound: 'error', message: 'The board takes something to chop.' };
      }
      const def = INGREDIENTS[carrying.id];
      if (!def.choppable) {
        return { sound: 'error', message: `${def.name} does not need chopping.` };
      }
      kitchen.board = { item: carrying.id, t: 0 };
      chef.carrying = null;
      return { sound: 'place', message: `Chopping the ${def.name.toLowerCase()}…` };
    }

    if (station.kind === 'assembly') {
      if (carrying && carrying.kind === 'plate') {
        kitchen.assembly.items = carrying.items.slice();
        chef.carrying = null;
        return { sound: 'place', message: 'Plate back on the counter.' };
      }
      if (carrying && carrying.kind === 'ingredient') {
        if (kitchen.assembly.items.length >= PLATE_MAX_ITEMS) {
          return { sound: 'error', message: 'The plate is full — serve it or bin it.' };
        }
        kitchen.assembly.items.push(carrying.id);
        chef.carrying = null;
        if (kitchen.plateReady(kitchen.assembly.items)) {
          const centre = kitchen.stationCenter(station.col, station.row);
          kitchen.burst(centre.x + TILE, centre.y - 12, '#ffd166', 12, 140);
          return { sound: 'ready', message: 'That plate matches an order — serve it!' };
        }
        return { sound: 'place', message: `Added ${INGREDIENTS[carrying.id].name} to the plate.` };
      }
      if (!kitchen.assembly.items.length) {
        return { sound: null, message: 'Build a dish here: bun first, then the rest.' };
      }
      chef.carrying = { kind: 'plate', items: kitchen.assembly.items.slice() };
      kitchen.assembly.items = [];
      return { sound: 'pickup', message: 'Picked up the plate.' };
    }

    if (station.kind === 'window') {
      if (!carrying) return { sound: null, message: 'Bring a finished plate here to serve it.' };
      if (carrying.kind !== 'plate') {
        return { sound: 'error', message: 'The window only takes finished plates.' };
      }
      const centre = kitchen.stationCenter(station.col, station.row);
      const result = kitchen.servePlate(carrying.items, centre.x + TILE, centre.y);
      if (!result) {
        return { sound: 'error', message: 'No order wants this dish — check the board.' };
      }
      chef.carrying = null;
      const tipText = result.tip > 0 ? ` (+${result.tip} tip)` : '';
      return { sound: 'coin', message: `Served! +${result.earned} coins${tipText}.` };
    }

    if (station.kind === 'bin') {
      if (!carrying) return { sound: null, message: 'Nothing to bin.' };
      chef.carrying = null;
      return { sound: 'place', message: 'Binned it.' };
    }

    return { sound: null, message: '' };
  }

  // The chef object itself is the public state: its x and y are read live by
  // the renderer and the screenshot stager, so the methods ride on it.
  Object.assign(chef, { reset, update, setWalkTarget, interact, carriedLabel });
  return chef;
}
