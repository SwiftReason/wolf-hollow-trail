// Boot and top-level flow: title -> setup -> store -> trail -> title.

const Game = {
  async play(G, fresh) {
    window.G = G;   // handy for poking at state in the console
    Hud.show(true);
    if (G.phase === 'store') {
      await Shop.run(G, DATA.landmarks[0], fresh);
      G.phase = 'travel';
      Save.write(G);
      await Landmark.depart(G);
    }
    const r = await Travel.run(G);
    Scene.setMoving(false);
    if (r === 'quit') {
      Save.write(G);
      await UI.pause(UI.t('Your game has been saved. Choose "Continue saved game" from the title screen to pick up where you left off.'));
    }
    Hud.show(false);
  },
};

(async function boot() {
  // Scene text is drawn in pixel fonts; wait for them (but not forever).
  await Promise.race([
    Promise.all(['8px "Press Start 2P"', '16px "Press Start 2P"', '20px Workbench'].map(f => document.fonts.load(f))),
    new Promise(r => setTimeout(r, 3000)),
  ]).catch(() => {});
  Save.migrate();
  Scene.init();
  while (true) {
    try {
      await Title.run();
    } catch (e) {
      console.error(e);
      Hud.show(false);
      await UI.pause(UI.t('Something broke. Like a PSU in August.\n\n' + (e && e.message || e)));
    }
  }
})();
