// Game state: creation, queries, save/load, graves, high scores.
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
  next(G) { return DATA.landmarks[G.lm]; },
};

function newGame({ role, names, roles, month }) {
  const C = DATA.config;
  const G = {
    v: 1,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    role, year: C.year, month, day: 0,
    crew: names.map((name, i) => ({
      name, role: roles[i], health: 100, alive: true, ailments: [],
      cause: null, escalated: false, epitaph: '',
    })),
    sats: Q.role(role).sats,
    s: Object.fromEntries(Object.keys(DATA.supplies).map(k => [k, 0])),
    fleet: { online: C.startMiners, broken: { hashboards: 0, psus: 0, fans: 0, boards: 0 } },
    tuning: 'stock', shift: 10,
    blocks: 0, lm: 1, zone: DATA.landmarks[0].zone,
    difficulty: 1, morale: C.startMorale,
    outOf: {}, phase: 'store', atLandmark: null,
    stats: { failures: 0, benchRepairs: 0, deaths: 0 },
    weather: null,
  };
  G.weather = Sim.rollWeather(G);
  return G;
}

const SAVE_KEY = 'wht.save.v1';
const Save = {
  exists() { return !!Persist.get(SAVE_KEY, null); },
  load() { return Persist.get(SAVE_KEY, null); },
  write(G) { Persist.set(SAVE_KEY, G); },
  clear() { Persist.del(SAVE_KEY); },
};

// Tombstones persist across games. You pass old ones on later runs.
const Graves = {
  all() { return Persist.get('wht.graves', []); },
  add(g) {
    const a = Graves.all();
    a.push(g);
    while (a.length > 40) a.shift();
    Persist.set('wht.graves', a);
  },
  between(from, to, gameId) {
    return Graves.all().filter(g => g.game !== gameId && g.block > from && g.block <= to).slice(0, 1);
  },
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
};
