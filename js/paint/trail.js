// The scrolling trail: sky, parallax mesas, the cooling zone's buildings,
// power lines, the caliche road, weather, and the UTV.
// Static layers are painted once into offscreen canvases and reused.

const Trail = {
  cache: new Map(),
  UTV_X: 112,
  ROAD_Y: 143,          // where the tires touch

  SKIES: {
    clear: [[0, '#2c5fc4'], [0.55, '#6aa2ea'], [1, '#c6e4fb']],
    hot:   [[0, '#5584cc'], [0.5, '#b4c6d8'], [1, '#f6e4b0']],
    storm: [[0, '#1f2434'], [0.55, '#434c62'], [1, '#6a7490']],
    dust:  [[0, '#80694c'], [0.55, '#b4966a'], [1, '#dcc08e']],
    ice:   [[0, '#6c7a92'], [0.55, '#a4b0c2'], [1, '#dbe2ec']],
    cold:  [[0, '#466cae'], [0.55, '#8ea6cc'], [1, '#d2deec']],
  },

  skyKey(w) {
    if (!w) return 'clear';
    if (w.cond === 'storm' || w.cond === 'dust' || w.cond === 'ice') return w.cond;
    if (w.heat === 'veryhot' || w.heat === 'hot') return 'hot';
    if (w.heat === 'cold') return 'cold';
    return 'clear';
  },

  memo(key, build) {
    if (!Trail.cache.has(key)) Trail.cache.set(key, build());
    return Trail.cache.get(key);
  },

  horizon(sky) { const s = Trail.SKIES[sky]; return s[s.length - 1][1]; },

  // ---------------------------------------------------------------- layers
  sky(sky) {
    return Trail.memo('sky:' + sky, () => {
      const c = Gfx.canvas(320, 112), x = c.getContext('2d');
      Gfx.gradient(x, 0, 0, 320, 112, Trail.SKIES[sky]);
      if (sky === 'storm') {
        for (let i = 0; i < 12; i++) Sprites.cloud(x, i * 30 - 10, 10 + (i % 3) * 5, 40, '#2a3042', '#3c4458');
      }
      return c;
    });
  },

  // Two ridgelines of mesas, 640 wide so they tile while scrolling.
  mesas(sky) {
    return Trail.memo('mesa:' + sky, () => {
      const c = Gfx.canvas(640, 52), x = c.getContext('2d');
      const hz = Trail.horizon(sky);
      const far = Gfx.mix('#7a6a98', hz, 0.55), near = Gfx.mix('#8a6a58', hz, 0.3);
      for (let i = 0; i < 640; i++) {
        const hFar = 26 + Math.round(Gfx.ridge(i, 640, 1.3) * 10);
        const mesaTop = Gfx.ridge(i, 640, 4.1, [[2, 1], [5, 0.6]]) > 0.55 ? 6 : 0;   // flat-topped buttes
        Gfx.rect(x, i, 52 - hFar - mesaTop, 1, hFar + mesaTop, far);
        const hNear = 10 + Math.round(Gfx.ridge(i, 640, 2.7, [[2, 1], [4, 0.5], [9, 0.25]]) * 6);
        Gfx.rect(x, i, 52 - hNear, 1, hNear, near);
        if (Gfx.BAYER[i & 3][0] < 6) Gfx.px(x, i, 52 - hNear, Gfx.shade(near, 0.12));
      }
      return c;
    });
  },

  // The cooling zone's buildings. Returns { canvas, fans, stacks } so moving
  // parts can be drawn on top each frame.
  mid(zone, sky) {
    return Trail.memo(`mid:${zone}:${sky}`, () => {
      const c = Gfx.canvas(640, 50), x = c.getContext('2d');
      const fans = [], stacks = [], leds = [];
      const tint = col => Gfx.mix(col, Trail.horizon(sky), 0.18);
      if (zone === 'air') {
        for (let i = 0; i < 4; i++) {
          const bx = 14 + i * 160, by = 20;
          Gfx.rect(x, bx, by, 112, 26, tint('#c9ced6'));
          for (let k = 2; k < 112; k += 3) Gfx.rect(x, bx + k, by + 2, 1, 22, tint('#aeb4be'));
          Gfx.rect(x, bx, by, 112, 2, tint('#e6e9ee'));
          Gfx.rect(x, bx, by + 24, 112, 2, tint('#7c828e'));
          for (let k = 0; k < 4; k++) {
            const fx = bx + 16 + k * 26, fy = by + 12;
            Gfx.disc(x, fx, fy, 7, tint('#4a505c'));
            Gfx.disc(x, fx, fy, 5, tint('#2e333c'));
            fans.push({ x: fx, y: fy, r: 5 });
          }
          Gfx.rect(x, bx + 114, by + 8, 14, 18, tint('#5d7a5a'));          // transformer
          Gfx.rect(x, bx + 116, by + 10, 10, 1, tint('#7c9a78'));
          leds.push({ x: bx + 104, y: by + 4 });
        }
      } else if (zone === 'immersion') {
        for (let i = 0; i < 2; i++) {
          const sx = 8 + i * 320;
          Gfx.poly(x, [[sx, 12], [sx + 220, 12], [sx + 228, 18], [sx - 8, 18]], tint('#5a5f6c'));
          for (let k = 0; k <= 4; k++) Gfx.rect(x, sx + k * 54, 18, 2, 28, tint('#6c717c'));
          for (let k = 0; k < 4; k++) {
            const tx = sx + 6 + k * 54;
            Gfx.rect(x, tx, 32, 44, 14, tint('#e2e6ec'));
            Gfx.rect(x, tx, 30, 44, 3, tint('#38a2da'));
            Gfx.rect(x, tx, 30, 44, 1, tint('#8cd6f6'));
            Gfx.rect(x, tx, 44, 44, 2, tint('#a8aeb8'));
          }
          // Dry cooler between sheds
          const dx = sx + 244;
          Gfx.rect(x, dx, 24, 60, 22, tint('#4a6a54'));
          Gfx.rect(x, dx, 24, 60, 2, tint('#6a8a72'));
          for (let k = 0; k < 2; k++) {
            Gfx.disc(x, dx + 15 + k * 30, 35, 8, tint('#2c3a30'));
            fans.push({ x: dx + 15 + k * 30, y: 35, r: 7 });
          }
        }
      } else {
        for (let i = 0; i < 2; i++) {
          const hx = 6 + i * 320;
          Gfx.rect(x, hx, 14, 150, 34, tint('#c8b896'));
          Gfx.rect(x, hx, 14, 150, 2, tint('#e0d2b0'));
          for (let k = 0; k < 6; k++) Gfx.rect(x, hx + 10 + k * 24, 20, 10, 6, tint('#3a4252'));
          // Supply (blue) and return (red) pipes
          Gfx.rect(x, hx - 6, 32, 300, 4, tint('#3a78d8')); Gfx.rect(x, hx - 6, 32, 300, 1, tint('#7aaef0'));
          Gfx.rect(x, hx - 6, 39, 300, 4, tint('#d24a3c')); Gfx.rect(x, hx - 6, 39, 300, 1, tint('#f08a7a'));
          for (let k = 0; k < 10; k++) {
            Gfx.rect(x, hx + k * 30, 31, 2, 6, tint('#8e98a8'));
            Gfx.rect(x, hx + k * 30, 38, 2, 6, tint('#8e98a8'));
          }
          // Cooling tower
          const cx = hx + 190;
          Gfx.poly(x, [[cx, 48], [cx + 6, 6], [cx + 30, 6], [cx + 36, 48]], tint('#aab2be'));
          Gfx.rect(x, cx + 6, 6, 24, 2, tint('#d0d6de'));
          for (let k = 12; k < 46; k += 6) Gfx.rect(x, cx + 4, k, 28, 1, tint('#9098a6'));
          stacks.push({ x: cx + 18, y: 4 });
          Gfx.rect(x, cx + 50, 22, 40, 26, tint('#8a7e64'));
          Gfx.rect(x, cx + 50, 22, 40, 2, tint('#a89c80'));
          leds.push({ x: cx + 84, y: 26 });
        }
      }
      return { canvas: c, fans, stacks, leds };
    });
  },

  // Ground strip under the horizon, with the road. Tiles at 320.
  groundColors(sky, season) {
    const base = {
      spring: ['#86a04c', '#5e7e32', '#4c7a28'],
      summer: ['#b4a462', '#928446', '#7a7a36'],
      fall:   ['#aa9258', '#8a723e', '#7a6a34'],
      winter: ['#9e8e6c', '#7c6e54', '#6c6448'],
    }[season];
    let [top, bot, tuft] = base, road = '#e6d4a8', rut = '#c4ac7c';
    if (sky === 'ice') { top = '#e0e8f0'; bot = '#b6c4d4'; tuft = '#98a8b8'; road = '#eef3f8'; rut = '#c2cedc'; }
    if (sky === 'storm') { top = Gfx.shade(top, -0.3); bot = Gfx.shade(bot, -0.3); tuft = Gfx.shade(tuft, -0.3); road = '#b4a486'; rut = '#8e8068'; }
    if (sky === 'dust') { top = Gfx.mix(top, '#c8a878', 0.4); bot = Gfx.mix(bot, '#c8a878', 0.3); }
    return { top, bot, tuft, road, rut };
  },

  ground(sky, season) {
    return Trail.memo(`ground:${sky}:${season}`, () => {
      const c = Gfx.canvas(320, 52), x = c.getContext('2d');
      const g = Trail.groundColors(sky, season);
      Gfx.gradient(x, 0, 0, 320, 52, [[0, g.top], [1, g.bot]]);
      Gfx.rect(x, 0, 24, 320, 15, g.road);
      Gfx.speckle(x, 0, 24, 320, 15, g.rut, 0.12);
      Gfx.rect(x, 0, 27, 320, 1, g.rut); Gfx.rect(x, 0, 34, 320, 1, g.rut);
      Gfx.rect(x, 0, 24, 320, 1, Gfx.shade(g.road, -0.12));
      if (sky === 'storm') for (let i = 0; i < 6; i++) Gfx.ellipse(x, 30 + i * 52, 31, 8, 1, '#7f90a8');
      for (let i = 0; i < 40; i++) {
        const px = Math.floor(Gfx.hash(i * 7 + 1) * 310) + 4;
        const py = Gfx.hash(i * 13 + 5) < 0.5 ? 6 + Math.floor(Gfx.hash(i * 3) * 14) : 42 + Math.floor(Gfx.hash(i * 5) * 8);
        Sprites.tuft(x, px, py, g.tuft, Gfx.shade(g.tuft, 0.25));
      }
      if (sky !== 'ice') {
        if (season === 'spring') for (let i = 0; i < 5; i++) Sprites.bluebonnets(x, 20 + i * 64, 20);
        for (let i = 0; i < 3; i++) Sprites.rock(x, 40 + i * 110, 50, Gfx.shade(g.bot, 0.15));
        Sprites.pricklyPear(x, 150, 21);
        Sprites.mesquite(x, 270, 20, season === 'winter' ? '#7a6e4e' : '#4f7a34');
      }
      return c;
    });
  },

  // ------------------------------------------------------------------ draw
  // Draw a 640- or 320-wide layer scrolled by `off`, tiled horizontally.
  tile(ctx, img, off, y) {
    const w = img.width, o = ((Math.floor(off) % w) + w) % w;
    ctx.drawImage(img, -o, y);
    ctx.drawImage(img, w - o, y);
    if (w - o < 320) ctx.drawImage(img, 2 * w - o, y);
  },

  draw(ctx, t, { G, scroll = 0, moving = false }) {
    const w = (G && G.weather) || { cond: 'clear', heat: 'warm', temp: 80 };
    const sky = Trail.skyKey(w);
    const zone = (G && G.zone) || 'air';
    const season = G ? Q.season(G) : 'summer';

    ctx.drawImage(Trail.sky(sky), 0, 0);

    // Sun, clouds
    if (sky === 'clear' || sky === 'hot' || sky === 'cold') {
      const big = sky === 'hot';
      if (big) {
        Gfx.disc(ctx, 263, 23, 17, Gfx.mix('#fff6cc', Trail.SKIES.hot[0][1], 0.55));
        Gfx.disc(ctx, 263, 23, 14, Gfx.mix('#fff6cc', Trail.SKIES.hot[0][1], 0.3));
      }
      Gfx.disc(ctx, 263, 23, big ? 11 : 9, big ? '#fff6cc' : '#fffbe6');
      for (let i = 0; i < 3; i++) {
        const cx = (((i * 140 + 40 - t * (3 + i) - scroll * 0.04) % 420) + 420) % 420 - 50;
        Sprites.cloud(ctx, cx, 16 + i * 11, 24 + i * 8, '#f4f8fc', '#ffffff');
      }
    } else if (sky === 'dust') {
      Gfx.disc(ctx, 263, 26, 9, '#f0dcb0');
    }

    Trail.tile(ctx, Trail.mesas(sky), scroll * 0.1, 42);

    // Buildings with their moving parts
    const mid = Trail.mid(zone, sky), mo = scroll * 0.35;
    Trail.tile(ctx, mid.canvas, mo, 60);
    const at = (lx) => { const sx = ((lx - mo) % 640 + 640) % 640; return sx > 330 ? sx - 640 : sx; };
    for (const f of mid.fans) {
      const fx = at(f.x);
      if (fx < -10 || fx > 330) continue;
      const a = t * 10 + f.x;
      for (let k = 0; k < 3; k++) {
        const ang = a + k * Math.PI * 2 / 3;
        Gfx.line(ctx, fx, 60 + f.y, fx + Math.cos(ang) * (f.r - 1), 60 + f.y + Math.sin(ang) * (f.r - 1), '#9aa2b2');
      }
      Gfx.px(ctx, fx, 60 + f.y, '#d0d6e0');
    }
    for (const s of mid.stacks) {
      const sx = at(s.x);
      if (sx < -20 || sx > 340) continue;
      for (let k = 0; k < 4; k++) {
        const age = (t * 0.4 + k / 4) % 1;
        Gfx.ellipse(ctx, sx + age * 14 - 2, 60 + s.y - age * 22, 4 + Math.round(age * 5), 3 + Math.round(age * 2), Gfx.mix('#f4f6f8', Trail.horizon(sky), age * 0.7));
      }
    }
    for (const l of mid.leds) {
      const lx = at(l.x);
      if (lx > -2 && lx < 322 && Math.floor(t * 2 + l.x) % 3) Gfx.rect(ctx, lx, 60 + l.y, 2, 1, Pal.ledGreen);
    }

    // Power poles and sagging lines
    const po = scroll * 0.6;
    const poleX = k => k * 110 - (((po % 110) + 110) % 110);
    for (let k = 0; k < 5; k++) {
      const x0 = poleX(k), x1 = poleX(k + 1);
      Sprites.pole(ctx, x0, 74, 36);
      for (const dx of [-5, 6]) {
        let px = x0 + dx, py = 76;
        for (let s = 1; s <= 10; s++) {
          const f = s / 10, nx = x0 + dx + (x1 - x0) * f, ny = 76 + Math.round(Math.sin(f * Math.PI) * 5);
          Gfx.line(ctx, px, py, nx, ny, '#3a3a40');
          px = nx; py = ny;
        }
      }
    }

    Trail.tile(ctx, Trail.ground(sky, season), scroll, 108);

    // Heat shimmer over the road on hot days
    if (w.heat === 'veryhot' || w.heat === 'hot') {
      for (let j = 0; j < 6; j++) {
        const yy = 112 + j * 3, sh = Math.round(Math.sin(t * 5 + j) * 2);
        for (let i = 0; i < 320; i += 23) Gfx.rect(ctx, i + sh + j * 7, yy, 6, 1, 'rgba(255,250,230,0.35)');
      }
    }

    // Dust kicked up behind the rear wheel
    const X = Trail.UTV_X, Y = Trail.ROAD_Y - 27;
    if (moving && sky !== 'storm' && sky !== 'ice') {
      const dust = Trail.groundColors(sky, season).road;
      for (let k = 0; k < 6; k++) {
        const age = (t * 1.6 + k / 6) % 1;
        ctx.globalAlpha = 0.8 * (1 - age);
        Gfx.ellipse(ctx, X + 4 - age * 34, Trail.ROAD_Y - 2 - age * 9, 2 + Math.round(age * 4), 1 + Math.round(age * 3), Gfx.shade(dust, 0.15));
      }
      ctx.globalAlpha = 1;
    }
    Gfx.ellipse(ctx, X + 24, Trail.ROAD_Y, 24, 1, 'rgba(0,0,0,0.25)');
    Sprites.utv(ctx, X, Y, { t, moving, cargo: true });

    // Dusk and night wash over everything; then the lights that cut through it.
    const L = Trail.light(G);
    if (L.dusk > 0.01) {
      ctx.fillStyle = `rgba(255,110,50,${(0.2 * L.dusk).toFixed(3)})`;
      ctx.fillRect(0, 0, 320, 160);
    }
    if (L.night > 0.01) {
      ctx.fillStyle = `rgba(8,12,40,${(0.64 * L.night).toFixed(3)})`;
      ctx.fillRect(0, 0, 320, 160);
      ctx.globalAlpha = L.night;
      for (let i = 0; i < 40; i++) {
        if ((Math.floor(t * 2) + i) % 9 === 0) continue;
        Gfx.px(ctx, Math.floor(Gfx.hash(i * 17 + 3) * 320), Math.floor(Gfx.hash(i * 29 + 3) * 48), i % 4 ? '#c8c8e8' : '#ffffff');
      }
      if (sky !== 'storm') { Gfx.disc(ctx, 54, 22, 7, '#ecead4'); Gfx.disc(ctx, 51, 20, 2, '#d0ccb0'); }
      for (const l of mid.leds) {
        const lx = at(l.x);
        if (lx > -4 && lx < 324) { Gfx.rect(ctx, lx - 1, 59 + l.y, 4, 3, 'rgba(92,255,122,0.35)'); Gfx.rect(ctx, lx, 60 + l.y, 2, 1, Pal.ledGreen); }
      }
      for (const f of mid.fans) {
        const fx = at(f.x);
        if (fx > -8 && fx < 328 && (Math.floor(t + f.x) % 3)) Gfx.px(ctx, fx, 60 + f.y - f.r - 2, Pal.ledBlue);
      }
      ctx.fillStyle = `rgba(255,240,170,${(0.22 * L.night).toFixed(3)})`;
      Gfx.poly(ctx, [[X + 46, Y + 11], [X + 120, Y + 2], [X + 120, Y + 32], [X + 46, Y + 14]], `rgba(255,240,170,${(0.2 * L.night).toFixed(3)})`);
      Gfx.rect(ctx, X + 43, Y + 11, 3, 2, Pal.light);
      Gfx.rect(ctx, X, Y + 11, 2, 2, '#ff5040');
      ctx.globalAlpha = 1;
    }

    Trail.weather(ctx, t, sky);
  },

  // Sun height from G.tod (0..1; noon near 0.35, midnight near 0.85).
  light(G) {
    const tod = G && G.tod != null ? G.tod : 0.3;
    const e = Math.cos((tod - 0.35) * Math.PI * 2);
    return { night: U.clamp((-e - 0.05) / 0.45, 0, 1), dusk: U.clamp(1 - Math.abs(e + 0.08) / 0.3, 0, 1) };
  },

  weather(ctx, t, sky) {
    if (sky === 'storm') {
      ctx.fillStyle = 'rgba(190,205,230,0.65)';
      for (let i = 0; i < 90; i++) {
        const sp = 0.6 + Gfx.hash(i) * 0.6;
        const x = (Gfx.hash(i * 3 + 1) * 360 + t * 60 * sp) % 360 - 20;
        const y = (Gfx.hash(i * 7 + 2) * 170 + t * 260 * sp) % 170 - 10;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 4);
      }
      const bolt = Math.floor(t / 4.5), phase = t - bolt * 4.5;
      if (Gfx.hash(bolt) < 0.6 && phase < 0.18) {
        if (Trail.lastBolt !== bolt) {
          Trail.lastBolt = bolt;
          Sound.thunder(0.3 + Gfx.hash(bolt * 9) * 0.9);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(0, 0, 320, 160);
        let bx = 40 + Math.floor(Gfx.hash(bolt * 5) * 240), by = 10;
        while (by < 96) {
          const nx = bx + Math.round((Gfx.hash(bx * 31 + by) - 0.5) * 12), ny = by + 8;
          Gfx.line(ctx, bx, by, nx, ny, '#ffffff');
          bx = nx; by = ny;
        }
      }
    } else if (sky === 'dust') {
      ctx.fillStyle = 'rgba(200,160,110,0.22)';
      ctx.fillRect(0, 0, 320, 160);
      ctx.fillStyle = 'rgba(150,115,75,0.8)';
      for (let i = 0; i < 70; i++) {
        const x = ((Gfx.hash(i * 5) * 340) - t * (90 + Gfx.hash(i) * 80)) % 340;
        const y = 40 + Gfx.hash(i * 11) * 120 + Math.sin(t * 3 + i) * 2;
        ctx.fillRect(Math.round(x < 0 ? x + 340 : x), Math.round(y), 2, 1);
      }
    } else if (sky === 'ice') {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i++) {
        const x = (Gfx.hash(i * 3) * 330 + Math.sin(t + i) * 4 - t * 12) % 330;
        const y = (Gfx.hash(i * 7) * 170 + t * (30 + Gfx.hash(i) * 30)) % 170;
        ctx.fillRect(Math.round(x < 0 ? x + 330 : x), Math.round(y) - 5, 1, 1);
      }
    }
  },
};
