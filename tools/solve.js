#!/usr/bin/env node
// Breadth-first solver: proves every level is beatable and finds its par (fewest moves).
// Usage: node tools/solve.js [levelNumber]     VERBOSE=1 prints the winning actions.
'use strict';
const path = require('path');
const L = require(path.join(__dirname, '..', 'core.js'));
const LEVELS = require(path.join(__dirname, '..', 'levels.js'));

const DIRS = ['up', 'down', 'left', 'right'];

function actions(s) {
  const out = [...DIRS, null];
  for (const k of L.POWERS) {
    if (!s.powers[k]) continue;
    if (L.AIMED[k]) for (const d of DIRS) out.push({ use: k, dir: d });
    else out.push({ use: k });
  }
  return out;
}

const label = (a) => (a === null ? 'wait' : typeof a === 'string' ? a : `${a.use}:${a.dir || '-'}`);

// Moves are counted in ticks (an ice slide costs one move per tile), so this is a
// cheapest-path search with one bucket per move count rather than plain BFS.
function solve(def, limit = 3000000) {
  const start = L.parseLevel({ ...def, battery: 0 });
  const best = new Map([[L.stateKey(start), { prev: null, a: null, cost: 0 }]]);
  const buckets = [[start]];
  let win = null;
  for (let cost = 0; cost < buckets.length; cost++) {
    if (win && cost >= win.cost) break;
    const bucket = buckets[cost];
    if (!bucket) continue;
    for (const s of bucket) {
      const sk = L.stateKey(s);
      if (best.get(sk).cost < cost) continue; // reached more cheaply since
      for (const a of actions(s)) {
        const r = L.act(s, a);
        if (r.state === s || r.state.status === 'dead') continue;
        // A flame or shot that hits nothing is just a worse way to wait; skip it.
        if (a && a.use && (a.use === 'f' || a.use === 'm') && !r.events.some((e) => e.startsWith('kill') || e.startsWith('break'))) continue;
        const c = r.state.steps;
        const key = L.stateKey(r.state) + (r.state.status === 'won' ? ';won' : '');
        const old = best.get(key);
        if (old && old.cost <= c) continue;
        best.set(key, { prev: sk, a, cost: c });
        if (r.state.status === 'won') {
          if (!win || c < win.cost) win = { cost: c, key };
          continue;
        }
        (buckets[c] = buckets[c] || []).push(r.state);
        if (best.size > limit) return { par: null, explored: best.size, truncated: true };
      }
    }
    buckets[cost] = null;
  }
  if (win) return { par: win.cost, path: trace(best, win.key), explored: best.size };
  return { par: null, explored: best.size };
}

