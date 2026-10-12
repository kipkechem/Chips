# Lockstep

A turn-based, pixel-art puzzle game inspired by *Chip's Challenge*. Collect the chips,
use colored keys on colored doors, and reach the flag. Spiders sleep behind the
things you need. Once one sees you, it chases you until a wall or a gate stops it.
Nothing moves unless you do.

See [GAME_DESIGN.md](GAME_DESIGN.md) for the full concept.

## Play

No build step. Serve the folder and open `index.html`:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Controls: arrow keys or WASD to move, Space to wait a turn, Z to undo, R to
restart, P or Esc to pause, F to peek (Lights Out mode). On a phone, swipe the
board or use the on-screen pad.

## Files

| File | What it is |
|---|---|
| `core.js` | Game rules as pure functions (no DOM). Shared by the game and the solver. |
| `levels.js` | Level maps, hints and par values. The map legend is in `core.js`. |
| `art.js` | Pixel-art themes, sprites and the board renderer. |
| `index.html` | The game page: HUD, menus, input, sound. |
| `tools/solve.js` | Breadth-first solver. Proves each level is beatable and checks its par. |

## Adding a level

1. Add an entry to `levels.js` with `par: 0`.
2. Run `node tools/solve.js`. It prints the real par (or `par=null` if the level
   cannot be beaten). Set `VERBOSE=1` to see the winning move list.
3. Put the printed par into the level and run the solver again; every line should say `ok`.
