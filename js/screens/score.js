// Final score and the Hall of Hashers.

const Score = {
  // Corporate's projected trip length, scaled to this trip.
  projected(G) { return Math.round(DATA.config.score.schedule.days * Q.scale(G)); },

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
    const ahead = Math.max(0, Score.projected(G) - G.day);
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
    const mult = Q.role(G.role).mult, diffMult = Q.diff(G).score;
    return { rows, subtotal, mult, diffMult, total: Math.round(subtotal * mult * diffMult) };
  },

  async victory(G) {
    Save.clear(G);
    Sound.win();
    Music.play('victory');
    const lm = DATA.landmarks[DATA.landmarks.length - 1];
    await UI.pause(Landmark.card(G, lm,
      `Congratulations! You have made it to The Halving. ${Q.alive(G).length} of ${G.crew.length} crew survived, after ${G.day} days. ` +
      `Corporate projected ${Score.projected(G)}.`));

    const s = Score.compute(G);
    const row = (a, b) => UI.esc(U.padR(a, 30) + U.padL(b, 10));
    const lines = [UI.hi(UI.center('FINAL SCORE')), UI.rule()];
    for (const [label, p] of s.rows) lines.push(row(label, U.num(p)));
    lines.push(UI.rule(), row('Subtotal', U.num(s.subtotal)),
      row(`${Q.role(G.role).name} bonus`, `x${s.mult}`),
      ...(s.diffMult !== 1 ? [row(`${Q.diff(G).label} difficulty`, `x${s.diffMult}`)] : []),
      UI.hi(row('TOTAL', U.num(s.total))),
      '', UI.esc(U.center(`Rating: ${Scores.rating(s.total)}`)));
    await UI.pause(lines.join('\n'));

    const entry = { name: G.crew[0].name, score: s.total, role: Q.role(G.role).name, id: G.id };
    if (Scores.qualifies(s.total)) Scores.add(entry);
    Journal.add(G, `Reached The Halving after ${G.day} days. Final score: ${U.num(s.total)} (${Scores.rating(s.total)}).`);
    await Score.hall(G.id);
    await Score.after(G, true);
    return 'won';
  },

  // After the end: read the journal or look at the score card.
  async after(G, won) {
    while (true) {
      const k = await UI.menu(UI.hi(UI.center(won ? 'THE END' : 'GAME OVER')) + '\n', [
        { k: '1', label: 'Read the trail journal' },
        { k: '2', label: 'Show the score card' },
        { k: '0', label: 'Return to the title screen' },
      ]);
      if (k === '1') await Travel.journal(G);
      else if (k === '2') await Score.showCard(G, won);
      else return;
    }
  },

  // The card shows on screen so it can be saved anywhere (right-click or
  // long-press). Pages hosted inside a frame can't start downloads, so the
  // direct download is only offered when the game runs on its own.
  async showCard(G, won) {
    const src = Score.card(G, won).toDataURL('image/png');
    const standalone = window.self === window.top;
    const body = `<img class="card" src="${src}" alt="Wolf Hollow Trail score card">` + '\n' +
      UI.t('Right-click or long-press the picture to save it.') + '\n';
    const opts = standalone ? [{ k: 'D', label: 'Download it' }, { k: '0', label: 'Back' }] : [{ k: '0', label: 'Back' }];
    const k = await UI.menu(body, opts, 'Choice?');
    if (k === 'D') {
      const ok = Score.download(G, won);
      await UI.pause(UI.t(ok ? 'Saved wolf-hollow-trail.png to your downloads.' : 'Your browser would not save the picture.'));
    }
  },

  // A shareable 640x360 picture: the ending scene, the score, and the crew.
  card(G, won) {
    const s = Score.compute(G);
    const c = Gfx.canvas(320, 180), x = c.getContext('2d');
    const scene = Gfx.canvas(320, 160);
    Places.draw(scene.getContext('2d'), 3, { scene: won ? 'halving' : 'gameover' });
    x.drawImage(scene, 0, 42, 320, 96, 0, 0, 320, 96);
    Gfx.gradient(x, 0, 96, 320, 84, [[0, '#2b4c92'], [1, '#0f1a3c']]);
    Gfx.rect(x, 0, 96, 320, 2, '#e8eaf4');
    Places.outlined(x, 'WOLF HOLLOW TRAIL', 160, 4, '#ffd25a', '#1a0f20', 16);
    const who = `${G.crew[0].name}, ${Q.role(G.role).short}, ${Q.diff(G).label}`;
    Gfx.text(x, who.toUpperCase(), 160, 102, '#f4ecd8', { align: 'center', shadow: '#000000' });
    const line2 = won
      ? `SCORE ${U.num(s.total)}  ${Scores.rating(s.total).toUpperCase()}`
      : `GAME OVER AT BLOCK ${U.num(Math.floor(G.blocks))}`;
    Gfx.text(x, line2, 160, 114, won ? '#ffd25a' : '#ff6a5a', { align: 'center', shadow: '#000000' });
    Gfx.text(x, `${G.day} DAYS  ${U.num(Q.total(G))} BLOCKS  ${Q.alive(G).length}/${G.crew.length} ALIVE`, 160, 126, '#b8c4e8', { align: 'center' });
    G.crew.forEach((m, i) => {
      const cx = 32 + i * 64, name = m.name.length > 7 ? m.name.slice(0, 6) + '.' : m.name;
      Gfx.text(x, name.toUpperCase(), cx, 144, m.alive ? '#f4ecd8' : '#8a8a90', { align: 'center' });
      Gfx.text(x, m.alive ? Q.status(m.health).toUpperCase() : 'R.I.P.', cx, 158, m.alive ? '#5cff7a' : '#c8c8d0', { align: 'center' });
    });
    const out = Gfx.canvas(640, 360);
    out.getContext('2d').drawImage(c, 0, 0, 640, 360);
    return out;
  },

  download(G, won) {
    try {
      const a = document.createElement('a');
      a.href = Score.card(G, won).toDataURL('image/png');
      a.download = 'wolf-hollow-trail.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
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
