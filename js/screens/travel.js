// The trail: animated travel, daily results, and the "size up the situation" menu.

const Travel = {
  // ---------------------------------------------------------------- drawing
  // A message in the text window. The picture and status bar carry the rest.
  frame(G, body) {
    return body.replace(/^\n/, '');
  },

  render(G) {
    const next = Q.next(G), C = DATA.config;
    UI.draw([
      next ? UI.hi(UI.esc(`Next stop: ${next.name}`)) : '',
      next ? UI.esc(`${U.num(Math.ceil(next.block - G.blocks))} blocks to go.`) : '',
      UI.dim(UI.esc(`${C.zones[G.zone].label}  /  ${C.tuning[G.tuning].label}  /  ${C.shifts[G.shift].label}`)),
      '',
      `<span class="opt">${UI.center('Press ENTER to size up the situation')}</span>`,
    ].join('\n'));
  },

  // --------------------------------------------------------------- the loop
  async run(G) {
    if (G.atLandmark != null) {
      const r = await Landmark.stay(G, DATA.landmarks[G.atLandmark]);
      if (r !== 'continue') return r;
    }
    while (true) {
      Save.write(G);
      const r = await Travel.ticks(G);
      if (r.menu) {
        const a = await Travel.sizeUp(G, null);
        if (a !== 'continue') return a;
        continue;
      }
      const end = await Travel.process(G, r.res);
      if (end) return end;
    }
  },

  // Advance one day per tick until something happens or the player stops.
  ticks(G) {
    return new Promise(resolve => {
      let done = false, timer;
      const finish = v => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        UI.cancel();
        Scene.setMoving(false);
        resolve(v);
      };
      Scene.trail(G);
      Scene.setMoving(true);
      Music.play('trail');
      Travel.render(G);
      UI.waitKeys([], true).then(() => finish({ menu: true }));
      const step = () => {
        if (done) return;
        const res = Sim.day(G);
        Travel.render(G);
        const interesting = res.notes.length || res.deaths.length || res.event || res.arrived ||
          res.graves.length || Q.over(G);
        if (interesting) finish({ res });
        else { Save.write(G); timer = setTimeout(step, DATA.config.dayMs); }
      };
      timer = setTimeout(step, DATA.config.dayMs);
    });
  },

  // Show everything a day produced. Returns an end state or null to keep going.
  async process(G, res) {
    for (const note of res.notes) {
      Sound.bad();
      await UI.pause(Travel.frame(G, '\n' + UI.t(note)));
    }
    for (const g of res.graves) await Death.grave(G, g);
    for (const i of res.deaths) await Death.announce(G, i);
    if (Q.over(G)) return Death.gameOver(G);
    if (res.event) {
      const end = await Travel.runEvent(G, res.event);
      if (end) return end;
    }
    if (res.arrived) {
      const r = await Landmark.arrive(G, res.arrived);
      if (r !== 'continue') return r;
    }
    return null;
  },

  async runEvent(G, roll) {
    if (Engine.escalatable(G, roll.ev)) {
      const mgr = Q.alive(G).find(c => c.role === 'manager' && !c.escalated);
      if (mgr) {
        Sound.bad();
        const preview = U.tmpl(roll.ev.text, { name: G.crew[roll.target].name, n: roll.n, month: Q.monthName(G) });
        const yes = await UI.yesNo(Travel.frame(G,
          UI.t('Something bad is about to happen:') + '\n\n' + UI.hi(UI.t(preview)) + '\n\n' +
          UI.t(`${mgr.name} can escalate to corporate. This only works once.`)), 'Escalate?');
        if (yes) {
          mgr.escalated = true;
          Sound.good();
          await UI.pause(Travel.frame(G, '\n' + UI.t('Corporate escalated it. It never happened. There is a ticket.')));
          return null;
        }
      }
    }
    const o = Engine.apply(G, roll);
    if (!o.deaths.length) {
      o.good ? Sound.good() : Sound.bad();
      await UI.pause(Travel.frame(G, '\n' + UI.t(o.text)));
    }
    for (const i of o.deaths) await Death.announce(G, i);
    if (Q.over(G)) return Death.gameOver(G);
    for (let d = 0; d < o.days; d++) {
      const end = await Travel.process(G, Sim.day(G, { noProgress: true, noEvents: true }));
      if (end) return end;
    }
    return null;
  },

  // ------------------------------------------------------- size up / menus
  // lm = the landmark you're standing at, or null on the open trail.
  // Returns 'continue', 'quit', or an end state.
  async sizeUp(G, lm) {
    while (true) {
      Save.write(G);
      if (lm) Scene.show(lm.id); else Scene.trail(G);
      const C = DATA.config;
      const head = [
        UI.hi(UI.center(lm ? lm.name : 'On the trail')),
        UI.dim(UI.esc(`${C.zones[G.zone].label}  /  ${C.tuning[G.tuning].label}  /  ${C.shifts[G.shift].label}`)),
        'You may:',
      ].join('\n');
      const opts = [
        { k: '1', label: 'Continue on trail' },
        { k: '2', label: 'Check supplies' },
        { k: '3', label: 'Look at map' },
        { k: '4', label: 'Change tuning' },
        { k: '5', label: 'Change shift length' },
        { k: '6', label: 'Stop to rest' },
        { k: '7', label: 'Attempt to trade' },
        { k: '8', label: 'Salvage the RMA pile' },
        { k: '9', label: 'Check the crew' },
      ];
      if (lm && lm.talk && lm.talk.length) opts.push({ k: 'T', label: 'Talk to people' });
      if (lm && lm.store) opts.push({ k: 'B', label: 'Buy supplies' });
      opts.push({ k: 'Q', label: 'Save and quit' });

      const k = await UI.menu(head, opts);
      let end = null;
      if (k === '1') return 'continue';
      if (k === '2') await Travel.supplies(G);
      if (k === '3') await Travel.map(G);
      if (k === '4') await Travel.tuning(G);
      if (k === '5') await Travel.shift(G);
      if (k === '6') end = await Travel.rest(G);
      if (k === '7') end = await Travel.trade(G);
      if (k === '8') end = await Salvage.run(G);
      if (k === '9') await Travel.crew(G);
      if (k === 'T') await UI.pause(UI.hi(UI.center(lm.name)) + '\n' + UI.rule() + '\n\n' + UI.t(U.pick(lm.talk)));
      if (k === 'B') await Shop.run(G, lm, false);
      if (k === 'Q') return 'quit';
      if (end) return end;
    }
  },

  async supplies(G) {
    const S = DATA.supplies, f = G.fleet;
    const row = (label, v) => UI.esc(U.padR(label, 24) + U.padL(v, 16));
    const lines = [
      UI.hi(UI.center('YOUR SUPPLIES')), UI.rule(),
      row('Miners online', U.num(f.online)),
      row('Hashrate', `${Q.hashrate(G).toFixed(1)} PH/s`),
      row('Miners broken', U.num(Q.broken(G))),
      row('Miners burned out', U.num(G.stats.burnouts || 0)),
      '',
    ];
    for (const k in S) lines.push(row(S[k].label, U.num(G.s[k]) + (S[k].unit ? ' ' + S[k].unit : '')));
    lines.push('', row('Sats', U.num(G.sats)), row('Morale', Q.status(G.morale)), row('Difficulty', Q.difficulty(G)));
    await UI.pause(lines.join('\n'));
  },

  async crew(G) {
    const lines = [UI.hi(UI.center('YOUR CREW')), UI.rule()];
    G.crew.forEach((c, i) => {
      const role = Q.role(c.role).short;
      const name = U.padR(c.name + (i === 0 ? '*' : ''), 12) + U.padR(role, 13);
      if (!c.alive) {
        lines.push(UI.dim(UI.esc(name + 'dead')));
        return;
      }
      lines.push(UI.esc(name + Q.status(c.health)));
      const ail = c.ailments.map(a => DATA.ailments[a.id].name).join(', ');
      if (ail) lines.push(UI.dim(UI.esc('  ' + ail)));
    });
    lines.push('', UI.dim(UI.esc('* you')));
    await UI.pause(lines.join('\n'));
  },

  async map(G) {
    const L = DATA.landmarks;
    Scene.show('map', { blocks: G.blocks, lm: G.lm });
    const lines = [
      UI.hi(UI.center('MAP OF WOLF HOLLOW')),
      UI.dim(UI.esc(U.center(`you are at block ${U.num(Math.floor(G.blocks))}`))),
    ];
    L.forEach((l, i) => {
      const passed = i < G.lm;
      const s = `${l.mapKey}  ${U.padR(l.name, 24)}${U.padL(U.num(l.block), 6)}  ${passed ? '*' : ' '}`;
      lines.push(passed ? UI.dim(UI.esc(s)) : UI.esc(s));
    });
    lines.push('', UI.dim(UI.esc('* passed')));
    await UI.pause(lines.join('\n'));
  },

  async tuning(G) {
    const T = DATA.config.tuning, ids = Object.keys(T);
    const desc = ids.map((id, i) => UI.esc(`${i + 1}. ${T[id].label}`) + '\n' + UI.t('   ' + T[id].desc)).join('\n');
    const k = await UI.menu(UI.hi(UI.center('CHANGE TUNING')) + '\n' + UI.rule() + '\n' + desc + '\n\n' +
      UI.kv('Current', T[G.tuning].label) + '\n', ids.map((id, i) => ({ k: String(i + 1), label: T[id].label })));
    G.tuning = ids[parseInt(k, 10) - 1];
  },

  async shift(G) {
    const S = DATA.config.shifts, ids = Object.keys(S);
    const desc = ids.map((id, i) => UI.esc(`${i + 1}. ${S[id].label}`) + '\n' + UI.t('   ' + S[id].desc)).join('\n');
    const k = await UI.menu(UI.hi(UI.center('CHANGE SHIFT LENGTH')) + '\n' + UI.rule() + '\n' + desc + '\n\n' +
      UI.kv('Current', S[G.shift].label) + '\n', ids.map((id, i) => ({ k: String(i + 1), label: S[id].label })));
    G.shift = parseInt(ids[parseInt(k, 10) - 1], 10);
  },

  async rest(G) {
    const n = await UI.ask(Travel.frame(G, '\n' + UI.t('The site keeps running on a skeleton crew. Nobody mines new blocks.')) + '\n',
      'Rest how many days? (0-9)', { numeric: true, max: 1, allowEmpty: true });
    if (!n) return null;
    for (let d = 0; d < n; d++) {
      const res = Sim.day(G, { rest: true });
      UI.draw(Travel.frame(G, '\n' + UI.center(`Resting... day ${d + 1} of ${n}`)));
      await new Promise(r => setTimeout(r, 250));
      const end = await Travel.process(G, res);
      if (end) return end;
    }
    await UI.pause(Travel.frame(G, '\n' + UI.t(`You rested for ${n} day${n > 1 ? 's' : ''}. Health is ${Q.groupHealth(G)}.`)));
    return null;
  },

  async trade(G) {
    const offer = U.pick(DATA.trades);
    const roll = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, U.ri(v[0], v[1])]));
    const give = roll(offer.give), get = roll(offer.get);
    const words = o => Object.entries(o).map(([k, v]) => Q.amount(k, v)).join(' and ');
    const canPay = Object.entries(give).every(([k, v]) => G.s[k] >= v);
    let body = UI.t(`${offer.who} offers you ${words(get)} for ${words(give)}.`);
    if (!canPay) {
      Sound.bad();
      await UI.pause(Travel.frame(G, '\n' + body + '\n\n' + UI.t('You don\'t have enough. They leave.')));
    } else if (await UI.yesNo(Travel.frame(G, '\n' + body), 'Are you willing to trade?')) {
      for (const k in give) G.s[k] -= give[k];
      for (const k in get) G.s[k] += get[k];
      Sim.repair(G);
      Sound.good();
    }
    // Trading takes the day.
    return Travel.process(G, Sim.day(G, { noProgress: true, noEvents: true }));
  },
};
