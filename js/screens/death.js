// Deaths, tombstones, epitaphs, and game over.

const Death = {
  async announce(G, i) {
    const c = G.crew[i];
    Sound.death();
    const prevMusic = Music.play('death');
    let msg = UI.t(c.cause);
    if (Q.count(G, c.role) === 0 && Q.alive(G).length) msg += '\n\n' + UI.hi(UI.t(Q.role(c.role).lost));
    await UI.pause(msg);

    const prev = Scene.save();
    const stone = { name: c.name, epitaph: '', date: c.diedOn };
    Scene.show('tomb', stone);
    const ep = await UI.ask(UI.hi(UI.center(`HERE LIES ${c.name.toUpperCase()}`)) + '\n\n' +
      UI.t(`Write an epitaph for ${c.name}.`) + '\n', '>', { max: 40, allowEmpty: true });
    c.epitaph = ep;
    Journal.add(G, c.cause + (ep ? ` Epitaph: "${ep}"` : ''));
    Graves.add({ game: G.id, name: c.name, cause: c.cause, epitaph: ep, frac: c.diedAt / Q.total(G), date: c.diedOn });
    Scene.show('tomb', { ...stone, epitaph: ep });
    await UI.pause(UI.t(c.cause));
    Scene.restore(prev);
    if (prevMusic && !Q.over(G)) Music.play(prevMusic);
  },

  // A grave left by a previous game.
  async grave(G, g) {
    const prev = Scene.save();
    Scene.show('tomb', { name: g.name, epitaph: g.epitaph, date: g.date });
    await UI.pause(UI.hi(UI.t(`You pass the grave of ${g.name}.`)) + '\n\n' + UI.dim(UI.t(g.cause)));
    Scene.restore(prev);
  },

  async gameOver(G) {
    Save.clear(G);
    Sound.death();
    Scene.setMoving(false);
    Scene.show('gameover');
    Journal.add(G, Q.alive(G).length ? 'Hashrate hit zero. Wolf Hollow went dark.' : 'The last of the crew is gone.');
    Music.play('gameover');
    const everyone = !Q.alive(G).length;
    const why = everyone
      ? 'Everyone is dead. The miners hash on, unsupervised, until something catches fire.'
      : 'Hashrate hit zero. Wolf Hollow is dark. Corporate has scheduled a call.';
    await UI.pause([
      UI.hi(UI.center('GAME OVER')),
      '',
      UI.t(why),
      '',
      UI.kv('Blocks mined', `${U.num(Math.floor(G.blocks))} / ${U.num(Q.total(G))}`),
      UI.kv('Days', U.num(G.day)),
      UI.kv('Deaths', U.num(G.stats.deaths)),
    ].join('\n'));
    await Score.after(G, false);
    return 'dead';
  },
};
