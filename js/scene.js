// The picture above the text window. Screens say what to show:
//   Scene.trail(G)            the scrolling trail (Scene.setMoving while traveling)
//   Scene.show('substation')  a painted place (see js/paint/places.js)
//   Scene.run(fn)             a custom per-frame painter (the salvage game)
// One animation loop draws whatever is current.

const Scene = {
  canvas: null,
  ctx: null,
  view: { mode: 'place', scene: 'title' },
  custom: null,
  t: 0,
  scroll: 0,
  moving: false,
  last: 0,

  init() {
    Scene.canvas = document.getElementById('scene');
    Scene.ctx = Scene.canvas.getContext('2d');
    Scene.ctx.imageSmoothingEnabled = false;
    Scene.layout();
    window.addEventListener('resize', Scene.layout);
    Scene.last = performance.now();
    Scene.schedule();
  },

  // Fit the game to the window: picture over text on tall screens, side by
  // side on wide ones, whichever gives a bigger picture with a full menu
  // (about 17 lines) still visible. Pixel art looks best at whole-number
  // scales, so snap to 2x or 3x when there's room.
  layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const stacked = Math.min(vw - 32, 960, (vh - 106) / 1.6);
    const side = Math.min((vw - 48) / 2, (vh - 70) / 1.05, 800);
    const useSide = side > stacked * 1.15;
    let s = Math.max(300, useSide ? side : stacked) / 320;
    if (s >= 2.85) s = 3; else if (s >= 1.85) s = 2;
    document.documentElement.style.setProperty('--game-w', Math.round(320 * s) + 'px');
    document.getElementById('game').classList.toggle('side', useSide);
  },

  show(scene, params = {}) { Scene.view = { mode: 'place', scene, ...params }; Scene.custom = null; },
  trail(G) { Scene.view = { mode: 'trail', G }; Scene.custom = null; },
  // speed: how fast the scenery scrolls (fast-forward passes its multiplier).
  setMoving(on, speed = 1) { Scene.moving = on; Scene.speed = speed; },
  speed: 1,
  run(fn) { Scene.custom = fn; },
  // An event picture drawn over whatever is showing (null to clear).
  overlay: null,
  overlayAt: 0,
  setOverlay(pic) { Scene.overlay = pic; Scene.overlayAt = Scene.t; },
  save() { return { view: Scene.view, custom: Scene.custom }; },
  restore(s) { Scene.view = s.view; Scene.custom = s.custom; },

  frame(now) {
    const dt = Math.min(0.1, Math.max(0, (now - Scene.last) / 1000));
    Scene.last = now;
    Scene.t += dt;
    const v = Scene.view, C = DATA.config;
    if (Scene.moving) {
      Scene.scroll += dt * 34 * Scene.speed;
      // Time of day turns over every few trail days while you drive.
      if (v.mode === 'trail' && v.G) v.G.tod = ((v.G.tod || 0.25) + dt * Scene.speed / (C.dayNightDays * C.dayMs / 1000)) % 1;
    }
    const ctx = Scene.ctx;
    try {
      if (Scene.custom) Scene.custom(ctx, dt, Scene.t);
      else if (v.mode === 'trail') Trail.draw(ctx, Scene.t, { G: v.G, scroll: Scene.scroll, moving: Scene.moving });
      else Places.draw(ctx, Scene.t, v);
      if (Scene.overlay && !Scene.custom) Vignettes.draw(ctx, Scene.t - Scene.overlayAt, Scene.overlay);
    } catch (e) {
      console.error(e);
    }
    Ambience.set(Scene.ambience());
    Hud.tick(dt);
    Scene.schedule();
  },

  // Background sound to match the picture.
  ambience() {
    if (Scene.custom) return {};
    const v = Scene.view;
    if (v.mode === 'trail') {
      const sky = Trail.skyKey(v.G && v.G.weather);
      return {
        engine: Scene.moving ? 0.045 : 0,
        rain: sky === 'storm' ? 0.06 : 0,
        wind: sky === 'dust' ? 0.14 : sky === 'ice' ? 0.1 : sky === 'cold' ? 0.04 : 0.016,
      };
    }
    return {
      hot_aisle: { wind: 0.12 }, tomb: { wind: 0.06 }, gameover: { wind: 0.08 },
      mempool_swamp: { wind: 0.04 }, title: { wind: 0.025 }, ercot_peak: { wind: 0.04 },
    }[v.scene] || {};
  },

  // requestAnimationFrame, with a timer fallback for contexts that never
  // paint (embedded previews, background tabs). Whichever fires first wins.
  token: 0,
  schedule() {
    const mine = ++Scene.token;
    const go = () => { if (mine !== Scene.token) return; Scene.token++; Scene.frame(performance.now()); };
    requestAnimationFrame(go);
    setTimeout(go, 40);
  },
};

// Status bar under the picture, shown during a game.
const Hud = {
  on: false,
  acc: 1,
  show(on) {
    Hud.on = on;
    document.getElementById('hud').hidden = !on;
    Hud.acc = 1;
  },
  tick(dt) {
    Hud.acc += dt;
    if (!Hud.on || Hud.acc < 0.25 || !window.G) return;
    Hud.acc = 0;
    const G = window.G, w = G.weather || {};
    const items = [
      ['Date', Q.dateStr(G)],
      ['Weather', `${w.label}, ${w.temp}°F`],
      ['Health', Q.groupHealth(G)],
      ['Food', `${U.num(G.s.food)} rations`],
      ['Hashrate', `${Q.hashrate(G).toFixed(1)} PH/s`],
      ['Difficulty', Q.difficulty(G)],
      ['Blocks', `${U.num(Math.floor(G.blocks))} / ${U.num(Q.total(G))}`],
      ['Sats', U.num(G.sats)],
    ];
    const html = items.map(([k, v]) => `<div><span>${k}</span><b>${U.esc(v)}</b></div>`).join('');
    const el = document.getElementById('hud');
    if (el.innerHTML !== html) el.innerHTML = html;
  },
};
