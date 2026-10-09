// Final score and the Hall of Hashers.

const Score = {
  // Oregon Trail-style tally: survivors by health, then leftover supplies.
  compute(G) {
    const P = DATA.config.score;
    const rows = [];
    const byStatus = {};
    for (const c of Q.alive(G)) { const s = Q.status(c.health); byStatus[s] = (byStatus[s] || 0) + 1; }
    for (const s of Object.keys(P.health)) {
      if (byStatus[s]) rows.push([`${byStatus[s]} in ${s} health`, byStatus[s] * P.health[s]]);
    }
    const parts = ['hashboards', 'psus', 'fans', 'boards'].reduce((a, k) => a + G.s[k], 0);
    const kits = G.s.ppe + G.s.hoses;
    const fluid = G.s.dielectric + G.s.glycol;
    const ahead = Math.max(0, P.schedule.days - G.day);
    if (ahead) rows.push([`${ahead} days ahead of schedule`, ahead * P.schedule.perDay]);
    rows.push(['The site', P.site]);
    rows.push([`${U.num(G.fleet.online)} miners online`, Math.floor(G.fleet.online / P.minersPerPoint)]);
    rows.push([`${parts} spare parts`, parts * P.perPart]);
    rows.push([`${kits} PPE & hose kits`, kits * P.perKit]);
    rows.push([`${U.num(G.s.food)} rations`, Math.floor(G.s.food / P.rationsPerPoint)]);
    rows.push([`${U.num(G.s.zipties)} zip ties`, Math.floor(G.s.zipties / P.tiesPerPoint)]);
    rows.push([`${U.num(fluid)} gal of fluid`, Math.floor(fluid / P.gallonsPerPoint)]);
    rows.push([`${U.num(G.sats)} sats`, Math.floor(G.sats / P.satsPerPoint)]);
    const subtotal = rows.reduce((a, r) => a + r[1], 0);
    const mult = Q.role(G.role).mult;
    return { rows, subtotal, mult, total: Math.round(subtotal * mult) };
  },

  async victory(G) {
    Save.clear();
    Sound.win();
    Music.play('victory');
    const lm = DATA.landmarks[DATA.landmarks.length - 1];
    await UI.pause(Landmark.card(G, lm,
      `Congratulations! You have made it to The Halving. ${Q.alive(G).length} of ${G.crew.length} crew survived, after ${G.day} days. ` +
      `Corporate projected ${DATA.config.score.schedule.days}.`));

    const s = Score.compute(G);
    const row = (a, b) => UI.esc(U.padR(a, 30) + U.padL(b, 10));
    const lines = [UI.hi(UI.center('FINAL SCORE')), UI.rule()];
    for (const [label, p] of s.rows) lines.push(row(label, U.num(p)));
    lines.push(UI.rule(), row('Subtotal', U.num(s.subtotal)),
      row(`${Q.role(G.role).name} bonus`, `x${s.mult}`),
      UI.hi(row('TOTAL', U.num(s.total))),
      '', UI.esc(U.center(`Rating: ${Scores.rating(s.total)}`)));
    await UI.pause(lines.join('\n'));

    const entry = { name: G.crew[0].name, score: s.total, role: Q.role(G.role).name, id: G.id };
    if (Scores.qualifies(s.total)) Scores.add(entry);
    await Score.hall(G.id);
    return 'won';
  },

  async hall(highlightId) {
    const lines = [UI.hi(UI.center('THE HALL OF HASHERS')), UI.rule(),
      UI.esc(U.padR('Name', 18) + U.padL('Points', 9) + '  Rating'), UI.rule()];
    for (const e of Scores.all()) {
      const s = UI.esc(U.padR(e.name, 18) + U.padL(U.num(e.score), 9) + '  ' + Scores.rating(e.score));
      lines.push(highlightId && e.id === highlightId ? UI.hi(s) : s);
    }
    const legend = DATA.config.ratings.map(r => r.min ? `${r.label} ${U.num(r.min)}+` : r.label).join(', ');
    lines.push('', UI.dim(UI.t(`Ratings: ${legend}.`)));
    await UI.pause(lines.join('\n'));
  },
};
