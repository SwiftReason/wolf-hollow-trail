// Arriving at, and staying at, a landmark.

const Landmark = {
  // Landmark types with a decision screen (see crossing.js).
  specials: {
    crossing: (G, lm) => Crossing.run(G, lm),
    ercot: (G, lm) => Ercot.run(G, lm),
    mempool: (G, lm) => Mempool.run(G, lm),
  },

  card(G, lm, extra) {
    Scene.show(lm.id);
    if (lm.type !== 'end') Music.play('landmark');
    return [
      UI.hi(UI.center(lm.name)),
      UI.dim(UI.center(`Block ${U.num(lm.block)} of ${U.num(DATA.config.totalBlocks)}`)),
      '',
      UI.t(lm.desc),
      extra ? '\n' + UI.t(extra) : '',
    ].join('\n');
  },

  async depart(G) {
    const lm = DATA.landmarks[0];
    Sound.arrive();
    await UI.pause(Landmark.card(G, lm,
      `You set out from ${lm.name} with ${U.num(G.fleet.online)} miners and a crew of ${G.crew.length}. ` +
      `${U.num(DATA.config.totalBlocks)} blocks to The Halving.`));
  },

  // Returns 'continue', 'quit', or an end state.
  async arrive(G, lm) {
    Sound.arrive();
    const idx = DATA.landmarks.indexOf(lm);
    G.lm = idx + 1;
    if (lm.type === 'end') return Score.victory(G);

    let extra = '';
    if (lm.type === 'difficulty') {
      const d = U.ri(-3, 9);
      G.difficulty *= 1 + d / 100;
      extra = `Difficulty adjusted ${d >= 0 ? '+' : ''}${d}%.` + (d < 0 ? ' Somebody else\'s miners died.' : '');
    }
    if (lm.zone && lm.type !== 'crossing') G.zone = lm.zone;
    G.atLandmark = idx;
    G.pending = Landmark.specials[lm.type] ? lm.type : null;
    Save.write(G);
    await UI.pause(Landmark.card(G, lm, extra));
    return Landmark.stay(G, lm);
  },

  // Also the resume point for a game saved at a landmark. ERCOT and the
  // mempool decide on arrival; a crossing waits until you leave, so you can
  // shop first.
  async stay(G, lm) {
    if (G.pending && G.pending !== 'crossing') {
      const end = await Landmark.special(G, lm);
      if (end) return end;
    }
    const r = await Travel.sizeUp(G, lm);
    if (r !== 'continue') return r;
    if (G.pending) {
      const end = await Landmark.special(G, lm);
      if (end) return end;
    }
    G.atLandmark = null;
    return 'continue';
  },

  async special(G, lm) {
    G.choice = G.choice || {};
    const end = await Landmark.specials[G.pending](G, lm);
    G.pending = null;
    G.choice = {};
    Save.write(G);
    return end;
  },
};
