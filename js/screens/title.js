// Title screen and "Learn about the trail".

const Title = {
  head() {
    return [
      UI.dim(UI.center('1,400 miners. 2,016 blocks. One crew.')),
      '',
      'You may:',
    ].join('\n');
  },

  async run() {
    Scene.show('title');
    Hud.show(false);
    Music.play('title');
    const saved = Save.exists();
    const k = await UI.menu(Title.head(), [
      { k: '1', label: 'Travel the trail' },
      { k: '2', label: 'Continue saved game', disabled: !saved },
      { k: '3', label: 'Learn about the trail' },
      { k: '4', label: 'See the Hall of Hashers' },
      { k: '5', label: `Music: ${Sound.musicOn ? 'on' : 'off'}` },
      { k: '6', label: `Sound effects: ${Sound.sfxOn ? 'on' : 'off'}` },
    ]);
    if (k === '1') {
      if (saved && !(await UI.yesNo(UI.t('You have a saved game. Starting over will erase it.'), 'Start over?'))) return;
      const G = await Setup.run();
      Save.write(G);
      await Game.play(G, true);
    } else if (k === '2') {
      const G = Save.load();
      if (G) await Game.play(G, false);
    } else if (k === '3') {
      await Title.learn();
    } else if (k === '4') {
      await Score.hall();
    } else if (k === '5') {
      Sound.setMusic(!Sound.musicOn);
    } else if (k === '6') {
      Sound.setSfx(!Sound.sfxOn);
    }
  },

  async learn() {
    const pages = [
      'Try taking a journey across Wolf Hollow, a bitcoin mining site outside Granbury, Texas, with 1,400 Whatsminers and a crew of five.\n\nYour goal is to keep the site alive for 2,016 blocks, until The Halving. Blocks mined is distance. Hashrate is speed.',
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
