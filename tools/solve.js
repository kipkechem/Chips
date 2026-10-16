#!/usr/bin/env node
// A* solver: proves each exact par, or validates an explicit best known route.
// Usage: node tools/solve.js [levelNumber or range]     VERBOSE=1 prints winning actions.
'use strict';
const path = require('path');
const L = require(path.join(__dirname, '..', 'core.js'));
const LEVELS = require(path.join(__dirname, '..', 'levels.js'));
const fs = require('fs');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { selectLevels, validateLevel } = require('./validate-levels.js');
const deadline = () => Date.now() + 90000;

const DIRS = ['up', 'down', 'left', 'right'];

function actions(s) {
  const out = [...DIRS, null];
  for (const k of L.POWERS) {
    if (!s.powers[k]) continue;
    out.push({ use: k }); // aimed power-ups fire the way you face
  }
  return out;
}

const label = (a) => (a === null ? 'wait' : typeof a === 'string' ? a : `${a.use}:${a.dir || '-'}`);

// Distances ignore movable obstacles and hazards. Their spanning tree is a lower
// bound on any winning route, so A* still proves the exact par. Teleports use zero.
function relaxedDistances(start, targets) {
  const tools = start.powers.j || start.powers.m || Object.values(start.items).some((it) => it === 'j' || it === 'm');
  const blocked = (i) => '%H&'.includes(start.grid[i]) || (!tools && '#I'.includes(start.grid[i]));
  return targets.map((target) => {
    const d = new Int32Array(start.grid.length).fill(-1), queue = [target];
    d[target] = 0;
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head], x = i % start.w, y = Math.floor(i / start.w);
      for (const [nx, ny] of [[x - 1,y],[x + 1,y],[x,y - 1],[x,y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= start.w || ny >= start.h) continue;
        const j = ny * start.w + nx;
        if (d[j] >= 0 || blocked(j)) continue;
        d[j] = d[i] + 1; queue.push(j);
      }
    }
    return d;
  });
}
function lowerBound(start) {
  if (start.grid.includes('o')) return () => 0;
  const targets = Object.keys(start.items).map(Number).filter((i) => start.items[i] === '*');
  targets.push(start.grid.indexOf('E'));
  const distances = relaxedDistances(start, targets);
  const trees = new Map();
  return (s) => {
    const remaining = targets.map((p, i) => i).filter((i) => i === targets.length - 1 || s.items[targets[i]] === '*');
    const key = remaining.join(',');
    if (!trees.has(key)) {
      const used = new Set([remaining[0]]); let total = 0;
      while (used.size < remaining.length) {
        let next = null, best = Infinity;
        for (const a of used) for (const b of remaining) if (!used.has(b)) {
          const d = distances[a][targets[b]];
          if (d >= 0 && d < best) { best = d; next = b; }
        }
        if (next === null) return Infinity;
        total += best; used.add(next);
      }
      trees.set(key, total);
    }
    const at = s.player.y * s.w + s.player.x;
    const chips = remaining.filter((i) => i !== targets.length - 1);
    const nearest = Math.min(...(chips.length ? chips : remaining).map((i) => distances[i][at] < 0 ? Infinity : distances[i][at]));
    return trees.get(key) + nearest;
  };
}
function priorityQueue() {
  const heap = [];
  const less = (a, b) => a.f < b.f || (a.f === b.f && a.cost > b.cost);
  return {
    get length() { return heap.length; },
    push(node) {
      heap.push(node);
      for (let i = heap.length - 1; i > 0;) {
        const p = (i - 1) >> 1;
        if (!less(heap[i], heap[p])) break;
        [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
      }
    },
    pop() {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        for (let i = 0;;) {
          let m = i; const l = 2 * i + 1, r = l + 1;
          if (l < heap.length && less(heap[l], heap[m])) m = l;
          if (r < heap.length && less(heap[r], heap[m])) m = r;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
        }
      }
      return top;
    },
  };
}

