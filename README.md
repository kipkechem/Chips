# Lockstep

A turn-based, pixel-art puzzle game inspired by *Chip's Challenge*, played in landscape.
Collect the chips, use colored keys on colored doors, and reach the flag. Spiders
never stop coming for you: whatever is in their way keeps them boxed in, until you pick
it up. Later levels are bigger than the screen, so you play from memory. Pick up a
jetpack, flamethrower, mega blaster or freeze bomb along the way.

See [GAME_DESIGN.md](GAME_DESIGN.md) for the full concept.

## Play

No build step. Serve the folder and open `index.html`:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

On a phone, hold it sideways: slide your thumb around the direction circle on the
left, and tap power-ups on the right (then pick a direction to fire). Keyboard:
arrows or WASD to move, Space to wait, 1–4 to ready a power-up, Z undo, R restart,
P pause.

## Files

| File | What it is |
|---|---|
| `core.js` | Game rules as pure functions (no DOM). Shared by the game and the solver. |
| `levels.js` | Level maps, hints and par values. The map legend is in `core.js`. |
| `art.js` | Pixel-art themes, sprites and the board renderer. |
| `index.html` | The game page: HUD, menus, input, sound. |
| `tools/solve.js` | Solver. Proves each level is winnable and checks its par. |

## Adding a level

1. Add an entry to `levels.js` with `par: 0`.
2. Run `node tools/solve.js` (or `node tools/solve.js 7` for one level). It prints the
   real par, or `par=null` if the level cannot be won. Set `VERBOSE=1` to see the
   winning moves. For a level too big to search, add a `route` (item positions to
   visit in order) and the solver uses the best route through them.
3. Put the printed par into the level and run the solver again; every line should say `ok`.
