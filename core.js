// Lockstep game rules. Pure functions, no DOM: shared by the browser game and tools/solve.js.
(function (root) {
  'use strict';

  const DIRS = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };
  const KEY_COLORS = ['r', 'g', 'b', 'y'];
  const PATROL_DIRS = { '<': [-1, 0], '>': [1, 0], '^': [0, -1], v: [0, 1] };

  // Level map legend:
  //   #  wall           .  floor          @  start
  //   E  exit (opens when every core is collected)
  //   *  core           +  flare (extra peek)
  //   r g b y  keys     R G B Y  doors (each key opens one door, then it's gone)
  //   x  lava (deadly; a pushed crate sinks into it and makes floor)
  //   O  crate (pushable)
  //   < > ^ v  patroller (walks straight, turns around when blocked)
  //   C  hunter (steps toward you, can get stuck behind walls)
  //   M  mimic (copies every move you make)
  function parseLevel(def) {
    const rows = def.map;
    const h = rows.length;
    const w = Math.max(...rows.map((r) => r.length));
    const grid = [];
    const items = {};
    const crates = [];
    const enemies = [];
    let player = null;
    let coresTotal = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = rows[y][x] || '#';
        const i = y * w + x;
        let tile = '.';
        if (c === '#' || c === 'E' || c === 'x' || 'RGBY'.includes(c)) tile = c;
        else if (c === '@') player = { x, y };
        else if (c === '*' || c === '+' || KEY_COLORS.includes(c)) {
          items[i] = c;
          if (c === '*') coresTotal++;
        } else if (c === 'O') crates.push(i);
        else if (PATROL_DIRS[c]) {
          const [dx, dy] = PATROL_DIRS[c];
          enemies.push({ type: 'patrol', x, y, dx, dy });
        } else if (c === 'C') enemies.push({ type: 'hunter', x, y });
        else if (c === 'M') enemies.push({ type: 'mimic', x, y });
        grid.push(tile);
      }
    }
    if (!player) throw new Error(`Level "${def.name}" has no start (@)`);
    return {
      w,
      h,
      grid,
      items,
      crates,
      enemies,
      player,
      keys: { r: 0, g: 0, b: 0, y: 0 },
      cores: 0,
      coresTotal,
      flares: 0,
      steps: 0,
      battery: def.battery,
      status: 'play', // 'play' | 'won' | 'dead'
      cause: null,
    };
  }

  function clone(s) {
    return {
      ...s,
      grid: s.grid.slice(),
      items: { ...s.items },
      crates: s.crates.slice(),
      enemies: s.enemies.map((e) => ({ ...e })),
      player: { ...s.player },
      keys: { ...s.keys },
    };
  }

  const inBounds = (s, x, y) => x >= 0 && y >= 0 && x < s.w && y < s.h;
  const enemyAt = (s, x, y) => s.enemies.find((e) => e.x === x && e.y === y);

  // Enemies only walk on bare floor: walls, doors, lava, items, crates and the exit all stop them.
  function enemyCanEnter(s, x, y) {
    if (!inBounds(s, x, y)) return false;
    const i = y * s.w + x;
    if (s.grid[i] !== '.' || s.items[i] || s.crates.includes(i)) return false;
    return !enemyAt(s, x, y);
  }

  function tryEnemyStep(s, e, dx, dy) {
    if ((dx || dy) && enemyCanEnter(s, e.x + dx, e.y + dy)) {
      e.x += dx;
      e.y += dy;
      return true;
    }
    return false;
  }

  function moveEnemies(s, dir) {
    for (const e of s.enemies) {
      if (e.type === 'patrol') {
        if (!tryEnemyStep(s, e, e.dx, e.dy)) {
          e.dx = -e.dx;
          e.dy = -e.dy;
          tryEnemyStep(s, e, e.dx, e.dy);
        }
      } else if (e.type === 'hunter') {
        const ddx = Math.sign(s.player.x - e.x);
        const ddy = Math.sign(s.player.y - e.y);
        const horizFirst = Math.abs(s.player.x - e.x) >= Math.abs(s.player.y - e.y);
        if (horizFirst) tryEnemyStep(s, e, ddx, 0) || tryEnemyStep(s, e, 0, ddy);
        else tryEnemyStep(s, e, 0, ddy) || tryEnemyStep(s, e, ddx, 0);
      } else if (e.type === 'mimic') {
        if (dir) tryEnemyStep(s, e, DIRS[dir].dx, DIRS[dir].dy);
      }
    }
  }

  // Advance one turn. dir is 'up'|'down'|'left'|'right', or null to wait.
  // Every turn costs one battery, including bumping into a wall in the dark.
  function step(state, dir) {
    if (state.status !== 'play') return { state, events: [] };
    const s = clone(state);
    const events = [];
    const p = s.player;

    if (dir) {
      const { dx, dy } = DIRS[dir];
      const nx = p.x + dx;
      const ny = p.y + dy;
      const i = ny * s.w + nx;
      let moved = false;
      if (!inBounds(s, nx, ny) || s.grid[i] === '#') {
        events.push('bump');
      } else if ('RGBY'.includes(s.grid[i])) {
        const k = s.grid[i].toLowerCase();
        if (s.keys[k] > 0) {
          s.keys[k]--;
          s.grid[i] = '.';
          events.push('unlock');
          moved = true;
        } else events.push('locked');
      } else if (s.grid[i] === 'E') {
        if (s.cores >= s.coresTotal) moved = true;
        else events.push('sealed');
      } else if (s.crates.includes(i)) {
        const bx = nx + dx;
        const by = ny + dy;
        const bi = by * s.w + bx;
        const free =
          inBounds(s, bx, by) &&
          (s.grid[bi] === '.' || s.grid[bi] === 'x') &&
          !s.items[bi] &&
          !s.crates.includes(bi) &&
          !enemyAt(s, bx, by);
        if (free) {
          s.crates.splice(s.crates.indexOf(i), 1);
          if (s.grid[bi] === 'x') {
            s.grid[bi] = '.';
            events.push('sink');
          } else {
            s.crates.push(bi);
            events.push('push');
          }
          moved = true;
        } else events.push('bump');
      } else {
        moved = true;
      }

      if (moved) {
        p.x = nx;
        p.y = ny;
        const item = s.items[i];
        if (item) {
          delete s.items[i];
          if (item === '*') s.cores++;
          else if (item === '+') s.flares++;
          else s.keys[item]++;
          events.push('pickup:' + item);
        }
        if (s.grid[i] === 'x') return finish(s, events, 'dead', 'lava');
        if (enemyAt(s, p.x, p.y)) return finish(s, events, 'dead', 'caught');
        if (s.grid[i] === 'E') {
          s.steps++;
          return finish(s, events, 'won', null);
        }
      }
    } else {
      events.push('wait');
    }

    moveEnemies(s, dir);
    s.steps++;
    if (enemyAt(s, p.x, p.y)) return finish(s, events, 'dead', 'caught');
    if (s.battery && s.steps >= s.battery) return finish(s, events, 'dead', 'battery');
    return { state: s, events };
  }

  function finish(s, events, status, cause) {
    s.status = status;
    s.cause = cause;
    events.push(status);
    return { state: s, events };
  }

  // Compact string identity of everything that can change during play (for the solver).
  function stateKey(s) {
    return [
      s.player.x + ',' + s.player.y,
      s.grid.join(''),
      Object.keys(s.items).sort().join('.'),
      s.crates.slice().sort((a, b) => a - b).join('.'),
      s.enemies.map((e) => `${e.x},${e.y},${e.dx || 0},${e.dy || 0}`).join('|'),
      KEY_COLORS.map((k) => s.keys[k]).join(''),
    ].join(';');
  }

  const api = { DIRS, KEY_COLORS, parseLevel, step, clone, stateKey, enemyAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Lockstep = api;
})(this);
