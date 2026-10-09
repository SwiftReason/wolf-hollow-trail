// Outcome logic for the choice landmarks (crossings, ERCOT Peak, the Mempool
// Swamp). No UI here: the screens in js/screens/crossing.js and the balance
// simulator both call these, so the odds can't drift apart.
// Outcomes mutate G and return { lines, deaths, days, good }.

const Decide = {
  // ------------------------------------------------------------ crossings
  // The raw reading drifts day to day.
  crossingRoll(C, prev) {
    const v = U.ri(C.reading.min, C.reading.max);
    return prev == null ? v : Math.round(prev * 0.5 + v * 0.5);
  },

  // Heat and overclocking push the shown reading up. sev 0 = safe, 1 = danger.
  crossingReading(C, G, base) {
    const R = C.reading, span = R.danger - R.safe;
    let shown = base;
    if (G.weather.heat === 'veryhot') shown += Math.round(span * 0.2);
    else if (G.weather.heat === 'hot') shown += Math.round(span * 0.1);
    if (G.tuning === 'overclocked') shown += Math.round(span * 0.15);
    return { shown, sev: U.clamp((shown - R.safe) / span, 0, 1.2) };
  },

  ferryPrice(G, C) {
    return Math.round(C.ferry.price * Q.perk(G, 'priceMult') / 100) * 100;
  },

  // method: 'ford' (live), 'caulk' (drain/swap/refill), 'ferry' (contractor).
  // Fluid for 'caulk' is used here; the ferry is paid for up front by the caller.
  crossing(G, lm, method, sev, vars = {}) {
    const C = DATA.crossings[lm.id];
    const odds = Q.perk(G, 'crossingOdds');
    if (method === 'caulk') G.s[C.fluid] = Math.max(0, G.s[C.fluid] - C.fluidNeed);
    const pFail = { ford: 0.04 + 0.55 * sev, caulk: 0.03 + 0.2 * sev, ferry: 0.03 }[method] / odds;
    const failed = U.chance(pFail);
    const out = { lines: [], deaths: [], days: { ford: 1, caulk: 3, ferry: 0 }[method], good: !failed };
    G.zone = lm.zone;

    if (!failed) {
      out.lines.push(U.tmpl(C.success[method], { gal: C.fluidNeed, days: vars.days || 0 }));
      return out;
    }

    const f = G.fleet;
    const pct = method === 'ford' ? U.ri(4, 10) * (0.5 + sev) : method === 'caulk' ? U.ri(3, 7) : U.ri(1, 3);
    const n = Math.min(f.online, Math.max(1, Math.round(f.online * pct / 100)));
    f.online -= n;
    if (method !== 'ford') f.broken.hashboards += n;   // a live-swap loss is gone for good
    out.lines.push(U.tmpl(C.fail[method], { n }));

    if (method === 'ford') {
      const keys = ['hashboards', 'psus', 'fans', 'boards', 'food', 'zipties', 'ppe'].filter(k => G.s[k] > 0);
      for (let i = 0; i < 2 && keys.length; i++) {
        const key = keys.splice(U.ri(0, keys.length - 1), 1)[0];
        const lost = Math.max(1, Math.round(G.s[key] * U.ri(20, 50) / 100));
        G.s[key] -= lost;
        out.lines.push(U.tmpl(C.lost, { amount: Q.amount(key, lost) }));
      }
    }
    if (method === 'caulk') G.s[C.fluid] = Math.max(0, G.s[C.fluid] - 30);

    const pDeath = { ford: 0.35 * (0.5 + sev), caulk: 0.1, ferry: 0 }[method] / odds;
    if (U.chance(pDeath)) {
      const alive = G.crew.map((c, i) => i).filter(i => G.crew[i].alive);
      const i = U.pick(alive);
      Sim.kill(G, i, U.tmpl(U.pick(C.deaths), { name: G.crew[i].name }));
      out.deaths.push(i);
    }
    return out;
  },

  // ---------------------------------------------------------------- ERCOT
  // Everything about this peak is decided on arrival (and saved).
  ercotRoll(G) {
    const inSeason = DATA.ercot.season.includes(Q.date(G).getMonth());
    const p = inSeason ? U.ri(30, 75) / 100 : U.ri(2, 10) / 100;
    return {
      inSeason, p,
      load: inSeason ? U.ri(820, 895) * 100 : U.ri(560, 700) * 100,
      guess: U.clamp(Math.round(p * 100) + U.ri(-8, 8), 1, 99),
      is4cp: U.chance(p),
    };
  },

  ercot(G, ch, curtail) {
    const E = DATA.ercot;
    if (curtail) {
      const credit = U.ri(200, 450) * 1000;
      G.sats += credit;
      return {
        lines: [U.tmpl(E.curtail, { sats: credit }),
          !ch.inSeason ? E.offSeason : ch.is4cp ? E.curtailed4cp : E.curtailedNo4cp],
        deaths: [], days: 2, good: true,
      };
    }
    const odds = Q.perk(G, 'ercotOdds');
    const out = { lines: [], deaths: [], days: 0, good: !ch.is4cp };
    if (ch.is4cp) {
      const penalty = Math.round(Math.max(1500000, G.sats * 0.25) / odds / 1000) * 1000;
      G.sats = Math.max(0, G.sats - penalty);
      out.lines.push(U.tmpl(E.was4cp, { sats: penalty }));
    } else {
      out.lines.push(E.not4cp);
    }
    if (U.chance((ch.inSeason ? 0.35 : 0.1) / odds)) {
      const n = Math.min(G.fleet.online, U.ri(10, 30));
      G.fleet.online -= n;
      G.fleet.broken.psus += n;
      out.lines.push(U.tmpl(E.brownout, { n }));
    }
    return out;
  },

  // -------------------------------------------------------------- Mempool
  mempoolRoll() { return { fee: U.ri(250, 700), tx: U.ri(180, 420) * 1000 }; },

  // Overnight fee movement. Mutates ch; returns the message.
  mempoolDrift(ch) {
    const M = DATA.mempool, r = Math.random();
    if (r < 0.15) {
      ch.fee = U.ri(2, 12);
      ch.tx = U.ri(5, 30) * 1000;
      return M.crash;
    }
    if (r < 0.6) {
      ch.fee = Math.round(ch.fee * (1.1 + Math.random() * 0.5));
      ch.tx = Math.round(ch.tx * 1.2 / 1000) * 1000;
      return M.climb;
    }
    ch.fee = Math.max(2, Math.round(ch.fee * (0.6 + Math.random() * 0.3)));
    ch.tx = Math.round(ch.tx * 0.8 / 1000) * 1000;
    return M.fall;
  },

  mempoolPayout(G, fee, mult) {
    return Math.round(fee * 3000 * (G.fleet.online / DATA.config.slots) * mult / 1000) * 1000;
  },

  mempool(G, fee, push) {
    const M = DATA.mempool;
    const sats = Decide.mempoolPayout(G, fee, push ? 2 : 1);
    G.sats += sats;
    if (!push) return { lines: [U.tmpl(M.normal, { sats })], deaths: [], days: 0, good: true };
    const n = Math.max(0, Math.min(G.fleet.online - 1, Math.round(G.fleet.online * U.ri(2, 5) / 100)));
    G.fleet.online -= n;
    G.fleet.broken.hashboards += n;
    return { lines: [U.tmpl(M.push, { sats, n })], deaths: [], days: 0, good: true };
  },
};
