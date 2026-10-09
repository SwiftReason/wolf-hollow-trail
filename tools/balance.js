// Headless balance check. Plays many games with a scripted player and prints
// win rates, deaths, trip length, and where the score comes from.
//
//   node tools/balance.js [role] [startMonth] [strategy] [games]
//   node tools/balance.js tech 5 careful 400
//   node tools/balance.js all            (every role, June start)
//
// role: manager | electrician | maintenance | inventory | tech | all
// startMonth: 0-11 (5 = June)
// strategy: careful    stock tuning, 10 hr shifts, rests when sick, safe choices
//           aggressive overclocked, 12 hr shifts, otherwise careful
//           hoard      careful, but never buys extra miners (sits on sats)
//           reckless   overclocked, 12 hr shifts, never rests, always gambles
//           Add /tuning/shift to override settings, e.g. careful/overclocked/10.
//           Tuning "smart" overclocks except in the air zone at 90F or hotter.
//
// It runs the real game logic (sim, events, decisions, scoring). Only the
// player is scripted, and RMA salvage is approximated since it's a skill game.

const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
global.window = global;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
for (const f of [
  'data/config.js', 'data/roles.js', 'data/store.js', 'data/weather.js', 'data/deaths.js',
  'data/events.js', 'data/landmarks.js', 'data/crossings.js', 'data/salvage.js',
  'js/util.js', 'js/state.js', 'js/sim.js', 'js/engine.js', 'js/decisions.js', 'js/screens/score.js',
]) vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });

// Try config changes without editing files:
//   CFG='{"shifts":{"12":{"speed":1.25}}}' node tools/balance.js manager
(function merge(dst, src) {
  for (const k in src) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) merge(dst[k] = dst[k] || {}, src[k]);
    else dst[k] = src[k];
  }
})(DATA.config, JSON.parse(process.env.CFG || '{}'));

const ROLES = DATA.roles.map(r => r.id);
const [argRole = 'all', argMonth = '5', strategyArg = 'careful', argGames = '400'] = process.argv.slice(2);
const [strategy, tuneArg, shiftArg] = strategyArg.split('/');
const N = parseInt(argGames, 10);
const reckless = strategy === 'reckless';
const fast = reckless || strategy === 'aggressive';
const hoard = strategy === 'hoard';

// ------------------------------------------------------------- the player
function price(G, id, lm) {
  return Math.round(DATA.store.items[id].price * ((lm && lm.priceMult) || 1) * Q.perk(G, 'priceMult') / 100) * 100;
}
function buy(G, id, n, lm) {
  const it = DATA.store.items[id], p = price(G, id, lm);
  n = Math.max(0, Math.min(n, Math.floor(G.sats / p)));
  if (id === 'miners') n = Math.min(n, Math.floor((DATA.config.slots - G.fleet.online - Q.broken(G)) / 20));
  G.sats -= n * p;
  for (const k in it.gives) {
    if (k === 'miners') G.fleet.online += it.gives[k] * n;
    else G.s[k] += it.gives[k] * n;
  }
}
function topUp(G, id, target, lm) {
  const per = Object.values(DATA.store.items[id].gives)[0];
  if (G.s[id] < target) buy(G, id, Math.ceil((target - G.s[id]) / per), lm);
}

// Plan supplies to reach the next store, including coolant for each zone
// along the way and fluid for any drain-and-refill crossing.
function shop(G, lm, first) {
  const L = DATA.landmarks, C = DATA.config;
  const nextIdx = L.findIndex((l, i) => i >= G.lm && (l.store || l.type === 'end'));
  const bpd = Sim.blocksPerDay(G);
  const observed = G.blocks > 50 ? G.day / G.blocks : 0;   // days per block so far, rests included
  const days = b => b * Math.max(1.35 / bpd, observed * 1.15) + 4;
  const fluid = { dielectric: 0, glycol: 0 };
  const here = DATA.crossings[lm.id];   // a crossing at this stop happens after shopping
  if (here && lm.zone !== G.zone) fluid[here.fluid] += here.fluidNeed;
  let zone = lm.zone || G.zone, at = G.blocks;
  for (let i = G.lm; i <= nextIdx; i++) {
    const z = C.zones[zone];
    if (z.fluid) fluid[z.fluid] += days(L[i].block - at) * z.use;
    const X = DATA.crossings[L[i].id];
    if (X && i < nextIdx) fluid[X.fluid] += X.fluidNeed;
    if (L[i].zone) zone = L[i].zone;
    at = L[i].block;
  }
  if (first && !hoard) buy(G, 'miners', Math.floor((G.sats - 3500000) / 400000 * 0.6), lm);
  const alive = Q.alive(G).length;
  topUp(G, 'food', alive * C.rationsPerPerson * days(L[nextIdx].block - G.blocks), lm);
  topUp(G, 'ppe', alive, lm);
  topUp(G, 'zipties', 150, lm);
  topUp(G, 'dielectric', fluid.dielectric, lm);
  topUp(G, 'glycol', fluid.glycol, lm);
  for (const [k, t] of [['hashboards', 12], ['psus', 8], ['fans', G.zone === 'air' ? 6 : 0], ['boards', 4], ['hoses', 3]]) topUp(G, k, t, lm);
  if (!reckless && !hoard) buy(G, 'miners', Math.floor((G.sats - 2000000) / 400000 * 0.5), lm);
  Sim.repair(G);
}

