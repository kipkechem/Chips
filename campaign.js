// Campaign progress is independent of timed records so revisions never erase a clear.
(function (root) {
  'use strict';
  const PACKS = [
    'Glass Mastery', 'Terrain Mastery', 'Pursuit Mastery', 'Machine Logic',
    'Scarcity Protocol', 'Systems Collision', 'Final Lockstep',
  ];
  const PACK_RULES = [
    'Contested keys, reusable crates, competing tool choices, and mechanisms powered by enemies.',
    'Master ice, conveyors, teleports, crates, elements, boots, and thieves.',
    'Plan escapes around spiders, gates, beat blocks, and predictable patrols.',
    'Connect buttons, toggle walls, traps, clone machines, tanks, and mimics.',
    'Spend keys and power-up charges in the right order.',
    'Combine terrain, machines, pursuit, tools, and off-screen memory.',
    'The final sequence brings every learned skill together.',
  ];
  const validTime = (v) => v && Number.isFinite(v.steps) && v.steps > 0;

  function create(levels, store) {
    const records = levels.map((def) => {
      const key = `lockstep:progress:${def.name}`;
      const revision = def.revision || 1;
      const saved = store.get(key);
      const legacy = store.get(`lockstep:best:${def.name}`);
      const record = { revision, cleared: false, steps: null };
      if (saved && typeof saved === 'object') {
        record.cleared = saved.cleared === true || validTime(saved);
        if (saved.revision === revision && validTime(saved)) record.steps = saved.steps;
      } else if (validTime(legacy)) {
        record.cleared = true;
        if (revision === 1) record.steps = legacy.steps;
      }
      store.set(key, record);
      return record;
    });
    const firstUncleared = () => records.findIndex((r) => !r.cleared);
    const unlocked = (i) => {
      const first = firstUncleared();
      return Number.isInteger(i) && i >= 0 && i < levels.length && (first < 0 || i <= first);
    };
    return {
      unlocked,
      cleared: (i) => !!records[i]?.cleared,
      bestTime: (i) => records[i]?.steps ?? null,
      next: () => { const first = firstUncleared(); return first < 0 ? levels.length - 1 : first; },
      blocker: () => firstUncleared(),
      record(i, steps) {
        if (!unlocked(i) || !Number.isFinite(steps) || steps <= 0) return false;
        const r = records[i];
        r.cleared = true;
        r.steps = r.steps == null ? steps : Math.min(r.steps, steps);
        store.set(`lockstep:progress:${levels[i].name}`, { ...r });
        return true;
      },
    };
  }
  const api = { create, PACKS, PACK_RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LockstepCampaign = api;
})(this);
