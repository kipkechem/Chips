#!/usr/bin/env node
// Level lab: how demanding is a level? For each level it reports
//   memory   how much bigger than the screen the map is, and how many goals start off-screen
//   search   reachable states, and the share from which the level can no longer be won
//   danger   moments on the par route where one wrong move kills you
//   planning moments on the par route where one wrong move makes the level unwinnable
//   greedy   whether always heading for the nearest chip wins, and how slowly
// Usage: node tools/levlab.js [levelNumber,...]      (levels from levels.js)
//        node tools/levlab.js drafts.js [index,...]  (a file exporting an array of level defs)
// Env: V=1 prints the par route; LITE=1 skips the full state graph (big levels) and only
// re-checks moves that change something permanent; CAP / SCAP raise the search limits.
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', 'core.js'));
const S = require(path.join(__dirname, 'solve.js'));
const LEVELS = require(path.join(__dirname, '..', 'levels.js'));
const VIEW_W = 15, VIEW_H = 9;
const parse = (a) => a === 'wait' ? null : a.includes(':') ? (([u, d]) => d === '-' ? { use: u } : { use: u, dir: d })(a.split(':')) : a;

function memory(def) {
  const s = C.parseLevel({ ...def, battery: 0 });
  const vw = Math.min(VIEW_W, s.w), vh = Math.min(VIEW_H, s.h);
  const cx = Math.max(0, Math.min(s.w - vw, s.player.x - (vw >> 1)));
  const cy = Math.max(0, Math.min(s.h - vh, s.player.y - (vh >> 1)));
  const inView = (i) => { const x = i % s.w, y = (i - x) / s.w; return x >= cx && x < cx + vw && y >= cy && y < cy + vh; };
  const goals = Object.keys(s.items).map(Number).concat(s.grid.map((g, i) => (g === 'E' ? i : -1)).filter((i) => i >= 0));
  const hidden = goals.filter((i) => !inView(i)).length;
  return { area: (s.w * s.h / (VIEW_W * VIEW_H)).toFixed(1), goals: goals.length, hidden };
}

// Full reachable graph, then which states can still be won.
function graph(def, cap = +process.env.CAP || 1500000) {
  const s0 = C.parseLevel({ ...def, battery: 0 });
  const ids = new Map([[C.stateKey(s0), 0]]);
  const from = [], to = [];
  let frontier = [s0];
  let n = 1;
  while (frontier.length) {
    const next = [];
    for (const s of frontier) {
      const a = ids.get(C.stateKey(s));
      for (const act of S.actions(s)) {
        const r = C.act(s, act).state;
        let b;
        if (r.status === 'won') b = -1;
        else if (r.status === 'dead') b = -2;
        else {
          const k = C.stateKey(r);
          b = ids.get(k);
          if (b === undefined) { b = n++; ids.set(k, b); next.push(r); if (n > cap) return { capped: true, n }; }
        }
        from.push(a); to.push(b);
      }
    }
    frontier = next;
  }
  // winnable: reverse propagation from states with a winning move
  const win = new Uint8Array(n);
  const rev = Array.from({ length: n }, () => []);
  const queue = [];
  for (let e = 0; e < from.length; e++) {
    if (to[e] === -1) { if (!win[from[e]]) { win[from[e]] = 1; queue.push(from[e]); } }
    else if (to[e] >= 0) rev[to[e]].push(from[e]);
  }
  for (let q = 0; q < queue.length; q++) for (const p of rev[queue[q]]) if (!win[p]) { win[p] = 1; queue.push(p); }
  let dead = 0; for (let i = 0; i < n; i++) if (!win[i]) dead++;
  return { n, ids, win, deadPct: (100 * dead / n).toFixed(0) };
}

// Along the par route: how many moments offer a move that kills you or soft-locks the level?
function traps(def, G, path) {
  let s = C.parseLevel({ ...def, battery: 0 });
  let lethal = 0, softlock = 0;
  for (const lab of path) {
    let l = false, sl = false;
    for (const act of S.actions(s)) {
      const r = C.act(s, act).state;
      if (r.status === 'dead') l = true;
      else if (r.status === 'play') { const i = G.ids.get(C.stateKey(r)); if (i !== undefined && !G.win[i]) sl = true; }
    }
    if (l) lethal++; if (sl) softlock++;
    s = C.act(s, parse(lab)).state;
  }
  return { lethal, softlock, steps: path.length };
}

// Naive play: always walk to the nearest remaining chip, then to the exit.
function greedy(def) {
  let s = C.parseLevel({ ...def, battery: 0 });
  const reach = (s0, done) => {
    const seen = new Set([C.stateKey(s0)]); let f = [s0];
    for (let d = 0; f.length && d < 600; d++) { const n = [];
      for (const t of f) for (const a of S.actions(t)) { const r = C.act(t, a).state; if (done(r)) return r; if (r.status !== 'play') continue; const k = C.stateKey(r); if (!seen.has(k)) { seen.add(k); n.push(r); } }
      if (seen.size > 600000) return null; f = n; }
    return null;
  };
  while (s.chips < s.chipsTotal) {
    const c = s.chips;
    const r = reach(s, (t) => t.status === 'play' && t.chips > c);
    if (!r) return { ok: false, at: `stuck after ${c} chips` };
    s = r;
  }
  const w = reach(s, (t) => t.status === 'won');
  return w ? { ok: true, turns: w.steps } : { ok: false, at: 'cannot reach the exit' };
}

