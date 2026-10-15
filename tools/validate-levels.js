'use strict';
const assert = require('assert');
const Core = require('../core.js');
function selectLevels(args, count) {
  if (!args.length) return Array.from({ length: count }, (_, i) => i);
  const selected = new Set();
  for (const part of args.flatMap((s) => s.split(','))) {
    assert(/^\d+(?:-\d+)?$/.test(part), `Invalid level range: ${part}`);
    const [a, b = a] = part.split('-').map(Number);
    assert(a >= 1 && b >= a && b <= count, `Level range outside campaign: ${part}`);
    for (let n = a; n <= b; n++) selected.add(n - 1);
  }
  return [...selected].sort((a, b) => a - b);
}
function validateLevel(def) {
  assert(def.map.length >= 3 && def.map.every((row) => row.length === def.map[0].length), `${def.name}: map must be rectangular`);
  assert.strictEqual(def.map.join('').split('@').length - 1, 1, `${def.name}: one start required`);
  assert.strictEqual(def.map.join('').split('E').length - 1, 1, `${def.name}: one exit required`);
  const s = Core.parseLevel(def);
  assert(s.chipsTotal > 0, `${def.name}: chips required`);
  assert(Number.isInteger(def.par) && def.par >= 0, `${def.name}: invalid par`);
  for (const [field, tile] of [['hints', '?'], ['facing', null], ['clones', 'C']]) {
    for (const [coord, value] of Object.entries(def[field] || {})) {
      assert(/^\d+,\d+$/.test(coord), `${def.name}: invalid ${field} coordinate`);
      const [x, y] = coord.split(',').map(Number);
      const ch = def.map[y]?.[x];
      assert(ch !== undefined && (tile ? ch === tile : 'SDUVQPAXZeM'.includes(ch)), `${def.name}: misplaced ${field} at ${coord}`);
      if (field === 'facing') assert(Core.DIRS[value], `${def.name}: invalid facing`);
      if (field === 'clones') assert('SDUVQPAXZeM'.includes(value[0]) && Core.DIRS[value[1]], `${def.name}: invalid clone`);
      if (field === 'hints') assert(typeof value === 'string' && value.length > 0, `${def.name}: empty hint`);
    }
  }
  for (const goal of def.route || []) {
    assert(/^@?\d+,\d+$/.test(goal), `${def.name}: invalid route waypoint`);
    const [x, y] = goal.replace('@', '').split(',').map(Number);
    assert(x >= 0 && x < s.w && y >= 0 && y < s.h, `${def.name}: route outside map`);
    if (!goal.startsWith('@')) assert(s.items[y * s.w + x], `${def.name}: route has no item at ${goal}`);
  }
  return s;
}
if (require.main === module) {
  const levels = require('../levels.js');
  assert.strictEqual(new Set(levels.map((d) => d.name)).size, levels.length, 'Duplicate level names would collide in saves');
  levels.forEach(validateLevel);
  console.log(`Validated ${levels.length} maps`);
}
module.exports = { selectLevels, validateLevel };