// -------------------------------------------------------------- one game
function runDay(G, opts, st) {
  const r = Sim.day(G, opts);
  st.deaths.push(...r.deaths.map(i => G.crew[i].cause));
  if (r.event) {
    const o = Engine.apply(G, r.event);
    st.deaths.push(...o.deaths.map(i => G.crew[i].cause));
    for (let d = 0; d < o.days && !Q.over(G); d++) runDay(G, { noProgress: true, noEvents: true }, st);
  }
  return r;
}

function passDays(G, n, st) {
  for (let d = 0; d < n && !Q.over(G); d++) runDay(G, { noProgress: true, noEvents: true }, st);
}

function crossing(G, lm, st) {
  const C = DATA.crossings[lm.id];
  let base = Decide.crossingRoll(C);
  let method;
  for (let waits = 0; ; waits++) {
    const r = Decide.crossingReading(C, G, base);
    const price = Decide.ferryPrice(G, C);
    if (reckless) method = 'ford';
    else if (G.s[C.fluid] >= C.fluidNeed) method = 'caulk';
    else if (G.sats >= price + 1000000) method = 'ferry';
    else if (r.sev > 0.7 && waits < 2) { runDay(G, { noProgress: true }, st); base = Decide.crossingRoll(C, base); continue; }
    else method = 'ford';
    if (method === 'ferry') {
      G.sats -= price;
      passDays(G, U.ri(C.ferry.days[0], C.ferry.days[1]), st);
    }
    const o = Decide.crossing(G, lm, method, r.sev);
    st.crossings[method] = (st.crossings[method] || 0) + 1;
    st.deaths.push(...o.deaths.map(i => G.crew[i].cause));
    st.crossingDeaths += o.deaths.length;
    passDays(G, o.days, st);
    return;
  }
}

function salvage(G) {
  const S = DATA.salvage;
  G.salvages = G.salvages || [];
  const recent = G.salvages.filter(b => G.blocks - b < S.recentBlocks).length;
  const good = Math.max(0.2, S.goodRatio - S.pickedOver * recent);
  const grabs = Math.min(U.ri(10, 18), Math.floor(G.s.zipties / S.tieCost));
  const got = Math.min(Math.round(S.carry * Q.perk(G, 'salvage')), Math.round(grabs * good));
  G.s.zipties -= grabs * S.tieCost;
  const hb = Math.round(got * 0.55);
  G.s.hashboards += hb;
  G.s.psus += got - hb;
  G.salvages.push(G.blocks);
  Sim.repair(G);
}

