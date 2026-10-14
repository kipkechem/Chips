#!/usr/bin/env node
// How much reaction time does each spider chase give a human? Follows the solver's winning
// path; at each moment a spider spots you (or you use a freeze bomb), it stands still for
// N turns and checks the level can still be won. Prints the largest N for each moment.
// Aim for about 1 second (6 turns) or more. Usage: node tools/reaction.js [levelNumber,...]
'use strict';
const L = require('../core.js');
const LEVELS = require('../levels.js');
const { solve, waypoints, actions } = require('./solve.js');

const parse = (a) => {
  if (a === 'wait') return null;
  if (!a.includes(':')) return a;
  const [use, dir] = a.split(':');
  return dir === '-' ? { use } : { use, dir };
};
const itemAt = (s, goal) => {
  const [x, y] = goal.split(',').map(Number);
  return s.items[y * s.w + x];
};

// Breadth-first search to the first state where done() holds.
function reach(s0, done, limit) {
  const seen = new Set([L.stateKey(s0)]);
  let frontier = [s0];
  while (frontier.length) {
    const next = [];
    for (const s of frontier) {
      for (const a of actions(s)) {
        const r = L.act(s, a).state;
        if (done(r)) return r;
        if (r.status !== 'play') continue;
        const k = L.stateKey(r);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push(r);
      }
    }
    if (seen.size > limit) return null;
    frontier = next;
  }
  return null;
}

// Can the level still be won from here? Levels with a route are searched leg by leg: the
// items not yet collected, in route order, then any '@x,y' tiles to stand on.
function winnable(s, route, limit = 400000) {
  const goals = (route || []).filter((g) => (g.startsWith('@') ? true : itemAt(s, g) !== undefined));
  for (const g of goals) {
    const at = g.startsWith('@') ? g.slice(1) : null;
    const done = (t) => t.status === 'won' || (t.status === 'play' && (at ? `${t.player.x},${t.player.y}` === at : itemAt(t, g) === undefined));
    s = reach(s, done, limit);
    if (!s) return false;
    if (s.status === 'won') return true;
  }
  return !!reach(s, (t) => t.status === 'won', limit);
}

const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
LEVELS.forEach((def, i) => {
  if (only ? !only.includes(i + 1) : !def.map.some((row) => row.includes('S'))) return;
  const r = def.route ? waypoints(def, def.route) : solve(def);
  let s = L.parseLevel({ ...def, battery: 0 });
  const out = [];
  for (const label of r.path) {
    const chasing = (t) => t.enemies.filter((e) => e.type === 'spider' && e.mode !== 'wait').length;
    const before = chasing(s);
    s = L.act(s, parse(label)).state;
    if (s.status !== 'play' || (chasing(s) <= before && !label.startsWith('z'))) continue;
    let spare = -1;
    for (let t = s; spare < 30 && t.status === 'play' && winnable(t, def.route); t = L.act(t, null).state) spare++;
    out.push(`at ${s.player.x},${s.player.y}: ${spare} spare turns (${(spare / L.TURNS_PER_SECOND).toFixed(2)} s)`);
  }
  console.log(`${String(i + 1).padStart(2)}. ${def.name.padEnd(16)} ${out.join(' | ') || 'no chase on the par path'}`);
});
