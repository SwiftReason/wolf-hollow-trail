// Random event engine. Reads DATA.events; see data/events.js for the format.

const Engine = {
  ctx(G) {
    const w = G.weather;
    return {
      zone: G.zone,
      tuning: G.tuning,
      shift: String(G.shift),
      tags: w.tags,
      season: Q.season(G),
      month: Q.date(G).getMonth(),
      short: Q.shortages(G),
      roles: Q.roleCounts(G),
      avgHealth: Q.avgHealth(G),
      fatal: Q.diff(G).fatal,
    };
  },

  weight(G, ev, x) {
    if (ev.zones && !ev.zones.includes(x.zone)) return 0;
    if (ev.months && !ev.months.includes(x.month)) return 0;
    if (ev.requires && !(G.s[ev.requires] > 0)) return 0;
    const m = ev.mods || {};
    if (m.needsRole && !x.roles[m.needsRole]) return 0;

    let w = ev.weight ?? 1;
    if (m.tuning) w *= m.tuning[x.tuning] ?? 1;
    if (m.shift) w *= m.shift[x.shift] ?? 1;
    if (m.weather) for (const t of x.tags) w *= m.weather[t] ?? 1;
    if (m.season) w *= m.season[x.season] ?? 1;
    if (m.missing) for (const k in m.missing) if (x.short[k]) w *= m.missing[k];
    if (m.roles) for (const r in m.roles) w *= Math.pow(m.roles[r], x.roles[r] || 0);
    if (ev.type === 'fatal') w *= (1.6 - x.avgHealth / 100) * x.fatal;  // sick crews die more
    return w;
  },

  roll(G) {
    const C = DATA.config;
    // Longer trips get fewer events per day (total grows with the square root of length).
    const p = C.eventChance * C.tuning[G.tuning].events * C.shifts[G.shift].events * Q.diff(G).events / Math.sqrt(Q.scale(G));
    if (!U.chance(p)) return null;
    const x = Engine.ctx(G);
    const ev = U.weighted(DATA.events, e => Engine.weight(G, e, x));
    if (!ev) return null;
    // Fatal events favor whoever is already worst off.
    const alive = G.crew.map((c, i) => i).filter(i => G.crew[i].alive);
    const target = ev.type === 'fatal'
      ? U.weighted(alive, i => 110 - G.crew[i].health)
      : U.pick(alive);
    let n = Array.isArray(ev.n) ? U.ri(ev.n[0], ev.n[1]) : (ev.n || 0);
    if (n >= 10000) n = Math.round(n / 1000) * 1000;   // sats read better as round numbers
    return { ev, target, n };
  },

  val(v, n) {
    if (v === 'n') return n;
    if (v === '-n') return -n;
    if (Array.isArray(v)) return U.ri(v[0], v[1]);
    return v;
  },

  canConsume(G, ev) {
    return !ev.consume || Object.entries(ev.consume).every(([k, v]) => G.s[k] >= v);
  },

  // Bad enough that a Site Manager can escalate it away.
  escalatable(G, ev) {
    if (ev.choices) return false;
    if (ev.type === 'fatal') return true;
    if (!Engine.canConsume(G, ev)) return true;
    if (ev.type === 'fleet' && !ev.consume && Array.isArray(ev.n) && ev.n[1] >= 55) return true;
    return (ev.effect && ev.effect.days >= 3) || ev.id === 'corporate_visit';
  },

  // Apply a rolled event. Returns { text, deaths: [crewIdx], days, good }.
  apply(G, roll) {
    const { ev } = roll;
    let text = ev.text, eff = ev.effect || {};
    if (ev.consume) {
      if (Engine.canConsume(G, ev)) {
        for (const [k, v] of Object.entries(ev.consume)) G.s[k] -= v;
      } else if (ev.shortfall) {
        text = ev.shortfall.text;
        eff = ev.shortfall.effect || {};
      }
    }
    return Engine.effect(G, roll, text, eff, ev.type === 'good');
  },

  // ------------------------------------------------------- choice events
  // A choice can require sats or supplies: { requires: { sats: 500000 } }.
  have(G, k) { return k === 'sats' ? G.sats : G.s[k]; },
  choiceOk(G, ch) {
    return !ch.requires || Object.entries(ch.requires).every(([k, v]) => Engine.have(G, k) >= v);
  },
  // Odds can improve with the right crew alive: roleBonus: { electrician: 0.15 }.
  choiceOdds(G, ch) {
    let p = ch.odds;
    for (const [r, b] of Object.entries(ch.roleBonus || {})) p += b * Q.count(G, r);
    return U.clamp(p, 0, 0.95);
  },
  applyChoice(G, roll, idx) {
    const ch = roll.ev.choices[idx];
    let branch = ch;
    if (ch.odds != null) {
      const won = U.chance(Engine.choiceOdds(G, ch));
      branch = won ? ch.win : ch.lose;
      branch = { ...branch, good: won };
    }
    const eff = { ...(ch.effect || {}), ...(branch !== ch ? branch.effect || {} : {}) };
    const out = Engine.effect(G, roll, branch.text || ch.text || '', eff, branch.good ?? !!ch.good);
    out.choice = ch.label;
    return out;
  },

  // Shared effect handling for events and choices.
  effect(G, roll, text, eff, good) {
    const { ev, target, n } = roll;
    const c = G.crew[target];
    const out = {
      text: U.tmpl(text, { name: c ? c.name : 'Someone', n, month: Q.monthName(G) }),
      deaths: [], days: 0, good,
    };
    const val = v => Engine.val(v, n);

    if (eff.kill && c) { Sim.kill(G, target, out.text); out.deaths.push(target); }
    if (eff.ailment && c) Sim.addAilment(c, eff.ailment);
    if (eff.health && c) c.health = U.clamp(c.health + val(eff.health), 1, 100);
    if (eff.allHealth) for (const p of Q.alive(G)) p.health = U.clamp(p.health + val(eff.allHealth), 1, 100);
    if (eff.supplies) for (const k in eff.supplies) G.s[k] = Math.max(0, G.s[k] + val(eff.supplies[k]));
    if (eff.broken) {
      for (const part in eff.broken) {
        const k = Math.min(val(eff.broken[part]), G.fleet.online);
        G.fleet.online -= k;
        G.fleet.broken[part] += k;
      }
    }
    if (eff.destroy) G.fleet.online = Math.max(0, G.fleet.online - val(eff.destroy));
    if (eff.miners) {   // new miners, up to the site's free slots
      const room = DATA.config.slots - G.fleet.online - Q.broken(G);
      G.fleet.online += Math.max(0, Math.min(room, val(eff.miners)));
    }
    if (eff.morale) {
      let m = val(eff.morale);
      if (ev.corporate && m < 0) m *= Q.perk(G, 'corporateMorale');
      G.morale = U.clamp(G.morale + m, 0, 100);
    }
    if (eff.sats) G.sats = Math.max(0, G.sats + val(eff.sats));
    if (eff.difficulty) G.difficulty *= 1 + val(eff.difficulty);
    if (eff.blocks) {
      const next = Q.next(G);
      G.blocks = U.clamp(G.blocks + val(eff.blocks), 0, next ? next.block - 0.01 : G.blocks);
    }
    if (eff.days) out.days = val(eff.days);
    return out;
  },
};
