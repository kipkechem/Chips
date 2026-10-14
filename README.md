# Lockstep

A real-time, grid-based pixel-art puzzle game inspired by *Chip's Challenge*, played in landscape.
Collect the chips, use colored keys on colored doors, and reach the flag, in real time. Spiders
wait behind the things you need: pick one up and they spot you, react half a second later and chase at nearly your speed, until
a gate stops them. Later levels are bigger than the screen, so you play from memory. Pick up a
jetpack, flamethrower, mega blaster or freeze bomb along the way.

See [GAME_DESIGN.md](GAME_DESIGN.md) for the full concept.

## Play

No build step. Serve the folder and open `index.html`:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

On a phone, hold it sideways: press a direction on the circle on the left to step, hold to run, slide your thumb to turn; tap power-ups on the right
(then pick a direction to fire). Keyboard:
arrows or WASD to move (hold to run), 1–4 to ready a power-up, Z undo, R restart,
P pause.

## Play on Android

Every push builds the Android app and publishes it as a release:

1. On your phone, open **https://github.com/kipkechem/Chips/releases/latest**.
2. Tap the `Lockstep-<number>.apk` file to download it.
3. Open the download. If Android asks, allow your browser to install unknown apps, then tap **Install**.

The app runs offline, opens in landscape and full screen, and the back button pauses
the game. To update, install a newer build over the old one; your stars are kept.

The build lives in `.github/workflows/android.yml`. It wraps the same web files with
[Capacitor](https://capacitorjs.com). To build locally you need Node 20, Java 17 and
the Android SDK:

```sh
npm install
node tools/build-web.js        # copies the game into www/ and bundles the fonts
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Files

| File | What it is |
|---|---|
| `core.js` | Game rules as pure functions (no DOM). Shared by the game and the solver. |
| `levels.js` | Level maps, hints and par values. The map legend is in `core.js`. |
| `art.js` | Pixel-art themes, sprites and the board renderer. |
| `index.html` | The game page: HUD (chip counter, keys, moves), menus, input, sound. |
| `tools/solve.js` | Solver. Proves each level is winnable and checks its par. |
| `tools/build-web.js` | Packs the game into `www/` for the Android app, with fonts bundled for offline play. |
| `assets/` | App icon sources. |

## Adding a level

1. Add an entry to `levels.js` with `par: 0`.
2. Run `node tools/solve.js` (or `node tools/solve.js 7` for one level). It prints the
   real par, or `par=null` if the level cannot be won. Set `VERBOSE=1` to see the
   winning moves. For a level too big to search, add a `route` (item positions to
   visit in order) and the solver uses the best route through them.
3. Put the printed par into the level and run the solver again; every line should say `ok`.
