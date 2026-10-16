// Authored Pack 1 maps. Design proofs and action fixtures live only under tools/.
(function (root) {
  'use strict';
  function board(w, h, rooms, paths, marks) {
    const rows = Array.from({ length: h }, () => Array(w).fill('%'));
    for (const [x1,y1,x2,y2] of rooms) {
      for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) rows[y][x] = '.';
    }
    for (const points of paths) for (let k = 1; k < points.length; k++) {
      let [x,y] = points[k - 1]; const [tx,ty] = points[k];
      if (x !== tx && y !== ty) throw new Error('Diagonal corridor');
      rows[y][x] = '.';
      while (x !== tx || y !== ty) { x += Math.sign(tx - x); y += Math.sign(ty - y); rows[y][x] = '.'; }
    }
    for (const [x,y,c] of marks) rows[y][x] = c;
    return rows.map((r) => r.join(''));
  }
  const pack = [
    {
      name: 'Panes', world: 'glass', revision: 2, par: 62,
      hint: 'Red and blue keys are spent once. There are more red doors than red keys. Steel frames cannot be breached, but ordinary panes can. Inspect what each room gives back before committing.',
      map: board(15, 13, [[1,1,5,11],[7,1,11,3],[7,5,11,7],[7,9,11,11],[13,5,13,7]], [], [
        [2,6,'@'],[3,3,'r'],[3,9,'j'],[6,2,'R'],[9,2,'b'],[10,2,'*'],
        [6,6,'B'],[9,6,'r'],[10,6,'*'],[6,10,'R'],[9,10,'*'],[10,10,'E'],
        [12,6,'R'],[12,5,'#'],[13,6,'*'],[6,5,'#'],[4,6,'?'],
      ]),
      hints: { '4,6': 'The outer red cupboard has a plain pane beside its door. The blue room has one too. A breach cannot be undone, and there is only one jetpack charge.' },
    },
    {
      name: 'Bobsled', world: 'glass', revision: 2, par: 45,
      hint: 'Sliding players cannot push crates, but a stopped player can. Crates stop a slide, slide themselves, and are consumed by water. The branch above the ice and the far bank both matter.',
      map: board(17, 10, [[5,1,8,2]], [
        [[1,4],[15,4]], [[7,2],[7,4]], [[8,4],[8,7],[1,7],[1,4]],
      ], [
        [1,7,'@'],[2,7,'m'],[8,5,'O'],[7,2,'b'],[6,1,'*'],[7,5,'%'],
        ...Array.from({ length: 11 }, (_,i) => [i+2,4,'~']),[12,4,'w'],[13,4,'B'],[14,4,'*'],[15,4,'E'],[1,5,'?'],
      ]),
      hints: { '1,5': 'The overhead branch lies one tile west of the crate shaft. There are no skates or flippers here. A blaster destroys a crate rather than moving it.' },
    },
    {
      name: 'One Way Out', world: 'glass', revision: 2, par: 106,
      hint: 'The two upper bridges collapse into holes. Plain panes cost two blaster shots, cracked panes cost one, and a jetpack breaches one pane. Check the supplies on both sides before crossing.',
      map: board(21, 13, [[1,1,5,5],[7,1,11,5],[13,1,19,5],[1,7,5,9],[7,7,11,9],[13,7,19,9],[3,11,5,11]], [
        [[5,2],[7,2]], [[11,2],[13,2]], [[5,4],[7,4]], [[11,4],[13,4]],
        [[3,5],[3,7]], [[9,5],[9,7]], [[16,5],[16,7]], [[3,9],[3,11]],
      ], [
        [2,2,'@'],[2,3,'m'],[2,5,'r'],[6,2,':'],[12,2,':'],[6,4,'#'],[12,4,'#'],
        [9,6,'R'],[9,8,'b'],[10,8,'*'],[3,6,'B'],[2,8,'j'],[4,8,'b'],[1,9,'*'],
        [16,6,'B'],[16,8,'y'],[18,9,'*'],[3,10,'Y'],[4,11,'W'],[5,11,'E'],[11,2,'?'],
      ]),
      hints: { '11,2': 'Beyond the second bridge is another plain-pane return. The jetpack is in the blue cupboard back at the start. Pop-up walls can be broken, but a collapsed bridge stays a hole.' },
    },
    {
      name: 'Ghost Walls', world: 'glass', revision: 2, par: 87,
      hint: 'Steel posts continue as invisible partitions. Paired notches mark a gap. One blue key must cover two tempting doors; the ordinary and cracked panes offer other ways in. Jetpack and blaster charges are interchangeable, but not at the same cost.',
      map: board(23, 15, [[1,1,6,9],[8,1,11,9],[13,1,21,9],[18,11,21,13],[8,11,9,13],[11,11,11,13]], [
        [[6,3],[8,3]], [[6,5],[8,5]], [[11,5],[13,5]], [[11,9],[13,9]], [[19,9],[19,11]], [[9,9],[9,11]], [[9,12],[11,12]],
      ], [
        [9,8,'@'],[9,7,'j'],[10,7,'m'],[9,6,'b'],[7,3,'#'],[7,5,'B'],[3,3,'r'],[2,7,'*'],
        [12,5,'B'],[12,9,'G'],[20,3,'g'],[20,7,'*'],[17,1,'%'],[17,9,'%'],
        ...[2,3,4,6,7,8].map((y) => [17,y,'&']),[16,5,'-'],[18,5,'-'],[14,3,'?'],
        [19,10,'W'],[20,12,'*'],[9,10,'R'],[10,12,'#'],[11,12,'E'],
      ]),
      hints: { '14,3': 'The aligned steel posts mark the north and south ends of a partition. The two short notches face each other across its only gap. The return door uses a reusable green key.' },
    },
    {
      name: 'Roulette', world: 'glass', revision: 2, par: 72,
      hint: 'There are two pairs of suction boots, but you carry only one pair at a time. The thief takes every pair you carry. Red keys are spent; an opened door stays open. Inspect the return connection and the spare cupboard.',
      map: board(19, 11, [[5,1,7,9],[1,1,3,3],[1,5,3,7],[9,4,11,9]], [
        [[3,2],[5,2]], [[3,6],[5,6]], [[7,4],[11,4]], [[7,8],[17,8]],
        [[13,1],[13,8]], [[17,6],[17,8]],
      ], [
        [5,5,'@'],[5,4,'u'],[6,5,'r'],[4,2,'R'],[2,2,'b'],[2,3,'r'],[4,6,'R'],[2,6,'u'],
        [7,4,'<'],[8,4,'T'],[9,4,'!'],[8,8,'B'],[13,1,'*'],[17,6,'*'],[17,7,'v'],[17,9,'E'],[10,6,'?'],
        ...[2,3,4,5,6,7].map((y) => [13,y,'v']),
      ]),
      hints: { '10,6': 'The blue door returns to the starting hall without crossing the thief. A second pair picked up too soon is not a spare. The vertical belts run away from their chips.' },
    },
    {
      name: 'Toolbox', world: 'glass', revision: 2, par: 58,
      hint: 'A crate blocks the canal. Moving it can make a bridge; blasting it leaves the canal open. The red detour and blue gate change the route. Fire, shots, and a jetpack have overlapping jobs, with different costs.',
      map: board(19, 13, [[5,5,9,9],[5,1,9,3],[1,5,3,9]], [
        [[7,3],[7,5]], [[3,7],[17,7]], [[9,9],[14,9],[14,7]], [[7,9],[7,11]],
      ], [
        [6,7,'@'],[5,6,'j'],[6,6,'m'],[7,6,'f'],[7,4,'#'],[7,2,'b'],[8,2,'*'],
        [4,7,'W'],[2,6,'r'],[2,8,'*'],[11,7,'O'],[13,7,'w'],[11,9,'R'],[15,7,'B'],[16,7,'*'],[17,7,'S'],[7,11,'E'],[9,6,'?'],
      ]),
      hints: { '9,6': 'The blaster breaks a plain pane in two shots, a cracked pane or crate in one. Flame reaches three tiles through an opened gate. Monsters cannot cross that gate.' },
    },
    {
      name: 'Hall of Glass', world: 'glass', revision: 2, par: 47,
      hint: 'An opened coloured door remains a barrier to monsters. A hole in its neighbouring pane does not. There are two red doors, a blue treasury, and a separate sealed chip. Plan both key use and an escape before entering the long hall.',
      map: board(23, 13, [[5,1,9,7],[11,3,21,3],[5,9,6,11],[8,9,9,11],[1,2,2,4]], [
        [[9,3],[11,3]], [[9,4],[11,4],[11,3]], [[2,3],[5,3]], [[5,7],[5,9]], [[6,10],[8,10]],
      ], [
        [8,6,'@'],[7,6,'j'],[8,5,'r'],[10,3,'R'],[10,4,'#'],[13,3,'b'],[15,3,'*'],[21,3,'S'],
        [5,8,'B'],[6,9,'r'],[7,10,'#'],[8,10,'*'],[3,3,'R'],[1,3,'E'],[9,2,'?'],
      ]),
      hints: { '9,2': 'The hall door and the pane below it reach the same space. Only one leaves a monster-proof threshold. The blue treasury contains another red key, but its sealed chip also needs a breach.' },
    },
    {
      name: 'Refraction', world: 'glass', revision: 2, par: 46,
      hint: 'The drone crosses a brown pressure plate. Traps release only while a plate is held by you, a crate, or a monster. Freeze preserves a monster\'s position for eighteen turns. The green return gate stays open once unlocked.',
      facing: { '3,2': 'right' },
      map: board(18, 11, [[1,5,4,9],[1,2,3,3]], [
        [[3,2],[9,2]], [[2,3],[2,5]], [[1,8],[15,8],[15,6],[9,6],[9,4]],
        [[6,2],[6,8]], [[6,4],[9,4]], [[9,6],[9,8]],
      ], [
        [2,8,'@'],[3,8,'z'],[4,8,'m'],[2,4,'W'],[2,3,'b'],[6,7,'B'],[6,6,'O'],[6,3,','],
        [3,2,'D'],[6,2,')'],[11,8,'J'],[13,8,'g'],[15,8,'*'],[14,6,'J'],[11,6,'G'],[2,9,'E'],[9,4,'?'],
      ]),
      hints: { '9,4': 'This alcove is safe for watching the drone. Freezing off the plate does not open a trap. A crate can hold the plate without a time limit; the warehouse and its blue key are optional for a different plan.' },
    },
    {
      name: 'Dead Reckoning', world: 'glass', revision: 2, par: 80,
      hint: 'One crate, several jobs. A moving crate can stop on a brown plate, but recovering it closes the trap. The cracked service passage leads around the trap. Water consumes the crate permanently.',
      map: board(18, 12, [[5,1,8,2]], [
        [[1,4],[14,4]], [[7,2],[7,4]], [[8,4],[8,7],[1,7],[1,4]],
        [[11,3],[14,3],[14,10]], [[12,4],[12,6],[14,6]], [[12,6],[12,8],[9,8]],
      ], [
        [1,7,'@'],[8,5,'O'],[7,5,'%'],[7,2,'b'],[6,1,'*'],
        ...Array.from({ length: 11 }, (_,i) => [i+2,4,'~']),[13,4,')'],[12,5,'J'],[12,6,'m'],
        [10,8,'#'],[9,8,'*'],[14,5,'W'],[14,8,'w'],[14,9,'B'],[14,10,'E'],[1,5,'?'],
      ]),
      hints: { '1,5': 'The ice branch is one tile west of the crate shaft. The brown plate is just beyond the ice. At the service corner, a crate blocks a shot from above; below it is reachable only while the plate is held.' },
    },
    {
      name: 'Prism Break', world: 'glass', revision: 2, par: 100,
      hint: 'The archive and crate warehouse compete for a red key. A moving drone, a brown plate, and a green escape gate connect the east wing. Breaches can save keys, but their charges are also needed beyond that wing. There is more than one complete plan.',
      facing: { '13,4': 'right' },
      map: board(25, 17, [[7,7,11,11],[1,7,5,11],[7,13,11,15],[21,7,23,9],[7,1,9,3]], [
        [[5,8],[7,8]], [[5,10],[7,10]], [[9,11],[9,13]],
        [[13,4],[19,4]], [[16,4],[16,8]], [[11,8],[23,8]],
        [[19,6],[23,6],[23,8]], [[19,6],[19,10],[11,10]],
        [[9,3],[9,7]], [[7,2],[5,2],[5,4],[7,4]],
      ], [
        [9,9,'@'],[8,9,'j'],[10,9,'m'],[9,10,'z'],[8,8,'r'],[6,8,'R'],[6,10,'#'],[2,8,'b'],[2,10,'*'],
        [9,12,'B'],[8,14,'r'],[9,14,'b'],[10,14,'*'],[13,4,'D'],[16,4,')'],[16,5,','],[16,6,'O'],[16,7,'R'],
        [18,8,'J'],[20,8,'B'],[22,8,'g'],[23,9,'y'],[21,7,'*'],[21,6,'J'],[19,6,'G'],[18,10,'G'],
        [9,4,'R'],[9,5,'#'],[8,2,'*'],[7,4,'Y'],[5,3,'W'],[5,2,'E'],[17,7,'?'],
      ]),
      hints: { '17,7': 'A frozen drone and a weighted plate are different ways to hold the mechanism. The green gate makes a permanent return. The archive has a plain-pane side entrance; the final stair has a plain pane too. Count charges before choosing a breach.' },
    },
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = pack;
  else root.LOCKSTEP_PACK1 = pack;
})(this);
