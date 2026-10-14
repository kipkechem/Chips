// Lockstep game rules. Pure functions, no DOM: shared by the browser game and tools/solve.js.
(function (root) {
  'use strict';

  const DIRS = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };
  const DIR_NAMES = ['up', 'right', 'down', 'left']; // clockwise
  const LEFT_OF = { up: 'left', left: 'down', down: 'right', right: 'up' };
  const RIGHT_OF = { up: 'right', right: 'down', down: 'left', left: 'up' };
  const BACK_OF = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const KEY_COLORS = ['r', 'g', 'b', 'y'];
  const POWERS = ['j', 'f', 'm', 'z']; // jetpack, flamethrower, mega blaster, freeze bomb
  const POWER_CHARGES = { j: 1, f: 3, m: 3, z: 1 };
  const AIMED = { j: true, f: true, m: true, z: false };
  const BOOTS = ['p', 'h', 'k', 'u']; // flippers, fire boots, ice skates, suction boots
  const FLAME_RANGE = 3;

  // Real-time pacing. The world advances one turn every TURN_MS whether or not you move;
  // holding a direction moves you one tile per turn (your top speed).
  const TURNS_PER_SECOND = 6;
  const TURN_MS = 1000 / TURNS_PER_SECOND;
  const ALERT_TURNS = 3; // 0.5 s: how long a spider takes to react once it sees you
  const SPIDER_SKIP = 20; // a chasing spider sits out every 20th turn: 95% of your top speed
  const FREEZE_TURNS = 18; // 3 s
  const BEAT = 8; // beat blocks swap every 8 turns (1.33 s)
  const RNG_PERIOD = 16; // blobs and walkers repeat their "random" choices every 16 turns

  // Monsters and how they move. `every`: they move on turns divisible by this (2 = half your
  // speed). `turns`: the order of directions they try, relative to their heading.
  const MONSTERS = {
    D: { type: 'patrol', every: 2, face: 'right' }, // drone: straight, back when blocked
    U: { type: 'bug', every: 2, face: 'up' }, // hugs the wall on its left
    V: { type: 'para', every: 2, face: 'up' }, // hugs the wall on its right
    Q: { type: 'fireball', every: 2, face: 'right' }, // straight, else right; walks through fire
    P: { type: 'glider', every: 2, face: 'right' }, // straight, else left; glides over water
    A: { type: 'tank', every: 2, face: 'right' }, // straight only; a blue button turns it around
    X: { type: 'teeth', every: 4, face: 'down' }, // chases you, slowly
    Z: { type: 'blob', every: 4, face: 'down' }, // wanders at random, slowly
    e: { type: 'walker', every: 2, face: 'right' }, // straight; picks a random turn when blocked
    M: { type: 'mimic', every: 1, face: 'down' }, // copies your moves
  };
  const TYPE_EVERY = Object.fromEntries(Object.values(MONSTERS).map((m) => [m.type, m.every]));
  const TURN_ORDER = {
    patrol: (h) => [h, BACK_OF[h]],
    bug: (h) => [LEFT_OF[h], h, RIGHT_OF[h], BACK_OF[h]],
    para: (h) => [RIGHT_OF[h], h, LEFT_OF[h], BACK_OF[h]],
    fireball: (h) => [h, RIGHT_OF[h], LEFT_OF[h], BACK_OF[h]],
    glider: (h) => [h, LEFT_OF[h], RIGHT_OF[h], BACK_OF[h]],
    tank: (h) => [h],
  };

  const FORCE = { '<': 'left', '>': 'right', '^': 'up', v: 'down' };

  // Level map legend:
  //   Floors     .  floor       ~  ice (slide)        :  crumbling floor (becomes a hole H)
  //              ,  gravel (monsters can't cross)    ;  dirt (clears when you walk on it)
  //              < > ^ v  force floors (carry you along)    o  teleport
  //              1 2  beat blocks (one set solid at a time, swapping every BEAT turns)
  //              =  fence (you pass; enemies don't)  ?  hint tile    T  thief (takes your boots)
  //              J  trap (holds whatever enters until a brown button is held down)
  //              (  green button: flips toggle walls   )  brown button: opens traps while held
  //              [  red button: clone machines fire      ]  blue button: tanks turn around
  //              - _ { }  thin walls along the north, south, west or east edge of a tile
  //              7 9 3 0  ice corners, walled north-west, north-east, south-east, south-west:
  //                       you slide in and are turned out of the other open side
  //              !  pop-up wall: floor that rises into a wall once you step off it
  //              +  random force floor: pushes up, right, down, left in turn (one shared
  //                 counter, clockwise, like the Lynx original)    $  chip socket
  //   Walls      #  wall    %  steel    W  cracked (blaster/jetpack)    H  hole
  //              I  hidden wall (looks like floor)   N  fake wall (gives way when you touch it)
  //              &  invisible wall (looks like floor, and stays that way)
  //              L  toggle wall, closed    l  toggle wall, open    C  clone machine
  //   Hazards    x  lava    w  water (flippers)    F  fire (fire boots)    K  bomb
  //   Doors      R G B Y  doors (red, blue, yellow keys are used up; the green key is not)
  //   Items      *  chip    r g b y  keys    j f m z  jetpack, flamethrower, mega blaster, freeze bomb
  //              p h k u  flippers, fire boots, ice skates, suction boots
  //   Things     @  start    E  exit    O  crate
  //   Enemies    S  spider   D drone   U bug   V paramecium   Q fireball   P glider
  //              A  tank     X teeth   Z blob  e walker       M mimic
  // Optional level fields: facing {'x,y': dir} for a monster's first heading; clones
  // {'x,y': ['U', 'left']} for the monster each clone machine copies; hints {'x,y': text}.
  //
  // An opened door stays in the grid as its lowercase letter: a gate. You can walk
  // through it; no enemy can cross it.
  const GRID_CHARS = '#%WH~:x12E=wF<>^voK,;INLlJC()[]?T' + 'RGBY' + '-_{}7930!&+$';
  // Tiles that wall off some of their edges: thin walls and ice corners.
  const EDGE_WALLS = {
    '-': ['up'], _: ['down'], '{': ['left'], '}': ['right'],
    7: ['up', 'left'], 9: ['up', 'right'], 3: ['down', 'right'], 0: ['down', 'left'],
  };
  const ICE_CORNERS = '7930';

  function parseLevel(def) {
    const rows = def.map;
    const h = rows.length;
    const w = Math.max(...rows.map((r) => r.length));
    const grid = [];
    const items = {};
    const crates = [];
    const enemies = [];
    const cloners = [];
    let player = null;
    let chipsTotal = 0;
    let beat = false;
    const facing = def.facing || {};
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = rows[y][x] || '#';
        const i = y * w + x;
        let tile = '.';
        if (GRID_CHARS.includes(c)) {
          tile = c;
          if (c === '1' || c === '2') beat = true;
          if (c === 'C') {
            const spec = (def.clones || {})[`${x},${y}`];
            if (!spec) throw new Error(`Level "${def.name}": clone machine at ${x},${y} needs a clones entry`);
            cloners.push({ x, y, type: MONSTERS[spec[0]] ? MONSTERS[spec[0]].type : 'spider', dir: spec[1] });
          }
        } else if (c === '@') player = { x, y };
        else if (c === '*' || KEY_COLORS.includes(c) || POWERS.includes(c) || BOOTS.includes(c)) {
          items[i] = c;
          if (c === '*') chipsTotal++;
        } else if (c === 'O') crates.push(i);
        else if (c === 'S') enemies.push({ id: enemies.length, type: 'spider', x, y, mode: 'wait', alert: 0, frozen: 0 });
        else if (MONSTERS[c]) {
          const { dx, dy } = DIRS[facing[`${x},${y}`] || MONSTERS[c].face];
          enemies.push({ id: enemies.length, type: MONSTERS[c].type, x, y, dx, dy, frozen: 0 });
        } else if (c !== '.' && c !== ' ') throw new Error(`Level "${def.name}" has unknown tile "${c}"`);
        grid.push(tile);
      }
    }
    if (!player) throw new Error(`Level "${def.name}" has no start (@)`);
    // Turn-number rhythms in play. The solver keys on steps % cycle.
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    let cycle = 1;
    const types = new Set([...enemies.map((e) => e.type), ...cloners.map((c) => c.type)]);
    const rhythms = [
      [types.has('spider'), SPIDER_SKIP],
      [[...types].some((t) => TYPE_EVERY[t] === 2), 2],
      [[...types].some((t) => TYPE_EVERY[t] === 4), 4],
      [types.has('blob') || types.has('walker'), RNG_PERIOD],
      [beat, 2 * BEAT],
    ];
    for (const [on, n] of rhythms) if (on) cycle = (cycle * n) / gcd(cycle, n);
    return {
      cycle,
      w,
      h,
      grid,
      grid0: grid.slice(), // never mutated; lets stateKey store only what changed
      items,
      crates,
      crateDir: {}, // crates sliding on ice: tile index -> direction
      rff: 0, // which way the random force floors push next (index into DIR_NAMES)
      enemies,
      cloners,
      nextId: enemies.length,
      player,
      facing: 'down',
      keys: { r: 0, g: 0, b: 0, y: 0 },
      powers: { j: 0, f: 0, m: 0, z: 0 },
      boots: { p: 0, h: 0, k: 0, u: 0 },
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
      crateDir: { ...s.crateDir },
      enemies: s.enemies.map((e) => ({ ...e })),
      player: { ...s.player },
      keys: { ...s.keys },
      powers: { ...s.powers },
      boots: { ...s.boots },
    };
  }

  const inBounds = (s, x, y) => x >= 0 && y >= 0 && x < s.w && y < s.h;
  const enemyAt = (s, x, y) => s.enemies.find((e) => e.x === x && e.y === y);
  const phase = (s) => Math.floor(s.steps / BEAT) % 2;
  const beatSolid = (s, g) => (g === '1' && phase(s) === 0) || (g === '2' && phase(s) === 1);
  const isEdge = (s, x, y) => x === 0 || y === 0 || x === s.w - 1 || y === s.h - 1;
  const headingOf = (e) => DIR_NAMES.find((d) => DIRS[d].dx === e.dx && DIRS[d].dy === e.dy) || 'down';
  const rng = (s, e) => ((Math.imul((s.steps % RNG_PERIOD) + 1, 2654435761) ^ Math.imul(e.id + 7, 40503)) >>> 0) % 997;

  // Anything that stops the player (and everyone else) like a wall.
  const wallLike = (s, g) => '#%WHLC&'.includes(g) || beatSolid(s, g);

  // Can anything cross from (x, y) one step in dir? Thin walls and ice corners block
  // their walled edges from both sides.
  function edgeOpen(s, x, y, dir) {
    const { dx, dy } = DIRS[dir];
    const a = inBounds(s, x, y) ? EDGE_WALLS[s.grid[y * s.w + x]] : null;
    const b = inBounds(s, x + dx, y + dy) ? EDGE_WALLS[s.grid[(y + dy) * s.w + x + dx]] : null;
    return !(a && a.includes(dir)) && !(b && b.includes(BACK_OF[dir]));
  }
  const dirOf = (dx, dy) => DIR_NAMES.find((d) => DIRS[d].dx === dx && DIRS[d].dy === dy);

  // Which way a force floor pushes. Random force floors take turns clockwise: each push,
  // by any of them, moves the shared counter on one step.
  function pushDir(s, i) {
    const g = s.grid[i];
    if (g !== '+') return FORCE[g];
    const d = DIR_NAMES[s.rff];
    s.rff = (s.rff + 1) % 4;
    return d;
  }
  const isForce = (g) => !!FORCE[g] || g === '+';

  // Which way something carries on after sliding onto tile g going dir: straight on over
  // ice, turned by an ice corner, or not at all.
  function iceTurn(g, dir) {
    if (g === '~') return dir;
    if (ICE_CORNERS.includes(g)) return DIR_NAMES.find((d) => !EDGE_WALLS[g].includes(d) && d !== BACK_OF[dir]);
    return null;
  }

  // A trap releases whatever is in it only while something holds a brown button down.
  function trapsOpen(s) {
    for (let i = 0; i < s.grid.length; i++) {
      if (s.grid[i] !== ')') continue;
      const x = i % s.w;
      const y = (i - x) / s.w;
      if ((s.player.x === x && s.player.y === y) || s.crates.includes(i) || enemyAt(s, x, y)) return true;
    }
    return false;
  }

  // Floor an enemy can stand on: plain, ice, crumbling, or a beat block that is currently open.
  function openFloor(s, g) {
    return g === '.' || g === '~' || g === ':' || !!EDGE_WALLS[g] || ((g === '1' || g === '2') && !beatSolid(s, g));
  }

  // Bare floor: no wall, door, gate, lava, exit, item or crate. Spiders only walk on this.
  function bare(s, x, y) {
    if (!inBounds(s, x, y)) return false;
    const i = y * s.w + x;
    return openFloor(s, s.grid[i]) && !s.items[i] && !s.crates.includes(i);
  }

  const enemyCanEnter = (s, x, y) => bare(s, x, y) && !enemyAt(s, x, y);

  // Pattern monsters also walk onto buttons, traps and bombs; gliders cross water and
  // fireballs cross fire. Nothing but you crosses gravel, dirt, force floors or teleports.
  function monsterCanEnter(s, type, x, y) {
    if (!inBounds(s, x, y)) return false;
    const i = y * s.w + x;
    if (s.items[i] || s.crates.includes(i) || enemyAt(s, x, y)) return false;
    const g = s.grid[i];
    if (openFloor(s, g) || '()[]JK'.includes(g)) return true;
    if (g === 'w') return type === 'glider';
    if (g === 'F') return type === 'fireball';
    return false;
  }

  // What a button does the moment something steps onto it.
  function press(s, g, events) {
    if (g === '(') {
      for (let i = 0; i < s.grid.length; i++) {
        if (s.grid[i] === 'L') s.grid[i] = 'l';
        else if (s.grid[i] === 'l') {
          // A toggle wall can't close on anything standing in it.
          const x = i % s.w;
          const y = (i - x) / s.w;
          const busy = (s.player.x === x && s.player.y === y) || s.crates.includes(i) || enemyAt(s, x, y);
          if (!busy) s.grid[i] = 'L';
        }
      }
      events.push('toggle');
    } else if (g === '[') {
      for (const c of s.cloners) {
        const { dx, dy } = DIRS[c.dir];
        const x = c.x + dx;
        const y = c.y + dy;
        if (!(s.player.x === x && s.player.y === y) && !monsterCanEnter(s, c.type, x, y)) continue;
        const e = { id: s.nextId++, type: c.type, x, y, dx, dy, frozen: 0 };
        if (c.type === 'spider') Object.assign(e, { mode: 'wait', alert: 0 });
        s.enemies.push(e);
        events.push(`clone:${x},${y}`);
      }
    } else if (g === ']') {
      for (const e of s.enemies) {
        if (e.type !== 'tank') continue;
        e.dx = -e.dx;
        e.dy = -e.dy;
      }
      events.push('reverse');
    }
  }

  // What happens to a monster on the tile it just entered.
  function landMonster(s, e, events) {
    const i = e.y * s.w + e.x;
    const g = s.grid[i];
    if (g === 'K') {
      s.grid[i] = '.';
      s.enemies.splice(s.enemies.indexOf(e), 1);
      events.push(`boom:${e.x},${e.y}`);
    } else if ('([]'.includes(g)) press(s, g, events);
  }

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

  // A spider sees along its row and column, through other spiders, until anything that
  // isn't bare floor (a wall, a door or gate, a chip, a key, a crate...) blocks the view.
  function spiderSees(s, e) {
    const { x: px, y: py } = s.player;
    if (px !== e.x && py !== e.y) return false;
    const dx = Math.sign(px - e.x);
    const dy = Math.sign(py - e.y);
    const dir = dirOf(dx, dy);
    for (let x = e.x, y = e.y; x !== px || y !== py; x += dx, y += dy) {
      if (!edgeOpen(s, x, y, dir)) return false;
      if ((x + dx !== px || y + dy !== py) && !bare(s, x + dx, y + dy)) return false;
    }
    return true;
  }

  // Spiders: wait (blocked, straining toward you) -> sees you -> alert for 0.5 s -> chase.
  // A chaser that runs into anything but another spider loses you and waits again.
  function moveSpiders(s) {
    const turn = s.steps;
    const dist = (e) => Math.abs(e.x - s.player.x) + Math.abs(e.y - s.player.y);
    const spiders = s.enemies.filter((e) => e.type === 'spider').sort((a, b) => dist(a) - dist(b));
    for (const e of spiders) {
      if (e.frozen > 0) {
        if (!--e.frozen) e.mode = 'wait';
        continue;
      }
      if (e.mode === 'wait') {
        if (spiderSees(s, e)) {
          e.mode = 'alert';
          e.alert = ALERT_TURNS;
        }
        continue;
      }
      if (e.mode === 'alert') {
        if (--e.alert > 0) continue;
        e.mode = 'chase';
      }
      if (turn % SPIDER_SKIP === SPIDER_SKIP - 1) continue; // 95% of your speed
      let queued = false;
      let moved = false;
      for (const [dx, dy] of chaseOptions(s, e)) {
        if (!edgeOpen(s, e.x, e.y, dirOf(dx, dy))) continue;
        if (enemyCanEnter(s, e.x + dx, e.y + dy)) {
          e.x += dx;
          e.y += dy;
          moved = true;
          break;
        }
        if (bare(s, e.x + dx, e.y + dy)) queued = true; // only another enemy in the way
      }
      if (!moved && !queued) e.mode = 'wait';
    }
  }

  function tryMonster(s, e, dir) {
    const { dx, dy } = DIRS[dir];
    if (!edgeOpen(s, e.x, e.y, dir) || !monsterCanEnter(s, e.type, e.x + dx, e.y + dy)) return false;
    e.x += dx;
    e.y += dy;
    e.dx = dx;
    e.dy = dy;
    return true;
  }

  function moveEnemies(s, dir, events) {
    moveSpiders(s);
    const open = trapsOpen(s);
    for (const e of s.enemies.slice()) {
      if (e.type === 'spider' || !s.enemies.includes(e)) continue;
      if (e.frozen > 0) {
        e.frozen--;
        continue;
      }
      if (s.steps % TYPE_EVERY[e.type]) continue;
      if (s.grid[e.y * s.w + e.x] === 'J' && !open) continue; // held in a trap
      let moved = false;
      if (e.type === 'mimic') {
        moved = !!dir && tryMonster(s, e, dir);
      } else if (e.type === 'teeth') {
        for (const [dx, dy] of chaseOptions(s, e)) {
          const d = DIR_NAMES.find((n) => DIRS[n].dx === dx && DIRS[n].dy === dy);
          if (tryMonster(s, e, d)) {
            moved = true;
            break;
          }
        }
      } else if (e.type === 'blob') {
        moved = tryMonster(s, e, DIR_NAMES[rng(s, e) % 4]);
      } else if (e.type === 'walker') {
        const h = headingOf(e);
        if (!(moved = tryMonster(s, e, h))) {
          const others = DIR_NAMES.filter((d) => d !== h);
          const start = rng(s, e) % 3;
          for (let k = 0; k < 3 && !moved; k++) moved = tryMonster(s, e, others[(start + k) % 3]);
        }
      } else {
        for (const d of TURN_ORDER[e.type](headingOf(e))) {
          if ((moved = tryMonster(s, e, d))) break;
        }
      }
      if (moved) landMonster(s, e, events);
    }
  }

  // Can the player step onto this tile right now (used to pick a teleport exit)?
  function passable(s, x, y) {
    if (!inBounds(s, x, y)) return false;
    const i = y * s.w + x;
    const g = s.grid[i];
    if (wallLike(s, g) || 'INRGBY'.includes(g) || ((g === 'E' || g === '$') && s.chips < s.chipsTotal)) return false;
    return !s.crates.includes(i) && !(enemyAt(s, x, y) || {}).frozen;
  }

  // Crates go onto floor, ice, gravel, force floors, buttons and traps, and into water,
  // lava and bombs (which use them up).
  const CRATE_TILES = '.~:x,wK()[]J<>^v+-_{}7930';
  function crateCanGo(s, x, y, dir) {
    const { dx, dy } = DIRS[dir];
    const tx = x + dx;
    const ty = y + dy;
    if (!inBounds(s, tx, ty) || !edgeOpen(s, x, y, dir)) return false;
    const ti = ty * s.w + tx;
    return CRATE_TILES.includes(s.grid[ti]) && !s.items[ti] && !s.crates.includes(ti) && !enemyAt(s, tx, ty) &&
      !(s.player.x === tx && s.player.y === ty);
  }

  // Move the crate at index i one tile. Returns its new index, or -1 if it was used up.
  function moveCrate(s, i, dir, events) {
    const { dx, dy } = DIRS[dir];
    const x = i % s.w;
    const bx = x + dx;
    const by = (i - x) / s.w + dy;
    const bi = by * s.w + bx;
    const bg = s.grid[bi];
    s.crates.splice(s.crates.indexOf(i), 1);
    delete s.crateDir[i];
    if (bg === 'x') {
      s.grid[bi] = '.';
      events.push('sink');
      return -1;
    }
    if (bg === 'w') {
      s.grid[bi] = ';';
      events.push(`splash:${bx},${by}`);
      return -1;
    }
    if (bg === 'K') {
      s.grid[bi] = '.';
      events.push(`boom:${bx},${by}`);
      return -1;
    }
    s.crates.push(bi);
    const on = iceTurn(bg, dir);
    if (on) s.crateDir[bi] = on;
    if ('([]'.includes(bg)) press(s, bg, events);
    return bi;
  }

  // Each turn, crates on ice slide on one tile and crates on force floors are carried one.
  // A sliding crate that is blocked stops; one on a force floor tries again next turn.
  function moveCrates(s, events, skip) {
    for (const i of s.crates.slice()) {
      if (skip.includes(i) || !s.crates.includes(i)) continue;
      const g = s.grid[i];
      if (g === 'J' && !trapsOpen(s)) continue;
      const dir = s.crateDir[i] || (isForce(g) ? pushDir(s, i) : null);
      if (!dir) continue;
      const x = i % s.w;
      if (crateCanGo(s, x, (i - x) / s.w, dir)) moveCrate(s, i, dir, events);
      else delete s.crateDir[i];
    }
  }

  // Player walks one tile. Returns false (and an event) when the way is blocked.
  function walk(s, dir, events, sliding) {
    const p = s.player;
    const { dx, dy } = DIRS[dir];
    const from = p.y * s.w + p.x;
    if (s.grid[from] === 'J' && !trapsOpen(s)) {
      events.push('trapped');
      return false;
    }
    const nx = p.x + dx;
    const ny = p.y + dy;
    const i = ny * s.w + nx;
    const g = inBounds(s, nx, ny) ? s.grid[i] : '#';
    if (!edgeOpen(s, p.x, p.y, dir)) {
      events.push('bump');
      return false;
    }
    if (g === '&') events.push(`ghostwall:${nx},${ny}`);
    if (g === 'I') {
      s.grid[i] = '#';
      events.push(`reveal:${nx},${ny}`, 'bump');
      return false;
    }
    if (wallLike(s, g)) {
      events.push('bump');
      return false;
    }
    const other = enemyAt(s, nx, ny);
    if (other && other.frozen) {
      events.push('bump');
      return false;
    }
    if (g === 'N') {
      s.grid[i] = '.';
      events.push(`fakewall:${nx},${ny}`);
    } else if ('RGBY'.includes(g)) {
      const k = g.toLowerCase();
      if (!s.keys[k]) {
        events.push('locked');
        return false;
      }
      if (k !== 'g') s.keys[k]--; // the green key opens every green door
      s.grid[i] = k;
      events.push('unlock');
    } else if (g === 'E' && s.chips < s.chipsTotal) {
      events.push('sealed');
      return false;
    } else if (g === '$') {
      if (s.chips < s.chipsTotal) {
        events.push('socket-shut');
        return false;
      }
      s.grid[i] = '.';
      events.push(`socket:${nx},${ny}`);
    } else if (s.crates.includes(i)) {
      const stuck = g === 'J' && !trapsOpen(s);
      if (sliding || stuck || !crateCanGo(s, nx, ny, dir)) {
        events.push('bump');
        return false;
      }
      const to = moveCrate(s, i, dir, events);
      events.push(`push:${to}`); // the crate's new tile (-1 if used up); it has moved this turn
    }
    // Crumbling floor gives way behind you; a pop-up wall rises behind you.
    if (s.grid[from] === ':') {
      s.grid[from] = 'H';
      events.push(`crumble:${p.x},${p.y}`);
    } else if (s.grid[from] === '!') {
      s.grid[from] = '#';
      events.push(`popup:${p.x},${p.y}`);
    }
    p.x = nx;
    p.y = ny;
    events.push('move');
    if (s.grid[i] === ';') s.grid[i] = '.';
    const item = s.items[i];
    if (item) {
      delete s.items[i];
      if (item === '*') s.chips++;
      else if (POWERS.includes(item)) s.powers[item] += POWER_CHARGES[item];
      else if (BOOTS.includes(item)) s.boots[item] = 1;
      else s.keys[item]++;
      events.push('pickup:' + item);
    }
    const here = s.grid[i];
    if (here === 'T' && BOOTS.some((b) => s.boots[b])) {
      for (const b of BOOTS) s.boots[b] = 0;
      events.push('thief');
    } else if (here === '?') events.push(`hint:${nx},${ny}`);
    else if ('([]'.includes(here)) press(s, here, events);
    return true;
  }

  // Fire a power-up. Returns false if it would do nothing (no turn is spent then).
  function usePower(s, k, dir, events) {
    if (!s.powers[k]) return false;
    const p = s.player;
    // Aimed power-ups fire the way you face (walk or bump into something to turn).
    const aim = dir || (AIMED[k] ? s.facing : null);
    const { dx, dy } = aim ? DIRS[aim] : { dx: 0, dy: 0 };
    const blocksFire = (g, i) => '#%WHRGBYEINLC&$'.includes(g) || beatSolid(s, g) || s.crates.includes(i);
    if (k === 'j') {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const i = ny * s.w + nx;
      if (!inBounds(s, nx, ny) || isEdge(s, nx, ny) || !'#WN'.includes(s.grid[i])) return false;
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
        const i = y * s.w + x;
        if (!edgeOpen(s, x - dx, y - dy, aim) || blocksFire(s.grid[i], i)) break;
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
        if (!edgeOpen(s, x - dx, y - dy, aim)) {
          x -= dx;
          y -= dy;
          break;
        }
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
        if (blocksFire(g, i)) break;
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

  // After the player lands on a tile: hazards, the exit, and whatever carries them on.
  // Returns a finished result, or null to carry on with the turn.
  function land(s, dir, events) {
    const p = s.player;
    const i = p.y * s.w + p.x;
    const g = s.grid[i];
    if (g === 'x') return finish(s, events, 'dead', 'lava');
    if (g === 'w' && !s.boots.p) return finish(s, events, 'dead', 'water');
    if (g === 'F' && !s.boots.h) return finish(s, events, 'dead', 'fire');
    if (g === 'K') {
      s.grid[i] = '.';
      events.push(`boom:${p.x},${p.y}`);
      return finish(s, events, 'dead', 'bomb');
    }
    if (enemyAt(s, p.x, p.y)) return finish(s, events, 'dead', 'caught');
    if (g === 'E') {
      s.steps++;
      return finish(s, events, 'won', null);
    }
    if (g === 'o') {
      // Teleport: arrive at the next teleport (in reading order) whose way out is clear,
      // and carry on in the same direction.
      const pads = [];
      for (let k = 1; k <= s.grid.length; k++) {
        const j = (i + k) % s.grid.length;
        if (s.grid[j] === 'o') pads.push(j);
      }
      const { dx, dy } = DIRS[dir];
      const to = pads.find((j) => {
        const x = j % s.w;
        const y = (j - x) / s.w;
        return !enemyAt(s, x, y) && edgeOpen(s, x, y, dir) && passable(s, x + dx, y + dy);
      });
      if (to !== undefined && to !== i) {
        p.x = to % s.w;
        p.y = (to - p.x) / s.w;
        events.push(`teleport:${p.x},${p.y}`);
      }
      s.slide = dir;
      return null;
    }
    const stopped = events.some((ev) => ev.startsWith('pickup:') || ev === 'unlock' || ev.startsWith('push:'));
    if (isForce(g) && !s.boots.u) s.slide = pushDir(s, i);
    else if (g === '~' && !s.boots.k && !stopped) s.slide = dir;
    else if (ICE_CORNERS.includes(g) && !s.boots.k && !stopped) s.slide = iceTurn(g, dir); // out of the other open side
    return null;
  }

  // One turn. action: 'up'|'down'|'left'|'right', null (wait), or { use: 'j'|'f'|'m'|'z', dir }.
  // sliding: this move is forced (ice, force floor, teleport exit), so it can't push crates.
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
      if (walk(s, action, events, sliding)) {
        const done = land(s, action, events);
        if (done) return done;
      } else if (sliding) {
        return { state, events }; // the slide simply ends; no turn spent
      }
    } else {
      events.push('wait');
    }
    // A force floor keeps pushing you even when you stand still.
    const under = s.grid[p.y * s.w + p.x];
    if (!s.slide && isForce(under) && !s.boots.u) s.slide = pushDir(s, p.y * s.w + p.x);

    moveCrates(s, events, events.filter((e) => e.startsWith('push:')).map((e) => +e.slice(5)));
    const before = phase(s);
    moveEnemies(s, action && typeof action === 'string' ? action : null, events);
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

  // A full player action: one step, plus any forced movement that follows (ice, force
  // floors, teleports). frames holds the state after every tick, for animation.
  function act(state, action) {
    let r = step(state, action);
    const frames = [r.state];
    const events = r.events.slice();
    let s = r.state;
    let guard = 0;
    while (s.status === 'play' && s.slide && guard++ < 400) {
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
      s.crates.join('.') + Object.entries(s.crateDir).join('.'),
      s.enemies.map((e) => `${e.id},${e.x},${e.y},${e.dx || 0},${e.dy || 0},${e.mode || ''}${e.alert || ''},${e.frozen}`).join('|'),
      KEY_COLORS.map((k) => s.keys[k]).join('') + POWERS.map((k) => s.powers[k]).join('') + BOOTS.map((k) => s.boots[k]).join(''),
      s.steps % s.cycle,
      s.rff,
      POWERS.some((k) => AIMED[k] && s.powers[k]) ? s.facing : '', // only matters while you can aim
    ].join(';');
  }

  const api = {
    DIRS, KEY_COLORS, POWERS, POWER_CHARGES, AIMED, BOOTS, FLAME_RANGE, FREEZE_TURNS, BEAT, FORCE,
    TURN_MS, TURNS_PER_SECOND, ALERT_TURNS, SPIDER_SKIP, spiderSees, trapsOpen,
    parseLevel, step, act, clone, stateKey, enemyAt, beatSolid, phase,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Lockstep = api;
})(this);
