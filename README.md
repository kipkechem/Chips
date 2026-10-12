# Lockstep

A turn-based puzzle game inspired by *Chip's Challenge*. Study the level in full
light, then the lights go out and you play from memory. Colored keys open colored
doors, lava hides in the dark, and every enemy moves only when you do.

See [GAME_DESIGN.md](GAME_DESIGN.md) for the full concept.

## Play

No build step. Serve the folder and open `index.html`:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Controls: arrow keys or WASD to move, Space to wait a turn, F to peek, R to
restart, Z to undo (Easy only), Esc for the level list. On a phone, swipe the
board or use the on-screen pad.

## Files

| File | What it is |
|---|---|
| `core.js` | Game rules as pure functions (no DOM). Shared by the game and the solver. |
| `levels.js` | Level maps, hints and par values. The map legend is in `core.js`. |
| `index.html` | The game: rendering, input, menus, sound. |
| `tools/solve.js` | Breadth-first solver. Proves each level is beatable and checks its par. |

## Adding a level

1. Add an entry to `levels.js` with `par: 0`.
2. Run `node tools/solve.js`. It prints the real par (or `par=null` if the level
   cannot be beaten). Set `VERBOSE=1` to see the winning move list.
3. Put the printed par into the level and run the solver again; every line should say `ok`.
