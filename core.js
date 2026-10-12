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
  const POWERS = ['j', 'f', 'm', 'z']; // jetpack, flamethrower, mega blaster, freeze bomb
  const POWER_CHARGES = { j: 1, f: 3, m: 3, z: 1 };
  const AIMED = { j: true, f: true, m: true, z: false };
  const FLAME_RANGE = 3;
  const FREEZE_TURNS = 6;
  const BEAT = 4; // Neon beat blocks swap every BEAT moves
  const PATROL_DIRS = { '<': [-1, 0], '>': [1, 0], '^': [0, -1], v: [0, 1] };

  // Level map legend:
  //   #  wall           %  steel wall (nothing breaks it)    W  cracked wall (blaster or jetpack breaks it)
  //   .  floor          ~  ice (you slide until something stops you)
  //   :  crumbling floor (turns into a hole once you step off it)     H  hole (a pit nothing can cross)
  //   1 2  beat blocks (only one set is solid at a time; they swap every BEAT moves)
  //   =  fence (you walk through it; enemies can't, but flames and shots pass)
//   x  lava           E  exit (opens when every chip is collected)        @  start
  //   *  chip           r g b y  keys      R G B Y  doors (each key opens one door, then it's gone)
  //   j  jetpack        f  flamethrower    m  mega blaster      z  freeze bomb
  //   O  crate (pushable; sinks into lava and leaves floor)
  //   S  spider (always steps toward you; anything not bare floor blocks it)
  //   < > ^ v  patrol drone (flies straight, turns around when blocked)
  //   M  mimic (copies every move you make)
  //
  // An opened door stays in the grid as its lowercase letter: a gate. You can walk
  // through it; no enemy can cross it. A crumbled floor tile becomes H (a hole).
  function parseLevel(def) {
    const rows = def.map;
    const h = rows.length;
    const w = Math.max(...rows.map((r) => r.length));
    const grid = [];
    const items = {};
    const crates = [];
    const enemies = [];
    let player = null;
    let chipsTotal = 0;
    let beat = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = rows[y][x] || '#';
        const i = y * w + x;
        let tile = '.';
        if ('#%WH~:x12E='.includes(c) || 'RGBY'.includes(c)) {
          tile = c;
          if (c === '1' || c === '2') beat = true;
        } else if (c === '@') player = { x, y };
        else if (c === '*' || KEY_COLORS.includes(c) || POWERS.includes(c)) {
          items[i] = c;
          if (c === '*') chipsTotal++;
        } else if (c === 'O') crates.push(i);
        else if (c === 'S') enemies.push({ type: 'spider', x, y, stuck: false, frozen: 0 });
        else if (PATROL_DIRS[c]) {
          const [dx, dy] = PATROL_DIRS[c];
          enemies.push({ type: 'patrol', x, y, dx, dy, frozen: 0 });
        } else if (c === 'M') enemies.push({ type: 'mimic', x, y, frozen: 0 });
        else if (c !== '.' && c !== ' ') throw new Error(`Level "${def.name}" has unknown tile "${c}"`);
        grid.push(tile);
      }
    }
    if (!player) throw new Error(`Level "${def.name}" has no start (@)`);
    return {
      w,
      h,
      grid,
      grid0: grid.slice(), // never mutated; lets stateKey store only what changed
      items,
      crates,
      enemies,
      player,
      facing: 'down',
      keys: { r: 0, g: 0, b: 0, y: 0 },
      powers: { j: 0, f: 0, m: 0, z: 0 },
      chips: 0,
      chipsTotal,
      beat,
      steps: 0,
      battery: def.battery || 0, // 0 means no move limit
      slide: null,
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
      powers: { ...s.powers },
    };
  }

  const inBounds = (s, x, y) => x >= 0 && y >= 0 && x < s.w && y < s.h;
  const enemyAt = (s, x, y) => s.enemies.find((e) => e.x === x && e.y === y);
  const phase = (s) => Math.floor(s.steps / BEAT) % 2;
  const beatSolid = (s, g) => (g === '1' && phase(s) === 0) || (g === '2' && phase(s) === 1);
  const isEdge = (s, x, y) => x === 0 || y === 0 || x === s.w - 1 || y === s.h - 1;

  // Floor an enemy can stand on: plain, ice, crumbling, or a beat block that is currently open.
  function openFloor(s, g) {
    return g === '.' || g === '~' || g === ':' || ((g === '1' || g === '2') && !beatSolid(s, g));
  }

  // Bare floor: no wall, door, gate, lava, exit, item or crate. Enemies only walk on this.
  function bare(s, x, y) {
    if (!inBounds(s, x, y)) return false;
    const i = y * s.w + x;
    return openFloor(s, s.grid[i]) && !s.items[i] && !s.crates.includes(i);
  }

  const enemyCanEnter = (s, x, y) => bare(s, x, y) && !enemyAt(s, x, y);

  // Spiders head for you along the longer axis first (ties go horizontal), else the other axis.
  function chaseOptions(s, e) {
    const ddx = Math.sign(s.player.x - e.x);
    const ddy = Math.sign(s.player.y - e.y);
    const horiz = [ddx, 0];
    const vert = [0, ddy];
    return (Math.abs(s.player.x - e.x) >= Math.abs(s.player.y - e.y) ? [horiz, vert] : [vert, horiz]).filter(
      ([dx, dy]) => dx || dy
    );
  }

  function moveEnemies(s, dir) {
    for (const e of s.enemies) {
      if (e.frozen > 0) {
        e.frozen--;
        if (!e.frozen && e.type === 'spider') e.stuck = true; // thawing costs it a turn
        continue;
      }
      if (e.type === 'spider') {
        const step = chaseOptions(s, e).find(([dx, dy]) => enemyCanEnter(s, e.x + dx, e.y + dy));
        if (e.stuck) {
          // A blocked spider needs one turn to get going once its way opens.
          if (step) e.stuck = false;
        } else if (step) {
          e.x += step[0];
          e.y += step[1];
        } else {
          e.stuck = true;
        }
      } else if (e.type === 'patrol') {
        if (enemyCanEnter(s, e.x + e.dx, e.y + e.dy)) {
          e.x += e.dx;
          e.y += e.dy;
        } else {
          e.dx = -e.dx;
          e.dy = -e.dy;
          if (enemyCanEnter(s, e.x + e.dx, e.y + e.dy)) {
            e.x += e.dx;
            e.y += e.dy;
          }
        }
      } else if (e.type === 'mimic' && dir) {
        const { dx, dy } = DIRS[dir];
        if (enemyCanEnter(s, e.x + dx, e.y + dy)) {
          e.x += dx;
          e.y += dy;
        }
      }
    }
  }

  // Player walks one tile. Returns false (and an event) when the way is blocked.
  function walk(s, dir, events, sliding) {
    const p = s.player;
    const { dx, dy } = DIRS[dir];
    const nx = p.x + dx;
    const ny = p.y + dy;
    const i = ny * s.w + nx;
    const g = inBounds(s, nx, ny) ? s.grid[i] : '#';
    if (g === '#' || g === '%' || g === 'W' || g === 'H' || beatSolid(s, g)) {
      events.push('bump');
      return false;
    }
    const other = enemyAt(s, nx, ny);
    if (other && other.frozen) {
      events.push('bump');
      return false;
    }
    if ('RGBY'.includes(g)) {
      const k = g.toLowerCase();
      if (!s.keys[k]) {
        events.push('locked');
        return false;
      }
      s.keys[k]--;
      s.grid[i] = k;
      events.push('unlock');
    } else if (g === 'E' && s.chips < s.chipsTotal) {
      events.push('sealed');
      return false;
    } else if (s.crates.includes(i)) {
      const bx = nx + dx;
      const by = ny + dy;
      const bi = by * s.w + bx;
      const bg = inBounds(s, bx, by) ? s.grid[bi] : '#';
      const free = !sliding && '.~:x'.includes(bg) && !s.items[bi] && !s.crates.includes(bi) && !enemyAt(s, bx, by);
      if (!free) {
        events.push('bump');
        return false;
      }
      s.crates.splice(s.crates.indexOf(i), 1);
      if (bg === 'x') {
        s.grid[bi] = '.';
        events.push('sink');
      } else {
        s.crates.push(bi);
        events.push('push');
      }
    }
    // Crumbling floor gives way behind you.
    const from = p.y * s.w + p.x;
    if (s.grid[from] === ':') {
      s.grid[from] = 'H';
      events.push(`crumble:${p.x},${p.y}`);
    }
    p.x = nx;
    p.y = ny;
    events.push('move');
    const item = s.items[i];
    if (item) {
      delete s.items[i];
      if (item === '*') s.chips++;
      else if (POWERS.includes(item)) s.powers[item] += POWER_CHARGES[item];
      else s.keys[item]++;
      events.push('pickup:' + item);
    }
    return true;
  }

  // Fire a power-up. Returns false if it would do nothing (no turn is spent then).
  function usePower(s, k, dir, events) {
    if (!s.powers[k]) return false;
    const p = s.player;
    const { dx, dy } = dir ? DIRS[dir] : { dx: 0, dy: 0 };
    if (k === 'j') {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const i = ny * s.w + nx;
      if (!inBounds(s, nx, ny) || isEdge(s, nx, ny) || (s.grid[i] !== '#' && s.grid[i] !== 'W')) return false;
      s.grid[i] = '.';
      s.powers.j--;
      events.push(`fx:jet:${nx},${ny}`);
      const from = p.y * s.w + p.x;
      if (s.grid[from] === ':') {
        s.grid[from] = 'H';
        events.push(`crumble:${p.x},${p.y}`);
      }
      p.x = nx;
      p.y = ny;
      return true;
    }
    if (k === 'f') {
      s.powers.f--;
      const burned = [];
      for (let d = 1, x = p.x + dx, y = p.y + dy; d <= FLAME_RANGE && inBounds(s, x, y); d++, x += dx, y += dy) {
        const g = s.grid[y * s.w + x];
        if ('#%WHRGBYE'.includes(g) || beatSolid(s, g) || s.crates.includes(y * s.w + x)) break;
        burned.push(`${x},${y}`);
        const e = enemyAt(s, x, y);
        if (e) {
          s.enemies.splice(s.enemies.indexOf(e), 1);
          events.push(`kill:${x},${y}`);
        }
      }
      events.push('fx:flame:' + burned.join(';'));
      return true;
    }
    if (k === 'm') {
      s.powers.m--;
      let x = p.x + dx;
      let y = p.y + dy;
      for (; inBounds(s, x, y); x += dx, y += dy) {
        const i = y * s.w + x;
        const g = s.grid[i];
        const e = enemyAt(s, x, y);
        if (e) {
          s.enemies.splice(s.enemies.indexOf(e), 1);
          events.push(`kill:${x},${y}`);
          break;
        }
        if (g === 'W') {
          s.grid[i] = '.';
          events.push(`break:${x},${y}`);
          break;
        }
        if (s.crates.includes(i)) {
          s.crates.splice(s.crates.indexOf(i), 1);
          events.push(`break:${x},${y}`);
          break;
        }
        if ('#%HRGBYE'.includes(g) || beatSolid(s, g)) break;
      }
      events.push(`fx:shot:${p.x},${p.y};${x},${y}`);
      return true;
    }
    if (k === 'z') {
      if (!s.enemies.length) return false;
      s.powers.z--;
      for (const e of s.enemies) e.frozen = FREEZE_TURNS;
      events.push('fx:freeze');
      return true;
    }
    return false;
  }

  // One turn. action: 'up'|'down'|'left'|'right', null (wait), or { use: 'j'|'f'|'m'|'z', dir }.
  // Every turn counts as a move, including bumping into a wall.
  function step(state, action, sliding) {
    if (state.status !== 'play') return { state, events: [] };
    const s = clone(state);
    const events = [];
    const p = s.player;
    s.slide = null;

    if (action && typeof action === 'object') {
      if (!usePower(s, action.use, action.dir, events)) return { state, events: ['fizzle'] };
      if (action.dir) s.facing = action.dir;
    } else if (action) {
      s.facing = action;
      const moved = walk(s, action, events, sliding);
      if (moved) {
        const i = p.y * s.w + p.x;
        const g = s.grid[i];
        if (g === 'x') return finish(s, events, 'dead', 'lava');
        const e = enemyAt(s, p.x, p.y);
        if (e) return finish(s, events, 'dead', 'caught');
        if (g === 'E') {
          s.steps++;
          return finish(s, events, 'won', null);
        }
        // On ice you keep going, unless you just picked something up or came through a door.
        if (g === '~' && !events.some((ev) => ev.startsWith('pickup:') || ev === 'unlock' || ev === 'push')) {
          s.slide = action;
        }
      } else if (sliding) {
        return { state, events }; // the slide simply ends; no turn spent
      }
    } else {
      events.push('wait');
    }

    const before = phase(s);
    moveEnemies(s, action && typeof action === 'string' ? action : null);
    s.steps++;
    if (s.beat && phase(s) !== before) {
      events.push('beat');
      for (const e of s.enemies.slice()) {
        if (beatSolid(s, s.grid[e.y * s.w + e.x])) {
          s.enemies.splice(s.enemies.indexOf(e), 1);
          events.push(`crush-enemy:${e.x},${e.y}`);
        }
      }
      if (beatSolid(s, s.grid[p.y * s.w + p.x])) return finish(s, events, 'dead', 'crushed');
    }
    if (enemyAt(s, p.x, p.y)) return finish(s, events, 'dead', 'caught');
    if (s.battery && s.steps >= s.battery) return finish(s, events, 'dead', 'battery');
    return { state: s, events };
  }

  // A full player action: one step, plus any ice slide that follows.
  // frames holds the state after every tick, for animation.
  function act(state, action) {
    let r = step(state, action);
    const frames = [r.state];
    const events = r.events.slice();
    let s = r.state;
    while (s.status === 'play' && s.slide) {
      const dir = s.slide;
      r = step(s, dir, true);
      if (r.state === s) {
        s = { ...s, slide: null };
        frames[frames.length - 1] = s;
        break;
      }
      s = r.state;
      frames.push(s);
      events.push(...r.events);
    }
    return { state: s, events, frames };
  }

  function finish(s, events, status, cause) {
    s.status = status;
    s.cause = cause;
    s.slide = null;
    events.push(status);
    return { state: s, events };
  }

  // Compact identity of everything that can change during play (for the solver).
  function stateKey(s) {
    let gridDiff = '';
    for (let i = 0; i < s.grid.length; i++) if (s.grid[i] !== s.grid0[i]) gridDiff += i + s.grid[i];
    return [
      s.player.x + ',' + s.player.y,
      gridDiff,
      Object.keys(s.items).join('.'),
      s.crates.join('.'),
      s.enemies.map((e) => `${e.x},${e.y},${e.dx || 0},${e.dy || 0},${e.stuck ? 1 : 0},${e.frozen}`).join('|'),
      KEY_COLORS.map((k) => s.keys[k]).join('') + POWERS.map((k) => s.powers[k]).join(''),
      s.beat ? s.steps % (2 * BEAT) : '',
    ].join(';');
  }

  const api = {
    DIRS, KEY_COLORS, POWERS, POWER_CHARGES, AIMED, FLAME_RANGE, FREEZE_TURNS, BEAT,
    parseLevel, step, act, clone, stateKey, enemyAt, beatSolid, phase,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Lockstep = api;
})(this);
