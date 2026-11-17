module.exports = [
 {
  "name": "Firewalk",
  "world": "tide",
  "hint": "One crate per water gap, and only two crates. The fire boots lie west; after that, fire is floor but fireballs are not.",
  "par": 191,
  "map": [
   "###############################",
   "#FFFFFFFFFF#.......#FFFFQFFFFF#",
   "#FF*FFFF*FFF.......FFF*FFFF*FF#",
   "#FFFFFFFFFF#.......#FFFFFFFFFF#",
   "############.......############",
   "#.....######x.....x#####......#",
   "#.*...######..O.O..#####..*...#",
   "#..h....w......@.....w......E.#",
   "#.....######.......#####......#",
   "#...*.F..*.w.......#####....*.#",
   "#.....#....#x.....x#####......#",
   "###############F###############",
   "######FFFFF#FFFFFFFFFFFFF######",
   "######FF*FF#FFFFFFFFFF*FF######",
   "######FFFFFFFFF*FFF#FFFFF######",
   "######FQFFFFFFFFFFF#FFFFF######",
   "###############################"
  ],
  "facing": {
   "24,1": "right",
   "7,15": "right"
  },
  "route": [
   "@7,7",
   "3,7",
   "2,6",
   "4,9",
   "9,9",
   "@22,7",
   "3,2",
   "8,2",
   "22,2",
   "27,2",
   "8,13",
   "15,14",
   "22,13",
   "26,6",
   "28,9"
  ]
 },
 {
  "name": "Cold Feet",
  "world": "tide",
  "hint": "Slide to the skates first; then ice is floor, but fire still burns. Push the crate over the ice to bridge the water.",
  "par": 108,
  "map": [
   "##################################",
   "#~.~.~~~~~~~@~~~~~##~~~~*~~~~~~~~#",
   "#~*~F~~~~~~~~~F~*.##~F~~~~FF~~~*F#",
   "#~~~~~~.~~~~~.~~~~..~~~~~~~~~~~~~#",
   "#~~~~.~.~...~~.~~~##~~~FF~~~~FF~~#",
   "#~~~~~.~..~.~.~F.F##~~~~~~~*~~~~~#",
   "#~~.F~~~~...~..F.~##~~F~~F~~F~~F~#",
   "#..~~~~k~~~~.~~~F~##~~~~~~~~~~~*~#",
   "#~~~F~#F~~~~~~~.*.##.#############",
   "#~~~~~..~~.F~~~~~.##.O~~~~~~~~w.E#",
   "##################################"
  ],
  "route": [
   "7,7",
   "2,2",
   "16,2",
   "16,8",
   "24,1",
   "31,2",
   "27,5",
   "31,7"
  ]
 },
 {
  "name": "Deep End",
  "world": "tide",
  "hint": "Three drones walk the causeway to the flippers, and the flamethrower has three flames. Then swim for the chips and key.",
  "par": 106,
  "map": [
   "###################################",
   "#ww*wwww#.....#..*..#wwwwwwwwwwwww#",
   "#wwwwbww#.....#.....#wwww...D...ww#",
   "#ww.wwwwB.....B..E..#w*ww.wwwww.ww#",
   "#wwwwwww#.....#.....#www..wwwwwDww#",
   "#ww*wwww#..@..#.....#wwwwDww*ww.ww#",
   "#########..b..#######wwww..wwwwpww#",
   "#.........www.......#wwww.wwwwwwww#",
   "#..ww....ww*ww........f...wwwwwwww#",
   "#.......wwwwww......#wwwwwwwwwwwww#",
   "###################################"
  ],
  "facing": {
   "25,5": "up",
   "31,4": "down"
  },
  "route": [
   "22,8",
   "31,6",
   "28,5",
   "22,3",
   "11,8",
   "11,6",
   "3,1",
   "3,5",
   "5,2",
   "17,1"
  ]
 },
 {
  "name": "Pickpocket",
  "world": "tide",
  "hint": "Thieves take every pair of boots you carry. Swim the west pools first; later, find the way round the second thief.",
  "par": 134,
  "map": [
   "####################################",
   "#wwwww##########......##...#..F....#",
   "#w*w..##########.wwww.##...#*.F..*.#",
   "#www..G..F.F..##.ww*w.##.h.#..F....#",
   "#.ww..#.p.....##.wwww.##...#..F....#",
   "#wwwww#.......##......##...#..F....#",
   "#######......@.T...........T..F..E.#",
   "#wwwww#.......##FFF...##...#..F....#",
   "#.ww..#.....g.##......##...#..F....#",
   "#www..G...F...##.p....##...w..F....#",
   "#w*w..##########......##.*.#..F..*.#",
   "#wwwww##########..ww..##...#..F....#",
   "####################################"
  ],
  "route": [
   "8,4",
   "12,8",
   "2,2",
   "2,10",
   "19,3",
   "17,9",
   "25,3",
   "25,10",
   "@28,9",
   "28,2",
   "33,2",
   "33,10"
  ]
 },
 {
  "name": "Minefield",
  "world": "yard",
  "hint": "Crates and monsters set off bombs. A teeth will chase you into its own bomb; gravel stops the other, so save it a crate.",
  "par": 148,
  "map": [
   "###################################",
   "#########*############..###*#######",
   "#########K############..K.......X##",
   "#########.############..######*####",
   "#*..K.........K...*###.O###########",
   "#####.........###.####..##*########",
   "#####..O.@.O..###.####..K...,...X##",
   "#####.........###.####..##*########",
   "#####.........###.####..xxxxxxxxxx#",
   "#####..........D..............*..E#",
   "#####.........#.....##..xxxxxxxxxx#",
   "######################..###########",
   "###################################"
  ],
  "route": [
   "1,4",
   "9,1",
   "18,4",
   "26,5",
   "26,7",
   "27,1",
   "30,3",
   "30,9"
  ]
 },
 {
  "name": "Smoke and Mirrors",
  "world": "yard",
  "hint": "Some walls aren't there; some floor is wall. Each sealed vault has a way in. Teeth can't cross hidden walls: watch them.",
  "par": 119,
  "map": [
   "##################################",
   "#.......###.......*.#*....I.....*#",
   "#.###...#*#...###...#.#I#.#.#.#..#",
   "#.#*#...#N#...#*#...#.........I..#",
   "#.#N#.........#N#...#I#.#I#.#.#I.#",
   "#.......I.....I.....#.I.....IX..E#",
   "###N#.....@.....#N###.#.#.#I#.####",
   "#...#...K...K...#...#...I.....NX##",
   "#.*.#..I.....I..#.....#.#I#.#I##.#",
   "#...#...........#...#......*....*#",
   "##################################"
  ],
  "route": [
   "9,2",
   "3,3",
   "2,8",
   "15,3",
   "18,1",
   "21,1",
   "27,9",
   "32,9",
   "32,1"
  ]
 },
 {
  "name": "Conveyor",
  "world": "yard",
  "hint": "Belts carry you even when you stand still. The thief takes your suction boots. Save the one-way run for last.",
  "par": 102,
  "map": [
   "###################################",
   "######.*...ww######################",
   "######.....ww#########K*>>>>>>>>*K#",
   "##########^############^########v##",
   "#....#####^#####....###^########v##",
   "#.........^.........##K^########v##",
   "#.u...<<<..@.>>>..*..T..>>>*K###v##",
   "#.........v.........##K^###v####v##",
   "#....#####v#####....###^###v####v##",
   "#####.....v.....#######^###v####v##",
   "#####K>>>>.<<<<*######K*<<<<####*E#",
   "#####...........################K##",
   "###################################"
  ]
 },
 {
  "name": "Beam Me Up",
  "world": "yard",
  "hint": "Pads send you to the next pad in reading order, still moving. One jetpack opens the vault; its belt only lets you out.",
  "par": 43,
  "map": [
   "#################################",
   "#wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#",
   "#w:..wwwwwwwwwww:..www*..ww...ww#",
   "#w*o.wwwwwwwwwww:o:www.o.ww.o.ww#",
   "#w:.:wwwwwwwwwww...www...ww..jww#",
   "#wwwwwwww...wwwwwwwwwwwwwwww.www#",
   "#wwwwwwww.o.wwwwwwwwwwwwwwww.www#",
   "#wwwwwwww.@.wwwwwwwwwwwwww#####w#",
   "#wwwwwwwwwwwwwwwwwwwwwwwww#*.*#w#",
   "#w...wwwwwwwwwww*::www...<<...#w#",
   "#w.o.wwwwwwwwwww:o.www.o.w#..*#w#",
   "#w..:wwwwwwwwwww*::wwwE.*w#####w#",
   "#wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#",
   "#################################"
  ],
  "route": [
   "16,11",
   "16,9",
   "2,3",
   "22,2",
   "29,4",
   "27,8",
   "29,8",
   "29,10",
   "24,11"
  ]
 }
];
