// Lockstep pixel art: themes, sprites and the board renderer.
// Everything is drawn at 16 x 16 pixels per tile into an offscreen buffer, which the page
// then scales up with smoothing off, so the art stays crisp at any size.
(function (root) {
  'use strict';

  const TILE = 16;

  const THEMES = {
    arcade: {
      name: 'Pixel Arcade',
      bg: '#070b16', panel: '#0a1430', frame: '#1f6fff', frameHi: '#5ab4ff', ink: '#e9f1ff', muted: '#8ea6d8',
      floor: '#0e1321', floorGrid: '#131a2b', detail: '#26324d',
      wall: '#1e8cff', wallHi: '#72ccff', wallLo: '#0b5ad0', wallEdge: '#041a40',
      enemy: '#e8312f', enemyDark: '#9a1410', style: 'plain',
    },
    circuits: {
      name: 'Lost Circuits',
      bg: '#110d07', panel: '#1d170e', frame: '#8f7a4f', frameHi: '#d9c48f', ink: '#f3ead6', muted: '#b3a37f',
      floor: '#2a2116', floorGrid: '#30261a', detail: '#4a3c29',
      wall: '#b49a62', wallHi: '#e3cf98', wallLo: '#7a6538', wallEdge: '#20180c',
      speck: '#9c8450', moss: '#4f9a2a', mossHi: '#8fcd47',
      enemy: '#e8312f', enemyDark: '#9a1410', style: 'moss',
    },
    ice: {
      name: 'Ice Station',
      bg: '#0a1030', panel: '#131b46', frame: '#8d8fe6', frameHi: '#c9cbff', ink: '#eef2ff', muted: '#a3add8',
      floor: '#192450', floorGrid: '#1d2a5a', detail: '#2f4282',
      wall: '#b6d0f5', wallHi: '#f4f9ff', wallLo: '#7893d2', wallEdge: '#1d2a66',
      icicle: '#eaf6ff', icicleTip: '#a9d4ff',
      enemy: '#9b4dff', enemyDark: '#5a1fb0', style: 'ice',
    },
    neon: {
      name: 'Neon Mixtape',
      bg: '#0c071d', panel: '#170c30', frame: '#d63ae6', frameHi: '#ff9cf6', ink: '#fbeaff', muted: '#c39bd6',
      floor: '#190f31', floorGrid: '#21153d', detail: '#3c2a63',
      wall: '#df3cdf', wallHi: '#ff9cf6', wallLo: '#8c1fb0', wallEdge: '#330848',
      stripe: '#f474f0',
      enemy: '#36dcff', enemyDark: '#11789e', style: 'neon',
    },
    solar: {
      name: 'Solar Disco',
      bg: '#0a1d25', panel: '#0f2a33', frame: '#ff7a1a', frameHi: '#ffd23f', ink: '#fff3e3', muted: '#e2b98f',
      floor: '#11303a', floorGrid: '#143640', detail: '#24596a',
      wall: '#ff8a2a', wallHi: '#ffc24d', wallLo: '#c94a17', wallEdge: '#401404',
      checker: '#ea6c1f',
      enemy: '#3fe0c8', enemyDark: '#138a78', style: 'solar',
    },
  };

  const KEY_COLORS = {
    r: { c: '#e8392f', h: '#ff8a7a', d: '#9c1a12' },
    b: { c: '#2f8cff', h: '#8cc6ff', d: '#1550b0' },
    y: { c: '#ffcc1f', h: '#fff08a', d: '#b88300' },
    g: { c: '#2fcf3a', h: '#9dff8a', d: '#16801e' },
  };

  // Door symbols, as in the mockups: red triangle, blue diamond, yellow circle, green square.
  const SHAPES = {
    r: ['...#...', '..###..', '..###..', '.#####.', '.#####.', '#######', '.......'],
    b: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
    y: ['..###..', '.#####.', '###.###', '##...##', '###.###', '.#####.', '..###..'],
    g: ['#######', '#######', '##...##', '##...##', '##...##', '#######', '#######'],
  };

  const ROBOT = [
    '................',
    '.......rr.......',
    '.......kk.......',
    '...kkkkkkkkkk...',
    '..kwwwwwwwwwwk..',
    '..kwkkkkkkkkwk..',
    '..kwkcckkcckwk..',
    '..kwkcckkcckwk..',
    '..kwkkkkkkkkwk..',
    '..kwwwwwwwwwwk..',
    '...kkkkkkkkkk...',
    '..okwwggggwwko..',
    '..okwwwwwwwwko..',
    '...kkwwkkwwkk...',
    '....kwk..kwk....',
    '....kkk..kkk....',
  ];

  const SPIDER = [
    '................',
    '................',
    '................',
    '..k..........k..',
    '...k........k...',
    '....k.kkkk.k....',
    '.kk..kbbbbk..kk.',
    '...kkbbbbbbkk...',
    '..k.kbwbbwbk.k..',
    '.k..kbwbbwbk..k.',
    '...kkbbbbbbkk...',
    '..k.kbbddbbk.k..',
    '.k...kbbbbk...k.',
    '..k...kkkk...k..',
    '................',
    '................',
  ];
  // Second leg pose for the scuttle animation while chasing.
  const SPIDER_B = [
    '................',
    '................',
    '................',
    '................',
    '.k............k.',
    '..kk..kkkk..kk..',
    '....kkbbbbkk....',
    '.kkkkbbbbbbkkkk.',
    '....kbwbbwbk....',
    '..kkkbwbbwbkkk..',
    '.k..kbbbbbbk..k.',
    '...kkbbddbbkk...',
    '..k..kbbbbk..k..',
    '.k....kkkk....k.',
    '................',
    '................',
  ];

  const UFO = [
    '................',
    '................',
    '......kkkk......',
    '.....kchcck.....',
    '....kcchccck....',
    '....kcccccck....',
    '..kkkkkkkkkkkk..',
    '.kggggggggggggk.',
    'kgglggglggglgggk',
    '.kddddddddddddk.',
    '..kkkkkkkkkkkk..',
    '...l...ll...l...',
    '................',
    '................',
    '................',
    '................',
  ];

  const MIMIC = [
    '................',
    '................',
    '....kkkkkkkk....',
    '...kmmmmmmmmk...',
    '..kmmmmmmmmmmk..',
    '..kmwwmmmmwwmk..',
    '..kmwkmmmmwkmk..',
    '..kmmmmmmmmmmk..',
    '..kmmmkkkkmmmk..',
    '..kmmmmmmmmmmk..',
    '..kmmmmmmmmmmk..',
    '..kmkmmkkmmkmk..',
    '..kk.kk..kk.kk..',
    '................',
    '................',
    '................',
  ];

  const KEY = [
    '................',
    '................',
    '................',
    '................',
    '.kkkk...........',
    'kcchck..........',
    'kckkckkkkkkkkkk.',
    'kck.kccccccccchk',
    'kckkckkkkkcckcck',
    'kcccck....kkkkkk',
    '.kkkk...........',
    '................',
    '................',
    '................',
    '................',
    '................',
  ];

  function makeCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined') return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function sprite(rows, pal) {
    const c = makeCanvas(TILE, TILE);
    const x = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let i = 0; i < TILE; i++) {
        const col = pal[row[i]];
        if (col) {
          x.fillStyle = col;
          x.fillRect(i, y, 1, 1);
        }
      }
    });
    return c;
  }

  const OUTLINE = '#0a0d14';
  const spriteCache = new Map();
  function sprites(themeKey) {
    if (spriteCache.has(themeKey)) return spriteCache.get(themeKey);
    const th = THEMES[themeKey];
    const spiderPal = { k: OUTLINE, b: th.enemy, d: th.enemyDark, w: '#ffffff' };
    const set = {
      robot: sprite(ROBOT, { k: OUTLINE, w: '#f2f4f8', g: '#b9c1cf', c: '#3ad6ff', r: '#ff3b30', o: '#ff8a1f' }),
      spider: sprite(SPIDER, spiderPal),
      spiderB: sprite(SPIDER_B, spiderPal),
      spiderSleep: sprite(SPIDER, { ...spiderPal, w: th.enemyDark }),
      ufo: sprite(UFO, { k: OUTLINE, c: '#46d4ff', h: '#e6fbff', g: '#b9c1cf', l: '#ffd23f', d: '#6b7385' }),
      mimic: sprite(MIMIC, { k: OUTLINE, m: '#b98cff', w: '#ffffff' }),
      keys: {},
    };
    for (const k of Object.keys(KEY_COLORS)) set.keys[k] = sprite(KEY, { k: OUTLINE, ...KEY_COLORS[k] });
    spriteCache.set(themeKey, set);
    return set;
  }

  const hash = (x, y) => ((Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0) % 997;

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawFloor(ctx, x0, y0, th, hv) {
    px(ctx, x0, y0, 16, 16, th.floor);
    px(ctx, x0, y0, 16, 1, th.floorGrid);
    px(ctx, x0, y0, 1, 16, th.floorGrid);
    const v = hv % 11;
    const d = th.detail;
    if (th.style === 'solar') {
      if (v < 4) {
        px(ctx, x0 + 7, y0 + 6, 1, 3, d);
        px(ctx, x0 + 6, y0 + 7, 3, 1, d);
      }
      return;
    }
    if (v === 0) for (let i = 3; i <= 12; i += 2) px(ctx, x0 + i, y0 + 8, 1, 1, d);
    else if (v === 1) for (let i = 3; i <= 12; i += 2) px(ctx, x0 + 8, y0 + i, 1, 1, d);
    else if (v === 2) {
      px(ctx, x0 + 5, y0 + 5, 6, 1, d); px(ctx, x0 + 5, y0 + 10, 6, 1, d);
      px(ctx, x0 + 5, y0 + 5, 1, 6, d); px(ctx, x0 + 10, y0 + 5, 1, 6, d);
      px(ctx, x0 + 7, y0 + 7, 2, 2, d);
    } else if (v === 3) {
      for (let i = 3; i <= 9; i += 2) px(ctx, x0 + i, y0 + 4, 1, 1, d);
      for (let i = 6; i <= 12; i += 2) px(ctx, x0 + 9, y0 + i, 1, 1, d);
    } else if (v === 4) {
      px(ctx, x0 + 4, y0 + 11, 3, 1, d); px(ctx, x0 + 4, y0 + 9, 1, 2, d);
    }
  }

  function drawWall(ctx, x0, y0, th, hv) {
    px(ctx, x0, y0, 16, 16, th.wallEdge);
    px(ctx, x0, y0, 15, 15, th.wall);
    if (th.style === 'neon') {
      for (let yy = 0; yy < 15; yy++) {
        for (let xx = 0; xx < 15; xx++) {
          const s = xx + yy;
          if (s >= 6 && s <= 9) px(ctx, x0 + xx, y0 + yy, 1, 1, th.stripe);
        }
      }
    }
    if (th.style === 'solar' && hv % 3 === 0) {
      for (let yy = 4; yy < 11; yy += 2) {
        for (let xx = 4; xx < 11; xx += 2) if (((xx + yy) / 2) % 2 === 0) px(ctx, x0 + xx, y0 + yy, 2, 2, th.checker);
      }
    }
    px(ctx, x0, y0, 15, 2, th.wallHi);
    px(ctx, x0, y0, 1, 15, th.wallHi);
    px(ctx, x0, y0 + 12, 15, 3, th.wallLo);
    px(ctx, x0 + 14, y0, 1, 15, th.wallLo);
    if (th.style === 'moss') {
      for (let k = 0; k < 6; k++) {
        const sx = (hv * (k + 3) * 7) % 12 + 1;
        const sy = (hv * (k + 5) * 3) % 8 + 3;
        px(ctx, x0 + sx, y0 + sy, 1, 1, th.speck);
      }
      if (hv % 3 !== 0) {
        for (let c = 0; c < 15; c++) {
          if ((hv >> (c % 9)) & 1) {
            px(ctx, x0 + c, y0, 1, 1 + ((hv + c) % 3), th.moss);
            if ((hv + c) % 4 === 0) px(ctx, x0 + c, y0, 1, 1, th.mossHi);
          }
        }
      }
      if (hv % 5 === 0) for (let yy = 2; yy < 12; yy += 2) px(ctx, x0 + 2 + (yy % 4 ? 1 : 0), y0 + yy, 1, 1, th.moss);
    } else if (th.style === 'ice') {
      px(ctx, x0 + 4, y0 + 4, 1, 1, th.wallHi);
      px(ctx, x0 + 5, y0 + 5, 1, 1, th.wallHi);
      px(ctx, x0 + 9, y0 + 7, 1, 1, th.wallHi);
      for (let c = 1; c < 14; c++) {
        if (((hv >> (c % 8)) & 3) === 0) {
          px(ctx, x0 + c, y0 + 12, 1, 3, th.icicle);
          px(ctx, x0 + c, y0 + 15, 1, 1, th.icicleTip);
        }
      }
      px(ctx, x0, y0, 15, 1, th.icicle);
    }
  }

  function drawShape(ctx, k, x, y, color) {
    SHAPES[k].forEach((row, yy) => {
      for (let xx = 0; xx < 7; xx++) if (row[xx] === '#') px(ctx, x + xx, y + yy, 1, 1, color);
    });
  }

  function drawDoor(ctx, x0, y0, k) {
    const c = KEY_COLORS[k];
    px(ctx, x0 + 1, y0, 14, 16, OUTLINE);
    px(ctx, x0 + 2, y0 + 1, 12, 14, c.c);
    px(ctx, x0 + 2, y0 + 1, 12, 2, c.h);
    px(ctx, x0 + 2, y0 + 1, 1, 14, c.h);
    px(ctx, x0 + 2, y0 + 13, 12, 2, c.d);
    px(ctx, x0 + 4, y0 + 4, 8, 8, c.d);
    px(ctx, x0 + 5, y0 + 5, 7, 7, c.c);
    drawShape(ctx, k, x0 + 5, y0 + 5, OUTLINE);
  }

  // An opened door: the frame stays, and no enemy will cross it.
  function drawGate(ctx, x0, y0, k) {
    const c = KEY_COLORS[k];
    px(ctx, x0 + 1, y0, 14, 2, c.d);
    px(ctx, x0 + 1, y0, 2, 16, c.c);
    px(ctx, x0 + 13, y0, 2, 16, c.c);
    px(ctx, x0 + 1, y0, 1, 16, c.h);
    for (let i = 4; i < 12; i += 2) px(ctx, x0 + i, y0 + 14, 1, 1, c.c);
  }

  function drawChip(ctx, x0, y0, t) {
    for (let i = 4; i <= 11; i += 2) {
      px(ctx, x0 + i, y0 + 2, 1, 2, '#c9ced8');
      px(ctx, x0 + i, y0 + 12, 1, 2, '#c9ced8');
      px(ctx, x0 + 2, y0 + i, 2, 1, '#c9ced8');
      px(ctx, x0 + 12, y0 + i, 2, 1, '#c9ced8');
    }
    px(ctx, x0 + 3, y0 + 3, 10, 10, OUTLINE);
    px(ctx, x0 + 4, y0 + 4, 8, 8, '#2b2f3a');
    const glow = Math.floor(t * 3) % 2 ? '#7dffb0' : '#39e07a';
    px(ctx, x0 + 6, y0 + 6, 4, 4, glow);
    px(ctx, x0 + 6, y0 + 6, 1, 1, '#e6fff0');
  }

  function drawExit(ctx, x0, y0, open, t) {
    px(ctx, x0 + 1, y0 + 1, 14, 14, open ? '#f2f4f8' : '#7d8496');
    px(ctx, x0 + 2, y0 + 2, 12, 12, OUTLINE);
    px(ctx, x0 + 4, y0 + 3, 1, 10, '#b9c1cf');
    const wave = open && Math.floor(t * 4) % 2 ? 1 : 0;
    for (let yy = 0; yy < 3; yy++) {
      for (let xx = 0; xx < 4; xx++) {
        const white = (xx + yy) % 2 === 0;
        const col = open ? (white ? '#ffffff' : '#1a1d26') : white ? '#9aa1b2' : '#3a3f4c';
        px(ctx, x0 + 5 + xx * 2, y0 + 3 + yy * 2 + (xx >= 2 ? wave : 0), 2, 2, col);
      }
    }
  }

  function drawLava(ctx, x0, y0, t, hv) {
    px(ctx, x0, y0, 16, 16, '#b3261a');
    const f = Math.floor(t * 3 + hv) % 2;
    for (let yy = 2; yy < 16; yy += 4) {
      for (let xx = 0; xx < 16; xx++) {
        if ((xx + yy / 2 + f * 2) % 6 < 2) px(ctx, x0 + xx, y0 + yy, 1, 2, '#ff6a2a');
      }
    }
    px(ctx, x0 + ((hv + f * 5) % 12) + 2, y0 + ((hv >> 2) % 10) + 3, 2, 2, '#ffd23f');
  }

  function drawCrate(ctx, x0, y0) {
    px(ctx, x0 + 1, y0 + 1, 14, 14, '#4a2c12');
    px(ctx, x0 + 2, y0 + 2, 12, 12, '#b0743a');
    px(ctx, x0 + 2, y0 + 6, 12, 1, '#7a4a20');
    px(ctx, x0 + 2, y0 + 10, 12, 1, '#7a4a20');
    px(ctx, x0 + 2, y0 + 2, 12, 1, '#d79a55');
    for (const [a, b] of [[3, 3], [12, 3], [3, 12], [12, 12]]) px(ctx, x0 + a, y0 + b, 1, 1, '#4a2c12');
  }

  function drawZ(ctx, x, y, color) {
    px(ctx, x, y, 4, 1, color);
    px(ctx, x + 2, y + 1, 1, 1, color);
    px(ctx, x + 1, y + 2, 1, 1, color);
    px(ctx, x, y + 3, 4, 1, color);
  }

  // Draw the whole board into ctx (sized w*16 x h*16).
  // view: { theme, reveal (bool), radius, t (seconds) }
  function drawBoard(ctx, s, view) {
    const th = THEMES[view.theme];
    const sp = sprites(view.theme);
    const t = view.t || 0;
    const reveal = view.reveal !== false;
    const radius = view.radius || 1;
    const dist = (x, y) => Math.max(Math.abs(x - s.player.x), Math.abs(y - s.player.y));
    const lit = (x, y) => reveal || dist(x, y) <= radius;
    const exitOpen = s.chips >= s.chipsTotal;

    px(ctx, 0, 0, s.w * TILE, s.h * TILE, '#000000');
    for (let y = 0; y < s.h; y++) {
      for (let x = 0; x < s.w; x++) {
        const i = y * s.w + x;
        const g = s.grid[i];
        const x0 = x * TILE;
        const y0 = y * TILE;
        const hv = hash(x, y);
        if (g === '#') {
          drawWall(ctx, x0, y0, th, hv);
          continue;
        }
        drawFloor(ctx, x0, y0, th, hv);
        if (g === 'x') drawLava(ctx, x0, y0, t, hv);
        else if ('RGBY'.includes(g)) drawDoor(ctx, x0, y0, g.toLowerCase());
        else if ('rgby'.includes(g)) drawGate(ctx, x0, y0, g);
        else if (g === 'E') drawExit(ctx, x0, y0, exitOpen, t);
        if (s.crates.includes(i)) drawCrate(ctx, x0, y0);
        const it = s.items[i];
        if (it === '*') drawChip(ctx, x0, y0, t);
        else if (it) ctx.drawImage(sp.keys[it], x0, y0);
      }
    }

    if (!reveal) {
      for (let y = 0; y < s.h; y++) {
        for (let x = 0; x < s.w; x++) {
          const d = dist(x, y);
          if (d > radius) px(ctx, x * TILE, y * TILE, TILE, TILE, '#020308');
          else if (d > 0) {
            ctx.globalAlpha = 0.3 * d;
            px(ctx, x * TILE, y * TILE, TILE, TILE, '#020308');
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    const frame = Math.floor(t * 6) % 2;
    for (const e of s.enemies) {
      const x0 = e.x * TILE;
      const y0 = e.y * TILE;
      if (!lit(e.x, e.y) && view.hideEnemiesInDark) continue;
      ctx.globalAlpha = lit(e.x, e.y) ? 1 : 0.75;
      if (e.type === 'spider') {
        if (e.mode === 'sleep') {
          ctx.drawImage(sp.spiderSleep, x0, y0);
          drawZ(ctx, x0 + 11, y0 - (Math.floor(t * 1.5) % 2), '#ffffff');
        } else if (e.mode === 'alert') {
          ctx.drawImage(sp.spider, x0, y0);
          px(ctx, x0 + 7, y0 - 3, 2, 4, '#ffd23f');
          px(ctx, x0 + 7, y0 + 2, 2, 1, '#ffd23f');
        } else {
          ctx.drawImage(frame ? sp.spiderB : sp.spider, x0, y0);
        }
      } else if (e.type === 'patrol') {
        ctx.drawImage(sp.ufo, x0, y0 + (frame ? 1 : 0));
        const ax = x0 + 7 + e.dx * 6;
        const ay = y0 + 7 + e.dy * 6;
        px(ctx, ax, ay, 2, 2, '#ffd23f');
      } else {
        ctx.drawImage(sp.mimic, x0, y0);
      }
      ctx.globalAlpha = 1;
    }

    const p = s.player;
    const dead = s.status === 'dead' && s.cause !== 'battery';
    ctx.drawImage(sp.robot, p.x * TILE, p.y * TILE);
    if (dead) {
      for (let k = 2; k < 14; k++) {
        px(ctx, p.x * TILE + k, p.y * TILE + k, 2, 1, '#ff3b30');
        px(ctx, p.x * TILE + 15 - k, p.y * TILE + k, 2, 1, '#ff3b30');
      }
    }
  }

  const api = { TILE, THEMES, KEY_COLORS, SHAPES, sprites, drawBoard, drawDoor, drawGate, drawShape, drawChip, drawExit, drawLava, drawCrate, drawFloor, drawWall, makeCanvas, SPRITE_ROWS: { ROBOT, SPIDER, SPIDER_B, UFO, MIMIC, KEY } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LockstepArt = api;
})(this);