// Signature of everything a move can't take back: items, opened doors and other grid
// changes, crates, keys, powers, boots.
function fixedSig(s) {
  const k = C.stateKey(s).split(';');
  return [k[1], k[2], k[3], k[5], k[7]].join(';');
}
// Best-first search from a state to any win (a proof of winnability, not a shortest path).
function canWin(s0, limit = 250000) {
  const ex = s0.grid.indexOf('E'), w = s0.w;
  const h = (s) => {
    let best = Infinity, n = 0;
    for (const i of Object.keys(s.items)) { n++; best = Math.min(best, Math.abs(i % w - s.player.x) + Math.abs(Math.floor(i / w) - s.player.y)); }
    return n ? best + n * 6 : Math.abs(ex % w - s.player.x) + Math.abs(Math.floor(ex / w) - s.player.y);
  };
  const heap = [[h(s0), s0]];
  const push = (f, s) => { heap.push([f, s]); for (let i = heap.length - 1; i > 0;) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; for (let i = 0; ;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const seen = new Set([C.stateKey(s0)]);
  while (heap.length) {
    const [, s] = pop();
    for (const a of S.actions(s)) {
      const r = C.act(s, a).state;
      if (r.status === 'won') return true;
      if (r.status !== 'play') continue;
      const k = C.stateKey(r);
      if (seen.has(k)) continue;
      seen.add(k);
      if (seen.size > limit) return null;
      push(r.steps - s0.steps + 3 * h(r), r);
    }
  }
  return false;
}
// Trap count for levels too big to map fully: only moves that change something permanent
// (and differ from the par route's move) are tested for winnability.
function trapsLite(def, path) {
  let s = C.parseLevel({ ...def, battery: 0 });
  let lethal = 0, softlock = 0, unsure = 0;
  for (const lab of path) {
    const next = C.act(s, parse(lab)).state;
    let l = false, sl = false;
    const base = fixedSig(s), good = fixedSig(next);
    for (const act of S.actions(s)) {
      const r = C.act(s, act).state;
      if (r.status === 'dead') { l = true; continue; }
      if (r.status !== 'play') continue;
      const sig = fixedSig(r);
      if (sig === base || sig === good) continue;
      const w = canWin(r);
      if (w === false) sl = true; else if (w === null) unsure++;
    }
    if (l) lethal++; if (sl) softlock++;
    s = next;
  }
  return { lethal, softlock, steps: path.length, unsure };
}

function report(def, label, checks = []) {
  const t0 = Date.now();
  const sol = def.route ? S.waypoints(def, def.route) : S.solve(def, +process.env.SCAP || 2000000);
  if (sol.par === null) { console.log(`\n${label}: UNSOLVABLE (${sol.truncated ? 'search too big' : 'no win'})`); return; }
  const m = memory(def);
  const G = process.env.LITE ? { capped: true, n: 0 } : graph(def);
  const tr = G.capped ? trapsLite(def, sol.path) : traps(def, G, sol.path);
  const g = greedy(def);
  const neutral = checks.map(([lab, f]) => {
    const r = S.solve({ ...def, map: def.map.map(f) }, 1500000);
    return `${lab}: ${r.par === null ? (r.truncated ? 'too big' : 'UNWINNABLE') : 'par ' + r.par}`;
  });
  const t3 = Math.ceil((sol.par * 1.5) / 6) * 6;
  console.log(`\n${label}  (par ${sol.par} = ${(sol.par / 6).toFixed(1)}s, 3-star ${t3 / 6}s, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  console.log(`   memory: map ${m.area}x the screen, ${m.hidden}/${m.goals} goals off-screen at start`);
  console.log(`   search: ${G.capped ? '>' + G.n : G.n} reachable states; ${G.capped ? '?' : G.deadPct + '%'} dead ends`);
  if (tr) console.log(`   par route: ${tr.steps} moves; DANGER ${tr.lethal} moments with a deadly wrong move; PLANNING ${tr.softlock} with a level-losing wrong move${tr.unsure !== undefined ? ` (lite check, ${tr.unsure} unsure)` : ''}`);
  console.log(`   nearest-chip play: ${g.ok ? `wins in ${g.turns} turns (${(g.turns / sol.par).toFixed(2)}x par)` : 'FAILS, ' + g.at}`);
  if (neutral.length) console.log(`   element check: ${neutral.join(' | ')}`);
  if (process.env.V) console.log('   path:', sol.path.join(' '));
}
module.exports = { report, graph, traps, trapsLite, greedy, memory, canWin };
if (require.main === module) {
  const arg = process.argv[2];
  const fromFile = arg && /\.js(on)?$/.test(arg);
  const defs = fromFile ? require(path.resolve(arg)) : LEVELS;
  const pick = fromFile ? process.argv[3] : arg;
  const only = pick ? pick.split(',').map(Number) : null;
  defs.forEach((d, i) => {
    const n = fromFile ? i : i + 1;
    if (only && !only.includes(n)) return;
    report(d, `${n}. ${d.name}`, (d.checks || []).map(([lab, re, rep]) => [lab, (row) => row.replace(new RegExp(re, 'g'), rep)]));
  });
}
