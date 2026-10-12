#!/usr/bin/env node
// Breadth-first solver: proves every level is beatable and finds its par (fewest turns).
// Usage: node tools/solve.js [levelIndex]
'use strict';
const path = require('path');
const L = require(path.join(__dirname, '..', 'core.js'));
const LEVELS = require(path.join(__dirname, '..', 'levels.js'));

const MOVES = ['up', 'down', 'left', 'right', null];

function solve(def, limit = 400000) {
  const start = L.parseLevel({ ...def, battery: 0 });
  const seen = new Map([[L.stateKey(start), null]]);
  let frontier = [start];
  let depth = 0;
  while (frontier.length && seen.size < limit) {
    const next = [];
    depth++;
    for (const s of frontier) {
      for (const m of MOVES) {
        const { state } = L.step(s, m);
        if (state.status === 'dead') continue;
        const key = L.stateKey(state);
        if (seen.has(key)) continue;
        seen.set(key, { prev: L.stateKey(s), move: m });
        if (state.status === 'won') return { par: depth, path: trace(seen, key), explored: seen.size };
        next.push(state);
      }
    }
    frontier = next;
  }
  return { par: null, explored: seen.size };
}

function trace(seen, key) {
  const out = [];
  for (let n = seen.get(key); n; n = seen.get(n.prev)) out.push(n.move || 'wait');
  return out.reverse();
}

const only = process.argv[2];
let failed = false;
LEVELS.forEach((def, i) => {
  if (only !== undefined && String(i) !== only) return;
  const r = solve(def);
  const ok = r.par !== null && r.par === def.par;
  if (!ok) failed = true;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${i + 1}. ${def.name.padEnd(16)} par=${r.par} (declared ${def.par}) states=${r.explored}`
  );
  if (r.path && process.env.VERBOSE) console.log('     ' + r.path.join(' '));
});
process.exit(failed ? 1 : 0);
