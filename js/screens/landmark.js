// Arriving at, and staying at, a landmark.

const Landmark = {
  // Landmark types with a decision screen (see crossing.js).
  specials: {
    crossing: (G, lm) => Crossing.run(G, lm),
    ercot: (G, lm) => Ercot.run(G, lm),
    mempool: (G, lm) => Mempool.run(G, lm),
  },

  // The landmark's picture and description. `drive` plays the UTV pulling in.
  card(G, lm, extra, drive = false) {
    Scene.show(lm.id, drive ? { arrive: Scene.t } : {});
    if (lm.type !== 'end') Music.play('landmark');
    const idx = lm.index ?? DATA.landmarks.indexOf(lm);
    return [
      UI.hi(UI.center(lm.name)),
      UI.dim(UI.center(`Block ${U.num(Q.landmark(G, idx).block)} of ${U.num(Q.total(G))}`)),
      '',
      UI.t(lm.desc),
      extra ? '\n' + UI.t(extra) : '',
    ].join('\n');
  },

  async depart(G) {
    const lm = DATA.landmarks[0];
    Sound.arrive();
    Journal.add(G, `Set out from ${lm.name} with ${U.num(G.fleet.online)} miners and a crew of ${G.crew.length}.`);
    await UI.pause(Landmark.card(G, lm,
      `You set out from ${lm.name} with ${U.num(G.fleet.online)} miners and a crew of ${G.crew.length}. ` +
      `${U.num(Q.total(G))} blocks to The Halving.`));
  },

  // Returns 'continue', 'quit', or an end state.
  async arrive(G, lm) {
    Sound.arrive();
    const idx = lm.index ?? DATA.landmarks.indexOf(lm);
    G.lm = idx + 1;
    Journal.add(G, `Arrived at ${lm.name}.`);
    if (lm.type === 'end') return Score.victory(G);

    let extra = '';
    if (lm.type === 'difficulty') {
      const d = U.ri(-3, 9);
      G.difficulty *= 1 + d / 100;
      extra = `Difficulty adjusted ${d >= 0 ? '+' : ''}${d}%.` + (d < 0 ? ' Somebody else\'s miners died.' : '');
      Journal.add(G, extra);
    }
    if (lm.zone && lm.type !== 'crossing') G.zone = lm.zone;
    G.atLandmark = idx;
    G.pending = Landmark.specials[lm.type] ? lm.type : null;
    Save.write(G);
    await UI.pause(Landmark.card(G, lm, extra, true));
    return Landmark.stay(G, DATA.landmarks[idx]);
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