// Guided best-first search for levels too large to search exhaustively. It proves the
// level is winnable and returns the shortest route it found, which may not be optimal.
function guided(def, { weight = 3, limit = 4000000 } = {}) {
  const start = L.parseLevel({ ...def, battery: 0 });
  const exit = start.grid.indexOf('E');
  const ex = exit % start.w;
  const ey = Math.floor(exit / start.w);
  const h = (s) => {
    let best = Infinity;
    let remaining = 0;
    for (const [i, it] of Object.entries(s.items)) {
      remaining++;
      const x = i % s.w;
      const y = Math.floor(i / s.w);
      best = Math.min(best, Math.abs(x - s.player.x) + Math.abs(y - s.player.y));
    }
    if (!remaining) return Math.abs(ex - s.player.x) + Math.abs(ey - s.player.y);
    return best + remaining * 6;
  };
  const heap = [];
  const push = (f, s) => {
    heap.push([f, s]);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  const best = new Map([[L.stateKey(start), { prev: null, a: null, cost: 0 }]]);
  push(weight * h(start), start);
  while (heap.length) {
    const [, s] = pop();
    const sk = L.stateKey(s);
    if (best.get(sk).cost < s.steps) continue;
    for (const a of actions(s)) {
      const r = L.act(s, a);
      if (r.state === s || r.state.status === 'dead') continue;
      if (a && a.use && (a.use === 'f' || a.use === 'm') && !r.events.some((e) => e.startsWith('kill') || e.startsWith('break'))) continue;
      const c = r.state.steps;
      const key = L.stateKey(r.state) + (r.state.status === 'won' ? ';won' : '');
      const old = best.get(key);
      if (old && old.cost <= c) continue;
      best.set(key, { prev: sk, a, cost: c });
      if (r.state.status === 'won') return { par: c, path: trace(best, key), explored: best.size, exact: false };
      push(c + weight * h(r.state), r.state);
      if (best.size > limit) return { par: null, explored: best.size, truncated: true };
    }
  }
  return { par: null, explored: best.size };
}

// Waypoint search for levels too large to search exhaustively: the shortest path to
// each listed item in turn, then to the exit. It proves the level is winnable and gives
// a par that is the best known route, not necessarily the true minimum.
function waypoints(def, route, limit = 1500000) {
  let s = L.parseLevel({ ...def, battery: 0 });
  const path = [];
  let explored = 0;
  const goals = route.map((p) => {
    const [x, y] = p.split(',').map(Number);
    return (t) => !t.items[y * t.w + x];
  });
  goals.push((t) => t.status === 'won');
  for (const goal of goals) {
    const best = new Map([[L.stateKey(s), { prev: null, a: null, cost: s.steps }]]);
    const buckets = [];
    buckets[s.steps] = [s];
    let found = null;
    for (let cost = s.steps; cost < buckets.length && !found; cost++) {
      for (const t of buckets[cost] || []) {
        const tk = L.stateKey(t);
        if (best.get(tk).cost < cost) continue;
        for (const a of actions(t)) {
          const r = L.act(t, a);
          if (r.state === t || r.state.status === 'dead') continue;
          if (a && a.use && (a.use === 'f' || a.use === 'm') && !r.events.some((e) => e.startsWith('kill') || e.startsWith('break'))) continue;
          const c = r.state.steps;
          const key = L.stateKey(r.state) + (r.state.status === 'won' ? ';won' : '');
          const old = best.get(key);
          if (old && old.cost <= c) continue;
          best.set(key, { prev: tk, a, cost: c, state: r.state });
          if (goal(r.state) && (!found || c < found.cost)) found = { cost: c, key, state: r.state };
          if (r.state.status === 'won') continue;
          (buckets[c] = buckets[c] || []).push(r.state);
        }
        if (best.size > limit) return { par: null, explored: explored + best.size, truncated: true };
      }
    }
    explored += best.size;
    if (!found) return { par: null, explored, failedAt: goals.indexOf(goal) };
    path.push(...trace(best, found.key));
    s = found.state;
  }
  return { par: s.steps, path, explored, exact: false };
}

function trace(seen, key) {
  const out = [];
  for (let n = seen.get(key); n && n.prev !== null; n = seen.get(n.prev)) out.push(label(n.a));
  return out.reverse();
}

if (require.main === module) {
  const only = process.argv[2];
  let failed = false;
  LEVELS.forEach((def, i) => {
    if (only !== undefined && String(i + 1) !== only) return;
    const t0 = Date.now();
    const r = def.route ? waypoints(def, def.route) : solve(def);
    const ok = r.par !== null && r.par === def.par;
    if (!ok) failed = true;
    console.log(
      `${ok ? 'ok  ' : 'FAIL'} ${String(i + 1).padStart(2)}. ${def.name.padEnd(16)} par=${r.par} (declared ${def.par}) ` +
        `${def.route ? '[best known route] ' : ''}states=${r.explored}${r.truncated ? ' (gave up)' : ''} ${Date.now() - t0}ms`
    );
    if (r.path && process.env.VERBOSE) console.log('     ' + r.path.join(' '));
  });
  process.exit(failed ? 1 : 0);
}

module.exports = { solve, guided, waypoints, actions, label };
