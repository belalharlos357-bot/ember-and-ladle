// Ember & Ladle — the renderer: every pixel of the kitchen, drawn with the
// canvas 2D API. No image assets anywhere; the food, the chef, the counters
// and the order board are all code, so the game loads nothing over the wire.
import {
  BOARD_HEIGHT,
  BOARD_TOP,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  HUD_HEIGHT,
  INGREDIENTS,
  KITCHEN_COLS,
  KITCHEN_ROWS,
  KITCHEN_TOP,
  MESSAGE_TOP,
  RECIPES,
  STATIONS,
  TILE,
} from './config.js';
import { recipeCoins, recipeItems, recipeName } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

// One ingredient, drawn as a small appetising icon centred on (x, y) with
// diameter `size`. Every dish on the board and on the plate uses these.
export function drawIngredient(ctx, id, x, y, size) {
  const s = size / 2;
  const def = INGREDIENTS[id];
  if (!def) return;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = def.dark;
    roundRect(ctx, -s, -s * 0.25, s * 2, s * 0.7, s * 0.3);
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, -s * 0.2, s * 0.95, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    circle(ctx, -s * 0.4, -s * 0.75, s * 0.1);
    circle(ctx, s * 0.1, -s * 0.9, s * 0.1);
    circle(ctx, s * 0.45, -s * 0.6, s * 0.1);
    ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = def.dark;
    roundRect(ctx, -s, -s * 0.45, s * 2, s * 0.9, s * 0.35);
    ctx.fill();
    ctx.fillStyle = def.color;
    roundRect(ctx, -s * 0.92, -s * 0.55, s * 1.84, s * 0.72, s * 0.3);
    ctx.fill();
  } else if (id === 'patty_cooked') {
    ctx.fillStyle = def.dark;
    roundRect(ctx, -s, -s * 0.45, s * 2, s * 0.9, s * 0.35);
    ctx.fill();
    ctx.fillStyle = def.color;
    roundRect(ctx, -s * 0.92, -s * 0.55, s * 1.84, s * 0.72, s * 0.3);
    ctx.fill();
    ctx.strokeStyle = '#2e150a';
    ctx.lineWidth = s * 0.14;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.5);
    ctx.lineTo(-s * 0.5, s * 0.45);
    ctx.moveTo(s * 0.1, -s * 0.5);
    ctx.lineTo(s * 0.1, s * 0.45);
    ctx.moveTo(s * 0.6, -s * 0.5);
    ctx.lineTo(s * 0.6, s * 0.45);
    ctx.stroke();
  } else if (id === 'burnt') {
    ctx.fillStyle = '#1c1c1c';
    roundRect(ctx, -s, -s * 0.45, s * 2, s * 0.9, s * 0.35);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.9);
    ctx.quadraticCurveTo(-s * 0.6, -s * 1.4, -s * 0.3, -s * 1.6);
    ctx.moveTo(s * 0.3, -s * 0.9);
    ctx.quadraticCurveTo(s * 0.5, -s * 1.5, s * 0.2, -s * 1.7);
    ctx.stroke();
  } else if (id === 'tomato' || id === 'tomato_chopped') {
    ctx.fillStyle = def.color;
    circle(ctx, 0, 0, s * 0.9);
    ctx.fill();
    ctx.fillStyle = def.dark;
    circle(ctx, -s * 0.25, s * 0.2, s * 0.5);
    ctx.fill();
    if (id === 'tomato') {
      ctx.fillStyle = '#3a7a30';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(-s * 0.4, -s * 1.1);
      ctx.lineTo(0, -s * 0.95);
      ctx.lineTo(s * 0.4, -s * 1.1);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.strokeStyle = '#ffd9c9';
      ctx.lineWidth = s * 0.12;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.3);
      ctx.lineTo(s * 0.5, s * 0.3);
      ctx.moveTo(-s * 0.5, s * 0.3);
      ctx.lineTo(s * 0.5, -s * 0.3);
      ctx.stroke();
    }
  } else if (id === 'lettuce' || id === 'lettuce_chopped') {
    ctx.fillStyle = def.dark;
    for (const [ox, oy] of [[-0.45, 0.15], [0, -0.3], [0.45, 0.15]]) {
      circle(ctx, ox * s, oy * s, s * 0.55);
      ctx.fill();
    }
    ctx.fillStyle = def.color;
    for (const [ox, oy] of [[-0.45, 0.05], [0, -0.4], [0.45, 0.05]]) {
      circle(ctx, ox * s, oy * s, s * 0.5);
      ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, s * 0.6);
    ctx.lineTo(s * 0.9, s * 0.6);
    ctx.lineTo(0, -s * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = def.dark;
    circle(ctx, -s * 0.25, s * 0.25, s * 0.14);
    circle(ctx, s * 0.3, s * 0.05, s * 0.14);
    ctx.fill();
  } else if (id === 'onion' || id === 'onion_chopped') {
    ctx.strokeStyle = def.color;
    ctx.lineWidth = s * 0.22;
    circle(ctx, 0, 0, s * 0.75);
    ctx.stroke();
    ctx.strokeStyle = def.dark;
    ctx.lineWidth = s * 0.14;
    circle(ctx, 0, 0, s * 0.4);
    ctx.stroke();
    ctx.fillStyle = '#e8d5f2';
    circle(ctx, 0, 0, s * 0.14);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, items, x, y, size) {
  const s = size / 2;
  ctx.fillStyle = '#e8e2d4';
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.78, s * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9bfa8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.78, s * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();
  items.forEach((id, index) => {
    const offset = (index - (items.length - 1) / 2) * s * 0.55;
    drawIngredient(ctx, id, x + offset, y - s * 0.1, s * 0.95);
  });
}

function stationRect(station) {
  return {
    x: station.col * TILE,
    y: KITCHEN_TOP + station.row * TILE,
    w: station.w * TILE,
    h: station.h * TILE,
  };
}

export function createRenderer(canvas) {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');

  function drawFloor() {
    for (let col = 0; col < KITCHEN_COLS; col += 1) {
      for (let row = 0; row < KITCHEN_ROWS; row += 1) {
        ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
        ctx.fillRect(col * TILE, KITCHEN_TOP + row * TILE, TILE, TILE);
      }
    }
    ctx.strokeStyle = 'rgba(122, 74, 43, 0.25)';
    ctx.lineWidth = 1;
    for (let col = 0; col <= KITCHEN_COLS; col += 1) {
      ctx.beginPath();
      ctx.moveTo(col * TILE, KITCHEN_TOP);
      ctx.lineTo(col * TILE, KITCHEN_TOP + KITCHEN_ROWS * TILE);
      ctx.stroke();
    }
    for (let row = 0; row <= KITCHEN_ROWS; row += 1) {
      ctx.beginPath();
      ctx.moveTo(0, KITCHEN_TOP + row * TILE);
      ctx.lineTo(CANVAS_WIDTH, KITCHEN_TOP + row * TILE);
      ctx.stroke();
    }
  }

  function drawCounterBase(rect) {
    ctx.fillStyle = COLORS.counterSide;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = COLORS.counterTop;
    ctx.fillRect(rect.x, rect.y, rect.w, 14);
    ctx.fillStyle = COLORS.counterEdge;
    ctx.fillRect(rect.x, rect.y + 14, rect.w, 3);
  }

  function drawCrate(station) {
    const rect = stationRect(station);
    drawCounterBase(rect);
    ctx.fillStyle = '#c89a5e';
    roundRect(ctx, rect.x + 8, rect.y + 20, rect.w - 16, rect.h - 28, 6);
    ctx.fill();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 2;
    roundRect(ctx, rect.x + 8, rect.y + 20, rect.w - 16, rect.h - 28, 6);
    ctx.stroke();
    drawIngredient(ctx, station.item, rect.x + rect.w / 2, rect.y + 26, 26);
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(station.label, rect.x + rect.w / 2, rect.y + rect.h - 8);
  }

  function drawGrill(kitchen, station) {
    const rect = stationRect(station);
    const cell = kitchen.grill[station.slot];
    const state = kitchen.grillState(station.slot);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = state === 'cooking' ? '#ff7a3c' : '#555';
    roundRect(ctx, rect.x + 8, rect.y + 10, rect.w - 16, 14, 5);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(rect.x + 10 + i * 12, rect.y + 28);
      ctx.lineTo(rect.x + 10 + i * 12, rect.y + rect.h - 8);
      ctx.stroke();
    }
    if (cell.item) {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + 32;
      const id = state === 'burnt' ? 'burnt' : state === 'cooked' ? 'patty_cooked' : 'patty';
      drawIngredient(ctx, id, cx, cy, 32);
      if (state === 'cooking' || state === 'cooked') {
        const progress = state === 'cooked' ? 1 : cell.t / 6;
        ctx.strokeStyle = state === 'cooked' ? '#7cc46a' : '#ffb703';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
      }
      if (state === 'burnt') {
        ctx.fillStyle = '#ff6b5e';
        ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BURNT', cx, rect.y + 12);
      }
    }
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GRILL', rect.x + rect.w / 2, rect.y + rect.h - 6);
  }

  function drawWindow(kitchen) {
    const station = STATIONS.find((s) => s.kind === 'window');
    const rect = stationRect(station);
    drawCounterBase(rect);
    ctx.fillStyle = '#f6e3c2';
    roundRect(ctx, rect.x + 10, rect.y + 18, rect.w - 20, rect.h - 26, 8);
    ctx.fill();
    ctx.fillStyle = '#b98a3e';
    ctx.beginPath();
    ctx.arc(rect.x + rect.w / 2, rect.y + 34, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(rect.x + rect.w / 2 - 2, rect.y + 22, 4, 12);
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SERVE', rect.x + rect.w / 2, rect.y + rect.h - 8);
    const ready = kitchen.plateReady(kitchen.assembly.items) && kitchen.assembly.items.length > 0;
    if (ready) {
      ctx.fillStyle = '#2e7d32';
      ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
      ctx.fillText('ORDER UP!', rect.x + rect.w / 2, rect.y - 6);
    }
  }

  function drawBoard(kitchen) {
    const station = STATIONS.find((s) => s.kind === 'board');
    const rect = stationRect(station);
    drawCounterBase(rect);
    ctx.fillStyle = '#e8d3a8';
    roundRect(ctx, rect.x + 10, rect.y + 16, rect.w - 20, rect.h - 24, 8);
    ctx.fill();
    ctx.strokeStyle = '#b99a68';
    ctx.lineWidth = 2;
    roundRect(ctx, rect.x + 10, rect.y + 16, rect.w - 20, rect.h - 24, 8);
    ctx.stroke();
    const state = kitchen.boardState();
    if (kitchen.board.item) {
      const id = state === 'chopped' ? INGREDIENTS[kitchen.board.item].chopped : kitchen.board.item;
      drawIngredient(ctx, id, rect.x + rect.w / 2, rect.y + 34, 30);
      if (state === 'chopping') {
        const progress = kitchen.board.t / 1.4;
        ctx.fillStyle = '#ddd';
        roundRect(ctx, rect.x + 18, rect.y + rect.h - 16, rect.w - 36, 8, 4);
        ctx.fill();
        ctx.fillStyle = '#58a34a';
        roundRect(ctx, rect.x + 18, rect.y + rect.h - 16, (rect.w - 36) * progress, 8, 4);
        ctx.fill();
      }
    }
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHOP', rect.x + rect.w / 2, rect.y + rect.h - 6);
  }

  function drawAssembly(kitchen) {
    const station = STATIONS.find((s) => s.kind === 'assembly');
    const rect = stationRect(station);
    drawCounterBase(rect);
    const items = kitchen.assembly.items;
    const ready = kitchen.plateReady(items) && items.length > 0;
    if (ready) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 180);
      ctx.strokeStyle = `rgba(124, 196, 106, ${0.55 + 0.45 * pulse})`;
      ctx.lineWidth = 5;
      roundRect(ctx, rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6, 10);
      ctx.stroke();
    }
    drawPlate(ctx, items, rect.x + rect.w / 2, rect.y + rect.h / 2 + 4, 74);
    if (ready) {
      ctx.fillStyle = '#2e7d32';
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('READY', rect.x + rect.w / 2, rect.y - 6);
    } else if (items.length > 0) {
      ctx.fillStyle = COLORS.hudText;
      ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BUILDING…', rect.x + rect.w / 2, rect.y - 6);
    }
  }

  function drawBin() {
    const station = STATIONS.find((s) => s.kind === 'bin');
    const rect = stationRect(station);
    drawCounterBase(rect);
    ctx.fillStyle = '#4a4a55';
    roundRect(ctx, rect.x + 14, rect.y + 16, rect.w - 28, rect.h - 24, 6);
    ctx.fill();
    ctx.fillStyle = '#33333c';
    roundRect(ctx, rect.x + 10, rect.y + 12, rect.w - 20, 10, 5);
    ctx.fill();
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BIN', rect.x + rect.w / 2, rect.y + rect.h - 6);
  }

  function drawDecor() {
    // Back counter dressing: a pot, a kettle, a stack of plates, a herb pot.
    const pot = (x, y) => {
      ctx.fillStyle = '#5b6b7a';
      roundRect(ctx, x - 18, y - 8, 36, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#3c4854';
      ctx.fillRect(x - 22, y - 12, 44, 6);
    };
    pot(2 * TILE + 32, KITCHEN_TOP + 32);
    pot(6 * TILE + 32, KITCHEN_TOP + 32);
    ctx.fillStyle = '#c98f4e';
    ctx.beginPath();
    ctx.arc(12 * TILE + 32, KITCHEN_TOP + 26, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#58a34a';
    for (const [ox, oy] of [[-8, -12], [0, -18], [8, -12]]) {
      circle(ctx, 12 * TILE + 32 + ox, KITCHEN_TOP + 26 + oy, 7);
      ctx.fill();
    }
    // Plates stacked on the back counter.
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(18 * TILE + 32, KITCHEN_TOP + 44 - i * 5, 20, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // The fridge and the oven on the right wall.
    ctx.fillStyle = '#dfe6ea';
    roundRect(ctx, 19 * TILE + 6, KITCHEN_TOP + TILE + 8, TILE - 12, TILE * 2 - 16, 8);
    ctx.fill();
    ctx.strokeStyle = '#9fb0ba';
    ctx.lineWidth = 2;
    ctx.strokeRect(19 * TILE + 6, KITCHEN_TOP + TILE + 8, TILE - 12, TILE * 2 - 16);
    ctx.fillStyle = '#7a8a94';
    ctx.fillRect(19 * TILE + 44, KITCHEN_TOP + TILE + 40, 6, 22);
    ctx.fillStyle = '#3c4854';
    roundRect(ctx, 19 * TILE + 6, KITCHEN_TOP + TILE * 4 + 8, TILE - 12, TILE * 2 - 16, 8);
    ctx.fill();
    ctx.fillStyle = '#ff9a3c';
    roundRect(ctx, 19 * TILE + 14, KITCHEN_TOP + TILE * 4 + 26, TILE - 28, TILE - 40, 6);
    ctx.fill();
    ctx.fillStyle = '#2b1d16';
    ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OVEN', 19 * TILE + 32, KITCHEN_TOP + TILE * 5 + 44);
  }

  function drawChef(chef) {
    const { x, y } = chef;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(x, y + 20, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body: a teal shirt under a cream apron.
    ctx.fillStyle = '#2e7d6b';
    roundRect(ctx, x - 17, y - 8, 34, 30, 12);
    ctx.fill();
    ctx.fillStyle = '#fff8ec';
    roundRect(ctx, x - 12, y - 2, 24, 24, 8);
    ctx.fill();
    ctx.fillStyle = '#2e7d6b';
    ctx.fillRect(x - 12, y - 2, 24, 4);
    // Head and the tall chef's hat.
    ctx.fillStyle = '#f2c29b';
    circle(ctx, x, y - 18, 13);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circle(ctx, x - 9, y - 30, 8);
    circle(ctx, x, y - 34, 9);
    circle(ctx, x + 9, y - 30, 8);
    ctx.fill();
    ctx.fillRect(x - 13, y - 32, 26, 10);
    // Face, looking where the chef faces.
    const lookX = chef.dirX * 3;
    const lookY = chef.dirY * 2;
    ctx.fillStyle = '#2b1d16';
    circle(ctx, x - 5 + lookX, y - 19 + lookY, 1.8);
    circle(ctx, x + 5 + lookX, y - 19 + lookY, 1.8);
    ctx.fill();
    ctx.strokeStyle = '#2b1d16';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x + lookX, y - 13 + lookY, 4, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // Whatever the chef carries rides above the hat.
    if (chef.carrying) {
      const cy = y - 58;
      ctx.fillStyle = 'rgba(255, 248, 236, 0.95)';
      circle(ctx, x, cy, 20);
      ctx.fill();
      ctx.strokeStyle = '#d9c39a';
      ctx.lineWidth = 2;
      circle(ctx, x, cy, 20);
      ctx.stroke();
      if (chef.carrying.kind === 'plate') {
        drawPlate(ctx, chef.carrying.items, x, cy, 30);
      } else {
        drawIngredient(ctx, chef.carrying.id, x, cy, 26);
      }
    }
  }

  function drawOrderCard(order, x, y, w, h) {
    const urgent = order.patience / order.patienceMax < 0.28;
    ctx.fillStyle = urgent ? '#5c2f2a' : COLORS.board;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#ff6b5e' : COLORS.boardEdge;
    ctx.lineWidth = urgent ? 3 : 2;
    roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(recipeName(order.recipeId), x + 12, y + 22);
    // The dish, as a row of ingredient icons.
    const items = recipeItems(order.recipeId);
    items.forEach((id, index) => {
      drawIngredient(ctx, id, x + 24 + index * 30, y + 44, 24);
    });
    // Coin value.
    ctx.fillStyle = COLORS.gold;
    circle(ctx, x + w - 52, y + 20, 10);
    ctx.fill();
    ctx.fillStyle = '#7a5a00';
    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', x + w - 52, y + 24);
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(order.coins), x + w - 38, y + 25);
    // Patience bar.
    const barW = w - 24;
    const ratio = Math.max(0, order.patience / order.patienceMax);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    roundRect(ctx, x + 12, y + h - 20, barW, 10, 5);
    ctx.fill();
    ctx.fillStyle = ratio > 0.5 ? '#7cc46a' : ratio > 0.28 ? '#ffb703' : '#ff5a4e';
    if (ratio > 0) {
      roundRect(ctx, x + 12, y + h - 20, barW * ratio, 10, 5);
      ctx.fill();
    }
  }

  function drawOrderBoard(kitchen) {
    ctx.fillStyle = '#241811';
    ctx.fillRect(0, BOARD_TOP, CANVAS_WIDTH, BOARD_HEIGHT);
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ORDER BOARD', 16, BOARD_TOP + 20);
    ctx.fillStyle = 'rgba(255, 243, 224, 0.55)';
    ctx.font = '12px "Trebuchet MS", sans-serif';
    ctx.fillText('serve the dish exactly as ordered', 16, BOARD_TOP + 38);
    const cardW = 252;
    const gap = 14;
    const startX = 210;
    kitchen.orders.forEach((order, index) => {
      drawOrderCard(order, startX + index * (cardW + gap), BOARD_TOP + 8, cardW, BOARD_HEIGHT - 16);
    });
    if (kitchen.orders.length === 0) {
      ctx.fillStyle = 'rgba(255, 243, 224, 0.6)';
      ctx.font = 'italic 15px "Trebuchet MS", sans-serif';
      ctx.fillText('No orders yet — the lunch crowd is coming…', startX + 10, BOARD_TOP + 52);
    }
  }

  function drawHud(kitchen, best) {
    ctx.fillStyle = COLORS.hud;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Ember & Ladle', 16, 34);
    ctx.fillStyle = 'rgba(255, 243, 224, 0.6)';
    ctx.font = '12px "Trebuchet MS", sans-serif';
    ctx.fillText('a cozy rush kitchen', 16, 52);
    // The shift timer, big in the middle.
    const total = Math.max(0, Math.ceil(kitchen.timeLeft));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;
    const low = kitchen.timeLeft <= 30 && kitchen.started;
    ctx.fillStyle = low ? '#ff6b5e' : '#fff3e0';
    ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(timeText, CANVAS_WIDTH / 2, 42);
    ctx.fillStyle = 'rgba(255, 243, 224, 0.6)';
    ctx.font = '11px "Trebuchet MS", sans-serif';
    ctx.fillText(kitchen.rush ? 'RUSH HOUR' : 'SHIFT', CANVAS_WIDTH / 2, 58);
    if (kitchen.rush && kitchen.started) {
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 200);
      ctx.fillStyle = `rgba(255, 107, 94, ${pulse})`;
      ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
      ctx.fillText('RUSH HOUR!', CANVAS_WIDTH / 2 + 120, 40);
    }
    // Coins and combo, on the right.
    ctx.fillStyle = COLORS.gold;
    circle(ctx, CANVAS_WIDTH - 178, 26, 12);
    ctx.fill();
    ctx.fillStyle = '#7a5a00';
    ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', CANVAS_WIDTH - 178, 31);
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(kitchen.coins), CANVAS_WIDTH - 160, 35);
    if (kitchen.combo >= 2) {
      ctx.fillStyle = '#ff8fa3';
      roundRect(ctx, CANVAS_WIDTH - 108, 12, 92, 28, 14);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Combo x${kitchen.combo}`, CANVAS_WIDTH - 62, 32);
    }
    ctx.fillStyle = 'rgba(255, 243, 224, 0.6)';
    ctx.font = '12px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Best ${best}`, CANVAS_WIDTH - 16, 56);
    // Shift progress, a thin bar under the HUD.
    const progress = kitchen.started || kitchen.over ? 1 - kitchen.timeLeft / 150 : 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, HUD_HEIGHT - 5, CANVAS_WIDTH, 5);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(0, HUD_HEIGHT - 5, CANVAS_WIDTH * progress, 5);
  }

  function drawParticles(kitchen) {
    for (const p of kitchen.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = p.color;
      circle(ctx, p.x, p.y, p.size * (0.5 + alpha * 0.5));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPopups(kitchen) {
    ctx.textAlign = 'center';
    for (const p of kitchen.popups) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${p.size}px "Trebuchet MS", sans-serif`;
      ctx.strokeStyle = 'rgba(43, 29, 22, 0.8)';
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawMessage(kitchen) {
    const text = kitchen.elapsed < kitchen.message.until ? kitchen.message.text : '';
    ctx.fillStyle = '#241811';
    ctx.fillRect(0, MESSAGE_TOP, CANVAS_WIDTH, CANVAS_HEIGHT - MESSAGE_TOP);
    if (text) {
      ctx.fillStyle = '#ffe9b8';
      ctx.font = '15px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, CANVAS_WIDTH / 2, MESSAGE_TOP + 30);
    } else {
      ctx.fillStyle = 'rgba(255, 243, 224, 0.45)';
      ctx.font = '13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WASD / arrows to walk · Space / E / click to use a station · P to pause', CANVAS_WIDTH / 2, MESSAGE_TOP + 30);
    }
  }

  function drawPanel(title, lines, footnote) {
    ctx.fillStyle = 'rgba(20, 12, 8, 0.62)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const w = 620;
    const h = 150 + lines.length * 34;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = (CANVAS_HEIGHT - h) / 2;
    ctx.fillStyle = '#fff8ec';
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = '#d9a45b';
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, w, h, 16);
    ctx.stroke();
    ctx.fillStyle = '#3a2a1a';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, CANVAS_WIDTH / 2, y + 56);
    ctx.font = '16px "Trebuchet MS", sans-serif';
    lines.forEach((line, index) => {
      ctx.fillText(line, CANVAS_WIDTH / 2, y + 100 + index * 34);
    });
    if (footnote) {
      ctx.fillStyle = '#8a5a2b';
      ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
      ctx.fillText(footnote, CANVAS_WIDTH / 2, y + h - 26);
    }
  }

  function drawTitle(kitchen) {
    drawPanel('Ember & Ladle', [
      'A cozy rush kitchen. Orders come in on the board —',
      'grab ingredients from the crates, chop and grill them,',
      'build each dish on the assembly counter and serve it',
      'at the window before the customer\'s patience runs out.',
      'WASD / arrows to walk · Space / E / click to use a station',
    ], 'Press Enter to start the shift');
  }

  function drawPaused() {
    drawPanel('Paused', [
      'The grill is holding. The orders are waiting.',
      'Take a breath — the lunch crowd is not going anywhere.',
    ], 'Press P to keep cooking');
  }

  function drawOver(kitchen) {
    const count = kitchen.stars();
    const starRow = '★'.repeat(count) + '☆'.repeat(3 - count);
    drawPanel('Shift complete!', [
      `${starRow}`,
      `Coins earned: ${kitchen.coins}   ·   Dishes served: ${kitchen.served}`,
      `Orders lost: ${kitchen.lost}   ·   Best combo: x${kitchen.bestCombo}`,
      count === 3 ? 'A flawless shift — the regulars are already back.' :
      count === 2 ? 'A fine shift — the kitchen sang today.' :
      count === 1 ? 'A shift survived — the grill forgives, mostly.' :
      'A rough shift — tomorrow the ladle is yours again.',
    ], 'Press Enter to cook another shift');
  }

  function draw(kitchen, chef, screen, best) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawFloor();
    drawDecor();
    for (const station of STATIONS) {
      if (station.kind === 'crate') drawCrate(station);
      else if (station.kind === 'grill') drawGrill(kitchen, station);
      else if (station.kind === 'board') drawBoard(kitchen);
      else if (station.kind === 'assembly') drawAssembly(kitchen);
      else if (station.kind === 'bin') drawBin();
    }
    drawWindow(kitchen);
    drawChef(chef);
    drawParticles(kitchen);
    drawPopups(kitchen);
    drawOrderBoard(kitchen);
    drawHud(kitchen, best);
    drawMessage(kitchen);
    if (screen === SCREEN_TITLE) drawTitle(kitchen);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(kitchen);
  }

  return { draw, drawIngredient, drawPlate };
}
