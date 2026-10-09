// Painted still scenes: title, landmarks, store, tombstone, game over, map.
// Each scene has paint(ctx, p) for the static picture (cached) and an
// optional anim(ctx, t, p) for things that move.

const Places = {
  cache: new Map(),

  draw(ctx, t, p) {
    const S = Places.scenes[p.scene] || Places.scenes.wolf_hollow;
    const key = p.scene + '|' + (S.key ? S.key(p) : '');
    let img = Places.cache.get(key);
    if (!img) {
      img = Gfx.canvas(320, 160);
      S.paint(img.getContext('2d'), p);
      if (Places.cache.size > 30) Places.cache.clear();
      Places.cache.set(key, img);
    }
    ctx.drawImage(img, 0, 0);
    if (S.anim) S.anim(ctx, t, p);
    if (S.park) Places.parked(ctx, t, p, S.park);
  },

  // The UTV parked at a landmark; when `arrive` is set it drives in first.
  parked(ctx, t, p, [px, py]) {
    let x = px, moving = false;
    if (p.arrive != null) {
      const k = U.clamp((t - p.arrive) / 1.8, 0, 1);
      x = Math.round(-56 + (px + 56) * (1 - Math.pow(1 - k, 3)));
      moving = k < 1;
      if (moving) {
        for (let i = 0; i < 4; i++) {
          const a = (t * 1.6 + i / 4) % 1;
          ctx.globalAlpha = 0.7 * (1 - a);
          Gfx.ellipse(ctx, x + 4 - a * 26, py + 25 - a * 7, 2 + Math.round(a * 4), 1 + Math.round(a * 2), '#e6d8b4');
        }
        ctx.globalAlpha = 1;
      }
    }
    Gfx.ellipse(ctx, x + 24, py + 27, 24, 1, 'rgba(0,0,0,0.25)');
    Sprites.utv(ctx, x, py, { t, moving });
  },

  // ------------------------------------------------------------- helpers
  sky(x, stops, h = 112) { Gfx.gradient(x, 0, 0, 320, h, stops); },
  daySky(x, h = 112) { Places.sky(x, [[0, '#2c5fc4'], [0.55, '#6aa2ea'], [1, '#c6e4fb']], h); },
  ground(x, y, top, bot) { Gfx.gradient(x, 0, y, 320, 160 - y, [[0, top], [1, bot]]); },
  mesas(x, y, far, near, seed = 1) {
    for (let i = 0; i < 320; i++) {
      const hf = 18 + Math.round(Gfx.ridge(i, 320, seed) * 7) + (Gfx.ridge(i, 320, seed + 3, [[2, 1], [5, 0.6]]) > 0.6 ? 5 : 0);
      Gfx.rect(x, i, y - hf, 1, hf, far);
      const hn = 8 + Math.round(Gfx.ridge(i, 320, seed + 1.7, [[2, 1], [4, 0.5]]) * 5);
      Gfx.rect(x, i, y - hn, 1, hn, near);
    }
  },
  stars(x, n, maxY, seed = 3) {
    for (let i = 0; i < n; i++) {
      Gfx.px(x, Math.floor(Gfx.hash(i * 17 + seed) * 320), Math.floor(Gfx.hash(i * 29 + seed) * maxY), i % 5 ? '#c8c8e8' : '#ffffff');
    }
  },
  twinkle(ctx, t, n, maxY, seed = 3) {
    for (let i = 0; i < n; i += 4) {
      if (Math.floor(t * 3 + i) % 5 === 0) {
        Gfx.px(ctx, Math.floor(Gfx.hash(i * 17 + seed) * 320), Math.floor(Gfx.hash(i * 29 + seed) * maxY), '#ffffff');
      }
    }
  },
  // A board with centered text. Grows (around its center) to fit the text.
  sign(x, sx, sy, w, h, bg, border, lines, color, size = 8) {
    const needW = Math.max(...lines.map(l => Gfx.textWidth(l, size))) + 12;
    if (needW > w) { sx -= Math.ceil((needW - w) / 2); w = needW; }
    h = Math.max(h, 4 + lines.length * (size + 2));
    Gfx.rect(x, sx, sy, w, h, border);
    Gfx.rect(x, sx + 1, sy + 1, w - 2, h - 2, bg);
    lines.forEach((ln, i) => Gfx.text(x, ln, sx + w / 2, sy + 3 + i * (size + 2), color, { align: 'center', size }));
  },
  outlined(x, str, cx, y, fill, edge, size) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1], [2, 2]]) {
      Gfx.text(x, str, cx + dx, y + dy, edge, { align: 'center', size });
    }
    Gfx.text(x, str, cx, y, fill, { align: 'center', size });
  },
  // Steel lattice tower between two x positions.
  lattice(x, x0, y0, w, h, c) {
    Gfx.rect(x, x0, y0, 2, h, c); Gfx.rect(x, x0 + w - 2, y0, 2, h, c);
    for (let y = y0; y < y0 + h - 8; y += 10) {
      Gfx.line(x, x0, y, x0 + w - 1, y + 10, c); Gfx.line(x, x0 + w - 1, y, x0, y + 10, c);
      Gfx.rect(x, x0, y, w, 1, c);
    }
  },

  scenes: {
    // ---------------------------------------------------------------- title
    title: {
      paint(x) {
        Places.sky(x, [[0, '#140f36'], [0.4, '#46205e'], [0.72, '#b44a4a'], [0.9, '#f08a40'], [1, '#ffc060']]);
        Places.stars(x, 60, 50);
        Gfx.disc(x, 160, 104, 28, '#ffd36a');
        for (const [y, h] of [[86, 1], [92, 2], [98, 2], [104, 3]]) Gfx.rect(x, 128, y, 64, h, '#e8704a');
        Places.mesas(x, 112, '#5a2a5a', '#3a1a40', 2.2);
        Gfx.poly(x, [[14, 112], [24, 84], [100, 84], [112, 112]], '#2c1434');
        Sprites.wolf(x, 48, 64, '#160a1e');
        for (let i = 0; i < 4; i++) {
          const cx = 196 + i * 30;
          Gfx.rect(x, cx, 96, 26, 16, '#2a1636');
          Gfx.rect(x, cx, 96, 26, 1, '#3e2450');
        }
        Places.ground(x, 112, '#2a1830', '#120a1a');
        Gfx.poly(x, [[150, 112], [176, 112], [250, 160], [120, 160]], '#3a2440');
        Places.outlined(x, 'WOLF HOLLOW', 160, 10, '#ffd25a', '#2a0f20', 16);
        Places.outlined(x, 'TRAIL', 160, 30, '#ffb03a', '#2a0f20', 16);
        Gfx.text(x, 'GRANBURY, TEXAS', 160, 52, '#f4d8b0', { align: 'center', shadow: '#2a0f20' });
      },
      anim(ctx, t) {
        Places.twinkle(ctx, t, 60, 50);
        for (let i = 0; i < 4; i++) {
          for (let k = 0; k < 5; k++) {
            if ((Math.floor(t * 2) + i * 3 + k) % 4) Gfx.px(ctx, 199 + i * 30 + k * 5, 102, k % 2 ? Pal.ledGreen : Pal.ledBlue);
          }
        }
        Sprites.utv(ctx, 152, 124, { t, moving: false });
      },
    },

    // ------------------------------------------------------------ landmarks
    wolf_hollow: {
      paint(x) {
        Places.daySky(x);
        Places.mesas(x, 100, '#9a8aae', '#a08068', 1.1);
        for (let i = 0; i < 5; i++) {
          Gfx.rect(x, 8 + i * 64, 82, 54, 18, '#c9ced6');
          for (let k = 2; k < 54; k += 3) Gfx.rect(x, 10 + i * 64 + k, 84, 1, 14, '#aeb4be');
        }
        Places.ground(x, 100, '#c8b47e', '#9a8656');
        Sprites.fence(x, 0, 98, 120, 16, '#8a9098');
        Sprites.fence(x, 200, 98, 120, 16, '#8a9098');
        Gfx.poly(x, [[136, 114], [184, 114], [236, 160], [84, 160]], '#e6d4a8');
        for (const px of [118, 190]) {
          Gfx.rect(x, px, 64, 12, 52, '#a08a6a');
          Gfx.speckle(x, px, 64, 12, 52, '#857054', 0.3);
          Gfx.rect(x, px - 1, 62, 14, 3, '#7a6448');
        }
        Places.sign(x, 116, 46, 88, 20, '#6a4a2e', '#3a2614', ['WOLF HOLLOW', 'MINING'], '#f6ead0');
        Sprites.wolf(x, 147, 26, '#2a2420');
        Sprites.pricklyPear(x, 40, 140);
        Sprites.person(x, 210, 120, {});
      },
      park: [30, 118],
    },

    substation: {
      park: [40, 128],
      paint(x) {
        Places.daySky(x);
        Places.mesas(x, 100, '#9a8aae', '#a08068', 3.3);
        Places.ground(x, 100, '#9e9e96', '#76766e');
        Gfx.speckle(x, 0, 100, 320, 60, '#b8b8b0', 0.2);
        Places.lattice(x, 30, 34, 50, 74, '#8a929e');
        Places.lattice(x, 236, 30, 54, 78, '#8a929e');
        for (let s = 0; s <= 40; s++) {
          const f = s / 40, sag = Math.round(Math.sin(f * Math.PI) * 8);
          Gfx.px(x, 80 + f * 156, 40 + sag, '#3a3a42');
          Gfx.px(x, 80 + f * 156, 48 + sag, '#3a3a42');
        }
        for (const tx of [104, 168]) {
          Gfx.rect(x, tx, 78, 50, 34, '#7a8290');
          for (let k = 3; k < 50; k += 4) Gfx.rect(x, tx + k, 82, 2, 26, '#5e6672');
          Gfx.rect(x, tx, 78, 50, 2, '#9aa2ae');
          for (let b = 0; b < 3; b++) {
            for (let d = 0; d < 4; d++) Gfx.rect(x, tx + 8 + b * 16, 76 - d * 3, 6, 2, d % 2 ? '#c8b8a0' : '#a8987e');
          }
        }
        Sprites.fence(x, 0, 116, 320, 26, '#8e949c');
        Places.sign(x, 132, 118, 56, 20, '#f4f4f0', '#3a3a3a', ['DANGER', 'HI VOLT'], '#c8241c');
      },
      anim(ctx, t) {
        if (Math.floor(t * 7) % 23 === 0) {
          Gfx.px(ctx, 113, 64, '#fff6a0'); Gfx.px(ctx, 115, 66, '#ffe060'); Gfx.px(ctx, 112, 67, '#fff6a0');
        }
      },
    },

    hot_aisle: {
      paint(x) {
        Gfx.rect(x, 0, 0, 320, 160, '#1a1416');
        Gfx.poly(x, [[0, 0], [320, 0], [194, 50], [126, 50]], '#2a2024');
        for (let k = 0; k < 5; k++) Gfx.line(x, 40 + k * 60, 0, 140 + k * 10, 50, '#3a3036');
        Gfx.poly(x, [[0, 160], [320, 160], [194, 82], [126, 82]], '#4a3e3e');
        for (let k = 0; k < 7; k++) Gfx.line(x, k * 53, 160, 160, 82, '#5a4c4a');
        // Racks of miners converging on the end of the aisle
        for (const side of [-1, 1]) {
          const xs = [0, 34, 60, 80, 96, 108, 117, 123, 126];
          for (let i = 0; i < xs.length - 1; i++) {
            const a = side < 0 ? xs[i] : 320 - xs[i + 1], b = side < 0 ? xs[i + 1] : 320 - xs[i];
            const near = side < 0 ? a : 320 - b;
            const top = 50 * near / 126 + 2, bot = 160 - 78 * near / 126 - 2;
            Gfx.rect(x, a, top, b - a, bot - top, '#26262e');
            const rows = 6;
            for (let r = 0; r < rows; r++) {
              const y0 = top + (bot - top) * r / rows + 1, h = (bot - top) / rows - 2;
              Gfx.rect(x, a + 1, y0, b - a - 2, h, '#3c3c46');
              if (b - a > 10) Gfx.disc(x, (a + b) / 2, y0 + h / 2, Math.max(1, Math.floor(Math.min(b - a, h) / 2) - 2), '#1e1e24');
            }
          }
        }
        // Heat
        x.globalAlpha = 0.16;
        for (let k = 0; k < 4; k++) Gfx.ellipse(x, 160, 70, 40 + k * 22, 22 + k * 14, '#ff5a1e');
        x.globalAlpha = 1;
        Places.sign(x, 136, 14, 48, 16, '#0e0e10', '#4a4a50', ['117 F'], '#ff3a2a');
        Sprites.person(x, 156, 90, { hat: '#f6c432' });
      },
      anim(ctx, t) {
        for (let j = 0; j < 8; j++) {
          const y = 40 + j * 9, sh = Math.round(Math.sin(t * 4 + j) * 3);
          Gfx.rect(ctx, 120 + sh, y, 80, 1, 'rgba(255,200,140,0.18)');
        }
        for (let i = 0; i < 30; i++) {
          if ((Math.floor(t * 3) + i) % 4) continue;
          const side = i % 2 ? 1 : -1, near = (i * 37) % 110;
          const lx = side < 0 ? near + 3 : 317 - near;
          const ly = 50 * near / 126 + 8 + ((i * 23) % Math.max(20, 100 - near));
          Gfx.px(ctx, lx, ly, i % 3 ? Pal.ledGreen : Pal.ledBlue);
        }
      },
    },

    immersion_lake: {
      paint(x) {
        Gfx.rect(x, 0, 0, 320, 100, '#5a6270');
        for (let k = 0; k < 320; k += 4) Gfx.rect(x, k, 0, 1, 100, '#4c5462');
        Gfx.rect(x, 0, 0, 320, 8, '#2e333c');
        for (let k = 0; k < 320; k += 40) Gfx.rect(x, k, 8, 3, 92, '#3a404a');
        Places.sign(x, 62, 26, 196, 14, '#f2c230', '#3a3020', ['DIELECTRIC. DO NOT DRINK.'], '#1a1a1a');
        Places.ground(x, 100, '#6c6c74', '#4e4e56');
        Gfx.speckle(x, 0, 120, 320, 40, '#7aa0c0', 0.08);
        for (let i = 0; i < 3; i++) {
          const tx = 12 + i * 102;
          Gfx.rect(x, tx, 70, 92, 50, '#dfe4ea');
          Gfx.rect(x, tx, 70, 92, 3, '#a8b0bc');
          Gfx.rect(x, tx + 3, 66, 86, 6, '#3aa6dc');
          for (let k = 0; k < 6; k++) Gfx.rect(x, tx + 8 + k * 13, 68, 8, 4, '#1d5c86');
          Gfx.rect(x, tx, 114, 92, 6, '#b8c0ca');
          Gfx.text(x, `TANK ${i * 3 + 4}`, tx + 46, 92, '#5a6270', { align: 'center' });
        }
        Gfx.rect(x, 0, 124, 320, 2, '#f2c230');
        Gfx.rect(x, 0, 134, 320, 2, '#f2c230');
        for (let k = 6; k < 320; k += 40) Gfx.rect(x, k, 124, 2, 24, '#d0a020');
      },
      anim(ctx, t) {
        for (let i = 0; i < 3; i++) {
          const tx = 12 + i * 102;
          for (let k = 0; k < 6; k++) {
            const rx = tx + 4 + ((k * 17 + t * 12) % 84);
            Gfx.rect(ctx, rx, 66 + (k % 2) * 3, 3, 1, '#9ce0fa');
          }
          const by = 72 - ((t * 10 + i * 4) % 8);
          Gfx.px(ctx, tx + 20 + i * 9, by, '#cfefff');
        }
      },
    },

    hydro_pass: {
      park: [196, 128],
      paint(x) {
        Places.daySky(x);
        Places.mesas(x, 96, '#9a8aae', '#a08068', 5.5);
        Gfx.rect(x, 0, 36, 236, 76, '#c8b896');
        Gfx.rect(x, 0, 36, 236, 3, '#e0d2b0');
        Places.ground(x, 110, '#a8a49a', '#7e7a72');
        Gfx.poly(x, [[246, 110], [254, 30], [290, 30], [298, 110]], '#aab2be');
        Gfx.rect(x, 254, 30, 36, 3, '#d0d6de');
        for (let k = 40; k < 108; k += 8) Gfx.rect(x, 250, k, 44, 1, '#9098a6');
        // Supply and return headers
        Gfx.rect(x, 0, 66, 250, 7, '#3a78d8'); Gfx.rect(x, 0, 66, 250, 2, '#7aaef0');
        Gfx.rect(x, 0, 80, 250, 7, '#d24a3c'); Gfx.rect(x, 0, 80, 250, 2, '#f08a7a');
        for (let k = 20; k < 250; k += 34) {
          Gfx.rect(x, k, 64, 3, 11, '#8e98a8'); Gfx.rect(x, k, 78, 3, 11, '#8e98a8');
          Gfx.rect(x, k + 12, 87, 4, 10, '#d24a3c'); Gfx.rect(x, k + 18, 73, 4, 24, '#3a78d8');
          Gfx.rect(x, k + 6, 97, 26, 13, '#3a404c');
          Gfx.px(x, k + 9, 100, Pal.ledGreen); Gfx.px(x, k + 13, 100, Pal.ledGreen);
        }
        for (const vx of [70, 170]) {
          Gfx.rect(x, vx, 56, 1, 10, '#5a5a62');
          Gfx.ellipse(x, vx, 54, 6, 2, '#d8392e'); Gfx.ellipse(x, vx, 54, 4, 1, '#c8b896');
        }
        Gfx.text(x, 'SUPPLY >', 6, 56, '#1d4f9e');
        Gfx.text(x, '< RETURN', 120, 90, '#9e2a1e');
        Gfx.disc(x, 120, 50, 8, '#3a3a42'); Gfx.disc(x, 120, 50, 7, '#f4f4f0');
      },
      anim(ctx, t) {
        const a = -Math.PI * 0.75 + Math.sin(t * 2.3) * 0.25 + 0.9;
        Gfx.line(ctx, 120, 50, 120 + Math.cos(a) * 6, 50 + Math.sin(a) * 6, '#c8241c');
        Gfx.px(ctx, 120, 50, '#1a1a1a');
        for (let k = 0; k < 5; k++) {
          const age = (t * 0.35 + k / 5) % 1;
          Gfx.ellipse(ctx, 272 + age * 18, 26 - age * 26, 6 + Math.round(age * 8), 4 + Math.round(age * 3), Gfx.mix('#f6f8fa', '#9ac0ea', age));
        }
        for (let i = 0; i < 4; i++) {
          if (Math.floor(t * 2 + i) % 3 === 0) Gfx.px(ctx, 40 + i * 34 + 3, 101, '#1d6a32');
        }
      },
    },

    ercot_peak: {
      park: [232, 118],
      paint(x) {
        Places.sky(x, [[0, '#4a1a2a'], [0.5, '#c0442e'], [0.85, '#f09a40'], [1, '#ffd27a']]);
        Gfx.disc(x, 250, 96, 22, '#ffe08a');
        Places.mesas(x, 112, '#7a3040', '#4a1e28', 6.6);
        Places.ground(x, 112, '#4a2a22', '#24140e');
        for (const tx of [20, 274]) {
          Gfx.poly(x, [[tx, 112], [tx + 12, 30], [tx + 16, 30], [tx + 28, 112]], '#2a1418');
          Gfx.rect(x, tx - 6, 40, 40, 3, '#2a1418'); Gfx.rect(x, tx - 2, 56, 32, 2, '#2a1418');
        }
        for (let s = 0; s <= 60; s++) {
          const f = s / 60, sag = Math.round(Math.sin(f * Math.PI) * 10);
          Gfx.px(x, 22 + f * 254, 42 + sag, '#2a1418'); Gfx.px(x, 22 + f * 254, 57 + sag, '#2a1418');
        }
        Gfx.rect(x, 120, 92, 4, 22, '#2a2a30'); Gfx.rect(x, 196, 92, 4, 22, '#2a2a30');
        Gfx.rect(x, 88, 24, 144, 70, '#3a3a44');
        Gfx.rect(x, 91, 27, 138, 64, '#0e1016');
        Gfx.text(x, 'ERCOT SYSTEM LOAD', 160, 31, '#ffb030', { align: 'center' });
        Gfx.rect(x, 98, 46, 1, 38, '#3a4050'); Gfx.rect(x, 98, 84, 124, 1, '#3a4050');
      },
      anim(ctx, t) {
        let px = 100, py = 80;
        const n = Math.min(24, Math.floor(t * 6) % 30);
        for (let i = 1; i <= n; i++) {
          const nx = 100 + i * 5, ny = 80 - Math.round(i * 1.3 + Math.sin(i * 1.7) * 3);
          Gfx.line(ctx, px, py, nx, ny, '#ff4a3a');
          px = nx; py = ny;
        }
        if (Math.floor(t * 2) % 2) Gfx.text(ctx, 'PEAK', 196, 48, '#ff4a3a');
      },
    },

    difficulty_adj: {
      paint(x) {
        Gfx.rect(x, 0, 0, 320, 160, '#1c2230');
        Gfx.rect(x, 0, 112, 320, 48, '#2a2a34');
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 4; c++) {
            if (r === 0 && (c === 1 || c === 2)) continue;
            const mx = 16 + c * 74, my = 12 + r * 46;
            Gfx.rect(x, mx, my, 66, 40, '#3a4458'); Gfx.rect(x, mx + 2, my + 2, 62, 36, '#0b1220');
          }
        }
        Gfx.rect(x, 88, 8, 144, 50, '#4a5468'); Gfx.rect(x, 91, 11, 138, 44, '#08101c');
        Gfx.text(x, 'DIFFICULTY', 160, 15, '#5cff7a', { align: 'center' });
        Gfx.rect(x, 104, 32, 112, 10, '#2a3a2e'); Gfx.rect(x, 106, 34, 54, 6, '#5cff7a');
        Gfx.text(x, '50%', 160, 45, '#a8ffb8', { align: 'center' });
        Gfx.rect(x, 40, 114, 240, 10, '#4a3a30'); Gfx.rect(x, 40, 114, 240, 2, '#6a5444');
        Gfx.rect(x, 70, 104, 10, 10, '#d8d8d0'); Gfx.rect(x, 80, 106, 3, 4, '#d8d8d0');
        Sprites.person(x, 220, 100, { hat: '#2a3a5a', shirt: '#4a5a7a', plain: true, cap: true });
      },
      anim(ctx, t) {
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 4; c++) {
            if (r === 0 && (c === 1 || c === 2)) continue;
            const mx = 18 + c * 74, my = 14 + r * 46;
            let py = my + 24;
            for (let i = 0; i < 30; i++) {
              const ny = my + 24 - Math.round(Math.sin((i + t * 8 + c * 5) * 0.5) * 6 + i * 0.3);
              Gfx.px(ctx, mx + 2 + i * 2, ny, '#5cff7a');
              py = ny;
            }
          }
        }
        if (Math.floor(t * 2) % 2) Gfx.rect(ctx, 160, 34, 2, 6, '#ffffff');
      },
    },

    mempool_swamp: {
      paint(x) {
        Places.sky(x, [[0, '#26352f'], [0.7, '#5e7262'], [1, '#8a9c7c']], 100);
        Places.mesas(x, 100, '#4e6052', '#3a4a3e', 7.7);
        Gfx.gradient(x, 0, 100, 320, 60, [[0, '#2e4a3a'], [1, '#13281c']]);
        for (let k = 0; k < 14; k++) Gfx.rect(x, (k * 47) % 300, 106 + k * 4, 30, 1, '#4a6a54');
        for (const [tx, h] of [[30, 80], [96, 64], [250, 88], [292, 70]]) {
          Gfx.poly(x, [[tx - 8, 110], [tx - 2, 110 - h], [tx + 4, 110 - h], [tx + 10, 110]], '#3a2e22');
          Gfx.ellipse(x, tx + 1, 104 - h, 18, 8, '#24361e');
          Gfx.speckle(x, tx - 16, 98 - h, 34, 12, '#34502a', 0.3);
          for (let m = 0; m < 6; m++) Gfx.rect(x, tx - 12 + m * 5, 108 - h, 1, 6 + (m % 3) * 4, '#8a9a6a');
        }
        Gfx.rect(x, 156, 82, 3, 30, '#5a4230');
        Places.sign(x, 132, 70, 64, 14, '#8a6a44', '#4a3420', ['512 sat/vB'], '#f4e8c8');
      },
      anim(ctx, t) {
        for (let i = 0; i < 6; i++) {
          const bx = 20 + i * 50 + Math.sin(t * 0.6 + i) * 4, by = 122 + (i % 3) * 10 + Math.round(Math.sin(t * 2 + i) * 1.5);
          Gfx.rect(ctx, bx, by, 18, 9, '#c8b080'); Gfx.rect(ctx, bx, by, 18, 1, '#e4d0a4');
          Gfx.text(ctx, 'tx', bx + 9, by + 1, '#4a3a20', { align: 'center' });
        }
        ctx.fillStyle = 'rgba(220,235,220,0.18)';
        for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(((t * (6 + i * 3) + i * 90) % 420) - 100), 92 + i * 9, 120, 4);
        for (let i = 0; i < 10; i++) if (Math.floor(t * 2 + i * 1.7) % 4 === 0) Gfx.px(ctx, Gfx.hash(i) * 320, 60 + Gfx.hash(i * 3) * 50, '#f4f070');
      },
    },

    loading_dock: {
      park: [150, 124],
      paint(x) {
        Places.daySky(x, 30);
        Gfx.rect(x, 0, 20, 320, 96, '#8a909a');
        for (let k = 0; k < 320; k += 3) Gfx.rect(x, k, 20, 1, 96, '#7a808a');
        Gfx.rect(x, 0, 20, 320, 3, '#a8aeb8');
        for (let d = 0; d < 3; d++) {
          const dx = 22 + d * 100;
          Places.sign(x, dx + 14, 30, 48, 12, '#2a5aa8', '#1a3a70', [`DOCK ${d + 1}`], '#ffffff');
          if (d === 1) {
            Gfx.rect(x, dx, 46, 76, 62, '#22252c');
            Gfx.rect(x, dx + 6, 84, 24, 20, '#d8dce4'); Gfx.rect(x, dx + 6, 104, 24, 4, '#a07a48');
            Gfx.rect(x, dx + 36, 76, 30, 28, '#c8b080'); Gfx.rect(x, dx + 36, 104, 30, 4, '#a07a48');
          } else {
            Gfx.rect(x, dx, 46, 76, 62, '#c0c4cc');
            for (let k = 0; k < 62; k += 4) Gfx.rect(x, dx, 46 + k, 76, 1, '#9aa0aa');
          }
          Gfx.rect(x, dx - 4, 46, 4, 62, '#2a2a30'); Gfx.rect(x, dx + 76, 46, 4, 62, '#2a2a30');
        }
        Places.ground(x, 112, '#4a4c52', '#34363c');
        for (let k = 0; k < 320; k += 26) Gfx.rect(x, k, 136, 14, 2, '#e8c020');
        Gfx.rect(x, 14, 120, 30, 22, '#e0e4ea'); Gfx.rect(x, 14, 120, 30, 2, '#ffffff'); Gfx.rect(x, 14, 142, 30, 4, '#a07a48');
        Gfx.rect(x, 248, 114, 26, 18, '#f2b42a'); Gfx.rect(x, 252, 104, 2, 28, '#3a3a3a'); Gfx.rect(x, 270, 104, 2, 28, '#3a3a3a');
        Gfx.rect(x, 272, 128, 12, 4, '#3a3a3a');
        Gfx.disc(x, 254, 134, 4, '#1c1e25'); Gfx.disc(x, 268, 134, 4, '#1c1e25');
      },
      anim(ctx, t) { if (Math.floor(t * 3) % 2) Gfx.rect(ctx, 260, 102, 3, 2, '#ffb030'); },
    },

    halving: {
      park: [40, 116],
      paint(x) {
        Places.sky(x, [[0, '#0a0c24'], [1, '#2a2a5a']]);
        Places.stars(x, 80, 100, 9);
        Places.ground(x, 120, '#24283a', '#12141e');
        Places.outlined(x, 'THE HALVING', 160, 8, '#ffd25a', '#2a1a08', 16);
        Gfx.text(x, '3.125  ->  1.5625 BTC', 160, 30, '#f4e8c8', { align: 'center' });
        // One coin, split down the middle and pulled apart.
        for (const [cx, sgn] of [[150, -1], [170, 1]]) {
          x.save();
          x.beginPath();
          x.rect(sgn < 0 ? cx - 23 : cx, 50, 23, 56);
          x.clip();
          Gfx.ellipse(x, cx, 78, 22, 22, '#c88a10');
          Gfx.ellipse(x, cx, 78, 19, 19, '#f2b630');
          Gfx.ellipse(x, cx - 6 * -sgn, 70, 4, 8, '#ffd870');
          Gfx.rect(x, sgn < 0 ? cx - 2 : cx, 62, 2, 32, '#c88a10');
          x.restore();
        }
        for (let i = 0; i < 4; i++) Sprites.person(x, 210 + i * 12, 118, { hat: Pal.helmet });
      },
      anim(ctx, t) {
        Places.twinkle(ctx, t, 80, 100, 9);
        for (let f = 0; f < 3; f++) {
          const cycle = Math.floor(t / 1.6 + f * 0.33), age = (t / 1.6 + f * 0.33) % 1;
          const cx = 40 + Gfx.hash(cycle * 3 + f) * 240, cy = 30 + Gfx.hash(cycle * 7 + f) * 30;
          const col = ['#ff5a5a', '#5ac8ff', '#ffd25a', '#9aff7a'][(cycle + f) % 4];
          for (let k = 0; k < 12; k++) {
            const a = k * Math.PI / 6, r = age * 18;
            Gfx.px(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r + age * age * 6, col);
          }
        }
      },
    },

    north_forty: {
      park: [24, 122],
      paint(x) {
        Places.sky(x, [[0, '#4a7ad0'], [0.6, '#b0c8e0'], [1, '#f4e2b0']]);
        Gfx.disc(x, 70, 24, 12, '#fff6cc');
        Places.mesas(x, 98, '#a49aa8', '#a88a6a', 10.4);
        Places.ground(x, 98, '#b88e5a', '#94703e');
        Gfx.speckle(x, 0, 100, 320, 60, '#a8804e', 0.25);
        // New containers, one still on the crane
        for (let i = 0; i < 4; i++) {
          const cx = 96 + i * 54;
          Gfx.rect(x, cx, 80, 48, 22, '#e4e8ee');
          for (let k = 2; k < 48; k += 3) Gfx.rect(x, cx + k, 82, 1, 18, '#c8ccd4');
          Gfx.disc(x, cx + 14, 91, 5, '#4a505c'); Gfx.disc(x, cx + 32, 91, 5, '#4a505c');
        }
        // Crane: mast, boom, cab
        Gfx.rect(x, 282, 30, 6, 74, '#e0b020');
        for (let y = 30; y < 100; y += 6) Gfx.line(x, 282, y, 287, y + 6, '#a07a10');
        Gfx.line(x, 285, 32, 196, 12, '#e0b020', 2);
        Gfx.rect(x, 276, 92, 20, 12, '#e0b020'); Gfx.rect(x, 280, 94, 8, 5, '#9ac8f0');
        // Survey stakes and the sign
        for (let i = 0; i < 6; i++) { Gfx.rect(x, 20 + i * 14, 108, 1, 6, '#f4f4f0'); Gfx.rect(x, 21 + i * 14, 108, 3, 2, '#ff7a1a'); }
        Gfx.rect(x, 62, 90, 2, 18, '#5a4232');
        Places.sign(x, 36, 78, 56, 14, '#2a5aa8', '#1a3a70', ['PHASE 2'], '#ffffff');
      },
      anim(ctx, t) {
        const sway = Math.round(Math.sin(t * 1.3) * 3), cy = 40 + Math.round(Math.sin(t * 0.7) * 2);
        Gfx.line(ctx, 200, 14, 196 + sway, cy, '#3a3a3a');
        Gfx.line(ctx, 200, 14, 228 + sway, cy, '#3a3a3a');
        Gfx.rect(ctx, 192 + sway, cy, 40, 16, '#e4e8ee');
        for (let k = 2; k < 40; k += 3) Gfx.rect(ctx, 192 + sway + k, cy + 2, 1, 12, '#c8ccd4');
      },
    },

    // ---------------------------------------------------------- crew portraits
    crew: {
      key: p => JSON.stringify(p.crew),
      paint(x, p) {
        Gfx.gradient(x, 0, 0, 320, 160, [[0, '#1c2440'], [1, '#0c1020']]);
        const hats = { manager: '#f4f4f0', electrician: '#f6c432', maintenance: '#ff7a1a', inventory: '#3a8ad8', tech: '#3faa5a' };
        const skins = ['#f0c8a0', '#e2a878', '#c8885a', '#9a6040', '#6a4228'];
        const hairs = ['#2a1a10', '#6a4a2a', '#c89a5a', '#1a1a1a', '#8a8a8a'];
        p.crew.forEach((c, i) => {
          const px = 6 + i * 62, cx = px + 29, h = Gfx.hash([...c.name].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
          const g = col => c.alive ? col : Gfx.mix(col, '#7a7a80', 0.85);
          const tint = col => c.alive && c.sick ? Gfx.mix(col, '#9ac070', 0.25) : g(col);
          Gfx.rect(x, px, 10, 58, 112, '#0a0e1c');
          Gfx.rect(x, px + 1, 11, 56, 110, g('#2b4c92'));
          Gfx.gradient(x, px + 3, 13, 52, 88, [[0, g('#5a7ac8')], [1, g('#2b4c92')]]);
          const skin = skins[Math.floor(h * skins.length)], hair = hairs[Math.floor(Gfx.hash(Math.floor(h * 1e6)) * hairs.length)];
          Gfx.ellipse(x, cx, 98, 22, 12, tint(c.role === 'inventory' || c.role === 'manager' ? '#4a6a8a' : Pal.vest));
          if (c.role !== 'inventory' && c.role !== 'manager') { Gfx.rect(x, cx - 20, 92, 40, 2, g(Pal.stripe)); }
          Gfx.rect(x, cx - 4, 74, 8, 10, tint(skin));
          Gfx.ellipse(x, cx, 60, 12, 15, tint(skin));
          Gfx.rect(x, cx - 12, 52, 3, 12, g(hair)); Gfx.rect(x, cx + 10, 52, 3, 12, g(hair));
          const hat = hats[c.role] || Pal.helmet;
          if (c.role === 'inventory') { Gfx.ellipse(x, cx, 47, 13, 7, g(hat)); Gfx.rect(x, cx, 49, 17, 3, g(hat)); }
          else { Gfx.ellipse(x, cx, 47, 14, 8, g(hat)); Gfx.rect(x, cx - 16, 50, 32, 3, g(Gfx.shade(hat, -0.2))); }
          if (c.alive) {
            Gfx.rect(x, cx - 6, 59, 3, 3, '#ffffff'); Gfx.rect(x, cx + 3, 59, 3, 3, '#ffffff');
            Gfx.px(x, cx - 5, 60, '#1a1a1a'); Gfx.px(x, cx + 4, 60, '#1a1a1a');
            Gfx.rect(x, cx - 3, 68, 6, 1, c.health >= 45 ? '#8a3a2a' : '#5a2a1a');
            if (c.sick) { Gfx.px(x, cx + 12, 56, '#9ce0fa'); Gfx.px(x, cx + 12, 58, '#9ce0fa'); }
          } else {
            for (const ex of [cx - 5, cx + 4]) { Gfx.line(x, ex - 1, 58, ex + 1, 60, '#2a2a2a'); Gfx.line(x, ex + 1, 58, ex - 1, 60, '#2a2a2a'); }
            Gfx.rect(x, cx - 3, 68, 6, 1, '#3a3a3a');
          }
          const name = c.name.length > 7 ? c.name.slice(0, 6) + '.' : c.name;
          Gfx.text(x, name, cx, 104, c.alive ? '#f4ecd8' : '#8a8a90', { align: 'center' });
          if (c.alive) {
            Gfx.rect(x, px + 5, 116, 48, 4, '#0a0e1c');
            const col = c.health >= 70 ? '#5cff7a' : c.health >= 45 ? '#ffd25a' : c.health >= 20 ? '#ff9a3a' : '#ff4a3a';
            Gfx.rect(x, px + 5, 116, Math.max(2, Math.round(48 * c.health / 100)), 4, col);
          } else {
            Gfx.text(x, 'R.I.P.', cx, 113, '#c8c8d0', { align: 'center' });
          }
        });
        Gfx.text(x, 'THE CREW', 160, 138, '#ffd25a', { align: 'center', shadow: '#000000' });
      },
    },

    // ----------------------------------------------------------- the store
    store: {
      paint(x) {
        Gfx.rect(x, 0, 0, 320, 160, '#7a5634');
        for (let k = 0; k < 160; k += 7) Gfx.rect(x, 0, k, 320, 1, '#5e4026');
        Places.sign(x, 60, 6, 200, 14, '#2a5a3a', '#e8d8a8', ['GRANBURY GENERAL SUPPLY'], '#f4e8c8');
        Gfx.rect(x, 12, 30, 60, 50, '#4a3220'); Gfx.rect(x, 15, 33, 54, 44, '#8ec4f0');
        Gfx.rect(x, 15, 60, 54, 17, '#c8b47e'); Gfx.rect(x, 41, 33, 2, 44, '#4a3220');
        const items = [
          ['#2f7a4a', '#e0b030'], ['#8a929e', '#4a505c'], ['#2f72d4', '#1d4f9e'], ['#b07a3e', '#7c5428'], ['#3c4049', '#7c8494'],
        ];
        for (let s = 0; s < 3; s++) {
          const sy = 40 + s * 26;
          Gfx.rect(x, 86, sy + 18, 220, 3, '#4a3220');
          for (let i = 0; i < 11; i++) {
            const [a, b] = items[(i + s * 2) % items.length];
            const ix = 90 + i * 20, w = 14, h = 10 + ((i + s) % 3) * 3;
            Gfx.rect(x, ix, sy + 18 - h, w, h, a); Gfx.rect(x, ix, sy + 18 - h, w, 1, b);
            if ((i + s) % 5 === 4) Gfx.disc(x, ix + 7, sy + 18 - h / 2, 3, b);
          }
        }
        // Dale, at 2x so he reads as the shopkeeper.
        Sprites.scaled(x, 2, 7, 16, 186, 80, c =>
          Sprites.person(c, 0, 0, { cap: true, hat: '#c8241c', shirt: '#4a6a8a', plain: true, beard: '#6a4a2a' }));
        Gfx.rect(x, 0, 112, 320, 48, '#8a5a30');
        Gfx.rect(x, 0, 112, 320, 4, '#b07a3e');
        for (let k = 0; k < 320; k += 40) Gfx.rect(x, k, 116, 1, 44, '#6a4424');
        Gfx.rect(x, 230, 100, 30, 12, '#3a3a42'); Gfx.rect(x, 234, 102, 22, 5, '#5cff7a');
        Gfx.rect(x, 110, 101, 46, 11, '#f0d070'); Gfx.rect(x, 110, 101, 46, 2, '#ffe8a0');
        Gfx.text(x, 'TACOS', 133, 103, '#7a3a10', { align: 'center' });
      },
      anim(ctx, t) {
        if (Math.floor(t * 1.5) % 3) Gfx.text(ctx, 'OPEN', 42, 40, '#ff4a6a', { align: 'center' });
      },
    },

    // ------------------------------------------------------------ tombstone
    tomb: {
      key: p => `${p.name}|${p.epitaph}|${p.date}`,
      paint(x, p) {
        Places.sky(x, [[0, '#1c1838'], [0.6, '#5a3a6a'], [1, '#c8706a']]);
        Places.stars(x, 40, 60, 5);
        Gfx.disc(x, 272, 26, 10, '#f4ecd0'); Gfx.disc(x, 268, 23, 2, '#d8d0b0');
        Places.mesas(x, 104, '#4a2e4e', '#36203a', 8.8);
        Gfx.ellipse(x, 160, 170, 210, 66, '#3a4a2a');
        Gfx.speckle(x, 0, 104, 320, 56, '#4e6236', 0.25);
        // The stone
        Gfx.ellipse(x, 160, 40, 56, 16, '#4a4a52');
        Gfx.rect(x, 104, 40, 112, 96, '#4a4a52');
        Gfx.ellipse(x, 160, 40, 54, 14, '#9a9aa2');
        Gfx.rect(x, 106, 40, 108, 94, '#9a9aa2');
        Gfx.rect(x, 106, 40, 6, 94, '#b4b4bc'); Gfx.rect(x, 206, 40, 8, 94, '#7e7e86');
        Gfx.speckle(x, 106, 30, 108, 104, '#8a8a92', 0.12);
        const ink = '#3a3a42';
        Gfx.text(x, 'HERE LIES', 160, 34, ink, { align: 'center' });
        Gfx.text(x, String(p.name || '').toUpperCase().slice(0, 12), 160, 52, '#1e1e24', { align: 'center' });
        U.wrap(p.epitaph || '', 12).slice(0, 4).forEach((ln, i) => Gfx.text(x, ln, 160, 72 + i * 11, ink, { align: 'center' }));
        // "September 30, 2027" -> "SEP 30, 2027" so it fits on the stone.
        let date = String(p.date || '').replace(/^([A-Za-z]{3})[A-Za-z]*/, '$1').toUpperCase();
        if (Gfx.textWidth(date) > 104) date = date.replace(/,?\s*\d{4}$/, '');
        Gfx.text(x, date, 160, 120, ink, { align: 'center' });
        for (let i = 0; i < 18; i++) Sprites.tuft(x, 96 + i * 7, 138 + (i % 3), '#4e7a2c', '#6e9a40');
        Gfx.ellipse(x, 228, 136, 7, 3, Pal.helmet); Gfx.rect(x, 220, 137, 16, 1, Pal.helmetLo);
      },
      anim(ctx, t) {
        Places.twinkle(ctx, t, 40, 60, 5);
        for (let i = 0; i < 5; i++) if (Math.floor(t * 2 + i * 1.3) % 3 === 0) Gfx.px(ctx, 60 + Gfx.hash(i) * 200, 110 + Gfx.hash(i * 5) * 30, '#f4f070');
      },
    },

    gameover: {
      paint(x) {
        Places.sky(x, [[0, '#06070f'], [1, '#1a1c30']]);
        Places.stars(x, 70, 90, 11);
        Gfx.disc(x, 60, 30, 9, '#e8e4cc');
        Places.mesas(x, 108, '#1c1c2c', '#141420', 9.9);
        for (let i = 0; i < 5; i++) {
          Gfx.rect(x, 20 + i * 62, 86, 50, 22, '#20222c');
          for (let k = 0; k < 3; k++) Gfx.disc(x, 32 + i * 62 + k * 13, 97, 4, '#14151c');
        }
        Places.ground(x, 108, '#1a1a22', '#0c0c12');
        Gfx.rect(x, 232, 70, 3, 40, '#2a2a30');
        Sprites.coyote(x, 120, 120, '#0a0a10');
      },
      anim(ctx, t) {
        Places.twinkle(ctx, t, 70, 90, 11);
        Places.sign(ctx, 210, 56, 50, 14, '#1a0a0a', '#3a2020', ['OFFLINE'], Math.floor(t * 2) % 2 ? '#ff3a2a' : '#5a1a14');
      },
    },

    // ------------------------------------------------------------------ map
    map: {
      key: p => `${Math.floor(p.frac * 300)}|${p.lm}`,
      paint(x, p) {
        Gfx.rect(x, 0, 0, 320, 160, '#b8a878');
        Gfx.speckle(x, 0, 0, 320, 160, '#a49464', 0.3);
        for (let i = 0; i < 14; i++) Gfx.ellipse(x, Gfx.hash(i * 3) * 320, Gfx.hash(i * 7) * 160, 14, 6, '#9aa462');
        for (let i = 0; i < 6; i++) Gfx.ellipse(x, Gfx.hash(i * 11 + 4) * 320, Gfx.hash(i * 13 + 4) * 160, 10, 5, '#a08a6a');
        Gfx.rect(x, 0, 0, 320, 3, '#5a4630'); Gfx.rect(x, 0, 157, 320, 3, '#5a4630');
        Gfx.rect(x, 0, 0, 3, 160, '#5a4630'); Gfx.rect(x, 317, 0, 3, 160, '#5a4630');
        Places.sign(x, 96, 8, 128, 14, '#e8dcb8', '#5a4630', ['WOLF HOLLOW TRAIL'], '#3a2a18');

        const L = DATA.landmarks, total = DATA.config.totalBlocks;
        const pos = b => { const f = b / total; return [16 + f * 288, 80 + Math.sin(f * Math.PI * 3) * 32]; };
        const zoneCol = { air: '#e6eaf0', immersion: '#5ec8f0', hydro: '#7aa0f0' };
        let zone = L[0].zone;
        for (let b = 0; b < total; b += 4) {
          const li = L.findIndex(l => l.block > b);
          const prev = L[Math.max(0, li - 1)];
          if (prev && prev.zone) zone = prev.zone;
          const [px, py] = pos(b);
          Gfx.rect(x, px - 1, py - 1, 4, 4, '#6a5232');
          Gfx.rect(x, px, py, 2, 2, b < p.frac * total ? '#e8d4a0' : zoneCol[zone]);
        }
        L.forEach((l, i) => {
          const [lx, ly] = pos(l.block);
          const passed = i < p.lm;
          Gfx.rect(x, lx - 6, ly - 6, 12, 12, '#3a2a18');
          Gfx.rect(x, lx - 5, ly - 5, 10, 10, passed ? '#8a7a5a' : (l.store ? '#3a8a4a' : '#c8582a'));
          Gfx.text(x, l.mapKey, lx, ly - 4, passed ? '#c8b890' : '#ffffff', { align: 'center' });
        });
        Gfx.rect(x, 10, 142, 6, 6, "#3a8a4a"); Gfx.text(x, "STORE", 20, 141, "#3a2a18");
        Gfx.rect(x, 74, 142, 6, 6, "#c8582a"); Gfx.text(x, "STOP", 84, 141, "#3a2a18");
        Gfx.rect(x, 130, 143, 6, 3, "#5ec8f0"); Gfx.text(x, "IMMERSION", 140, 141, "#3a2a18");
        Gfx.rect(x, 216, 143, 6, 3, "#7aa0f0"); Gfx.text(x, "HYDRO", 226, 141, "#3a2a18");
      },
      anim(ctx, t, p) {
        const f = p.frac;
        const px = 16 + f * 288, py = 80 + Math.sin(f * Math.PI * 3) * 32;
        if (Math.floor(t * 3) % 3) {
          Gfx.rect(ctx, px - 5, py - 14, 10, 6, Pal.navy); Gfx.rect(ctx, px - 5, py - 15, 10, 1, Pal.black);
          Gfx.disc(ctx, px - 3, py - 8, 2, Pal.tire); Gfx.disc(ctx, px + 3, py - 8, 2, Pal.tire);
          Gfx.px(ctx, px, py - 5, '#ff4a3a');
        }
      },
    },
  },
};
