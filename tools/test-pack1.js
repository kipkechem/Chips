'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const L = require('../core.js');
const levels = require('../levels.js');
const designs = require('./pack1-designs.js');
const { builders, Plan, fingerprint } = require('./build-pack1-proofs.js');
const { search } = require('./checkpoint-search.js');
const { parseAction, lowerBound } = require('./solve.js');
const proofs = Object.fromEntries(Object.keys(builders).map((n) => [n,builders[n]().map((p) => p.result())]));
const report = { fingerprint:fingerprint(), branches:[], strategies:[], margins:[] };

function replay(n, proof, end = proof.path.length, waitsAt = -1, waits = 0) {
  let s = L.parseLevel(levels[n-1]); const h = lowerBound(s);
  for (let k = 0; k < end; k++) {
    if (k === waitsAt) for (let w = 0; w < waits; w++) s = L.act(s,null).state;
    const r = L.act(s,parseAction(proof.path[k])); s = r.state;
    assert.notStrictEqual(s.status,'dead',`${n} ${proof.name} died on action ${k}`);
    for (const frame of r.frames) {
      assert.strictEqual(L.stateKey(frame),L.stateKey({ ...frame, mutableGrid:frame.grid.map((_,i) => i) }));
      assert(h(frame) <= proof.par + waits - frame.steps,'Search lower bound exceeds a winning suffix');
    }
  }
  return s;
}
function checkpoint(n, marker, variant = 0) {
  const p = new Plan(n,`checkpoint:${marker}`), proof = proofs[n][variant];
  assert(Number.isInteger(proof.checkpoints[marker]),`Missing checkpoint ${n}:${marker}`);
  p.s = replay(n,proof,proof.checkpoints[marker]); return p;
}
function impossible(n,name,s) {
  const r = search(s,(t) => t.status === 'won',{ limit:750000, ms:30000 });
  assert.strictEqual(r.status,'exhausted',`${n} ${name}: ${r.status} is not an unwinnability proof (${r.explored})`);
  report.branches.push({ level:n,mistake:name,proof:'exhaustive checkpoint search',explored:r.explored });
  console.log(`ok branch ${n}: ${name}, exhausted ${r.explored} states`);
}
function cut(n,name,s,target) {
  // Optimistic closure: reuse reachable keys and the full tool budget separately
  // at every barrier. Ignore enemies, thin edges, and forced movement entirely.
  const keys = new Set(Object.keys(s.keys).filter((k) => s.keys[k]));
  let jet = !!s.powers.j, shots = s.powers.m, swim = !!s.boots.p, seen;
  const actor = s.crates.length || s.enemies.length;
  for (let pass = 0; pass < s.grid.length; pass++) {
    const before = [...keys].sort().join('') + jet + shots + swim;
    seen = new Set([s.player.y*s.w+s.player.x]); const q = [...seen];
    for (let k = 0; k < q.length; k++) {
      const i = q[k], x = i%s.w, y = Math.floor(i/s.w), it = s.items[i];
      if ('rgby'.includes(it || '?')) keys.add(it);
      if (it === 'j') jet = true;
      if (it === 'm') shots = Math.max(shots,3);
      if (it === 'p') swim = true;
      for (const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        if (nx < 0 || ny < 0 || nx >= s.w || ny >= s.h) continue;
        const j = ny*s.w+nx, g = s.grid[j];
        if (seen.has(j) || '%H&L'.includes(g) || ('#I'.includes(g) && !jet && shots<2) || (g==='W' && !jet && !shots) || ('RGBY'.includes(g) && !keys.has(g.toLowerCase())) || (g === 'w' && !swim && !s.crates.length) || (g === 'J' && !actor)) continue;
        seen.add(j); q.push(j);
      }
    }
    if (before === [...keys].sort().join('') + jet + shots + swim) break;
  }
  assert(!seen.has(target[1]*s.w+target[0]),`${n} ${name}: optimistic cut failed`);
  report.branches.push({level:n,mistake:name,proof:'unreachable under optimistic per-barrier resource relaxation',target});
  console.log(`ok branch ${n}: ${name}, optimistic reachability cut`);
}
for (const [n,variants] of Object.entries(proofs)) {
  assert.strictEqual(levels[n-1].revision,2);
  assert(designs[n].budget && designs[n].dependencies.length && designs[n].mistakes.length);
  assert.strictEqual(Math.min(...variants.map((v) => v.par)),levels[n-1].par);
  const commitments = [];
  for (const proof of variants) {
    const s = replay(Number(n),proof); assert.strictEqual(s.status,'won'); assert.strictEqual(s.steps,proof.par);
    report.strategies.push({level:Number(n),name:proof.name,turns:s.steps,keys:s.keys,powers:s.powers,crates:s.crates,enemies:s.enemies.map((e) => ({type:e.type,x:e.x,y:e.y}))});
    let t = L.parseLevel(levels[n-1]); const events = [];
    for (const a of proof.path) { const r=L.act(t,parseAction(a)); t=r.state; events.push(...r.events.filter((e) => /^(fx:jet|break|crack|kill|splash|fx:freeze)/.test(e))); }
    commitments.push(events.sort().join('|'));
    console.log(`ok strategy ${n}: ${proof.name}, ${s.steps} turns`);
  }
  if (designs[n].style === 'alternatives') {
    assert.strictEqual(variants.length,2);
    assert.notStrictEqual(commitments[0],commitments[1],'Different walking orders alone do not qualify');
    if (n === '34') { assert(commitments[0].includes('fx:jet:7,3')); assert(commitments[1].includes('fx:jet:10,12')); }
    if (n === '36') { assert(commitments[0].includes('break:11,7')); assert(commitments[1].includes('splash:13,7')); }
    if (n === '38') {
      assert(commitments[0].includes('fx:freeze')); assert(!commitments[1].includes('fx:freeze'));
      assert(replay(38,variants[1]).crates.includes(2*levels[37].map[0].length+6));
    }
    if (n === '40') {
      assert(commitments[0].includes('fx:jet:9,5')); assert(commitments[0].includes('fx:freeze'));
      assert(commitments[1].includes('fx:jet:6,10')); assert(!commitments[1].includes('fx:freeze'));
      assert(replay(40,variants[1]).crates.includes(4*levels[39].map[0].length+16));
    }
  }
}
{
  const p=checkpoint(31,'last-red'); p.go(13,6); assert.strictEqual(p.s.keys.r,0);
  cut(31,'spend the final red on the outer cupboard',p.s,[9,10]);
  const q=checkpoint(31,'initial-key'); q.go(3,9).go(5,5).fire('j','right');
  impossible(31,'breach the blue-room seam instead',q.s);
}
{
  const p=checkpoint(32,'ice-stop'); p.go(2,7).go(8,6).fire('m','up');
  assert.strictEqual(p.s.crates.length,0); cut(32,'blast the ice stop',p.s,[15,4]);
  const q=checkpoint(32,'ice-stop'); q.go(7,4).act('right').find((s) => !s.crates.length);
  impossible(32,'consume the crate before the branch',q.s);
}
{
  const p=checkpoint(33,'first-crossing'); p.go(7,2).fire('m','up');
  impossible(33,'waste a shot after the first crossing',p.s);
  const q=checkpoint(33,'second-crossing'); q.go(13,2);
  impossible(33,'cross the second bridge without the jetpack',q.s);
  const r=new Plan(33,'leave-tools'); r.go(3,2).go(3,5).go(2,5).go(5,5).go(5,2).go(7,2);
  assert.strictEqual(r.s.powers.m,0);
  cut(33,'cross the first bridge without tools',r.s,[1,9]);
}
{
  const p=new Plan(34,'wrong-blue'); p.go(9,7).go(10,7).go(9,6).go(7,5).go(3,3).go(2,7);
  cut(34,'spend blue on the archive door',p.s,[20,7]);
  const q=new Plan(36,'wasted-shots'); q.go(5,6).go(6,6).go(7,6).go(5,7).fire('j','left').go(5,5).fire('m','up').fire('m');
  assert.strictEqual(q.s.powers.j,0); assert.strictEqual(q.s.powers.m,1);
  cut(36,'waste two shots after jetpacking west',q.s,[8,2]);
}
{
  const p=checkpoint(35,'spare-before-thief'); p.go(2,6).go(10,4);
  assert.strictEqual(p.s.boots.u,0); assert(!Object.values(p.s.items).includes('u'));
  impossible(35,'collect both boot pairs before theft',p.s);
  const q=new Plan(35,'wrong-red'); q.go(6,5).go(2,6);
  cut(35,'spend the first red on the spare cupboard',q.s,[2,2]);
}
{
  const p=checkpoint(37,'key-choice'); p.go(9,4).fire('j','right');
  cut(37,'use the only jetpack beside the hall door',p.s,[8,10]);
  p.go(15,3).go(9,4);
  let s=p.s; for(let k=0;k<30;k++) s=L.act(s,null).state;
  assert.strictEqual(s.status,'dead','The unsafe opening must admit pursuit');
  const q=checkpoint(37,'safe-gate'); q.go(9,4);
  s=q.s; for(let k=0;k<40;k++) s=L.act(s,null).state;
  assert.strictEqual(s.status,'play','The gate must preserve the observation point');
  report.branches.push({level:37,mistake:'breach instead of the enemy gate',proof:'same observation point dies with breach and survives forty turns behind gate'});
}
{
  const p=checkpoint(38,'freeze'); p.go(6,4).fire('m','down').go(6,3,(s) => s.facing==='up' && s.enemies.some((e) => e.x===6&&e.y===2)).fire('m','up');
  assert.strictEqual(p.s.crates.length,0); assert.strictEqual(p.s.enemies.length,0);
  cut(38,'destroy both possible plate operators',p.s,[15,8]);
  const q=checkpoint(38,'freeze'); q.go(9,4,(s) => !s.enemies.some((e) => e.x===6&&e.y===2)).fire('z').go(11,8);
  assert.strictEqual(q.s.grid[q.s.player.y*q.s.w+q.s.player.x],'J');
  let s=q.s; const at={...s.player}; for(let k=0;k<4;k++) s=L.act(s,'right').state;
  assert.deepStrictEqual(s.player,at,'Off-plate freeze must not release the trap during the frozen window');
  report.branches.push({level:38,mistake:'freeze off the plate',proof:'trap holds during freeze; crate alternative remains available'});
}
{
  const p=checkpoint(39,'weighted'); p.go(12,6).go(11,8).fire('m','left').fire('m').go(9,8).go(11,3).go(11,4).go(12,4).act('right');
  assert(p.s.crates.includes(4*p.s.w+14)); assert.strictEqual(p.s.grid[5*p.s.w+14],'W');
  impossible(39,'recover the crate before the permanent bypass',p.s);
  const q=checkpoint(39,'weighted'); q.go(12,6).go(12,3).go(14,4).fire('m','left');
  assert.strictEqual(q.s.crates.length,0); cut(39,'destroy the weighted bridge crate',q.s,[14,10]);
}
{
  const p=checkpoint(40,'freeze'); p.go(16,7).fire('m','up').go(16,5,(s) => s.facing==='up' && s.enemies.some((e) => e.x===16&&e.y===4)).fire('m','up');
  assert.strictEqual(p.s.crates.length,0); assert.strictEqual(p.s.enemies.length,0);
  cut(40,'destroy both operators before opening the east wing',p.s,[21,7]);
}
for(const n of [37,38,40]) {
  const p=proofs[n][0], marker=n===37?'chase':'freeze';
  const index=p.checkpoints[marker]+(marker==='freeze'?1:0);
  const s=replay(n,p,p.path.length,index,4); assert.strictEqual(s.status,'won');
  report.margins.push({level:n,strategy:p.name,extraTurns:4,checkpoint:marker});
  console.log(`ok reaction margin ${n}: four extra turns at ${marker}`);
}
fs.mkdirSync(path.join(__dirname,'..','.cache','qa'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'..','.cache','qa','pack1-decisions.json'),JSON.stringify(report,null,2));
console.log(`Verified ${report.strategies.length} complete strategies, ${report.branches.length} branch consequences and ${report.margins.length} reaction margins`);
