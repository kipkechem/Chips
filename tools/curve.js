#!/usr/bin/env node
// Difficulty curve: one row per level, to check that complexity and strategy rise steadily.
//   par      turns on the best known route        mech   distinct mechanics in the level
//   danger   deadly wrong moves per route move    traps  pickups where a reachable target loses the level
//   choice   pickups with 2+ reachable targets    greedy nearest-chip play: turns/par, or fail
//   score    a rough composite used to compare neighbours
// Usage: node tools/curve.js [from-to]   e.g. node tools/curve.js 13-29
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', 'core.js'));
const S = require(path.join(__dirname, 'solve.js'));
const { trapsLite, greedy, canWin } = require(path.join(__dirname, 'levlab.js'));
const LEVELS = require(path.join(__dirname, '..', 'levels.js'));
const parse = (l) => (l === 'wait' ? null : l.includes(':') ? (([u, d]) => (d === '-' ? { use: u } : { use: u, dir: d }))(l.split(':')) : l);
const nItems = (s) => Object.keys(s.items).length;
function firsts(s0, limit = 50000) {
  const seen = new Set([C.stateKey(s0)]); let f = [s0]; const out = new Map();
  while (f.length && seen.size < limit) { const n = [];
    for (const s of f) for (const a of S.actions(s)) { const r = C.act(s, a).state; if (r.status === 'dead') continue;
      if (r.status === 'won') { out.set('exit', r); continue; }
      const k = C.stateKey(r); if (seen.has(k)) continue; seen.add(k);
      if (nItems(r) < nItems(s0)) { const got = Object.keys(s0.items).find((i) => !r.items[i]); if (!out.has(got)) out.set(got, r); continue; }
      n.push(r); }
    f = n; }
  return out;
}
// Mechanics: tile families, items and monster kinds, with plain floor/wall/chip/exit left out.
const FAMILY = { '<': 'force', '>': 'force', '^': 'force', v: 'force', '1': 'beat', '2': 'beat', L: 'toggle', l: 'toggle', '(': 'toggle',
  '-': 'thin', _: 'thin', '{': 'thin', '}': 'thin', '7': 'corner', '9': 'corner', '3': 'corner', '0': 'corner', R: 'door', G: 'door', B: 'door', Y: 'door',
  r: 'door', g: 'door', b: 'door', y: 'door', W: 'cracked', '%': null, '#': null, '.': null, '*': null, E: null, '@': null, I: 'hidden', N: 'hidden' };
function mechanics(def) {
  const set = new Set();
  for (const row of def.map) for (const ch of row) { const f = ch in FAMILY ? FAMILY[ch] : ch; if (f) set.add(f); }
  return set.size;
}
const [from, to] = (process.argv[2] || `1-${LEVELS.length}`).split('-').map(Number);
LEVELS.forEach((def, i) => {
  if (i + 1 < from || i + 1 > (to || from)) return;
  const sol = def.route ? S.waypoints(def, def.route) : S.solve(def, 2500000);
  if (sol.par === null) { console.log(`${i + 1}\t${def.name}\tUNSOLVED`); return; }
  const tr = trapsLite(def, sol.path); const gr = greedy(def);
  let s = C.parseLevel({ ...def, battery: 0 }); let opts = 0, traps = 0, n = 0;
  const check = (st) => { const F = firsts(st); let ok = 0; for (const [, r] of F) if (r.status === 'won' || canWin(r, 40000) !== false) ok++; n++; if (F.size >= 2) opts++; if (ok < F.size) traps++; };
  check(s);
  for (const lab of sol.path) { const b = nItems(s); s = C.act(s, parse(lab)).state; if (s.status === 'play' && nItems(s) < b && nItems(s) > 0) check(s); }
  const mech = mechanics(def); const danger = tr.lethal / tr.steps;
  const g = gr.ok ? gr.turns / sol.par : 2;
  const score = Math.round(sol.par * 0.25 + mech * 3 + danger * 25 + traps * 6 + tr.softlock * 0.5 + opts * 2 + (g - 1) * 12);
  console.log([i + 1, def.name.padEnd(17), def.world.padEnd(9), `par ${sol.par}`, `mech ${mech}`, `danger ${danger.toFixed(2)}`, `traps ${traps}/${n}`, `choice ${opts}/${n}`, `greedy ${gr.ok ? g.toFixed(2) : 'fail'}`, `score ${score}`].join('\t'));
});
