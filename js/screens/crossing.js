// Choice landmarks: cooling-zone migrations, ERCOT Peak, the Mempool Swamp.
// The odds and outcomes live in js/decisions.js; this file is the screens.
// Each run() returns an end state or null to carry on to the landmark menu.

// Pass `n` days without progress, showing anything that happens.
async function passDays(G, n, opts = { noEvents: true }) {
  for (let d = 0; d < n; d++) {
    const end = await Travel.process(G, Sim.day(G, { noProgress: true, ...opts }));
    if (end) return end;
  }
  return null;
}

// The decision is final: save so a reload can't re-roll it.
function commit(G) {
  G.pending = null;
  G.choice = {};
  Save.write(G);
}

function landmarkHead(G, lm) {
  return [UI.hi(UI.center(lm.name)), UI.center(Q.dateStr(G)), UI.rule()].join('\n');
}

// Show a Decide outcome, then any deaths, then the days it took.
async function showOutcome(G, lm, o) {
  commit(G);
  o.good ? Sound.good() : Sound.bad();
  await UI.pause(landmarkHead(G, lm) + '\n' + o.lines.map(UI.t).join('\n\n'));
  for (const i of o.deaths) await Death.announce(G, i);
  if (Q.over(G)) return Death.gameOver(G);
  return passDays(G, o.days);
}

const Crossing = {
  risk(sev) { return sev < 0.2 ? 'low' : sev < 0.6 ? 'moderate' : sev < 1 ? 'high' : 'very high'; },

  async run(G, lm) {
    const C = DATA.crossings[lm.id];
    if (!C || lm.zone === G.zone) return null;
    const ch = G.choice;
    if (ch.base == null) { ch.base = Decide.crossingRoll(C); Save.write(G); }
    while (true) {
      const r = Decide.crossingReading(C, G, ch.base);
      const price = Decide.ferryPrice(G, C);
      const have = G.s[C.fluid];
      const head = [
        landmarkHead(G, lm),
        UI.t(U.tmpl(C.intro, { racks: Math.ceil(G.fleet.online / 20) })),
        '',
        UI.kv('Weather', `${G.weather.temp}F` +
          (G.weather.cond !== 'clear' ? `, ${DATA.weather.conditions[G.weather.cond].label}` : ''), 18),
        UI.kv(C.reading.label, `${r.shown}${C.reading.unit}`, 18),
        UI.kv('Risk', Crossing.risk(r.sev), 18),
        UI.kv(DATA.supplies[C.fluid].label, `${U.num(have)} gal`, 18),
        UI.rule(),
        'You may:',
      ].join('\n');
      const k = await UI.menu(head, [
        { k: '1', label: C.options.ford },
        { k: '2', label: `${C.options.caulk} (${C.fluidNeed} gal)`, disabled: have < C.fluidNeed },
        { k: '3', label: `${C.options.ferry} (${U.num(price)})`, disabled: G.sats < price },
        { k: '4', label: 'Wait a day' },
        { k: '5', label: 'Get more information' },
      ]);

      if (k === '5') {
        await UI.pause(landmarkHead(G, lm) + '\n' + C.info.map(UI.t).join('\n\n'));
        continue;
      }
      if (k === '4') {
        const end = await passDays(G, 1, {});
        if (end) return end;
        ch.base = Decide.crossingRoll(C, ch.base);
        Save.write(G);
        continue;
      }
      if (k === '3') {
        const days = ch.ferryDays ??= U.ri(C.ferry.days[0], C.ferry.days[1]);
        const ok = await UI.yesNo(landmarkHead(G, lm) + '\n' + UI.t(
          `${C.ferry.who} will do it for ${U.num(price)} sats. They can start in ${days} days.`), 'Are you willing?');
        if (!ok) continue;
        G.sats -= price;
        G.zone = lm.zone;   // paid for; the contractor's job is happening either way
        commit(G);
        const end = await passDays(G, days);
        if (end) return end;
        return showOutcome(G, lm, Decide.crossing(G, lm, 'ferry', 0, { days }));
      }
      const method = k === '2' ? 'caulk' : 'ford';
      return showOutcome(G, lm, Decide.crossing(G, lm, method, r.sev));
    }
  },
};

const Ercot = {
  async run(G, lm) {
    const ch = G.choice;
    if (ch.p == null) { Object.assign(ch, Decide.ercotRoll(G)); Save.write(G); }
    const elec = Q.alive(G).find(c => c.role === 'electrician');
    const guess = elec
      ? `${elec.name} reads the load forecast and puts it at ${ch.guess}% that this is a 4CP interval.`
      : 'Nobody left can read a load forecast.';

    while (true) {
      const head = [
        landmarkHead(G, lm),
        UI.kv('System load', `${U.num(ch.load)} MW`),
        UI.kv('4CP season', ch.inSeason ? 'yes' : 'no'),
        UI.kv('Hashrate', `${Q.hashrate(G).toFixed(1)} PH/s`),
        '',
        UI.t(guess),
        UI.rule(),
        'You may:',
      ].join('\n');
      const k = await UI.menu(head, [
        { k: '1', label: 'Curtail for 2 days' },
        { k: '2', label: 'Run through it' },
        { k: '3', label: 'Get more information' },
      ]);
      if (k === '3') {
        await UI.pause(landmarkHead(G, lm) + '\n' + DATA.ercot.info.map(UI.t).join('\n\n'));
        continue;
      }
      return showOutcome(G, lm, Decide.ercot(G, ch, k === '1'));
    }
  },
};

const Mempool = {
  async run(G, lm) {
    const ch = G.choice;
    if (ch.fee == null) { Object.assign(ch, Decide.mempoolRoll()); Save.write(G); }
    while (true) {
      const head = [
        landmarkHead(G, lm),
        UI.kv('Fees', `${U.num(ch.fee)} sat/vB`),
        UI.kv('Mempool', `${U.num(ch.tx)} tx`),
        UI.kv('Hashrate', `${Q.hashrate(G).toFixed(1)} PH/s`),
        UI.rule(),
        'You may:',
      ].join('\n');
      const k = await UI.menu(head, [
        { k: '1', label: 'Push the fleet for fees' },
        { k: '2', label: 'Mine through normally' },
        { k: '3', label: 'Wait a day' },
        { k: '4', label: 'Get more information' },
      ]);
      if (k === '4') {
        await UI.pause(landmarkHead(G, lm) + '\n' + DATA.mempool.info.map(UI.t).join('\n\n'));
        continue;
      }
      if (k === '3') {
        const end = await passDays(G, 1, {});
        if (end) return end;
        const msg = Decide.mempoolDrift(ch);
        Save.write(G);
        await UI.pause(landmarkHead(G, lm) + '\n' + UI.t(msg));
        continue;
      }
      return showOutcome(G, lm, Decide.mempool(G, ch.fee, k === '1'));
    }
  },
};