function solve(def, limit = 1000000) {
  const until = deadline();
  const start = L.parseLevel({ ...def, battery: 0 });
  const h = lowerBound(start), open = priorityQueue();
  const best = new Map([[L.stateKey(start), 0]]);
  open.push({ s: start, cost: 0, f: h(start), prev: null });
  while (open.length) {
    if (Date.now() > until) return { par: null, explored: best.size, truncated: true, reason: '90 second search budget' };
    const node = open.pop(), s = node.s;
    if (s.status === 'won') {
      const path = [];
      for (let n = node; n.prev; n = n.prev) path.push(label(n.a));
      return { par: s.steps, path: path.reverse(), explored: best.size, exact: true };
    }
    if (best.get(L.stateKey(s)) < s.steps) continue;
    for (const a of actions(s)) {
      const r = L.act(s, a);
      if (r.state === s || r.state.status === 'dead') continue;
      if (a && a.use && (a.use === 'f' || a.use === 'm') && !r.events.some((e) => e.startsWith('kill') || e.startsWith('break') || e.startsWith('crack'))) continue;
      const c = r.state.steps, key = L.stateKey(r.state) + (r.state.status === 'won' ? ';won' : '');
      if (best.has(key) && best.get(key) <= c) continue;
      best.set(key, c);
      const estimate = r.state.status === 'won' ? 0 : h(r.state);
      if (Number.isFinite(estimate)) open.push({ s: r.state, cost: c, f: c + estimate, prev: node, a });
      if (best.size > limit) return { par: null, explored: best.size, truncated: true };
    }
  }
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
      if (a && a.use && (a.use === 'f' || a.use === 'm') && !r.events.some((e) => e.startsWith('kill') || e.startsWith('break') || e.startsWith('crack'))) continue;
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
// each listed item (or '@x,y' position) in turn, then to the exit. It proves the level is winnable and gives
// a par that is the best known route, not necessarily the true minimum.
function waypoints(def, route, limit = 1000000, finish = true) {
  const until = deadline();
  let s = L.parseLevel({ ...def, battery: 0 });
  const path = [];
  let explored = 0;
  // 'x,y' means the item there has been collected; '@x,y' means standing on that tile.
  const positions = route.map((p) => {
    const [x, y] = p.replace('@', '').split(',').map(Number);
    return y * s.w + x;
  });
  if (finish) positions.push(s.grid.indexOf('E'));
  const fields = s.grid.includes('o') ? null : relaxedDistances(s, positions);
  const goals = route.map((p) => {
    const at = p.startsWith('@');
    const [x, y] = p.replace('@', '').split(',').map(Number);
    return at ? (t) => t.player.x === x && t.player.y === y : (t) => !t.items[y * t.w + x];
  });
  if (finish) goals.push((t) => t.status === 'won');
  for (const [gi, goal] of goals.entries()) {
    if (goal(s)) continue;
    const h = (t) => goal(t) || !fields ? 0 : fields[gi][t.player.y * t.w + t.player.x];
    const best = new Map([[L.stateKey(s), s.steps]]);
    const open = priorityQueue();
    open.push({ s, cost: s.steps, f: s.steps + h(s), prev: null });
    let found = null;
    while (open.length) {
      if (Date.now() > until) return { par: null, explored: explored + best.size, truncated: true, reason: '90 second search budget' };
      const node = open.pop(), t = node.s;
      if (best.get(L.stateKey(t)) < t.steps) continue;
      if (goal(t)) { found = node; break; }
      if (t.status === 'won') continue;
      for (const a of actions(t)) {
        const r = L.act(t, a);
        if (r.state === t || r.state.status === 'dead') continue;
        if (a && a.use && (a.use === 'f' || a.use === 'm') && !r.events.some((e) => e.startsWith('kill') || e.startsWith('break') || e.startsWith('crack'))) continue;
        const c = r.state.steps, key = L.stateKey(r.state);
        if (best.has(key) && best.get(key) <= c) continue;
        best.set(key, c);
        const estimate = h(r.state);
        if (estimate >= 0) open.push({ s: r.state, cost: c, f: c + estimate, prev: node, a });
        if (best.size > limit) return { par: null, explored: explored + best.size, truncated: true };
      }
    }
    explored += best.size;
    if (!found) return { par: null, explored, failedAt: goals.indexOf(goal) };
    const leg = [];
    for (let n = found; n.prev; n = n.prev) leg.push(label(n.a));
    path.push(...leg.reverse());
    s = found.s;
  }
  return { par: s.steps, path, explored, exact: false };
}

function trace(seen, key) {
  const out = [];
  for (let n = seen.get(key); n && n.prev !== null; n = seen.get(n.prev)) out.push(label(n.a));
  return out.reverse();
}

const fingerprint = (def) => crypto.createHash('sha256').update(JSON.stringify(def)).update(fs.readFileSync(path.join(__dirname, '..', 'core.js'))).update(fs.readFileSync(__filename)).digest('hex');
const cacheFile = (i) => path.join(__dirname, '..', '.cache', 'solutions', `${i + 1}.json`);
const parseAction = (a) => a === 'wait' ? null : a.includes(':') ? { use: a.split(':')[0] } : a;
function replay(def, result) {
  let s = L.parseLevel(def);
  for (const a of result.path || []) s = L.act(s, parseAction(a)).state;
  if (s.status !== 'won' || s.steps !== result.par) throw new Error(`Invalid solution for ${def.name}`);
  return s;
}
function solution(i, cached = true) {
  const def = LEVELS[i];
  validateLevel(def);
  const hash = fingerprint(def);
  if (cached) {
    try {
      const r = JSON.parse(fs.readFileSync(cacheFile(i), 'utf8'));
      if (r.fingerprint === hash) { replay(def, r); return r; }
    } catch { /* Missing or stale cache is solved again. */ }
  }
  // Pack 1 has executable design witnesses, including genuinely different plans.
  // Their pars are best known complete routes, not claims of global optimality.
  const proofs = i >= 30 && i < 40 ? require('./build-pack1-proofs.js').builders[i + 1]().map((p) => p.result()) : null;
  const r = proofs ? { ...proofs.sort((a,b) => a.par-b.par)[0], exact:false } : def.route ? waypoints(def, def.route) : solve(def);
  if (r.par !== null) {
    replay(def, r);
    r.fingerprint = hash;
    fs.mkdirSync(path.dirname(cacheFile(i)), { recursive: true });
    fs.writeFileSync(cacheFile(i), JSON.stringify(r));
  }
  return r;
}
module.exports = { solve, guided, waypoints, actions, label, solution, replay, parseAction, lowerBound };
if (require.main === module) {
  if (process.argv[2] === '--worker') {
    try { console.log(JSON.stringify(solution(Number(process.argv[3]) - 1, false))); }
    catch (err) { console.error(err.stack); process.exitCode = 1; }
  } else {
    let failed = false;
    for (const i of selectLevels(process.argv.slice(2), LEVELS.length)) {
      const def = LEVELS[i], t0 = Date.now();
      const child = spawnSync(process.execPath, [__filename, '--worker', String(i + 1)], { encoding: 'utf8', timeout: 95000, maxBuffer: 4 * 1024 * 1024 });
      let r;
      try { r = JSON.parse(child.stdout); } catch { r = { par: null, reason: child.stderr || child.error?.message }; }
      const ok = child.status === 0 && r.par !== null && r.par === def.par;
      if (!ok) failed = true;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${i + 1}. ${def.name} par=${r.par} (declared ${def.par}) [${r.exact ? 'exact' : 'best known route'}] states=${r.explored} ${Date.now() - t0}ms ${r.reason || ''}`);
      if (r.path && process.env.VERBOSE) console.log(r.path.join(' '));
    }
    process.exitCode = failed ? 1 : 0;
  }
}
