# ember-and-ladle

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/belalharlos357-bot/ember-and-ladle/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/belalharlos357-bot/ember-and-ladle/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Ember & Ladle** — a cozy rush kitchen. Orders come in on the board: grab ingredients from the crates, chop and grill them, build each dish on the assembly counter and serve it at the window before the customer's patience runs out. Four recipes combine in different ways, the grill can burn a patty, rush hour quickens the orders, and a combo grows when you serve on time. Pure HTML/CSS/JS canvas, no libraries, no network, no image or audio files — every sound is synthesised with the Web Audio API.

## Run it

```sh
node serve.ts
# open http://localhost:8080 in desktop Chrome
```

WASD / arrow keys to walk, Space / E / click to use a station, P to pause, R to restart. Or open `game/index.html` straight from the files (served by any static server).

## How it plays

- **Crates** (left wall): buns, raw patties, tomatoes, lettuce, cheese, onions.
- **Chopping board** (bottom): lay a tomato, lettuce or onion down and it chops itself.
- **Grill** (top, two slots): a raw patty cooks in 6 seconds — leave it past 12 and it burns.
- **Assembly counter** (middle): build the dish on the plate. When it matches an order it glows green and reads READY.
- **Serving window** (top right): hand the finished plate over for coins plus a tip; serving on time builds a combo.
- **Orders** arrive on the board with a patience bar; a lost order breaks the combo. At 60 seconds left, rush hour hits and everything quickens. The shift lasts 150 seconds, then the kitchen rates your shift in stars.

## Layout

- `game/` — the playable game as static files (`index.html` + `src/*.js`)
- `game/src/config.js` — the kitchen's shape, ingredients, recipes and timings
- `game/src/world.js` — orders, grill, board, assembly, timer, score
- `game/src/chef.js` — walking, collision and the one context-sensitive use action
- `game/src/render.js` — every pixel, drawn with the canvas 2D API
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesised sounds (chop, sizzle, ding, coin)
- `game/src/shots.js` — the four screenshot scenes (`?shot=cover|midgame|rush|serve`)
- `game/src/random.js` — seeded random numbers
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — four real renders of the game's own code

---

<sub>Entered on [make.fun](https://make.fun/?ref=wh5aaqez&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
