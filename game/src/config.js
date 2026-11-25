// Ember & Ladle — configuration: the kitchen's shape, its ingredients, its
// recipes and every timing the game runs on. One place, so tuning the game
// never means hunting through the rules or the renderer.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const HUD_HEIGHT = 64;
export const BOARD_TOP = 64;
export const BOARD_HEIGHT = 96;
export const KITCHEN_TOP = 160;
export const TILE = 64;
export const KITCHEN_COLS = 20;
export const KITCHEN_ROWS = 8;
export const MESSAGE_TOP = 672;

export const SHIFT_SECONDS = 150;
export const RUSH_AT_SECONDS_LEFT = 60;
export const MAX_ORDERS = 4;
export const ORDER_SPAWN_START = 11;
export const ORDER_SPAWN_END = 6;
export const ORDER_PATIENCE_START = 50;
export const ORDER_PATIENCE_END = 32;

export const CHOP_SECONDS = 1.4;
export const GRILL_SECONDS = 6;
export const BURN_SECONDS = 12;
export const CHEF_SPEED = 265;
export const CHEF_RADIUS = 20;
export const INTERACT_RANGE = 84;
export const PLATE_MAX_ITEMS = 4;
export const STEP = 1 / 60;

// Every ingredient the crates hold. A choppable one has a chopped form; the
// patty is the only grillable one; cheese is used as it comes.
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8a54b', dark: '#b97a28', choppable: false, chopped: null },
  patty: { name: 'Patty', color: '#8a4b2d', dark: '#5e2f1a', choppable: false, chopped: null, grillable: true },
  tomato: { name: 'Tomato', color: '#e4572e', dark: '#b23a1d', choppable: true, chopped: 'tomato_chopped' },
  lettuce: { name: 'Lettuce', color: '#58a34a', dark: '#3a7a30', choppable: true, chopped: 'lettuce_chopped' },
  cheese: { name: 'Cheese', color: '#ffc53d', dark: '#d99a12', choppable: false, chopped: null },
  onion: { name: 'Onion', color: '#b388eb', dark: '#7e57c2', choppable: true, chopped: 'onion_chopped' },
  patty_cooked: { name: 'Grilled patty', color: '#6e3b22', dark: '#4a2413', choppable: false, chopped: null },
  tomato_chopped: { name: 'Chopped tomato', color: '#ef6a4a', dark: '#c04527', choppable: false, chopped: null },
  lettuce_chopped: { name: 'Chopped lettuce', color: '#7cc46a', dark: '#4f8f3e', choppable: false, chopped: null },
  onion_chopped: { name: 'Chopped onion', color: '#c9a6f2', dark: '#8e6bc8', choppable: false, chopped: null },
  burnt: { name: 'Burnt patty', color: '#2b2b2b', dark: '#111111', choppable: false, chopped: null },
};

// The menu: what each dish needs on the plate, its coin value and how often
// the order board asks for it. A plate must hold exactly these items.
export const RECIPES = {
  classic: {
    name: 'Classic Burger',
    items: ['bun', 'patty_cooked', 'tomato_chopped', 'lettuce_chopped'],
    coins: 12,
    weight: 35,
  },
  cheese: {
    name: 'Cheese Melt',
    items: ['bun', 'patty_cooked', 'cheese', 'onion_chopped'],
    coins: 14,
    weight: 30,
  },
  garden: {
    name: 'Garden Stack',
    items: ['bun', 'tomato_chopped', 'lettuce_chopped', 'onion_chopped'],
    coins: 10,
    weight: 20,
  },
  double: {
    name: 'Double Ember',
    items: ['bun', 'patty_cooked', 'patty_cooked', 'cheese'],
    coins: 20,
    weight: 15,
  },
};

export const RECIPE_IDS = Object.keys(RECIPES);

// Stations, in kitchen tile coordinates. A station is a solid block of tiles
// the chef walks around and interacts with from beside it. kind drives the
// interaction; item names the crate's ingredient; slot indexes a grill slot.
export const STATIONS = [
  { kind: 'crate', item: 'bun', col: 0, row: 1, w: 1, h: 1, label: 'Buns' },
  { kind: 'crate', item: 'patty', col: 0, row: 2, w: 1, h: 1, label: 'Patties' },
  { kind: 'crate', item: 'tomato', col: 0, row: 3, w: 1, h: 1, label: 'Tomatoes' },
  { kind: 'crate', item: 'lettuce', col: 0, row: 4, w: 1, h: 1, label: 'Lettuce' },
  { kind: 'crate', item: 'cheese', col: 0, row: 5, w: 1, h: 1, label: 'Cheese' },
  { kind: 'crate', item: 'onion', col: 0, row: 6, w: 1, h: 1, label: 'Onions' },
  { kind: 'grill', slot: 0, col: 9, row: 0, w: 1, h: 1, label: 'Grill' },
  { kind: 'grill', slot: 1, col: 10, row: 0, w: 1, h: 1, label: 'Grill' },
  { kind: 'window', col: 14, row: 0, w: 3, h: 1, label: 'Serve' },
  { kind: 'board', col: 4, row: 7, w: 2, h: 1, label: 'Chopping board' },
  { kind: 'assembly', col: 9, row: 4, w: 2, h: 1, label: 'Assembly' },
  { kind: 'bin', col: 17, row: 7, w: 1, h: 1, label: 'Bin' },
];

// The palette, kept warm and appetising: cream walls, terracotta floor,
// dark wood counters, a chalkboard-green order board.
export const COLORS = {
  floorA: '#e9c9a0',
  floorB: '#dfb586',
  wall: '#7a4a2b',
  counterTop: '#a9743f',
  counterSide: '#7c4f27',
  counterEdge: '#5e3a1c',
  hud: '#2b1d16',
  hudText: '#fff3e0',
  board: '#2f4f3e',
  boardEdge: '#22392c',
  gold: '#ffb703',
  red: '#e4572e',
  green: '#58a34a',
  cream: '#fff8ec',
  ink: '#3a2a1a',
};
