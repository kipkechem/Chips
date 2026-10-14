#!/usr/bin/env node
// Rule tests: each mechanic on a tiny map. Run: node tools/test-rules.js
'use strict';
const assert = require('assert');
const path = require('path');
const L = require(path.join(__dirname, '..', 'core.js'));

const lvl = (map, extra = {}) => L.parseLevel({ name: 'test', map, ...extra });
function play(s, actions) {
  let events = [];
  for (const a of actions) {
    const r = L.act(s, a === 'wait' ? null : a);
    s = r.state;
    events = events.concat(r.events);
  }
  return { s, events };
}
const at = (s) => `${s.player.x},${s.player.y}`;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('water drowns you without flippers', () => {
  assert.strictEqual(play(lvl(['#####', '#@w.#', '#####']), ['right']).s.cause, 'water');
});
test('flippers let you swim', () => {
  const { s } = play(lvl(['######', '#@pw.#', '######']), ['right', 'right', 'right']);
  assert.strictEqual(s.status, 'play');
  assert.strictEqual(at(s), '4,1');
});
test('fire burns you without fire boots; fire boots protect', () => {
  assert.strictEqual(play(lvl(['#####', '#@F.#', '#####']), ['right']).s.cause, 'fire');
  assert.strictEqual(play(lvl(['######', '#@hF.#', '######']), ['right', 'right', 'right']).s.status, 'play');
});
test('ice slides you; ice skates let you walk', () => {
  assert.strictEqual(at(play(lvl(['#######', '#@~~~.#', '#######']), ['right']).s), '5,1');
  assert.strictEqual(at(play(lvl(['########', '#@k~~~.#', '########']), ['right', 'right']).s), '3,1');
});
test('force floors carry you; suction boots hold you', () => {
  assert.strictEqual(at(play(lvl(['#######', '#@>>>.#', '#######']), ['right']).s), '5,1');
  assert.strictEqual(at(play(lvl(['########', '#@u>>>.#', '########']), ['right', 'right']).s), '3,1');
  // standing still on a force floor still moves you
  assert.strictEqual(at(play(lvl(['#####', '#.@.#', '#.v.#', '#...#', '#####']), ['down']).s), '2,3');
});
test('the thief takes your boots', () => {
  const { s, events } = play(lvl(['######', '#@pT.#', '######']), ['right', 'right']);
  assert.strictEqual(s.boots.p, 0);
  assert.ok(events.includes('thief'));
});
test('the green key opens every green door; other keys are used up', () => {
  const { s } = play(lvl(['#######', '#@gGG.#', '#######']), ['right', 'right', 'right', 'right']);
  assert.strictEqual(at(s), '5,1');
  assert.strictEqual(s.keys.g, 1);
  const red = play(lvl(['#######', '#@rRR.#', '#######']), ['right', 'right', 'right']);
  assert.strictEqual(at(red.s), '3,1');
});
test('teleports send you to the next pad and out the other side', () => {
  const { s, events } = play(lvl(['#########', '#@o###o.#', '#########']), ['right']);
  assert.strictEqual(at(s), '7,1');
  assert.ok(events.some((e) => e.startsWith('teleport')));
});
test('bombs kill you; a crate pushed onto one destroys both', () => {
  assert.strictEqual(play(lvl(['#####', '#@K.#', '#####']), ['right']).s.cause, 'bomb');
  const { s } = play(lvl(['######', '#@OK.#', '######']), ['right']);
  assert.strictEqual(s.crates.length, 0);
  assert.strictEqual(s.grid[1 * 6 + 3], '.');
});
test('a crate pushed into water becomes dirt, and dirt clears when walked on', () => {
  const { s } = play(lvl(['######', '#@Ow.#', '######']), ['right', 'right', 'right']);
  assert.strictEqual(s.status, 'play');
  assert.strictEqual(s.grid[1 * 6 + 3], '.');
});
test('gravel keeps monsters off; you walk on it', () => {
  // the bug would walk left into you, but the gravel between stops it
  const s0 = lvl(['#######', '#@,..U#', '#######'], { facing: { '5,1': 'left' } });
  const { s } = play(s0, ['right', 'wait', 'wait', 'wait', 'wait', 'wait', 'wait']);
  assert.strictEqual(s.status, 'play');
});
test('hidden walls appear when you bump them; fake walls give way', () => {
  const r = play(lvl(['#####', '#@I.#', '#####']), ['right']);
  assert.strictEqual(at(r.s), '1,1');
  assert.strictEqual(r.s.grid[1 * 5 + 2], '#');
  assert.strictEqual(at(play(lvl(['#####', '#@N.#', '#####']), ['right', 'right']).s), '3,1');
});
test('a green button flips toggle walls', () => {
  const { s } = play(lvl(['#######', '#@(L.#', '#######']), ['right', 'right', 'right']);
  assert.strictEqual(at(s), '4,1');
});
test('a trap holds you until something holds the brown button down', () => {
  const held = play(lvl(['######', '#@J..#', '######']), ['right', 'right', 'right']);
  assert.strictEqual(at(held.s), '2,1');
  // a crate on the brown button keeps traps open
  const { s } = play(lvl(['#######', '#.O)..#', '#@J...#', '#######']), ['up', 'right', 'down', 'right', 'right']);
  assert.strictEqual(at(s), '4,2');
});
test('a red button fires the clone machines', () => {
  const s0 = lvl(['#########', '#@[....C#', '#########'], { clones: { '7,1': ['U', 'left'] } });
  const { s, events } = play(s0, ['right']);
  assert.ok(events.some((e) => e.startsWith('clone')));
  assert.strictEqual(s.enemies.length, 1);
  assert.strictEqual(s.enemies[0].type, 'bug');
});
test('a blue button turns tanks around', () => {
  const s0 = lvl(['########', '#@]....#', '#.....A#', '########'], { facing: { '6,2': 'left' } });
  const { s } = play(s0, ['right']);
  assert.strictEqual(s.enemies[0].dx, 1);
});
test('a bug follows the wall on its left around a pillar', () => {
  // A 3x3 room with a pillar: the bug heading up circles the pillar.
  const s0 = lvl(['#######', '#.....#', '#.###.#', '#U#@#.#', '#.###.#', '#.....#', '#######']);
  let { s } = play(s0, Array(48).fill('wait'));
  assert.strictEqual(s.status, 'play'); // it never reaches you in the middle
  const seen = new Set();
  for (let k = 0; k < 40; k++) {
    s = L.act(s, null).state;
    seen.add(`${s.enemies[0].x},${s.enemies[0].y}`);
  }
  assert.ok(seen.size >= 12, 'it travels the whole ring, not back and forth');
});
test('teeth chase you at a quarter of your speed', () => {
  const s0 = lvl(['##########', '#@......X#', '##########']);
  const { s } = play(s0, Array(8).fill('wait'));
  assert.strictEqual(s.enemies[0].x, 6); // 2 steps in 8 turns
});
test('blobs wander the same way every time', () => {
  const map = ['#######', '#.....#', '#..Z..#', '#.....#', '#@....#', '#######'];
  const a = play(lvl(map), Array(32).fill('wait')).s.enemies[0];
  const b = play(lvl(map), Array(32).fill('wait')).s.enemies[0];
  assert.deepStrictEqual([a.x, a.y], [b.x, b.y]);
});
test('the mimic copies your moves, even a bump into a wall', () => {
  const s0 = lvl(['#######', '#M....#', '#######', '#@....#', '#######']);
  let { s } = play(s0, ['right', 'right']);
  assert.strictEqual(s.enemies[0].x, 3);
  ({ s } = play(s, ['up'])); // you bump the wall; the mimic bumps its wall too
  assert.strictEqual(at(s), '3,3');
  ({ s } = play(s, ['right', 'right', 'right'])); // the last press bumps you, but the mimic is already at its end
  assert.strictEqual(at(s), '5,3');
  ({ s } = play(s, ['left'])); // both step left together
  assert.strictEqual(s.enemies[0].x, 4);
  ({ s } = play(lvl(['######', '#..M.#', '######', '#@...#', '######']), ['left', 'left']));
  assert.strictEqual(s.enemies[0].x, 1); // you bumped twice; it walked twice
  assert.strictEqual(at(s), '1,3');
});
test('a walker goes straight until it is blocked, then turns', () => {
  const s0 = lvl(['#######', '#e....#', '#.....#', '#....@#', '#######']);
  const { s } = play(s0, Array(8).fill('wait'));
  const e = s.enemies[0];
  assert.deepStrictEqual([e.x, e.y], [5, 1]); // 4 moves right in 8 turns
  const t = play(s, ['wait', 'wait']).s.enemies[0];
  assert.ok(t.x !== 5 || t.y !== 1, 'blocked, it picks a new way');
});
test('power-ups fire the way you face; bump a wall to turn', () => {
  const s0 = lvl(['######', '#@m..#', '#....#', '#W...#', '######']);
  let { s } = play(s0, ['right', 'left', 'down']); // pick up the blaster, end up facing down
  assert.strictEqual(s.facing, 'down');
  ({ s } = play(s, [{ use: 'm' }]));
  assert.strictEqual(s.grid[3 * 6 + 1], '.', 'the cracked wall below is gone');
  const bumped = play(lvl(['######', '#@j..#', '######', '#....#', '######']), ['right', 'down']).s;
  assert.strictEqual(at(bumped), '2,1');
  assert.strictEqual(bumped.facing, 'down', 'bumping a wall faces it');
  assert.strictEqual(at(play(bumped, [{ use: 'j' }]).s), '2,2', 'the jetpack smashes the wall you face');
});
test('thin walls block one edge, from both sides', () => {
  // '}' walls the east edge of its tile: you can step onto it from the west but not leave east.
  let { s } = play(lvl(['######', '#@}.E#', '######']), ['right', 'right']);
  assert.strictEqual(at(s), '2,1');
  ({ s } = play(lvl(['######', '#@.{.#', '######']), ['right', 'right']));
  assert.strictEqual(at(s), '2,1', 'a west-edge wall stops you entering from the west');
  ({ s } = play(lvl(['#####', '#@.-#', '#####']), ['right', 'right']));
  assert.strictEqual(at(s), '3,1', 'a north-edge wall does not stop sideways moves');
});
test('ice corners turn a slide', () => {
  // Slide right along the ice into a corner walled north-east: you come out going down.
  const s0 = lvl(['#######', '#@~~9.#', '#...~.#', '#...~.#', '#######']);
  const { s } = play(s0, ['right']);
  assert.strictEqual(at(s), '4,3');
  assert.strictEqual(play(lvl(['#####', '#@.0#', '#####']), ['right', 'right']).s.player.x, 2, "you can't enter through a corner's wall");
});
test('pop-up walls rise behind you', () => {
  const { s, events } = play(lvl(['######', '#@!..#', '######']), ['right', 'right', 'left']);
  assert.strictEqual(s.grid[1 * 6 + 2], '#');
  assert.strictEqual(at(s), '3,1');
  assert.ok(events.some((e) => e.startsWith('popup')));
});
test('invisible walls stop you and stay invisible', () => {
  const { s } = play(lvl(['#####', '#@&.#', '#####']), ['right', 'right']);
  assert.strictEqual(at(s), '1,1');
  assert.strictEqual(s.grid[1 * 5 + 2], '&');
});
test('random force floors push up, right, down, left in turn', () => {
  const s0 = lvl(['#######', '#.....#', '#.....#', '#..+..#', '#..@..#', '#.....#', '#######']);
  let { s } = play(s0, ['up']); // onto the floor: pushed up
  assert.strictEqual(at(s), '3,2');
  ({ s } = play(s, ['down'])); // pushed right
  assert.strictEqual(at(s), '4,3');
  ({ s } = play(s, ['left'])); // pushed down
  assert.strictEqual(at(s), '3,4');
  ({ s } = play(s, ['up'])); // pushed left
  assert.strictEqual(at(s), '2,3');
});
test('crates slide across ice and turn at ice corners', () => {
  let { s } = play(lvl(['########', '#@O~~~.#', '########']), ['right', 'wait', 'wait', 'wait', 'wait']);
  assert.deepStrictEqual(s.crates, [1 * 8 + 6], 'it slid to the floor at the far end');
  ({ s } = play(lvl(['#######', '#@O~9.#', '####~.#', '####..#', '#######']), ['right', 'wait', 'wait', 'wait', 'wait']));
  assert.deepStrictEqual(s.crates, [3 * 7 + 4], 'the corner turned it down');
});
test('crates ride force floors', () => {
  const { s } = play(lvl(['#######', '#@O>>.#', '#######']), ['right', 'wait', 'wait', 'wait']);
  assert.deepStrictEqual(s.crates, [1 * 7 + 5]);
});
test('a chip socket opens only once you have every chip', () => {
  const shut = play(lvl(['#######', '#@$*.E#', '#######']), ['right']).s;
  assert.strictEqual(at(shut), '1,1');
  const { s } = play(lvl(['#######', '#*@$.E#', '#######']), ['left', 'right', 'right', 'right', 'right']);
  assert.strictEqual(s.status, 'won');
});
test('a plain wall takes two blaster shots; steel and the outer edge take none', () => {
  const s0 = lvl(['#######', '#@m.#.#', '#######']);
  let { s } = play(s0, ['right', { use: 'm' }]); // facing right, at the wall
  assert.strictEqual(s.grid[1 * 7 + 4], 'W', 'the first shot cracks it');
  ({ s } = play(s, [{ use: 'm' }]));
  assert.strictEqual(s.grid[1 * 7 + 4], '.', 'the second breaks it');
  const steel = play(lvl(['######', '#@m%.#', '######']), ['right', { use: 'm' }]).s;
  assert.strictEqual(steel.grid[1 * 6 + 3], '%');
  const edge = play(lvl(['#####', '#@m.#', '#####']), ['right', 'right', { use: 'm' }]).s;
  assert.strictEqual(edge.grid[1 * 5 + 4], '#', 'the edge of the level never breaks');
});
test('a monster that walks onto a bomb is destroyed with it', () => {
  const s0 = lvl(['########', '#@...KD#', '########'], { facing: { '6,1': 'left' } });
  const { s, events } = play(s0, ['wait', 'wait', 'wait']);
  assert.strictEqual(s.enemies.length, 0);
  assert.ok(events.some((e) => e.startsWith('boom')));
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`ok    ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name}\n      ${err.message}`);
  }
}
console.log(`${tests.length - failed}/${tests.length} rule tests passed`);
process.exit(failed ? 1 : 0);
