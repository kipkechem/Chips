'use strict';
const L = require('../core.js');
const { actions, label } = require('./solve.js');

// Checkpoint searches use real states, including spent resources and enemy phase.
// A budget expiry is explicitly inconclusive. Only exhausted frontiers prove failure.
function search(start, goal, { heuristic = () => 0, allow = () => true, accept = () => true, limit = 300000, ms = 15000 } = {}) {
  const heap = [], until = Date.now() + ms;
  const less = (a,b) => a.f < b.f || (a.f === b.f && a.s.steps > b.s.steps);
  function push(n) {
    heap.push(n);
    for (let i = heap.length - 1; i;) {
      const p = (i - 1) >> 1;
      if (!less(heap[i], heap[p])) break;
      [heap[i],heap[p]] = [heap[p],heap[i]]; i = p;
    }
  }
  function pop() {
    const n = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      for (let i = 0;;) {
        let k = i;
        for (const c of [i*2+1,i*2+2]) if (c < heap.length && less(heap[c],heap[k])) k = c;
        if (i === k) break;
        [heap[i],heap[k]] = [heap[k],heap[i]]; i = k;
      }
    }
    return n;
  }
  const seen = new Map([[L.stateKey(start), start.steps]]);
  push({ s: start, f: start.steps + heuristic(start), prev: null });
  while (heap.length) {
    if (seen.size >= limit || Date.now() > until) return { status: 'inconclusive', explored: seen.size };
    const n = pop(), s = n.s;
    if (goal(s)) {
      const path = [];
      for (let p = n; p.prev; p = p.prev) path.push(label(p.a));
      return { status: 'found', state: s, path: path.reverse(), explored: seen.size };
    }
    if (s.status !== 'play' || seen.get(L.stateKey(s)) < s.steps) continue;
    for (const a of actions(s)) {
      if (!allow(s,a)) continue;
      const r = L.act(s,a), t = r.state;
      if (t === s || t.status === 'dead' || !accept(s,a,t,r.events)) continue;
      const key = L.stateKey(t) + (t.status === 'won' ? ';won' : '');
      if (seen.has(key) && seen.get(key) <= t.steps) continue;
      seen.set(key,t.steps);
      push({ s:t, f:t.steps + heuristic(t), prev:n, a });
    }
  }
  return { status: 'exhausted', explored: seen.size };
}
module.exports = { search };
