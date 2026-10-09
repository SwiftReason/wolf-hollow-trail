// Granbury General Supply. Purchases happen immediately.

const Shop = {
  price(G, item, lm) {
    const mult = (lm && lm.priceMult) || 1;
    return Math.round(item.price * mult * Q.perk(G, 'priceMult') * Q.diff(G).prices / 100) * 100;
  },

  // Free miner positions, in racks.
  rackRoom(G) {
    return Math.floor((DATA.config.slots - G.fleet.online - Q.broken(G)) / 20);
  },

  have(G, id) {
    if (id === 'miners') return `${U.num(G.fleet.online)} miners`;
    const s = DATA.supplies[id];
    return U.num(G.s[id]) + (s.unit ? ' ' + s.unit : '');
  },

  header(G, lm) {
    return [
      UI.hi(UI.center(DATA.store.name)),
      UI.esc(U.padR(lm.name, 22) + U.padL(Q.dateStr(G), 18)),
      UI.rule(),
    ].join('\n');
  },

  async run(G, lm, first) {
    const prev = Scene.save();
    Scene.show('store');
    const prevMusic = Music.play('store');
    const before = G.sats;
    try {
      await Shop.counter(G, lm, first);
    } finally {
      Scene.restore(prev);
      if (prevMusic) Music.play(prevMusic);
    }
    if (G.sats < before) Journal.add(G, `Spent ${U.num(before - G.sats)} sats at ${DATA.store.name} in ${lm.name}.`);
  },

  async counter(G, lm, first) {
    if (first) await Shop.intro(G);
    while (true) {
      const opts = DATA.store.groups.map((g, i) => {
        const single = g.items.length === 1 ? Shop.have(G, g.items[0]) : '';
        return { k: String(i + 1), label: U.padR(g.label, 21) + U.padL(single, 14) };
      });
      opts.push({ k: '0', label: 'Leave the store' });
      const disc = Q.perk(G, 'priceMult') < 1 ? `  Inventory discount: ${Math.round((1 - Q.perk(G, 'priceMult')) * 100)}%` : '';
      const head = Shop.header(G, lm) + '\n' +
        UI.esc(`You have ${U.num(G.sats)} sats.`) + '\n' + (disc ? UI.dim(UI.esc(disc)) + '\n' : '');
      const k = await UI.menu(head, opts, 'Which would you like to buy?');
      if (k === '0') {
        if (first && G.s.food <= 0 &&
            !(await UI.yesNo(Shop.header(G, lm) + '\n\n' + UI.t('Dale looks at your cart. "No tacos?"'), 'Leave anyway?'))) continue;
        return;
      }
      const group = DATA.store.groups[parseInt(k, 10) - 1];
      if (group.items.length === 1) await Shop.buy(G, group.items[0], lm);
      else await Shop.groupMenu(G, group, lm);
    }
  },

  async intro(G) {
    const lines = DATA.store.intro.map(l => UI.t(l)).join('\n');
    await UI.pause(UI.hi(UI.center(DATA.store.name)) + '\n' + UI.rule() + '\n\n' + lines + '\n\n' +
      UI.t(`You have ${U.num(G.sats)} sats. The site already has ${U.num(G.fleet.online)} miners. Buy wisely. You can restock at some stops along the way, but prices go up.`));
  },

  async groupMenu(G, group, lm) {
    while (true) {
      const opts = group.items.map((id, i) => {
        const it = DATA.store.items[id];
        return { k: String(i + 1), label: U.padR(it.name, 21) + U.padL(Shop.have(G, id), 14) };
      });
      opts.push({ k: '0', label: 'Back' });
      const k = await UI.menu(Shop.header(G, lm) + '\n' + UI.hi(UI.esc(U.padR(group.label, 26) + U.padL('you have', 14))) + '\n', opts);
      if (k === '0') return;
      await Shop.buy(G, group.items[parseInt(k, 10) - 1], lm);
    }
  },

  async buy(G, id, lm) {
    const it = DATA.store.items[id];
    const p = Shop.price(G, it, lm);
    let cap = Math.floor(G.sats / p);
    if (id === 'miners') cap = Math.min(cap, Shop.rackRoom(G));
    const body = [
      Shop.header(G, lm),
      UI.hi(UI.esc(it.name)),
      UI.esc(`${U.num(p)} sats per ${it.unit}`),
      '',
      UI.t(`${DATA.store.keeper} says: "${it.advice}"`),
      '',
      UI.kv('You have', Shop.have(G, id)),
      UI.kv('Sats', U.num(G.sats)),
      id === 'miners' ? UI.kv('Room for', `${Shop.rackRoom(G)} racks`) : null,
      '',
    ].filter(l => l !== null).join('\n');
    const n = await UI.ask(body, `How many? (0-${cap})`, { numeric: true, max: 4, allowEmpty: true });
    if (!n) return;
    if (n > cap) {
      Sound.bad();
      const why = id === 'miners' && n * p <= G.sats ? 'There isn\'t room for that many racks.' : 'You can\'t afford that.';
      await UI.pause(Shop.header(G, lm) + '\n\n' + UI.t(why));
      return;
    }
    G.sats -= n * p;
    Sound.buy();
    for (const k in it.gives) {
      if (k === 'miners') G.fleet.online += it.gives[k] * n;
      else G.s[k] += it.gives[k] * n;
    }
    const fixed = Sim.repair(G);
    if (fixed > 0) {
      Sound.good();
      await UI.pause(Shop.header(G, lm) + '\n\n' + UI.t(`Your crew put ${U.plural(fixed, 'broken miner')} back online.`));
    }
  },
};
