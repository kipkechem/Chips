'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const L = require('../core.js');
const levels = require('../levels.js');
const { solution, waypoints, parseAction, lowerBound } = require('./solve.js');

// Validate the optimized identities and distance bounds against actual winning suffixes.
let frames = 0;
for (let i = process.argv.includes('--pack-only') ? 30 : 0; i < levels.length; i++) {
  const def = levels[i], result = solution(i);
  let s = L.parseLevel(def); const bound = lowerBound(s);
  const check = (state) => {
    const slow = { ...state, mutableGrid: state.grid.map((g, n) => n) };
    assert.strictEqual(L.stateKey(state), L.stateKey(slow), `${def.name}: state identity changed`);
    assert(bound(state) <= result.par - state.steps, `${def.name}: lower bound overestimated a winning suffix`);
    frames++;
  };
  check(s);
  for (const action of result.path) {
    const r = L.act(s, parseAction(action));
    for (const frame of r.frames) check(frame);
    s = r.state;
  }
  assert.strictEqual(s.status, 'won');
}

const def = levels[39], result = solution(39);
let s = L.parseLevel(def); const chase = [];
for (let i = 0; i < result.path.length; i++) {
  const previous = s;
  s = L.act(s, parseAction(result.path[i])).state;
  if (s.enemies.some((e) => e.type === 'spider' && e.mode === 'alert') && previous.enemies.every((e) => e.mode === 'wait')) {
    let max = -1;
    for (let wait = 0; wait <= 30; wait++) {
      let delayed = L.clone(s);
      for (let t = 0; t < wait; t++) delayed = L.act(delayed, null).state;
      for (const action of result.path.slice(i + 1)) delayed = L.act(delayed, parseAction(action)).state;
      if (delayed.status === 'won') max = wait;
    }
    assert(max >= 4, `Prism Break requires a reaction faster than four turns: ${max}`);
    chase.push({ x: s.player.x, y: s.player.y, spareTurns: max, spareSeconds: max / L.TURNS_PER_SECOND });
  }
}
assert(chase.length > 0, 'The final chase must be part of the validated route');
const ordinary = {
  ...def, name: 'Prism Break without shortcuts',
  map: def.map.map((row, y) => [...row].map((ch, x) => ch === 'N' || (x === 23 && y === 17) ? '%' : ch).join('')),
};
const route = def.route.slice(0, def.route.indexOf('24,17') + 1).concat(['@24,15','@31,15','@31,19','@22,19','@22,13','@33,13','@20,11','@17,11']);
const normal = waypoints(ordinary, route);
assert(normal.par !== null, 'The capstone needs a route without secrets');
let delayed = L.parseLevel(ordinary), delayedOnce = false;
for (const action of normal.path) {
  delayed = L.act(delayed, parseAction(action)).state;
  if (!delayedOnce && delayed.enemies.some((e) => e.type === 'spider' && e.mode === 'alert')) {
    delayedOnce = true;
    for (let t = 0; t < 4; t++) delayed = L.act(delayed, null).state;
  }
}
assert.strictEqual(delayed.status, 'won', 'The ordinary route also needs four turns of reaction margin');
assert(normal.par > Math.ceil(def.par * 1.5 / 6) * 6, 'The clued shortcuts should reward top-star exploration');
const report = { checkedFrames: frames, chase, capstone: { bestKnownTurns: result.par, ordinaryRouteTurns: normal.par } };
fs.mkdirSync(path.join(__dirname, '..', '.cache', 'qa'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', '.cache', 'qa', 'pack1-fairness.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
