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
    tide: {
      name: 'Tide Works',
      bg: '#04161c', panel: '#082630', frame: '#1fb5a8', frameHi: '#7ff0e2', ink: '#e6fbf8', muted: '#8cc4bd',
      floor: '#0b2129', floorGrid: '#0e2831', detail: '#1c4450',
      wall: '#1aa39a', wallHi: '#6fe3d6', wallLo: '#0d6b66', wallEdge: '#032a28',
      enemy: '#ff6f3c', enemyDark: '#a3361a', style: 'plain',
    },
    yard: {
      name: 'Conveyor Yard',
      bg: '#0d0d10', panel: '#1a1a1f', frame: '#e0b21c', frameHi: '#ffe27a', ink: '#f7f3e6', muted: '#c2b98f',
      floor: '#18181d', floorGrid: '#1e1e24', detail: '#34343d',
      wall: '#d4a62a', wallHi: '#f5d870', wallLo: '#8f6b12', wallEdge: '#2a2003',
      checker: '#22222a',
      enemy: '#ff4d6d', enemyDark: '#a3203a', style: 'solar',
    },
    machine: {
      name: 'Machine Room',
      bg: '#0b0e15', panel: '#141a26', frame: '#8a9bbf', frameHi: '#c9d6f2', ink: '#eef2fb', muted: '#9aa6c0',
      floor: '#131824', floorGrid: '#171d2b', detail: '#2a3346',
      wall: '#6b7a99', wallHi: '#a9b6d1', wallLo: '#3e4a66', wallEdge: '#161b27',
      enemy: '#ffb23a', enemyDark: '#a3650f', style: 'plain',
    },
    zoo: {
      name: 'The Zoo',
      bg: '#08130a', panel: '#0f2212', frame: '#5cbf4a', frameHi: '#a8ef8f', ink: '#eefbe8', muted: '#9fc495',
      floor: '#122112', floorGrid: '#162716', detail: '#274227',
      wall: '#3f8f3a', wallHi: '#7fd66f', wallLo: '#24561f', wallEdge: '#0a1d08',
      speck: '#357a30', moss: '#2f6b1f', mossHi: '#9fe07a',
      enemy: '#e8312f', enemyDark: '#9a1410', style: 'moss',
    },
    glass: {
      name: 'Glass Maze',
      bg: '#0d0a18', panel: '#171228', frame: '#a07cff', frameHi: '#d6c4ff', ink: '#f3eeff', muted: '#b5a8d6',
      floor: '#15112a', floorGrid: '#1b1633', detail: '#2f2752',
      wall: '#7c5cf0', wallHi: '#c2adff', wallLo: '#4a33a8', wallEdge: '#140b33',
      speck: '#5a44b8',
      enemy: '#ff5a8a', enemyDark: '#a3204a', style: 'plain',
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

  // Player characters. 'w' is the main color, which the player can change.
  const CAT = [
    '................',
    '..kk........kk..',
    '..kpk......kpk..',
    '..kwpkkkkkkpwk..',
    '..kwwwwwwwwwwk..',
    '.kwwwwwwwwwwwwk.',
    '.kwwkekwwkekwwk.',
    '.kwwkkkwwkkkwwk.',
    '.kwwwwwppwwwwwk.',
    '.kwwwwkwwkwwwwk.',
    '..kwwwwkkwwwwk..',
    '...kkwwwwwwkk...',
    '...kwwwwwwwwk.k.',
    '...kwwkwwkwwkkwk',
    '...kwwkkkkwwkwk.',
    '....kk....kkk...',
  ];
  const ASTRONAUT = [
    '................',
    '.....kkkkkk.....',
    '...kkwwwwwwkk...',
    '..kwwwwwwwwwwk..',
    '..kwkkkkkkkkwk..',
    '.kwkvvvvvvvvkwk.',
    '.kwkvhhvvvvvkwk.',
    '.kwkvvvvvvvvkwk.',
    '..kwkkkkkkkkwk..',
    '..kwwwwwwwwwwk..',
    '.kgkwwwrrwwwkgk.',
    '.kgkwwwwwwwwkgk.',
    '..kkwwwwwwwwkk..',
    '...kwwwkkwwwk...',
    '...kwwk..kwwk...',
    '...kkkk..kkkk...',
  ];
  const FROG = [
    '................',
    '..kkkk....kkkk..',
    '.keeeek..keeeek.',
    '.keekek..kekeek.',
    '.kweeekkkkeeewk.',
    '.kwwwwwwwwwwwwk.',
    'kwwwwwwwwwwwwwwk',
    'kwkwwwwwwwwwwkwk',
    'kwwkkkkkkkkkkwwk',
    '.kwwwwwwwwwwwwk.',
    '..kwwbbbbbbwwk..',
    '..kwbbbbbbbbwk..',
    '.kwwkbbbbbbkwwk.',
    'kwwwk.kkkk.kwwwk',
    'kkkkk......kkkkk',
    '................',
  ];
  const GHOST = [
    '................',
    '.....kkkkkk.....',
    '...kkwwwwwwkk...',
    '..kwwwwwwwwwwk..',
    '..kwwwwwwwwwwk..',
    '.kwwkkwwwwkkwwk.',
    '.kwwkekwwkekwwk.',
    '.kwwkkwwwwkkwwk.',
    '.kwwwwwwwwwwwwk.',
    '.kwwwwwkkwwwwwk.',
    '.kwwwwwkkwwwwwk.',
    '.kwwwwwwwwwwwwk.',
    '.kwwwwwwwwwwwwk.',
    '.kwwkwwwkwwwkwk.',
    '.kkk.kwk.kwk.kk.',
    '......k...k.....',
  ];
  const NINJA = [
    '................',
    '.....kkkkkk.....',
    '...kkwwwwwwkk...',
    '..kwwwwwwwwwwkkk',
    '..kwwwwwwwwwwrrk',
    '..ksssssssssskrk',
    '..kseekssekeesk.',
    '..ksssssssssskk.',
    '..kwwwwwwwwwwk..',
    '...kkwwwwwwkk...',
    '..kwkwwrrwwkwk..',
    '..kwkwwwwwwkwk..',
    '...kkwwwwwwkk...',
    '...kwwwkkwwwk...',
    '...kwwk..kwwk...',
    '...kkkk..kkkk...',
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

  const JETPACK = [
    '................',
    '................',
    '................',
    '....kkk..kkk....',
    '...kgggkkgggk...',
    '...kghgkkghgk...',
    '...kgggkkgggk...',
    '...kgggkkgggk...',
    '...kgggkkgggk...',
    '...kkkkkkkkkk...',
    '....kok..kok....',
    '....kyk..kyk....',
    '.....o....o.....',
    '................',
    '................',
    '................',
  ];

  const FLAMER = [
    '................',
    '................',
    '................',
    '................',
    '..kkkk..........',
    '.krrrrk.........',
    '.krhrrkkkkkkk...',
    '.krrrrkgggggkoo.',
    '.krrrrkkkkkkkyo.',
    '.krrrrk..kk.....',
    '..kkkk...kk.....',
    '.........kk.....',
    '................',
    '................',
    '................',
    '................',
  ];

  const BLASTER = [
    '................',
    '................',
    '................',
    '................',
    '...kkkkkkkkkkk..',
    '..kbbbbbbbbbbbk.',
    '..kbhhhhhhbbbbkk',
    '..kbbbbbbbbbbbk.',
    '..kkkkbbkkkkkk..',
    '.....kbbk.......',
    '.....kbbk.......',
    '.....kkkk.......',
    '................',
    '................',
    '................',
    '................',
  ];

  const FREEZER = [
    '................',
    '...........y....',
    '..........k.....',
    '.....kkkkk......',
    '....kcccccck....',
    '...kcchccccck...',
    '...kchhcwccck...',
    '...kcccwwwcck...',
    '...kccccwccck...',
    '...kcccccccck...',
    '....kcccccck....',
    '.....kkkkkk.....',
    '................',
    '................',
    '................',
    '................',
  ];

  // Monsters with a heading are drawn facing up and rotated to face the way they move.
  const BUG = [
    '................',
    '.....k....k.....',
    '......k..k......',
    '.....kkkkkk.....',
    '....kddddddk....',
    '..k.kkkkkkkk.k..',
    '...kgggkkgggk...',
    '.kkkghgkkghgkkk.',
    '...kgggkkgggk...',
    '.kkkgggkkgggkkk.',
    '...kgggkkgggk...',
    '.kkkgggkkgggkkk.',
    '....kggkkggk....',
    '.....kkkkkk.....',
    '................',
    '................',
  ];
  const PARA = [
    '................',
    '......kkkk......',
    '.l..kkppppkk..l.',
    '..lkppppppppkl..',
    '...kpwwppwwpk...',
    '.l.kpwkppwkpk.l.',
    '...kppppppppk...',
    '..lkppppppppkl..',
    '...kppppppppk...',
    '.l.kppppppppk.l.',
    '...kppppppppk...',
    '..lkppppppppkl..',
    '....kkppppkk....',
    '......kkkk......',
    '................',
    '................',
  ];
  const FIREBALL = [
    '................',
    '.......o........',
    '....o..oo..o....',
    '.....oooooo.....',
    '...ooyyyyyyoo...',
    '..ooyywwwwyyoo..',
    '..oyywwwwwwyyo..',
    '.ooyywwwwwwyyoo.',
    '..oyywwwwwwyyo..',
    '..ooyywwwwyyoo..',
    '...ooyyyyyyoo...',
    '....oooooooo....',
    '.....oo..oo.....',
    '................',
    '................',
    '................',
  ];
  const GLIDER = [
    '................',
    '.......kk.......',
    '......kbbk......',
    '.....kbhbbk.....',
    '....kbbhbbbk....',
    '...kbbbbbbbbk...',
    '..kbbbwbbwbbbk..',
    '.kbbbbbbbbbbbbk.',
    'kbbbbbbbbbbbbbbk',
    'kbbkkbbbbbbkkbbk',
    'kbk..kbbbbk..kbk',
    'kk....kbbk....kk',
    '.......kk.......',
    '.......kk.......',
    '................',
    '................',
  ];
  const TANK = [
    '................',
    '.......kk.......',
    '.......kk.......',
    '.......kk.......',
    '..kkkkkkkkkkkk..',
    '..kttkggggkttk..',
    '..kttkghggkttk..',
    '..kttkggggkttk..',
    '..kttkgkkgkttk..',
    '..kttkggggkttk..',
    '..kttkggggkttk..',
    '..kttkggggkttk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '................',
  ];
  const TEETH = [
    '................',
    '................',
    '....kkkkkkkk....',
    '...kmmmmmmmmk...',
    '..kmmwmmmmwmmk..',
    '..kmmkmmmmkmmk..',
    '..kmmmmmmmmmmk..',
    '..kwwkwwkwwkwk..',
    '..krrrrrrrrrrk..',
    '..kwkwwkwwkwwk..',
    '..kmmmmmmmmmmk..',
    '...kmmmmmmmmk...',
    '....kkkkkkkk....',
    '................',
    '................',
    '................',
  ];
  const BLOB = [
    '................',
    '................',
    '................',
    '................',
    '......kkkk......',
    '....kksssskk....',
    '...kshssssssk...',
    '..kssssssssssk..',
    '..ksswsssswssk..',
    '.kssskssssksssk.',
    '.kssssssssssssk.',
    'kssssssssssssssk',
    'kkkkkkkkkkkkkkkk',
    '................',
    '................',
    '................',
  ];
  const WALKER = [
    '................',
    '................',
    '.....kkkkkk.....',
    '....kooooook....',
    '...koohoooook...',
    '..koowwoowwook..',
    '..koowkoowkook..',
    '..kooooooooook..',
    '..kooookkooook..',
    '...kooooooook...',
    '....kkkkkkkk....',
    '....kk....kk....',
    '...kkk....kkk...',
    '................',
    '................',
    '................',
  ];
  const THIEF = [
    '................',
    '................',
    '.....kkkkkk.....',
    '....kddddddk....',
    '...kkkkkkkkkk...',
    '...kffffffffk...',
    '...kmmmmmmmmk...',
    '...kmwmmmmwmk...',
    '...kffffffffk...',
    '...kfffkkfffk...',
    '....kffffffk....',
    '.....kkkkkk.....',
    '................',
    '................',
    '................',
    '................',
  ];
  const BOOT = [
    '................',
    '................',
    '.....kkkkk......',
    '.....kcchk......',
    '.....kccck......',
    '.....kccck......',
    '.....kccck......',
    '.....kccckkkk...',
    '....kcccccccck..',
    '....kccccccccck.',
    '....kkkkkkkkkkk.',
    '................',
    '................',
    '................',
    '................',
    '................',
  ];
  const BOOT_COLORS = {
    p: { c: '#2f8cff', h: '#9ccbff' }, // flippers
    h: { c: '#e8392f', h: '#ff9a8a' }, // fire boots
    k: { c: '#e6ebf5', h: '#ffffff' }, // ice skates
    u: { c: '#2fcf3a', h: '#a6f08f' }, // suction boots
  };

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
  const EDGE_SIDES = {
    '-': ['up'], _: ['down'], '{': ['left'], '}': ['right'],
    7: ['up', 'left'], 9: ['up', 'right'], 3: ['down', 'right'], 0: ['down', 'left'],
  };
  // The characters you can play as. 'w' is each one's main color, which you can recolor.
  const AVATARS = [
    { id: 'robot', name: 'Robot', rows: ROBOT, pal: { w: '#f2f4f8', g: '#b9c1cf', c: '#3ad6ff', r: '#ff3b30', o: '#ff8a1f' } },
    { id: 'cat', name: 'Cat', rows: CAT, pal: { w: '#ffa94d', p: '#ff8fb1', e: '#7dff6b' } },
    { id: 'astronaut', name: 'Astronaut', rows: ASTRONAUT, pal: { w: '#e8ecf4', v: '#3ad6ff', h: '#e6fbff', g: '#9aa3b5', r: '#ff3b30' } },
    { id: 'frog', name: 'Frog', rows: FROG, pal: { w: '#5fd35f', e: '#ffffff', b: '#f4f1b8' } },
    { id: 'ghost', name: 'Ghost', rows: GHOST, pal: { w: '#d6dcff', e: '#3ad6ff' } },
    { id: 'ninja', name: 'Ninja', rows: NINJA, pal: { w: '#3a3f58', s: '#f2c9a0', e: '#ffffff', r: '#ff3b30' } },
  ];
  const avatarCache = new Map();
  function avatarSprite(id, color) {
    const key = `${id}|${color || ''}`;
    if (!avatarCache.has(key)) {
      const a = AVATARS.find((v) => v.id === id) || AVATARS[0];
      avatarCache.set(key, sprite(a.rows, { k: OUTLINE, ...a.pal, ...(color ? { w: color } : {}) }));
    }
    return avatarCache.get(key);
  }

  // Four copies of an up-facing sprite, turned to face up, right, down and left.
  function turned(src) {
    return [0, 1, 2, 3].map((q) => {
      const c = makeCanvas(TILE, TILE);
      const x = c.getContext('2d');
      x.translate(TILE / 2, TILE / 2);
      x.rotate((q * Math.PI) / 2);
      x.drawImage(src, -TILE / 2, -TILE / 2);
      return c;
    });
  }

  function bootSprite(b) {
    const col = BOOT_COLORS[b];
    const c = sprite(BOOT, { k: OUTLINE, c: col.c, h: col.h });
    const x = c.getContext('2d');
    const dot = (a, y, w, h, color) => {
      x.fillStyle = color;
      x.fillRect(a, y, w, h);
    };
    if (b === 'p') {
      dot(13, 8, 2, 3, col.h);
      dot(14, 7, 2, 5, col.c);
      dot(15, 6, 1, 7, OUTLINE);
    } else if (b === 'h') {
      dot(6, 0, 1, 2, '#ffd23f');
      dot(8, 0, 1, 2, '#ff8a1f');
      dot(7, 1, 1, 1, '#ffd23f');
    } else if (b === 'k') {
      dot(4, 11, 11, 1, '#9aa3b5');
      dot(5, 12, 1, 1, '#9aa3b5');
      dot(13, 12, 1, 1, '#9aa3b5');
    } else if (b === 'u') {
      for (const a of [5, 8, 11]) dot(a, 11, 2, 2, '#16801e');
    }
    return c;
  }
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
      powers: {
        j: sprite(JETPACK, { k: OUTLINE, g: '#9aa3b5', h: '#e6ebf5', o: '#ff8a1f', y: '#ffd23f' }),
        f: sprite(FLAMER, { k: OUTLINE, r: '#e8392f', h: '#ff9a8a', g: '#9aa3b5', o: '#ff8a1f', y: '#ffd23f' }),
        m: sprite(BLASTER, { k: OUTLINE, b: '#4c8dff', h: '#cfe3ff' }),
        z: sprite(FREEZER, { k: OUTLINE, c: '#5ab8ff', h: '#d9f1ff', w: '#ffffff', y: '#ffd23f' }),
      },
      keys: {},
      monsters: {
        bug: turned(sprite(BUG, { k: OUTLINE, d: '#1e6b2a', g: '#3fbf4a', h: '#a6f08f' })),
        para: turned(sprite(PARA, { k: OUTLINE, p: '#b06cf0', w: '#ffffff', l: '#e0b8ff' })),
        fireball: [sprite(FIREBALL, { o: '#ff5a1f', y: '#ffb02a', w: '#fff2a8' })],
        glider: turned(sprite(GLIDER, { k: OUTLINE, b: '#3aa8ff', h: '#bfe6ff', w: '#ffffff' })),
        tank: turned(sprite(TANK, { k: OUTLINE, t: '#3a3f4a', g: '#8a9a4a', h: '#c9d68a' })),
        teeth: [sprite(TEETH, { k: OUTLINE, m: '#ff6fae', w: '#ffffff', r: '#5a0f2a' })],
        blob: [sprite(BLOB, { k: OUTLINE, s: '#6ad13a', h: '#d6ffb0', w: '#ffffff' })],
        walker: [sprite(WALKER, { k: OUTLINE, o: '#ffa63a', h: '#ffe0a8', w: '#ffffff' })],
      },
      thief: sprite(THIEF, { k: OUTLINE, d: '#3b2b5c', f: '#e8b48a', m: '#241a36', w: '#ffffff' }),
      boots: {},
    };
    for (const k of Object.keys(KEY_COLORS)) set.keys[k] = sprite(KEY, { k: OUTLINE, ...KEY_COLORS[k] });
    for (const b of Object.keys(BOOT_COLORS)) set.boots[b] = bootSprite(b);
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



  function drawSteel(ctx, x0, y0) {
    px(ctx, x0, y0, 16, 16, '#22262f');
    px(ctx, x0, y0, 15, 15, '#6b7385');
    px(ctx, x0, y0, 15, 2, '#a7afc0');
    px(ctx, x0, y0, 1, 15, '#a7afc0');
    px(ctx, x0, y0 + 12, 15, 3, '#454b5a');
    px(ctx, x0 + 14, y0, 1, 15, '#454b5a');
    for (const [a, b] of [[3, 4], [11, 4], [3, 10], [11, 10]]) {
      px(ctx, x0 + a, y0 + b, 2, 2, '#2f3440');
      px(ctx, x0 + a, y0 + b, 1, 1, '#c9ced8');
    }
  }

  function drawCracks(ctx, x0, y0, color) {
    const pts = [[7, 1], [7, 2], [6, 3], [6, 4], [7, 5], [8, 6], [8, 7], [7, 8], [6, 9], [6, 10], [7, 11], [9, 4], [10, 3], [4, 8], [3, 9], [9, 9], [10, 10]];
    for (const [a, b] of pts) px(ctx, x0 + a, y0 + b, 1, 1, color);
  }

  function drawIce(ctx, x0, y0, hv) {
    px(ctx, x0, y0, 16, 16, '#8fcdf0');
    px(ctx, x0, y0, 16, 1, '#b9e4fb');
    px(ctx, x0, y0, 1, 16, '#b9e4fb');
    const o = hv % 5;
    for (let k = 0; k < 4; k++) px(ctx, x0 + 3 + o + k, y0 + 10 - k, 1, 1, '#e8f8ff');
    for (let k = 0; k < 3; k++) px(ctx, x0 + 8 + k, y0 + 13 - k, 1, 1, '#e8f8ff');
    px(ctx, x0 + 12, y0 + 3 + (hv % 3), 1, 1, '#ffffff');
  }

  // A wall along some edges of a tile (thin walls, ice corners).
  function drawEdgeWalls(ctx, x0, y0, sides, th) {
    for (const d of sides) {
      const [x, y, w, h] = { up: [0, 0, 16, 4], down: [0, 12, 16, 4], left: [0, 0, 4, 16], right: [12, 0, 4, 16] }[d];
      px(ctx, x0 + x, y0 + y, w, h, OUTLINE);
      px(ctx, x0 + x + 1, y0 + y + 1, w - 2, h - 2, th.wall);
      px(ctx, x0 + x + 1, y0 + y + 1, w - 2, 1, th.wallEdge);
    }
  }

  // An ice corner: ice with two walled sides and a rounded fill where they meet.
  function drawIceCorner(ctx, x0, y0, sides, th, hv) {
    drawIce(ctx, x0, y0, hv);
    const v = sides.includes('up') ? 0 : 1;
    const h = sides.includes('left') ? 0 : 1;
    for (let k = 0; k < 5; k++) {
      const len = 5 - k;
      const yy = v ? 15 - (4 + k) : 4 + k;
      px(ctx, x0 + (h ? 12 - len : 4), y0 + yy, len, 1, '#5aa9d6');
    }
    drawEdgeWalls(ctx, x0, y0, sides, th);
  }

  // Pop-up wall: floor with a sunken outline, ready to rise.
  function drawPopup(ctx, x0, y0, th) {
    for (let k = 2; k < 14; k += 2) {
      px(ctx, x0 + k, y0 + 2, 1, 1, th.wallEdge);
      px(ctx, x0 + k, y0 + 13, 1, 1, th.wallEdge);
      px(ctx, x0 + 2, y0 + k, 1, 1, th.wallEdge);
      px(ctx, x0 + 13, y0 + k, 1, 1, th.wallEdge);
    }
    px(ctx, x0 + 7, y0 + 5, 2, 4, th.wallEdge);
    px(ctx, x0 + 6, y0 + 6, 4, 1, th.wallEdge);
  }

  // Random force floor: arrows spinning through all four ways.
  function drawRandomForce(ctx, x0, y0, t) {
    px(ctx, x0, y0, 16, 16, '#2a2440');
    px(ctx, x0, y0, 16, 1, '#3a3260');
    const dir = ['up', 'right', 'down', 'left'][Math.floor(t * 4) % 4];
    for (let k = 0; k < 4; k++) {
      rotPx(ctx, x0, y0, dir, 6 + k, 4 + k, 1, 1, '#d6a8ff');
      rotPx(ctx, x0, y0, dir, 6 + k, 11 - k, 1, 1, '#d6a8ff');
    }
    px(ctx, x0 + 2, y0 + 2, 2, 2, '#d6a8ff');
    px(ctx, x0 + 12, y0 + 12, 2, 2, '#d6a8ff');
  }

  // Chip socket: a frame that takes every chip in the level before it opens.
  function drawSocket(ctx, x0, y0, t) {
    px(ctx, x0 + 1, y0, 14, 16, OUTLINE);
    px(ctx, x0 + 2, y0 + 1, 12, 14, '#2c3b2e');
    px(ctx, x0 + 2, y0 + 1, 12, 2, '#4b6b4f');
    ctx.globalAlpha = 0.35; // a faded chip: what it is waiting for
    drawChip(ctx, x0, y0, t);
    ctx.globalAlpha = 1;
    for (const y of [5, 10]) px(ctx, x0 + 2, y0 + y, 12, 2, '#c9a227'); // locked bars
  }

  function drawHole(ctx, x0, y0, th) {
    px(ctx, x0, y0, 16, 16, '#030407');
    px(ctx, x0, y0, 16, 2, th.floorGrid);
    px(ctx, x0 + 1, y0 + 2, 14, 2, '#0b0d14');
  }

  function drawBeat(ctx, x0, y0, which, solid, th) {
    const col = which === '1' ? { c: '#ff4fd8', h: '#ffa8ee', d: '#a01d88' } : { c: '#36dcff', h: '#b4f2ff', d: '#137a9a' };
    if (solid) {
      px(ctx, x0, y0, 16, 16, OUTLINE);
      px(ctx, x0 + 1, y0 + 1, 14, 14, col.c);
      px(ctx, x0 + 1, y0 + 1, 14, 2, col.h);
      px(ctx, x0 + 1, y0 + 12, 14, 3, col.d);
      px(ctx, x0 + 6, y0 + 6, 4, 4, col.h);
    } else {
      for (let i = 1; i < 15; i += 2) {
        px(ctx, x0 + i, y0 + 1, 1, 1, col.d);
        px(ctx, x0 + i, y0 + 14, 1, 1, col.d);
        px(ctx, x0 + 1, y0 + i, 1, 1, col.d);
        px(ctx, x0 + 14, y0 + i, 1, 1, col.d);
      }
      px(ctx, x0 + 7, y0 + 7, 2, 2, col.d);
    }
  }

  function drawFence(ctx, x0, y0) {
    px(ctx, x0, y0 + 2, 16, 2, '#c9ced8');
    px(ctx, x0, y0 + 12, 16, 2, '#c9ced8');
    for (let i = 1; i < 16; i += 4) {
      px(ctx, x0 + i, y0 + 1, 2, 14, '#e6ebf5');
      px(ctx, x0 + i + 1, y0 + 1, 1, 14, '#8a91a3');
    }
  }

  function drawFrozen(ctx, x0, y0, turns) {
    ctx.globalAlpha = 0.55;
    px(ctx, x0 + 1, y0 + 1, 14, 14, '#a8dcff');
    ctx.globalAlpha = 1;
    px(ctx, x0 + 1, y0 + 1, 14, 1, '#ffffff');
    px(ctx, x0 + 1, y0 + 1, 1, 14, '#ffffff');
    px(ctx, x0 + 14, y0 + 1, 1, 14, '#5ab8ff');
    px(ctx, x0 + 1, y0 + 14, 14, 1, '#5ab8ff');
    for (let k = 0; k < turns; k++) px(ctx, x0 + 3 + k * 2, y0 + 12, 1, 1, '#ffffff');
  }

  // Transient effects layered over the board. fx: { kind, at: [[x,y],...], to: [x,y], t0 }
  function drawEffects(ctx, list, now) {
    for (const fx of list) {
      const age = now - fx.t0;
      if (fx.kind === 'flame') {
        for (const [x, y] of fx.at) {
          const f = Math.floor(age * 20 + x + y) % 3;
          const x0 = x * TILE;
          const y0 = y * TILE;
          px(ctx, x0 + 1, y0 + 4, 14, 9, '#ff6a1a');
          px(ctx, x0 + 3 + f, y0 + 2, 10 - f, 9, '#ffb02a');
          px(ctx, x0 + 5, y0 + 5 + f, 6, 5, '#fff2a8');
        }
      } else if (fx.kind === 'shot') {
        const [ax, ay] = fx.at[0];
        const [bx, by] = fx.to;
        const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) || 1;
        const reach = Math.min(1, age / 0.12);
        for (let k = 0; k <= steps * reach; k++) {
          const x = ax + Math.sign(bx - ax) * k;
          const y = ay + Math.sign(by - ay) * k;
          px(ctx, x * TILE + 6, y * TILE + 6, 4, 4, '#bff6ff');
          px(ctx, x * TILE + 7, y * TILE + 7, 2, 2, '#ffffff');
        }
      } else if (fx.kind === 'boom' || fx.kind === 'splat' || fx.kind === 'dust' || fx.kind === 'splash' || fx.kind === 'sparkle') {
        const [x, y] = fx.at[0];
        const r = Math.min(7, 2 + age * 30);
        const color = {
          boom: ['#fff2a8', '#ff8a1f'],
          splat: ['#ffffff', '#7a1fe0'],
          dust: ['#c9b48a', '#6b5a3a'],
          splash: ['#bfe2ff', '#2f8cff'],
          sparkle: ['#ffffff', '#36dcff'],
        }[fx.kind];
        const cx = x * TILE + 8;
        const cy = y * TILE + 8;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          px(ctx, Math.round(cx + Math.cos(a) * r) - 1, Math.round(cy + Math.sin(a) * r) - 1, 3, 3, color[k % 2]);
        }
        px(ctx, cx - 2, cy - 2, 4, 4, color[0]);
      } else if (fx.kind === 'freeze') {
        ctx.globalAlpha = Math.max(0, 0.5 - age);
        px(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height, '#bfe6ff');
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawWater(ctx, x0, y0, t, hv) {
    px(ctx, x0, y0, 16, 16, '#1c5fc4');
    const f = Math.floor(t * 3 + hv) % 4;
    for (const yy of [3, 8, 13]) {
      for (let xx = 0; xx < 16; xx++) {
        if ((xx + f + yy) % 6 < 3) px(ctx, x0 + xx, y0 + yy + (((xx + f) % 6) < 1 ? -1 : 0), 1, 1, '#5aa8ff');
      }
    }
    px(ctx, x0 + ((hv + f * 3) % 12) + 2, y0 + 5 + (hv % 3) * 3, 2, 1, '#bfe2ff');
  }

  function drawFire(ctx, x0, y0, t, hv) {
    px(ctx, x0, y0, 16, 16, '#5a1408');
    const f = Math.floor(t * 6 + hv) % 2;
    for (const [cx, h] of [[3, 9], [8, 12], [13, 8]]) {
      const top = 15 - h - f;
      for (let yy = top; yy < 16; yy++) {
        const half = Math.max(0, Math.floor(((yy - top) * 3) / h));
        px(ctx, x0 + cx - half, y0 + yy, half * 2 + 1, 1, '#ff6a1a');
      }
      px(ctx, x0 + cx, y0 + top + 3, 1, h - 4, '#ffd23f');
    }
  }

  // Draw pixels as if facing right, rotated to face dir.
  function rotPx(ctx, x0, y0, dir, x, y, w, h, color) {
    for (let a = 0; a < w; a++) {
      for (let b = 0; b < h; b++) {
        let X = x + a;
        let Y = y + b;
        if (dir === 'left') X = 15 - X;
        else if (dir === 'down') [X, Y] = [15 - Y, X];
        else if (dir === 'up') [X, Y] = [Y, 15 - X];
        px(ctx, x0 + X, y0 + Y, 1, 1, color);
      }
    }
  }

  function drawForce(ctx, x0, y0, dir, t) {
    px(ctx, x0, y0, 16, 16, '#22303e');
    px(ctx, x0, y0, 16, 1, '#2d4052');
    const off = Math.floor(t * 12) % 8;
    for (const base of [0, 8]) {
      const cx = (base + off) % 16;
      for (let k = 0; k < 4; k++) {
        rotPx(ctx, x0, y0, dir, (cx + k) % 16, 4 + k, 1, 1, '#7fe3ff');
        rotPx(ctx, x0, y0, dir, (cx + k) % 16, 11 - k, 1, 1, '#7fe3ff');
      }
    }
  }

  function drawTeleport(ctx, x0, y0, t) {
    px(ctx, x0, y0, 16, 16, '#090d1a');
    const f = Math.floor(t * 8) % 3;
    const cols = ['#36dcff', '#1f6fff', '#b98cff'];
    for (let r = 0; r < 3; r++) {
      const c = cols[(r + f) % 3];
      const a = 2 + r * 2;
      const b = 16 - a * 2;
      px(ctx, x0 + a, y0 + a, b, 1, c);
      px(ctx, x0 + a, y0 + a + b - 1, b, 1, c);
      px(ctx, x0 + a, y0 + a, 1, b, c);
      px(ctx, x0 + a + b - 1, y0 + a, 1, b, c);
    }
    px(ctx, x0 + 7, y0 + 7, 2, 2, '#ffffff');
  }

  function drawBomb(ctx, x0, y0, t) {
    const cx = x0 + 7;
    const cy = y0 + 9;
    for (let yy = -5; yy <= 5; yy++) {
      const half = Math.floor(Math.sqrt(25 - yy * yy));
      px(ctx, cx - half, cy + yy, half * 2 + 1, 1, '#16181f');
    }
    px(ctx, cx - 3, cy - 3, 2, 2, '#5b6170');
    px(ctx, cx + 2, cy - 6, 1, 2, '#b9a06a');
    px(ctx, cx + 3, cy - 7, 1, 1, '#b9a06a');
    px(ctx, cx + 4, cy - 8, 2, 2, Math.floor(t * 8) % 2 ? '#ffd23f' : '#ff5a1f');
  }

  function drawGravel(ctx, x0, y0, hv) {
    let seed = hv * 7919 + 13;
    const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) >>> 16;
    for (let k = 0; k < 16; k++) {
      px(ctx, x0 + 1 + (next() % 13), y0 + 1 + (next() % 14), 2, 1, k % 3 ? '#7d8496' : '#5b6170');
    }
  }

  function drawDirt(ctx, x0, y0, hv) {
    px(ctx, x0, y0, 16, 16, '#5e4126');
    for (let k = 0; k < 10; k++) {
      px(ctx, x0 + ((hv * (k + 2) * 7) % 15), y0 + ((hv * (k + 5) * 3) % 15), 1, 1, k % 2 ? '#7d5a36' : '#3f2a17');
    }
  }

  function drawToggle(ctx, x0, y0, closed) {
    if (closed) {
      px(ctx, x0, y0, 16, 16, '#0a2a12');
      px(ctx, x0 + 1, y0 + 1, 14, 14, '#1f8a3a');
      for (let k = -14; k < 16; k += 4) {
        for (let a = 0; a < 14; a++) {
          const b = a + k;
          if (b >= 0 && b < 14) px(ctx, x0 + 1 + a, y0 + 1 + b, 1, 1, '#37d15a');
        }
      }
    } else {
      for (let i = 1; i < 15; i += 2) {
        px(ctx, x0 + i, y0 + 1, 1, 1, '#2fcf3a');
        px(ctx, x0 + i, y0 + 14, 1, 1, '#2fcf3a');
        px(ctx, x0 + 1, y0 + i, 1, 1, '#2fcf3a');
        px(ctx, x0 + 14, y0 + i, 1, 1, '#2fcf3a');
      }
    }
  }

  function drawTrap(ctx, x0, y0, open) {
    px(ctx, x0 + 1, y0 + 1, 14, 2, '#7a4a1e');
    px(ctx, x0 + 1, y0 + 13, 14, 2, '#7a4a1e');
    px(ctx, x0 + 1, y0 + 1, 2, 14, '#7a4a1e');
    px(ctx, x0 + 13, y0 + 1, 2, 14, '#7a4a1e');
    if (!open) {
      for (let a = 4; a < 13; a += 3) {
        px(ctx, x0 + a, y0 + 3, 1, 3, '#c9ced8');
        px(ctx, x0 + a, y0 + 10, 1, 3, '#c9ced8');
      }
    }
  }

  const BUTTON_COLORS = { '(': '#2fcf3a', ')': '#b0732f', '[': '#e8392f', ']': '#2f8cff' };
  function drawButton(ctx, x0, y0, g) {
    px(ctx, x0 + 3, y0 + 4, 10, 9, OUTLINE);
    px(ctx, x0 + 4, y0 + 3, 8, 11, OUTLINE);
    px(ctx, x0 + 4, y0 + 4, 8, 8, BUTTON_COLORS[g]);
    px(ctx, x0 + 5, y0 + 5, 3, 2, '#ffffff');
  }

  function drawHintTile(ctx, x0, y0) {
    px(ctx, x0 + 3, y0 + 2, 10, 12, '#2a2f3d');
    const Q = ['.###.', '#...#', '...#.', '..#..', '..#..', '.....', '..#..'];
    Q.forEach((row, yy) => {
      for (let xx = 0; xx < 5; xx++) if (row[xx] === '#') px(ctx, x0 + 5 + xx, y0 + 4 + yy, 1, 1, '#ffd23f');
    });
  }

  // Draw the whole level into ctx (sized w*16 x h*16).
  // view: { theme, t (seconds), phase (beat phase 0|1), prev (last turn's state), k (0..1 through the turn),
  //         trapsOpen (a brown button is held down) }
  function drawBoard(ctx, s, view) {
    const th = THEMES[view.theme];
    const sp = sprites(view.theme);
    const t = view.t || 0;
    const phase = view.phase || 0;
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
        if (g === 'W') {
          drawWall(ctx, x0, y0, th, hv);
          drawCracks(ctx, x0, y0, th.wallEdge);
          continue;
        }
        if (g === '%' || g === 'C') {
          drawSteel(ctx, x0, y0);
          if (g === 'C') {
            const c = (s.cloners || []).find((k) => k.x === x && k.y === y);
            if (c) {
              const art = sp.monsters[c.type] || [sp.spider];
              const q = { up: 0, right: 1, down: 2, left: 3 }[c.dir] || 0;
              ctx.globalAlpha = 0.85;
              ctx.drawImage(art[art.length > 1 ? q : 0], x0 + 2, y0 + 2, 12, 12);
              ctx.globalAlpha = 1;
            }
          }
          continue;
        }
        if (g === 'N' || g === 'L') {
          if (g === 'N') drawWall(ctx, x0, y0, th, hv);
          else drawToggle(ctx, x0, y0, true);
          continue;
        }
        if (g === 'H') {
          drawHole(ctx, x0, y0, th);
          continue;
        }
        if (g === '~') drawIce(ctx, x0, y0, hv);
        else if ('7930'.includes(g)) drawIceCorner(ctx, x0, y0, EDGE_SIDES[g], th, hv);
        else if (g === '+') drawRandomForce(ctx, x0, y0, t);
        else if (g === 'w') drawWater(ctx, x0, y0, t, hv);
        else if (g === 'F') drawFire(ctx, x0, y0, t, hv);
        else if (g === ';') drawDirt(ctx, x0, y0, hv);
        else if ('<>^v'.includes(g)) drawForce(ctx, x0, y0, { '<': 'left', '>': 'right', '^': 'up', v: 'down' }[g], t);
        else if (g === 'o') drawTeleport(ctx, x0, y0, t);
        else drawFloor(ctx, x0, y0, th, hv);
        if (g === ',') drawGravel(ctx, x0, y0, hv);
        else if (g === 'K') drawBomb(ctx, x0, y0, t);
        else if (g === 'l') drawToggle(ctx, x0, y0, false);
        else if (g === 'J') drawTrap(ctx, x0, y0, view.trapsOpen);
        else if (BUTTON_COLORS[g]) drawButton(ctx, x0, y0, g);
        else if (g === '?') drawHintTile(ctx, x0, y0);
        else if (g === 'T') ctx.drawImage(sp.thief, x0, y0);
        else if ('-_{}'.includes(g)) drawEdgeWalls(ctx, x0, y0, EDGE_SIDES[g], th);
        else if (g === '!') drawPopup(ctx, x0, y0, th);
        else if (g === '$') drawSocket(ctx, x0, y0, t);
        if (g === ':') drawCracks(ctx, x0, y0, th.detail);
        else if (g === 'x') drawLava(ctx, x0, y0, t, hv);
        else if (g === '1' || g === '2') drawBeat(ctx, x0, y0, g, (g === '1') === (phase === 0), th);
        else if (g === '=') drawFence(ctx, x0, y0);
        else if ('RGBY'.includes(g)) drawDoor(ctx, x0, y0, g.toLowerCase());
        else if ('rgby'.includes(g)) drawGate(ctx, x0, y0, g);
        else if (g === 'E') drawExit(ctx, x0, y0, exitOpen, t);
        if (s.crates.includes(i)) drawCrate(ctx, x0, y0);
        const it = s.items[i];
        if (it === '*') drawChip(ctx, x0, y0, t);
        else if (sp.boots[it]) ctx.drawImage(sp.boots[it], x0, y0);
        else if (sp.powers[it]) {
          const bob = Math.floor(t * 3) % 2;
          ctx.drawImage(sp.powers[it], x0, y0 - bob);
        } else if (it) ctx.drawImage(sp.keys[it], x0, y0);
      }
    }

    const frame = Math.floor(t * 6) % 2;
    // Entities glide from where they were last turn (view.prev) to where they are, by view.k.
    const k = view.k === undefined ? 1 : view.k;
    const at = (from, to) => {
      if (!from || Math.abs(from.x - to.x) + Math.abs(from.y - to.y) !== 1) return [to.x * TILE, to.y * TILE];
      return [Math.round((from.x + (to.x - from.x) * k) * TILE), Math.round((from.y + (to.y - from.y) * k) * TILE)];
    };
    const before = new Map(((view.prev && view.prev.enemies) || []).map((e) => [e.id, e]));
    for (const e of s.enemies) {
      let [x0, y0] = at(before.get(e.id), e);
      if (e.type === 'spider') {
        if (e.frozen) ctx.drawImage(sp.spider, x0, y0);
        else if (e.mode === 'alert') {
          // Spotted you: a moment of surprise before it gives chase.
          ctx.drawImage(sp.spider, x0 + (frame ? 1 : -1), y0);
          px(ctx, x0 + 7, y0 - 4, 2, 4, '#ffd23f');
          px(ctx, x0 + 7, y0 + 1, 2, 1, '#ffd23f');
        } else if (e.mode === 'chase') {
          ctx.drawImage(frame ? sp.spiderB : sp.spider, x0, y0);
        } else {
          // Waiting: straining against whatever blocks it, leaning toward you.
          if (frame) {
            x0 += Math.sign(s.player.x - e.x);
            y0 += Math.sign(s.player.y - e.y);
          }
          ctx.drawImage(sp.spider, x0, y0);
        }
      } else if (e.type === 'patrol') {
        ctx.drawImage(sp.ufo, x0, y0 + (frame && !e.frozen ? 1 : 0));
        px(ctx, x0 + 7 + e.dx * 6, y0 + 7 + e.dy * 6, 2, 2, '#ffd23f');
      } else if (sp.monsters[e.type]) {
        const art = sp.monsters[e.type];
        const q = e.dy < 0 ? 0 : e.dx > 0 ? 1 : e.dy > 0 ? 2 : 3;
        const bob = !e.frozen && frame && (e.type === 'blob' || e.type === 'teeth' || e.type === 'walker') ? 1 : 0;
        ctx.drawImage(art.length > 1 ? art[q] : art[0], x0, y0 + bob);
      } else {
        ctx.drawImage(sp.mimic, x0, y0);
      }
      if (e.frozen) drawFrozen(ctx, x0, y0, Math.ceil(e.frozen / 3));
    }

    const [rx, ry] = at(view.prev && view.prev.player, s.player);
    ctx.drawImage(view.avatar || sp.robot, rx, ry);
    // While you hold an aimed power-up, a small arrow shows which way it will fire.
    if (s.status === 'play' && ['j', 'f', 'm'].some((k) => s.powers[k])) {
      // A chevron just outside the robot, pointing into the tile it will hit.
      const { dx, dy } = { up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 } }[s.facing];
      for (let n = 0; n < 3; n++) {
        const along = 9 + n; // pixels out from the robot's center, just past its edge
        const half = 3 - n;
        const cx = rx + 8 + dx * along - (dx < 0 ? 1 : 0);
        const cy = ry + 8 + dy * along - (dy < 0 ? 1 : 0);
        if (dx) px(ctx, cx, cy - half, 1, half * 2, '#ffd23f');
        else px(ctx, cx - half, cy, half * 2, 1, '#ffd23f');
      }
    }
    if (s.status === 'dead' && s.cause !== 'battery') {
      for (let n = 2; n < 14; n++) {
        px(ctx, rx + n, ry + n, 2, 1, '#ff3b30');
        px(ctx, rx + 15 - n, ry + n, 2, 1, '#ff3b30');
      }
    }
  }

  const api = {
    TILE, THEMES, KEY_COLORS, SHAPES, sprites, drawBoard, drawEffects, drawDoor, drawGate, drawShape, drawChip, drawExit,
    drawLava, drawCrate, drawFloor, drawWall, drawSteel, drawCracks, drawIce, drawHole, drawBeat, drawFence, drawFrozen, makeCanvas,
    drawWater, drawFire, drawForce, drawTeleport, drawBomb, drawGravel, drawDirt, drawToggle, drawTrap, drawButton, drawHintTile,
    drawEdgeWalls, drawIceCorner, drawPopup, drawRandomForce, drawSocket,
    AVATARS, avatarSprite,
    SPRITE_ROWS: { ROBOT, CAT, ASTRONAUT, FROG, GHOST, NINJA, SPIDER, SPIDER_B, UFO, MIMIC, KEY, JETPACK, FLAMER, BLASTER, FREEZER, BUG, PARA, FIREBALL, GLIDER, TANK, TEETH, BLOB, WALKER, THIEF, BOOT },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LockstepArt = api;
})(this);
