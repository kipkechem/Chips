'use strict';
const assert = require('assert');
const Campaign = require('../campaign.js');
const levels = Array.from({ length: 100 }, (_, i) => ({ name: `Level ${i + 1}`, revision: 1 }));
function storage(seed = {}) {
  const data = JSON.parse(JSON.stringify(seed));
  return { get: (k) => data[k], set: (k, v) => { data[k] = JSON.parse(JSON.stringify(v)); }, data };
}
const tests = [
  ['fresh campaign unlocks only the first level', () => {
    const c = Campaign.create(levels, storage());
    assert(c.unlocked(0)); assert(!c.unlocked(1)); assert(!c.unlocked(99));
    assert(!c.unlocked(-1)); assert(!c.unlocked(100)); assert(!c.unlocked(0.5));
    assert.strictEqual(c.next(), 0);
    assert(!c.record(1, 20));
  }],
  ['every completion unlocks the next level through 100', () => {
    const store = storage(); const c = Campaign.create(levels, store);
    for (let i = 0; i < 100; i++) { assert(c.unlocked(i)); assert(c.record(i, 100)); }
    assert.strictEqual(c.next(), 99);
    c.record(99, 120); assert.strictEqual(c.bestTime(99), 100);
    c.record(99, 90); assert.strictEqual(c.bestTime(99), 90);
    assert.strictEqual(Campaign.create(levels, store).bestTime(99), 90);
  }],
  ['Build 20 times migrate and survive repeated loads', () => {
    const store = storage(Object.fromEntries(levels.slice(0, 37).map((l) => [`lockstep:best:${l.name}`, { steps: 42 }])));
    let c = Campaign.create(levels, store);
    assert.strictEqual(c.next(), 37); assert(c.unlocked(37)); assert(!c.unlocked(38));
    c = Campaign.create(levels, store); assert.strictEqual(c.bestTime(36), 42);
  }],
  ['completion gaps lock later clears without losing them', () => {
    const store = storage({ 'lockstep:best:Level 3': { steps: 80 } });
    const c = Campaign.create(levels, store);
    assert(c.cleared(2)); assert(!c.unlocked(2)); assert.strictEqual(c.bestTime(2), 80);
    c.record(0, 10); assert(!c.unlocked(2)); c.record(1, 20);
    assert(c.unlocked(3)); assert.strictEqual(c.next(), 3);
  }],
  ['revised levels keep clears and reset only obsolete times', () => {
    const revised = levels.map((l) => ({ ...l })); revised[0].revision = 2;
    const store = storage({ 'lockstep:best:Level 1': { steps: 42 } });
    let c = Campaign.create(revised, store);
    assert(c.cleared(0)); assert(c.unlocked(1)); assert.strictEqual(c.bestTime(0), null);
    c.record(0, 60); c = Campaign.create(revised, store); assert.strictEqual(c.bestTime(0), 60);
    revised[0].revision = 3; c = Campaign.create(revised, store);
    assert(c.cleared(0)); assert.strictEqual(c.bestTime(0), null);
  }],
  ['malformed saves do not grant completion or poison scores', () => {
    const store = storage({ 'lockstep:best:Level 1': { steps: -1 }, 'lockstep:progress:Level 2': { steps: '5', cleared: 'yes' } });
    const c = Campaign.create(levels, store);
    assert.strictEqual(c.next(), 0); assert(!c.cleared(1));
    for (const value of [0, -1, NaN, Infinity, '20']) assert(!c.record(0, value));
  }],
];
for (const [name, test] of tests) { test(); console.log(`ok ${name}`); }
console.log(`${tests.length} campaign tests passed`);
