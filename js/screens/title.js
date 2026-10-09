// Title screen and "Learn about the trail".

const Title = {
  head() {
    return [
      UI.dim(UI.center('3,125 miners. 2,016 blocks. One crew.')),
      '',
      'You may:',
    ].join('\n');
  },

  async run() {
    Scene.show('title');
    Hud.show(false);
    Music.play('title');
    const k = await UI.menu(Title.head(), [
      { k: '1', label: 'Travel the trail' },
      { k: '2', label: 'Continue saved game', disabled: !Save.any() },
      { k: '3', label: 'Learn about the trail' },
      { k: '4', label: 'See the Hall of Hashers' },
      { k: '5', label: 'Sound settings' },
      { k: '6', label: 'Management options' },
    ]);
    if (k === '1') {
      const slot = await Title.pickSlot('Which save slot should this trip use?', false);
      if (!slot) return;
      if (Save.load(slot) && !(await UI.yesNo(UI.t(`Slot ${slot} has a trip in progress. Starting over will erase it.`), 'Start over?'))) return;
      const G = await Setup.run(slot);
      Save.write(G);
      await Game.play(G, true);
    } else if (k === '2') {
      const slot = await Title.pickSlot('Which trip do you want to continue?', true);
      const G = slot && Save.load(slot);
      if (G) await Game.play(G, false);
    } else if (k === '3') {
      await Title.learn();
    } else if (k === '4') {
      await Score.hall();
    } else if (k === '5') {
      await Title.soundSettings();
    } else if (k === '6') {
      await Title.manage();
    }
  },

  // One-line summary of a saved trip.
  slotLabel(s) {
    if (!s.G) return '(empty)';
    const G = s.G, at = G.atLandmark != null ? DATA.landmarks[G.atLandmark].name : `block ${U.num(Math.floor(G.blocks))}`;
    return `${G.crew[0].name}, day ${G.day}, ${at}`.slice(0, 33);
  },

  // Returns a slot number, or 0 for back. `existing` only offers full slots.
  async pickSlot(question, existing) {
    const opts = Save.list().map(s => ({ k: String(s.slot), label: Title.slotLabel(s), disabled: existing && !s.G }));
    opts.push({ k: '0', label: 'Back' });
    const k = await UI.menu(UI.hi(UI.center('SAVED TRIPS')) + '\n\n' + UI.t(question) + '\n', opts);
    return parseInt(k, 10);
  },

  bar(v) { return '[' + '#'.repeat(v) + '-'.repeat(10 - v) + ']'; },

  async soundSettings() {
    while (true) {
      const head = [
        UI.hi(UI.center('SOUND SETTINGS')), '',
        UI.esc(`Music          ${Title.bar(Sound.musicVol)} ${Sound.musicVol}`),
        UI.esc(`Sound effects  ${Title.bar(Sound.sfxVol)} ${Sound.sfxVol}`),
        '',
      ].join('\n');
      const k = await UI.menu(head, [
        { k: '1', label: 'Music softer' },
        { k: '2', label: 'Music louder' },
        { k: '3', label: 'Effects softer' },
        { k: '4', label: 'Effects louder' },
        { k: '0', label: 'Back' },
      ]);
      if (k === '0') return;
      if (k === '1') Sound.setMusicVol(Sound.musicVol - 1);
      if (k === '2') Sound.setMusicVol(Sound.musicVol + 1);
      if (k === '3') Sound.setSfxVol(Sound.sfxVol - 1);
      if (k === '4') { Sound.setSfxVol(Sound.sfxVol + 1); Sound.good(); }
    }
  },

  // Like the original's Management Options: wipe the records.
  async manage() {
    while (true) {
      const k = await UI.menu(UI.hi(UI.center('MANAGEMENT OPTIONS')) + '\n\n' + UI.t('These cannot be undone.') + '\n', [
        { k: '1', label: 'Erase the Hall of Hashers' },
        { k: '2', label: 'Erase old graves' },
        { k: '3', label: 'Erase a saved trip' },
        { k: '0', label: 'Back' },
      ]);
      if (k === '0') return;
      if (k === '1' && await UI.yesNo(UI.t('Reset the Hall of Hashers to the original names?'), 'Erase it?')) {
        Scores.clear();
        await UI.pause(UI.t('The Hall of Hashers has been reset. Glycol Gary is back on top.'));
      }
      if (k === '2' && await UI.yesNo(UI.t(`Remove all ${Graves.all().length} graves left by earlier trips?`), 'Erase them?')) {
        Graves.clear();
        await UI.pause(UI.t('The graves are gone. The coyotes are suspicious.'));
      }
      if (k === '3') {
        const slot = await Title.pickSlot('Which saved trip should be erased?', true);
        if (slot && await UI.yesNo(UI.t(`Erase slot ${slot}: ${Title.slotLabel({ G: Save.load(slot) })}?`), 'Erase it?')) {
          Save.clear(slot);
          await UI.pause(UI.t(`Slot ${slot} is empty.`));
        }
      }
    }
  },

  async learn() {
    const pages = [
      'Try taking a journey across Wolf Hollow, a bitcoin mining site outside Granbury, Texas, with 3,125 Whatsminers and a crew of five.\n\nYour goal is to keep the site alive for 2,016 blocks, until The Halving. Blocks mined is distance. Hashrate is speed.',
      'First you choose a job. A Site Manager starts with the most sats. A Miner Technician starts with the fewest, but scores triple.\n\nYour crew\'s jobs matter. Their perks only work while they are alive.',
      'TUNING: overclocked miners go faster, break more often, and sometimes burn out for good. Worst in the hot aisle. Underclocked miners are slow and stay cool.\n\nSHIFT LENGTH: 12-hour shifts mine more blocks. They also break people.',
      'DIFFICULTY: every two weeks the network retargets. It usually goes up. The longer you take, the harder each block gets.\n\nCorporate projects 300 days to The Halving. Every day you beat it is worth points.',
      'The site has three cooling zones.\n\nAIR: fans and filters. Brutal in summer.\n\nIMMERSION: tanks of dielectric fluid. Keep spare fluid.\n\nHYDRO: water/glycol loops. Keep spare hoses and glycol.',
      'When miners fail, spare parts are used automatically. With no spares, miners go offline until you buy more, trade, or salvage the RMA pile.\n\nIf hashrate hits zero, it is over. If everyone dies, it is also over.\n\nBuy tacos.',
      'Moving between cooling zones means migrating the whole fleet. You can do it live, drain and refill, or pay a contractor.\n\nAt ERCOT Peak you decide whether to curtail. Guess wrong and next year\'s transmission bill comes out of your sats.',
    ];
    for (let i = 0; i < pages.length; i++) {
      await UI.pause(UI.hi(UI.center('LEARN ABOUT THE TRAIL')) + '\n' + UI.rule() + '\n\n' + UI.t(pages[i]) +
        '\n\n' + UI.dim(UI.center(`page ${i + 1} of ${pages.length}`)));
    }
  },
};
