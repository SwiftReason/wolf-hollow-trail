// One trail day at a time: weather, progress, consumption, failures, health, events.
// Pure state changes; screens decide what to show from the returned summary.

const Sim = {
  rollWeather(G) {
    const W = DATA.weather, m = W.months[Q.date(G).getMonth()], prev = G.weather;
    let temp, cond;
    if (prev && Math.random() < W.persist) {
      cond = prev.cond;
      temp = Math.round(prev.temp * 0.6 + m.high * 0.4 + U.gauss() * 3);
      if (cond === 'ice' && !m.ice) cond = 'clear';
    } else {
      temp = Math.round(m.high + U.gauss() * W.spread);
      const r = Math.random();
      cond = r < m.ice ? 'ice'
        : r < m.ice + m.storm ? 'storm'
        : r < m.ice + m.storm + m.dust ? 'dust' : 'clear';
    }
    if (cond === 'ice') temp = Math.min(temp, U.ri(24, 33));
    const band = W.heat.find(h => temp >= h.min);
    const condLabel = W.conditions[cond].label;
    const label = cond === 'clear' ? band.label : cond === 'ice' ? condLabel : `${band.label}, ${condLabel}`;
    return { temp, cond, heat: band.tag, tags: [cond, band.tag], label };
  },

  blocksPerDay(G, w = G.weather) {
    const C = DATA.config, tun = C.tuning[G.tuning], sh = C.shifts[G.shift];
    const alive = Q.alive(G);
    const fleet = Math.pow(Math.max(0, G.fleet.online) / C.slots, 0.6);
    const crew = (0.5 + 0.5 * alive.length / G.crew.length) * (0.7 + 0.3 * Q.avgHealth(G) / 100);
    let b = C.baseBlocksPerDay * fleet * tun.speed * sh.speed * crew / G.difficulty;
    b *= DATA.weather.conditions[w.cond].speed;
    if (G.zone === 'air' && w.heat === 'veryhot') b *= 0.85;  // thermal throttling
    const zone = C.zones[G.zone];
    if (zone.fluid && G.s[zone.fluid] <= 0) b *= 0.7;
    b *= 0.9 + 0.1 * G.morale / 100;
    return Math.max(0.5, b);
  },

  // opts: rest (crew rests, no progress), noProgress, noEvents
  day(G, opts = {}) {
    const C = DATA.config, sh = C.shifts[G.shift], zone = C.zones[G.zone];
    const out = { notes: [], deaths: [], event: null, arrived: null, graves: [] };
    const resting = !!opts.rest;

    G.day++;
    const w = G.weather = Sim.rollWeather(G);

    // The network retargets on its own schedule, whether you're moving or not.
    if (G.day % C.retarget.days === 0) {
      G.difficulty *= 1 + U.ri(C.retarget.change[0], C.retarget.change[1]) / 100;
    }

    // Progress, stopping at the next landmark.
    if (!resting && !opts.noProgress) {
      const before = G.blocks, next = Q.next(G);
      let after = before + Sim.blocksPerDay(G, w);
      if (next && after >= next.block) { after = next.block; out.arrived = next; }
      G.blocks = after;
      out.graves = Graves.between(G, before, after);
    }

    // Food and coolant.
    const alive = Q.alive(G);
    const need = alive.length * C.rationsPerPerson;
    const hungry = G.s.food < need;
    G.s.food = Math.max(0, G.s.food - need);
    if (zone.fluid) G.s[zone.fluid] = Math.max(0, G.s[zone.fluid] - zone.use * (resting ? 0.5 : 1));
    const fluidShort = !!zone.fluid && G.s[zone.fluid] <= 0;

    // Hardware.
    if (!resting) Sim.failures(G, w, fluidShort, out);
    Sim.repair(G);

    // Crew health. People past the PPE count go without.
    let ppeLeft = G.s.ppe;
    G.crew.forEach((c, i) => {
      if (!c.alive) return;
      const hasPPE = ppeLeft-- > 0;
      let dh = 2;
      dh += resting ? 6 : sh.health;
      if (hungry) dh -= 8;
      if (G.zone === 'air' && !resting) {
        if (w.heat === 'veryhot') dh -= 2.5;
        else if (w.heat === 'hot') dh -= 1;
      }
      if (w.cond === 'ice') dh -= 2;
      if (w.heat === 'cold' && !hasPPE) dh -= 2;
      if (!hasPPE) dh -= 1;
      if (G.morale < 30) dh -= 1;
      for (const a of c.ailments) {
        dh -= DATA.ailments[a.id].dmg * (resting ? 0.5 : 1);
        a.days -= resting ? 2 : 1;
      }
      c.health = U.clamp(c.health + dh, 0, 100);
      if (c.health <= 0 || (c.health < 15 && c.ailments.length && U.chance(0.04))) {
        Sim.kill(G, i, Sim.causeOfDeath(G, c, hungry));
        out.deaths.push(i);
      }
      c.ailments = c.ailments.filter(a => a.days > 0);
    });

    // Morale drifts back toward 70 unless something is wrong.
    let dm = resting ? 3 : sh.morale;
    if (hungry) dm -= 3;
    dm += G.morale < 70 ? 0.3 : -0.3;
    G.morale = U.clamp(G.morale + dm, 0, 100);

    if (!resting && !opts.noEvents && Q.alive(G).length) out.event = Engine.roll(G);
    return out;
  },

  failures(G, w, fluidShort, out) {
    const C = DATA.config, f = G.fleet, tun = C.tuning[G.tuning], zone = C.zones[G.zone];
    let rate = C.baseFailRate * tun.fail * zone.fail * Q.diff(G).fail;
    if (G.zone === 'air') {
      rate *= 1 + Math.max(0, w.temp - 85) / 12 * tun.heat;
      if (w.cond === 'dust') rate *= 1.5;
    }
    if (w.cond === 'storm') rate *= 1.2;
    if (fluidShort) rate *= 2;

    // Share of failures that burn a miner out for good. Heat makes it worse in air.
    let burn = (tun.burnout || 0) * (zone.burnout ?? 1);
    if (G.zone === 'air') burn *= 1 + Math.max(0, w.temp - 85) / C.burnoutHeatPer;
    if (fluidShort) burn *= 2;
    burn = Math.min(0.9, burn);

    const expected = f.online * rate;
    const n = Math.floor(expected) + (U.chance(expected % 1) ? 1 : 0);
    const parts = Object.keys(zone.partMix);
    for (let i = 0; i < n && f.online > 0; i++) {
      const part = U.weighted(parts, p => zone.partMix[p]);
      if (part === 'psus' && !U.chance(Q.perk(G, 'psuFail'))) continue;
      if (part === 'fans' && !U.chance(Q.perk(G, 'fanFail'))) continue;
      G.stats.failures++;
      if (U.chance(burn)) {
        f.online--;
        G.stats.burnouts = (G.stats.burnouts || 0) + 1;
        if (tun.burnNote && !G.burnNoted) { G.burnNoted = true; out.notes.push(tun.burnNote); }
        continue;
      }
      if (G.s[part] > 0) { G.s[part]--; continue; }
      if (part === 'hashboards' && !U.chance(Q.perk(G, 'hbRepairFail'))) { G.stats.benchRepairs++; continue; }
      f.online--;
      f.broken[part]++;
      if (!G.outOf[part]) {
        G.outOf[part] = true;
        out.notes.push(`You are out of ${DATA.supplies[part].noun}. Miners are going offline.`);
      }
    }
  },

  // Put broken miners back online with whatever spares exist. Returns count fixed.
  repair(G) {
    const f = G.fleet;
    let fixed = 0;
    for (const part of Object.keys(f.broken)) {
      const k = Math.min(f.broken[part], G.s[part]);
      if (k > 0) { f.broken[part] -= k; G.s[part] -= k; f.online += k; fixed += k; }
      if (G.s[part] > 0) G.outOf[part] = false;
    }
    const bench = Math.min(f.broken.hashboards, Math.round(Q.perkSum(G, 'benchRepair')));
    if (bench > 0) { f.broken.hashboards -= bench; f.online += bench; fixed += bench; G.stats.benchRepairs += bench; }
    return fixed;
  },

  causeOfDeath(G, c, hungry) {
    const worst = c.ailments.map(a => DATA.ailments[a.id]).sort((a, b) => b.dmg - a.dmg)[0];
    const g = DATA.deathGeneric;
    // A serious ailment gets the credit; mild ones (tinnitus) only if nothing else explains it.
    const t = worst && worst.dmg >= 1 ? worst.death
      : hungry ? g.starved
      : worst ? worst.death
      : G.shift === 12 ? g.overworked : g.exhaustion;
    return U.tmpl(t, { name: c.name });
  },

  kill(G, i, cause) {
    const c = G.crew[i];
    c.alive = false;
    c.health = 0;
    c.ailments = [];
    c.cause = cause;
    c.diedOn = Q.dateStr(G);
    c.diedAt = Math.floor(G.blocks);
    G.stats.deaths++;
  },

  addAilment(c, id) {
    const A = DATA.ailments[id];
    const days = U.ri(A.days[0], A.days[1]);
    const have = c.ailments.find(a => a.id === id);
    if (have) have.days = Math.max(have.days, days);
    else c.ailments.push({ id, days });
  },
};
