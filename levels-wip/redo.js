module.exports = [
 {
  "name": "Deep End",
  "world": "tide",
  "map": [
   "#####################",
   "#ww*wwww#.....#..*..#",
   "#wwwwbww#.....#.....#",
   "#ww.wwwwB.....B..E..#",
   "#wwwwwww#.....#.....#",
   "#ww*wwww#..@..#.....#",
   "#########..b..#######",
   "#.........www.......#",
   "#..ww....ww*ww.....p#",
   "#.......wwwwww......#",
   "#####################"
  ],
  "hint": "Water drowns you. One blue key, two blue doors: fetch the flippers, then choose the door that leads to more keys.",
  "par": 58
 },
 {
  "name": "Firewalk",
  "world": "tide",
  "map": [
   "###################",
   "#FFFFF#.....#FFFFF#",
   "#F*FFF#.....#FF*FF#",
   "#FFFFF......FFFFFF#",
   "######..@...##F####",
   "#.....#w...w#.....#",
   "#.h...w..O..w...E.#",
   "#.....#ww.ww#..*..#",
   "###################"
  ],
  "hint": "Fire boots lie past the water, and you have one crate to fill it. Push it the right way; boots cross the fire.",
  "par": 52
 },
 {
  "name": "Snare",
  "world": "machine",
  "map": [
   "#####D......#####",
   "#.........#J.*..#",
   "#.........#.....#",
   "#####.....###.###",
   "#*w..O....).....#",
   "##......@.......#",
   "#####D......#####",
   "#p..J.......J..*#",
   "#...#.......#...#",
   "#E..#.......#...#",
   "#####D......#####"
  ],
  "route": [
   "13,1",
   "15,7",
   "1,7",
   "1,4"
  ],
  "hint": "A trap holds you until something stands on a brown button. You have one crate: hold the button, or fill the water?",
  "par": 75
 },
 {
  "name": "Conveyor",
  "world": "yard",
  "map": [
   "#####################",
   "######.*...ww########",
   "######.....ww########",
   "##########^##########",
   "#....#####^#####....#",
   "#.........^.........#",
   "#.u...<<<..@.>>>..*E#",
   "#.........v.........#",
   "#....#####v#####....#",
   "#####.....v.....#####",
   "#####K>>>>.<<<<*#####",
   "#####...........#####",
   "#####################"
  ],
  "hint": "Belts carry you even standing still; only suction boots walk against them. Ride the wrong belt first and you're stuck.",
  "par": 60
 },
 {
  "name": "Minefield",
  "world": "yard",
  "map": [
   "#####################",
   "#########*###########",
   "#########K###########",
   "#########.###########",
   "#*..K.........K...*##",
   "#####.........###.###",
   "#####..O.@.O..###.###",
   "#####.........###.###",
   "#####.........###.###",
   "#####..........D....#",
   "#####.........#E....#",
   "#####################"
  ],
  "route": [
   "1,4",
   "9,1",
   "18,4"
  ],
  "hint": "A crate pushed onto a bomb clears it. Two crates, three bombs: one chip has a long way round, past a drone.",
  "par": 68
 },
 {
  "name": "Switchback",
  "world": "machine",
  "map": [
   "#####################",
   "#*...x#.....x.#...(*#",
   "#..x..l...(.....x...#",
   "#x....#.x.....#x...x#",
   "###L######.######l###",
   "#x...x#..L..x.#....L#",
   "#..x..:...@.....x...#",
   "#:....#.x...x.#x...x#",
   "###l######L######.###",
   "#*....L...(..(.....E#",
   "#####################"
  ],
  "hint": "Each green button flips every toggle wall. Some buttons sit past crumbling floor, so press them in the right order.",
  "par": 80
 },
 {
  "name": "Copy Machine",
  "world": "machine",
  "clones": {
   "1,3": [
    "D",
    "right"
   ]
  },
  "map": [
   "#####################",
   "#####*#####*#####*###",
   "#####.#####.#####.###",
   "#C.....K.........K..#",
   "#########.#.#########",
   "#####......x....#####",
   "#####..x@.......#####",
   "#####.:.......:.#####",
   "######[#.....#[######",
   "######v#.....#v######",
   "######.....E...######",
   "#####################"
  ],
  "hint": "The red button sends a copy of the drone down the corridor, into the next bomb. Each button works once: time your runs.",
  "par": 79
 },
 {
  "name": "Tank Trap",
  "world": "machine",
  "facing": {
   "15,2": "right",
   "8,8": "right"
  },
  "map": [
   "#####################",
   "###*###########*#####",
   "#x.............A#####",
   "##########.##########",
   "#####.....O....]#####",
   "#####...]..@.....####",
   "#####...........#####",
   "##########.##########",
   "#####...A...........#",
   "#####*###########*#E#",
   "#####################"
  ],
  "route": [
   "5,9",
   "15,1",
   "3,1",
   "17,9"
  ],
  "hint": "Tanks drive straight until blocked; the blue button turns them all round. Each press frees one spot and blocks another.",
  "par": 80
 },
 {
  "name": "Bug Hunt",
  "world": "zoo",
  "facing": {
   "2,2": "down",
   "18,2": "down",
   "2,9": "up",
   "18,9": "up"
  },
  "map": [
   "#####################",
   "#.......#####.......#",
   "#.U.....:...:.....V.#",
   "#....#*.##:##.*#....#",
   "#....#..##.##..#....#",
   "####:####...####:####",
   "####.####.@.####.####",
   "####:####...####:####",
   "#....#..##.##..#....#",
   "#.V..#*.##:##.*#..U.#",
   "#.......:...:......E#",
   "#####################"
  ],
  "hint": "Bugs keep a wall on their left, paramecia on their right. Crumbling tiles hold once: find the one tour through all four.",
  "par": 55
 },
 {
  "name": "Smoke and Mirrors",
  "world": "yard",
  "map": [
   "#####################",
   "#.......###.......*.#",
   "#.###...#*#...###...#",
   "#.#y#...#N#...#*#...#",
   "#.#N#.........#N#...#",
   "#.......I.....I.....#",
   "###Y#.....@.....#Y###",
   "#...#...K...K...#...#",
   "#.*.#..I.....I..#.E.#",
   "#..y#...........#...#",
   "#####################"
  ],
  "route": [
   "9,2",
   "3,3",
   "3,9",
   "2,8",
   "15,3",
   "18,1"
  ],
  "hint": "Some walls aren't there; some floor is wall. A sealed vault has a way in. One yellow key: open the right door first.",
  "par": 62
 },
 {
  "name": "Feeding Time",
  "world": "zoo",
  "map": [
   "#####################",
   "#*.#.......#.....#.*#",
   "#..#..,,...#..Z..#..#",
   "#..#..,,...X...,.#..#",
   "#.....#####.####....#",
   "#.........@.........#",
   "#....####.#####.....#",
   "#..#.,...X......,#..#",
   "#..#.......#..,,.#..#",
   "#*.#......E#.....#.*#",
   "#####################"
  ],
  "route": [
   "19,1",
   "19,9",
   "1,1",
   "1,9"
  ],
  "hint": "Teeth chase you slowly; the blob wanders. Every chip sits in a dead end: go in only when they can't follow.",
  "par": 73
 },
 {
  "name": "Beam Me Up",
  "world": "yard",
  "map": [
   "#####################",
   "#wwwwwwwwwwwwwwwwwww#",
   "#w:..wwwwwwwwwww:..w#",
   "#w*o.wwwwwwwwwww:o:w#",
   "#w:.:wwwwwwwwwww...w#",
   "#wwwwwwww...wwwwwwww#",
   "#wwwwwwww.o.wwwwwwww#",
   "#wwwwwwww.@.wwwwwwww#",
   "#wwwwwwwwwwwwwwwwwww#",
   "#w...wwwwwwwwwww*::w#",
   "#w.o.wwwwwwwwwww:oEw#",
   "#w..:wwwwwwwwwww*::w#",
   "#wwwwwwwwwwwwwwwwwww#",
   "#####################"
  ],
  "hint": "A pad sends you to the next pad in reading order, still moving the same way. Crumbling floor holds once: plan each jump.",
  "par": 24
 }
];