function play(role, month) {
  const crewRoles = [role, ...ROLES.filter(r => r !== role)];
  const G = newGame({ role, names: ['A', 'B', 'C', 'D', 'E'], roles: crewRoles, month });
  if (fast) { G.tuning = 'overclocked'; G.shift = 12; }
  const smart = tuneArg === 'smart';
  if (tuneArg && !smart) G.tuning = tuneArg;
  if (shiftArg) G.shift = parseInt(shiftArg, 10);
  const st = { deaths: [], crossings: {}, crossingDeaths: 0, salvages: 0 };
  shop(G, DATA.landmarks[0], true);
  let result = null;
  while (!result) {
    if (smart) G.tuning = G.zone === 'air' && G.weather.temp >= 90 ? 'stock' : 'overclocked';
    const r = runDay(G, {}, st);
    if (!reckless && Q.avgHealth(G) < 45) for (let d = 0; d < 3; d++) runDay(G, { rest: true }, st);
    if (!Q.over(G) && G.s.hashboards + G.s.psus < 4 && G.s.zipties >= 40 &&
        !(G.salvages || []).some(b => G.blocks - b < DATA.salvage.recentBlocks)) {
      salvage(G); st.salvages++; runDay(G, { noProgress: true, noEvents: true }, st);
    }
    if (Q.over(G)) { result = Q.alive(G).length ? 'dark' : 'wiped'; break; }
    if (r.arrived) {
      const lm = r.arrived;
      G.lm = DATA.landmarks.indexOf(lm) + 1;
      if (lm.type === 'end') { result = 'win'; break; }
      if (lm.type === 'difficulty') G.difficulty *= 1 + U.ri(-3, 9) / 100;
      if (lm.zone && lm.type !== 'crossing') G.zone = lm.zone;
      if (lm.type === 'ercot') {
        const ch = Decide.ercotRoll(G);
        const curtail = reckless ? false : !Q.count(G, 'electrician') || ch.guess >= 35;
        const o = Decide.ercot(G, ch, curtail);
        passDays(G, o.days, st);
        st.ercot = ch.is4cp && !curtail ? 'paid' : 'ok';
      }
      if (lm.type === 'mempool') Decide.mempool(G, Decide.mempoolRoll().fee, reckless);
      if (Q.over(G)) { result = Q.alive(G).length ? 'dark' : 'wiped'; break; }
      if (lm.store) shop(G, lm, false);
      if (lm.type === 'crossing' && lm.zone !== G.zone) crossing(G, lm, st);   // on the way out
      if (Q.over(G)) { result = Q.alive(G).length ? 'dark' : 'wiped'; break; }
    }
    if (G.day > 700) result = 'timeout';
  }
  return { G, result, st };
}

// --------------------------------------------------------------- report
function report(role, month) {
  const agg = { win: 0, wiped: 0, dark: 0, timeout: 0, deaths: 0, days: 0, score: 0, crossingDeaths: 0, ercotPaid: 0, salvages: 0, burnouts: 0, difficulty: 0, miners: 0 };
  const causes = {}, parts = {}, methods = {};
  let wins = 0;
  for (let g = 0; g < N; g++) {
    const { G, result, st } = play(role, month);
    agg[result]++;
    agg.deaths += st.deaths.length;
    agg.crossingDeaths += st.crossingDeaths;
    agg.salvages += st.salvages;
    if (st.ercot === 'paid') agg.ercotPaid++;
    for (const m in st.crossings) methods[m] = (methods[m] || 0) + st.crossings[m];
    for (const c of st.deaths) { const k = c.replace(/^\S+ /, ''); causes[k] = (causes[k] || 0) + 1; }
    if (result === 'win') {
      wins++;
      agg.days += G.day;
      agg.burnouts += G.stats.burnouts || 0;
      agg.difficulty += G.difficulty;
      agg.miners += G.fleet.online;
      const s = Score.compute(G);
      agg.score += s.total;
      for (const [label, p] of s.rows) {
        const k = label.replace(/^[\d,]+ /, '').replace(/^in /, 'health: ');
        parts[k] = (parts[k] || 0) + p * s.mult;
      }
    }
  }
  const pct = n => `${Math.round(n / N * 100)}%`;
  console.log(`\n=== ${Q.role(role).name}, start ${DATA.weather.months[month].name}, ${strategyArg}, ${N} games ===`);
  console.log(`win ${pct(agg.win)}  everyone dead ${pct(agg.wiped)}  hashrate zero ${pct(agg.dark)}  timeout ${pct(agg.timeout)}`);
  console.log(`deaths/game ${(agg.deaths / N).toFixed(2)} (crossings ${(agg.crossingDeaths / N).toFixed(2)})  ` +
    `days/win ${wins ? Math.round(agg.days / wins) : '-'}  ERCOT paid ${pct(agg.ercotPaid)}  salvages/game ${(agg.salvages / N).toFixed(1)}`);
  console.log(`crossings: ${Object.entries(methods).map(([m, n]) => `${m} ${pct(n / 2)}`).join(', ')}`);
  if (wins) {
    const avg = agg.score / wins;
    console.log(`wins end with: ${Math.round(agg.miners / wins)} miners online, ${(agg.burnouts / wins).toFixed(0)} burned out, ` +
      `difficulty +${Math.round((agg.difficulty / wins - 1) * 100)}%`);
    console.log(`avg score ${Math.round(avg)}  (${Scores.rating(avg)})  from: ` +
      Object.entries(parts).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([k, v]) => `${k} ${Math.round(v / agg.score * 100)}%`).join(', '));
  }
  console.log('top causes of death per game: ' + Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([k, v]) => `${(v / N).toFixed(2)} ${k.slice(0, 40)}`).join(' | '));
}

const month = parseInt(argMonth, 10);
for (const role of argRole === 'all' ? ROLES : [argRole]) report(role, month);
