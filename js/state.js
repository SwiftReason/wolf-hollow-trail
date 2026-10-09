// Game state: creation, queries, save slots, journal, graves, high scores.
// The whole game lives in one plain object (G) so it serializes to localStorage as-is.

const Q = {
  role(id) { return DATA.roles.find(r => r.id === id); },
  alive(G) { return G.crew.filter(c => c.alive); },
  count(G, role) { return G.crew.filter(c => c.alive && c.role === role).length; },
  roleCounts(G) {
    const o = {};
    for (const c of Q.alive(G)) o[c.role] = (o[c.role] || 0) + 1;
    return o;
  },
  // Multiplicative perk across living crew (1 if nobody has it).
  perk(G, key) {
    let v = 1;
    for (const c of Q.alive(G)) { const p = Q.role(c.role).perks[key]; if (p !== undefined) v *= p; }
    return v;
  },
  // Additive perk across living crew (0 if nobody has it).
  perkSum(G, key) {
    let v = 0;
    for (const c of Q.alive(G)) { const p = Q.role(c.role).perks[key]; if (p !== undefined) v += p; }
    return v;
  },

  // ------------------------------------------------- trip length and route
  total(G) { return (G && G.total) || DATA.config.totalBlocks; },
  scale(G) { return Q.total(G) / DATA.config.totalBlocks; },
  // A landmark with its block scaled to this trip, plus its index.
  landmark(G, i) {
    const lm = DATA.landmarks[i];
    return lm && { ...lm, block: Math.round(lm.block * Q.scale(G)), index: i };
  },
  next(G) { return Q.landmark(G, G.lm); },
  diff(G) { return DATA.config.difficulties[(G && G.diff) || 'normal']; },

  date(G) { return new Date(G.year, G.month, 1 + G.day); },
  monthName(G) { return DATA.weather.months[Q.date(G).getMonth()].name; },
  dateStr(G) {
    const d = Q.date(G);
    return `${DATA.weather.months[d.getMonth()].name} ${d.getDate()}, ${d.getFullYear()}`;
  },
  season(G) {
    const m = Q.date(G).getMonth();
    return [11, 0, 1].includes(m) ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'fall';
  },

  status(h) { return h >= 70 ? 'good' : h >= 45 ? 'fair' : h >= 20 ? 'poor' : 'very poor'; },
  avgHealth(G) {
    const a = Q.alive(G);
    return a.length ? a.reduce((s, c) => s + c.health, 0) / a.length : 0;
  },
  groupHealth(G) { return Q.alive(G).length ? Q.status(Q.avgHealth(G)) : 'dead'; },

  hashrate(G) { // PH/s
    return G.fleet.online * DATA.config.thPerMiner * DATA.config.tuning[G.tuning].hash / 1000;
  },
  broken(G) { return Object.values(G.fleet.broken).reduce((a, b) => a + b, 0); },

  // Difficulty relative to the start of the trip: "+12%"
  difficulty(G) {
    const pct = Math.round((G.difficulty - 1) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}%`;
  },

  // "1 spare PSU", "12 spare PSUs"
  amount(key, n) {
    const s = DATA.supplies[key];
    return `${U.num(n)} ${n === 1 ? s.one : s.noun}`;
  },

  shortages(G) {
    const S = DATA.config.short, s = G.s, n = Q.alive(G).length;
    return {
      food: s.food < n * DATA.config.rationsPerPerson * S.foodDays,
      ppe: s.ppe < n,
      zipties: s.zipties < S.zipties,
      dielectric: s.dielectric < S.dielectric,
      glycol: s.glycol < S.glycol,
      hoses: s.hoses < S.hoses,
      hashboards: s.hashboards < S.parts,
      psus: s.psus < S.parts,
      fans: s.fans < S.parts,
      boards: s.boards < S.parts,
    };
  },

  over(G) { return !Q.alive(G).length || G.fleet.online <= 0; },
};

function newGame({ role, names, roles, month, length = 'normal', diff = 'normal', slot = 1 }) {
  const C = DATA.config;
  const G = {
    v: 2,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    slot, length, diff, total: C.lengths[length].blocks,
    role, year: C.year, month, day: 0,
    crew: names.map((name, i) => ({
      name, role: roles[i], health: 100, alive: true, ailments: [],
      cause: null, escalated: false, epitaph: '',
    })),
    sats: Math.round(Q.role(role).sats * C.difficulties[diff].sats / 1000) * 1000,
    s: Object.fromEntries(Object.keys(DATA.supplies).map(k => [k, 0])),
    fleet: { online: C.startMiners, broken: { hashboards: 0, psus: 0, fans: 0, boards: 0 } },
    tuning: 'stock', shift: 10,
    blocks: 0, lm: 1, zone: DATA.landmarks[0].zone,
    difficulty: 1, morale: C.startMorale,
    outOf: {}, phase: 'store', atLandmark: null,
    stats: { failures: 0, benchRepairs: 0, deaths: 0 },
    journal: [],
    weather: null,
  };
  G.weather = Sim.rollWeather(G);
  return G;
}

// --------------------------------------------------------------- journal
// A running log of what happened, readable from the trail and at the end.
const Journal = {
  add(G, text) {
    if (!G || !text) return;
    (G.journal = G.journal || []).push({ d: Q.dateStr(G), t: String(text) });
    if (G.journal.length > 400) G.journal.shift();
  },
};

// ------------------------------------------------------------ save slots
const Save = {
  SLOTS: 3,
  key(slot) { return `wht.save.${slot}`; },
  // Older versions had a single save; it becomes slot 1.
  migrate() {
    const old = Persist.get('wht.save.v1', null);
    if (old && !Persist.get(Save.key(1), null)) Persist.set(Save.key(1), { ...old, slot: 1 });
    Persist.del('wht.save.v1');
  },
  load(slot) {
    const G = Persist.get(Save.key(slot), null);
    if (G) { G.slot = slot; Save.upgrade(G); }
    return G;
  },
  // Version 1 saves predate The North Forty, which shifted landmark indexes.
  upgrade(G) {
    if ((G.v || 1) >= 2) return;
    const old = ['wolf_hollow', 'substation', 'hot_aisle', 'immersion_lake', 'hydro_pass', 'ercot_peak',
      'difficulty_adj', 'mempool_swamp', 'loading_dock', 'halving'];
    const byId = id => DATA.landmarks.findIndex(l => l.id === id);
    if (G.atLandmark != null) G.atLandmark = byId(old[G.atLandmark]);
    const after = DATA.landmarks.findIndex((l, i) => i > 0 && l.block > G.blocks);
    G.lm = G.atLandmark != null ? G.atLandmark + 1 : Math.max(1, after);
    G.journal = G.journal || [];
    G.v = 2;
  },
  write(G) { Persist.set(Save.key(G.slot || 1), G); },
  clear(slotOrG) { Persist.del(Save.key(typeof slotOrG === 'object' ? slotOrG.slot || 1 : slotOrG)); },
  list() {
    const out = [];
    for (let s = 1; s <= Save.SLOTS; s++) out.push({ slot: s, G: Persist.get(Save.key(s), null) });
    return out;
  },
  any() { return Save.list().some(x => x.G); },
};

// ----------------------------------------------------------------- graves
// Tombstones persist across games. You pass old ones on later runs. Their
// spot is stored as a fraction of the trail so it works for any trip length.
const Graves = {
  all() { return Persist.get('wht.graves', []); },
  add(g) {
    const a = Graves.all();
    a.push(g);
    while (a.length > 40) a.shift();
    Persist.set('wht.graves', a);
  },
  frac(g) { return g.frac ?? g.block / DATA.config.totalBlocks; },
  between(G, from, to) {
    const T = Q.total(G);
    return Graves.all().filter(g => g.game !== G.id && Graves.frac(g) > from / T && Graves.frac(g) <= to / T).slice(0, 1);
  },
  clear() { Persist.del('wht.graves'); },
};

const Scores = {
  all() {
    const s = Persist.get('wht.scores', null);
    return s || DATA.config.defaultScores.map(x => ({ ...x, role: '' }));
  },
  qualifies(score) {
    const a = Scores.all();
    return a.length < 10 || score > a[a.length - 1].score;
  },
  add(entry) {
    const a = Scores.all();
    a.push(entry);
    a.sort((x, y) => y.score - x.score);
    Persist.set('wht.scores', a.slice(0, 10));
  },
  rating(score) { return DATA.config.ratings.find(r => score >= r.min).label; },
  clear() { Persist.del('wht.scores'); },
};
