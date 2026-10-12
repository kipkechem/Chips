// Lockstep levels. `par` is the fewest possible turns (checked by tools/solve.js);
// The battery (turn limit) is derived from par by difficulty. See core.js for the map legend.
(function (root) {
  'use strict';
  const LEVELS = [
    {
      name: 'First Light',
      hint: 'Study the map. Once the lights go out, you only see what is next to you.',
      par: 28,
      map: [
        '###########',
        '#@..#...*.#',
        '#.#.#.###.#',
        '#.#...#r..#',
        '#.#####.###',
        '#..*..R..E#',
        '###########',
      ],
    },
    {
      name: 'Spend Wisely',
      hint: 'A key opens one door, then it is gone. Which door first?',
      par: 57,
      map: [
        '#############',
        '#@....Y..*..#',
        '#.###.#######',
        '#.#y#.Y...y.#',
        '#.#.#.#####.#',
        '#.....#*.b..#',
        '#######B#####',
        '#...E....*..#',
        '#############',
      ],
    },
    {
      name: 'Heat',
      hint: 'Lava kills. Crates sink into it and leave solid ground.',
      par: 29,
      map: [
        '###########',
        '#@..#...*.#',
        '#.O.x.....#',
        '#...#####x#',
        '###.#.....#',
        '#...O.###.#',
        '#.#...x..E#',
        '###########',
      ],
    },
    {
      name: 'Clockwork',
      hint: 'Patrollers walk straight and turn back when blocked. They move only when you do.',
      par: 26,
      map: [
        '#############',
        '#@..#*#..b..#',
        '#...#.#.###.#',
        '#.>.......<.#',
        '#.#.#.#.#.#.#',
        '#*#...#...#B#',
        '#####.#####.#',
        '#E....*.....#',
        '#############',
      ],
    },
    {
      name: 'Hunter',
      hint: 'The hunter always steps toward you. Walls confuse it.',
      par: 35,
      map: [
        '###########',
        '#@....#..*#',
        '#.###.#.#.#',
        '#.#C..#.#.#',
        '#.#####.#.#',
        '#.......#.#',
        '#####.###.#',
        '#*........E',
        '###########',
      ],
    },
    {
      name: 'Echo',
      hint: 'The mimic copies every move you make. Use the walls to shake it off.',
      par: 19,
      map: [
        '###########',
        '#@...#...M#',
        '#.##.#.##.#',
        '#....#....#',
        '##.#####.##',
        '#*.......*#',
        '#####E#####',
      ],
    },
    {
      name: 'Vault',
      hint: 'Everything you have learned, in the dark.',
      par: 81,
      map: [
        '###############',
        '#@..#....>....#',
        '#.O.#.#####.#.#',
        '#...x.#+..#.#*#',
        '###.###.#.##..#',
        '#*..G...#...#B#',
        '#.#####.#.#^#.#',
        '#..g....#.b.#.#',
        '#######.#####E#',
        '###############',
      ],
    },
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = LEVELS;
  else root.LOCKSTEP_LEVELS = LEVELS;
})(this);
