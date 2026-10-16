'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const L = require('../core.js');
const levels = require('../levels.js');
const { search } = require('./checkpoint-search.js');
const { parseAction, label } = require('./solve.js');

class Plan {
  constructor(n, name) { this.n = n; this.name = name; this.s = L.parseLevel(levels[n-1]); this.path = []; this.checkpoints = {}; this.explored = 0; }
  act(a) {
    const r = L.act(this.s, typeof a === 'string' ? parseAction(a) : a);
    assert(r.state.status !== 'dead', `${this.n} ${this.name}: died at ${this.s.steps} (${r.state.cause})`);
    this.s = r.state; this.path.push(label(typeof a === 'string' ? parseAction(a) : a));
    return this;
  }
  find(goal, options = {}) {
    const r = search(this.s, goal, { allow: (s,a) => !a || typeof a === 'string', ...options, ms: 20000 });
    assert.strictEqual(r.status, 'found', `${this.n} ${this.name} at ${this.s.player.x},${this.s.player.y}: ${options.title || 'goal'} ${r.status} (${r.explored}); keys ${JSON.stringify(this.s.keys)}, powers ${JSON.stringify(this.s.powers)}`);
    this.path.push(...r.path); this.s = r.state; this.explored += r.explored;
    return this;
  }
  go(x,y, extra = () => true) {
    const crates = this.s.crates.join(',');
    return this.find((s) => s.player.x === x && s.player.y === y && extra(s), {
      title: `walk ${x},${y}`, heuristic: (s) => Math.abs(s.player.x-x)+Math.abs(s.player.y-y),
      accept: (s,a,t) => t.crates.join(',') === crates,
    });
  }
  crate(x,y) {
    const i = y*this.s.w+x;
    return this.find((s) => s.crates.includes(i), { title: `crate ${x},${y}`, heuristic: (s) => Math.min(...s.crates.map((p) => Math.abs(p%s.w-x)+Math.abs(Math.floor(p/s.w)-y))) });
  }
  fire(k,dir) { if (dir && this.s.facing !== dir) this.act(dir); return this.act({ use:k }); }
  mark(name) { this.checkpoints[name] = this.path.length; return this; }
  finish(x,y) { this.go(x,y); assert.strictEqual(this.s.status,'won', `${this.n} ${this.name}: not won`); return this; }
  result() { return { name:this.name, par:this.s.steps, path:this.path, checkpoints:this.checkpoints, explored:this.explored }; }
}
const builders = {
  31: () => [new Plan(31,'reserve-red').go(3,3).mark('initial-key').go(3,9).go(6,2).go(10,2).go(6,6).go(9,6).go(10,6).mark('last-red').go(11,5).fire('j','right').go(13,5).go(13,6).go(13,5).go(11,5).go(9,10).finish(10,10)],
  32: () => [new Plan(32,'stop-then-bridge').go(2,7).go(8,6).act('up').mark('ice-stop').go(6,1).go(7,2).go(7,4).mark('recover-stop').act('right').find((s) => !s.crates.length,{ title:'bridge' }).go(14,4).finish(15,4)],
  33: () => [new Plan(33,'provisioned-crossings').go(2,3).go(2,5).mark('first-crossing').go(7,2).go(9,8).go(10,8).mark('second-crossing').go(7,4).fire('m','left').fire('m').go(2,8).go(4,8).go(1,9).mark('provisioned').go(13,2).go(16,8).go(18,9).go(13,4).fire('j','left').go(3,11).fire('m','right').finish(5,11)],
  34: () => {
    const plans = [];
    for (const first of ['j','m']) {
      const p = new Plan(34,first === 'j' ? 'jet-archive' : 'jet-final');
      p.go(9,7).go(10,7).go(9,6).go(8,3).fire(first,'left'); if (first === 'm') p.fire('m');
      p.go(3,3).go(2,7).go(6,3).go(8,3).go(12,5).go(20,3).go(20,7).go(19,9).fire('m','down').go(20,12).go(9,12);
      p.fire(first === 'j' ? 'm' : 'j','right'); if (first === 'j') p.fire('m');
      p.finish(11,12); plans.push(p);
    }
    return plans;
  },
  35: () => [new Plan(35,'leave-the-spare').go(5,4).go(6,5).go(2,2).go(2,3).mark('spare-before-thief').go(10,4).mark('after-thief').go(5,8).go(2,6).go(13,1).go(17,6).finish(17,9)],
  36: () => {
    const a = new Plan(36,'shots-and-red-detour').go(5,6).go(6,6).go(7,6).go(7,5).fire('j','up').go(7,2).go(8,2).go(5,7).fire('m','left').go(2,6).go(2,8).go(10,7).fire('m','right').go(14,9).go(15,7).go(14,7).fire('m','right').go(16,7).finish(7,11);
    const b = new Plan(36,'bridge-and-flame').go(5,6).go(6,6).go(7,6).go(7,5).fire('m','up').fire('m').go(7,2).go(8,2).go(5,7).fire('j','left').go(2,6).go(2,8).go(10,7).act('right').act('right').go(15,7).go(13,7).act('right').fire('f').go(16,7).finish(7,11);
    return [a,b];
  },
  37: () => [new Plan(37,'gate-before-pursuit').go(7,6).go(8,5).mark('key-choice').go(10,3).go(13,3).go(15,3).mark('chase').go(9,3).mark('safe-gate').go(6,9).go(6,10).fire('j','right').go(8,10).finish(1,3)],
  38: () => {
    const a = new Plan(38,'frozen-operator').go(3,8).go(4,8).go(9,4,(s) => s.enemies.some((e) => e.x===6 && e.y===2)).mark('freeze').fire('z').go(13,8).go(15,8).go(15,6).go(10,6).mark('off-traps').finish(2,9);
    const b = new Plan(38,'crate-operator').go(3,8).go(4,8).go(2,5).fire('m','up').go(2,3).go(6,7).crate(6,2).mark('weighted').go(13,8).go(15,8).go(15,6).go(10,6).finish(2,9);
    return [a,b];
  },
  39: () => [new Plan(39,'stop-weight-bridge').go(8,6).act('up').mark('ice-stop').go(6,1).go(7,2).go(7,4).act('right').crate(13,4).mark('weighted').go(12,6).go(11,8).fire('m','left').fire('m').go(9,8).go(14,6).fire('m','up').mark('bypass').go(11,3).go(11,4).go(12,4).act('right').mark('recovered').go(14,3).act('down').act('down').act('down').act('down').act('down').mark('bridge').finish(14,10)],
  40: () => {
    const plans = [];
    for (const crate of [false,true]) {
      const p = new Plan(40,crate ? 'key-saving-crate' : 'gate-and-freeze');
      p.go(8,9).go(10,9).go(9,10).go(8,8);
      if (crate) p.go(7,10).fire('j','left'); else p.go(6,8);
      p.go(2,8).go(2,10); if (crate) p.go(5,10).go(7,10);
      p.go(8,14).go(9,14).go(10,14);
      if (crate) p.go(16,7).crate(16,4).mark('weighted');
      else p.go(17,8,(s) => s.keys.r >= 1 && s.enemies.some((e) => e.x===16 && e.y===4)).mark('freeze').fire('z');
      p.go(22,8).go(23,9).go(21,7).go(20,6).mark('off-traps').go(17,10).go(9,6).fire(crate ? 'm' : 'j','up'); if (crate) p.fire('m');
      p.go(8,2).go(5,4).fire('m','up').finish(5,2); plans.push(p);
    }
    return plans;
  },
};
function fingerprint() {
  const defs = levels.slice(30).map(({ par, ...d }) => d);
  return crypto.createHash('sha256').update(JSON.stringify(defs)).update(fs.readFileSync(path.join(__dirname,'..','core.js'))).digest('hex');
}
if (require.main === module) {
  const nums = process.argv.slice(2).map(Number);
  const out = {};
  for (const n of (nums.length ? nums : Object.keys(builders).map(Number))) {
    out[n] = builders[n]().map((p) => p.result());
    for (const p of out[n]) console.log(`${n} ${p.name}: ${p.par} turns, ${p.explored} searched states`);
  }
  fs.mkdirSync(path.join(__dirname,'..','.cache','proofs'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'..','.cache','proofs','pack1.json'),JSON.stringify({ fingerprint:fingerprint(), levels:out },null,2));
}
module.exports = { builders, Plan, fingerprint };
