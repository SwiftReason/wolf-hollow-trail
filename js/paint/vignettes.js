// Event pictures: a framed card that pops in over the scene when something
// happens. Events name a picture with `pic` (data/events.js, data/choices.js);
// otherwise DATA.eventPics picks one by event type.
// Each picture paints a 176x104 card once (cached) plus optional animation.

const Vignettes = {
  W: 176, H: 104, X: 72, Y: 16,
  cache: new Map(),

  draw(ctx, age, pic) {
    const P = Vignettes.pics[pic];
    if (!P) return;
    ctx.fillStyle = `rgba(6,8,18,${Math.min(0.5, age * 3)})`;
    ctx.fillRect(0, 0, 320, 160);
    let img = Vignettes.cache.get(pic);
    if (!img) {
      img = Gfx.canvas(Vignettes.W + 8, Vignettes.H + 8);
      const x = img.getContext('2d');
      Gfx.rect(x, 0, 0, Vignettes.W + 8, Vignettes.H + 8, '#0a0e1c');
      Gfx.rect(x, 1, 1, Vignettes.W + 6, Vignettes.H + 6, '#e8eaf4');
      Gfx.rect(x, 3, 3, Vignettes.W + 2, Vignettes.H + 2, '#5a7ac8');
      x.save();
      x.translate(4, 4);
      x.beginPath(); x.rect(0, 0, Vignettes.W, Vignettes.H); x.clip();
      P.paint(x);
      x.restore();
      Vignettes.cache.set(pic, img);
    }
    // Drop in from above.
    const k = Math.min(1, age / 0.22), ease = 1 - Math.pow(1 - k, 3);
    const ox = Vignettes.X - 4, oy = Math.round(-120 + (Vignettes.Y - 4 + 120) * ease);
    ctx.drawImage(img, ox, oy);
    if (P.anim && k >= 1) {
      ctx.save();
      ctx.beginPath(); ctx.rect(ox + 4, oy + 4, Vignettes.W, Vignettes.H); ctx.clip();
      P.anim(ctx, age, ox + 4, oy + 4);
      ctx.restore();
    }
  },

  // Shared backdrops.
  sky(x, top, bot, horizon = 70) { Gfx.gradient(x, 0, 0, Vignettes.W, horizon, [[0, top], [1, bot]]); },
  ground(x, y, top, bot) { Gfx.gradient(x, 0, y, Vignettes.W, Vignettes.H - y, [[0, top], [1, bot]]); },
  room(x, wall = '#3a3f4c', floor = '#2a2c34') {
    Gfx.rect(x, 0, 0, Vignettes.W, 70, wall);
    for (let i = 0; i < Vignettes.W; i += 6) Gfx.rect(x, i, 0, 1, 70, Gfx.shade(wall, -0.12));
    Gfx.rect(x, 0, 70, Vignettes.W, 34, floor);
  },
  day(x) { Vignettes.sky(x, '#3a6ccc', '#bfe0fa'); Vignettes.ground(x, 70, '#c8b47e', '#9a8656'); },
  night(x) { Vignettes.sky(x, '#0c1028', '#2a2c50'); Places.stars(x, 30, 50, 4); Vignettes.ground(x, 70, '#2a2a30', '#141418'); },
  miner(x, mx, my, dead) {
    Gfx.rect(x, mx, my, 34, 22, dead ? '#4a4e58' : '#8a929e');
    Gfx.rect(x, mx, my, 34, 2, dead ? '#5a5e66' : '#b4bcc8');
    Gfx.disc(x, mx + 9, my + 12, 6, '#2a2e36'); Gfx.disc(x, mx + 25, my + 12, 6, '#2a2e36');
    Gfx.rect(x, mx + 2, my + 3, 3, 1, dead ? Pal.ledRed : Pal.ledGreen);
  },
  puffs(ctx, t, x, y, col = '#8a909a') {
    for (let k = 0; k < 4; k++) {
      const a = (t * 0.7 + k / 4) % 1;
      ctx.globalAlpha = 0.85 * (1 - a);
      Gfx.ellipse(ctx, x + Math.sin(a * 6 + k) * 4, y - a * 36, 4 + Math.round(a * 6), 3 + Math.round(a * 4), col);
    }
    ctx.globalAlpha = 1;
  },

  pics: {
    snake: {
      paint(x) {
        Vignettes.day(x);
        Gfx.rect(x, 110, 34, 50, 40, '#7a8290');
        for (let k = 3; k < 50; k += 4) Gfx.rect(x, 110 + k, 38, 2, 32, '#5e6672');
        for (let i = 0; i < 26; i++) {
          const a = i * 0.55, r = 4 + i * 0.9;
          Gfx.disc(x, 64 + Math.cos(a) * r, 82 + Math.sin(a) * r * 0.5, 4, i % 3 ? '#8a6a3a' : '#5a4224');
        }
        Gfx.ellipse(x, 64, 64, 6, 4, '#8a6a3a');
        Gfx.px(x, 66, 63, '#101010');
        for (let k = 0; k < 4; k++) Gfx.rect(x, 86 + k * 3, 92, 2, 3, '#d8c8a0');
      },
      anim(ctx, t, ox, oy) {
        if (Math.floor(t * 4) % 3 === 0) { Gfx.line(ctx, ox + 70, oy + 64, ox + 76, oy + 63, '#d8392e'); Gfx.px(ctx, ox + 77, oy + 62, '#d8392e'); Gfx.px(ctx, ox + 77, oy + 64, '#d8392e'); }
        const sh = Math.round(Math.sin(t * 40));
        Gfx.rect(ctx, ox + 98 + sh, oy + 90, 2, 3, '#e8d8b0');
      },
    },
    coyote: {
      paint(x) {
        Vignettes.night(x);
        Gfx.disc(x, 146, 18, 8, '#e8e4cc');
        Gfx.line(x, 0, 84, 176, 78, '#ff8a2a', 2);
        Sprites.scaled(x, 3, 18, 12, 54, 52, c => Sprites.coyote(c, 0, 1, '#1a1410'));
      },
      anim(ctx, t, ox, oy) {
        if (Math.floor(t * 6) % 2) { Gfx.px(ctx, ox + 58, oy + 78, '#ffe060'); Gfx.px(ctx, ox + 61, oy + 75, '#ffffff'); }
      },
    },
    fire: {
      paint(x) {
        Vignettes.room(x, '#2a2a34', '#1a1a20');
        Gfx.rect(x, 60, 58, 56, 30, '#6a7280'); Gfx.rect(x, 60, 58, 56, 3, '#8a929e');
        Gfx.text(x, 'PSU', 88, 70, '#2a2a30', { align: 'center' });
      },
      anim(ctx, t, ox, oy) {
        for (let i = 0; i < 7; i++) {
          const h = 12 + Math.round(Math.abs(Math.sin(t * 9 + i * 1.7)) * 16);
          Gfx.poly(ctx, [[ox + 62 + i * 8, oy + 58], [ox + 66 + i * 8, oy + 58 - h], [ox + 70 + i * 8, oy + 58]], i % 2 ? '#ff7a1a' : '#ffb030');
          Gfx.poly(ctx, [[ox + 64 + i * 8, oy + 58], [ox + 66 + i * 8, oy + 58 - h / 2], [ox + 68 + i * 8, oy + 58]], '#fff2a0');
        }
        Vignettes.puffs(ctx, t, ox + 88, oy + 30, '#5a5a62');
      },
    },
    smoke: {
      paint(x) {
        Vignettes.room(x);
        Vignettes.miner(x, 40, 48, false);
        Vignettes.miner(x, 100, 48, true);
      },
      anim(ctx, t, ox, oy) { Vignettes.puffs(ctx, t, ox + 117, oy + 46); },
    },
    spray: {
      paint(x) {
        Vignettes.room(x, '#4a5262', '#3a3e48');
        Gfx.rect(x, 0, 40, 176, 9, '#3a78d8'); Gfx.rect(x, 0, 40, 176, 2, '#7aaef0');
        Gfx.rect(x, 0, 58, 176, 9, '#d24a3c'); Gfx.rect(x, 0, 58, 176, 2, '#f08a7a');
        Gfx.rect(x, 86, 38, 4, 13, '#8e98a8');
      },
      anim(ctx, t, ox, oy) {
        for (let i = 0; i < 40; i++) {
          const a = (t * 2 + i / 40) % 1, ang = -0.5 + (Gfx.hash(i) - 0.5) * 1.4;
          const r = a * 70;
          Gfx.rect(ctx, ox + 90 + Math.cos(ang) * r, oy + 44 + Math.sin(ang) * r + a * a * 30, 2, 1, i % 3 ? '#bfe6ff' : '#ffffff');
        }
      },
    },
    splash: {
      paint(x) {
        Vignettes.room(x, '#5a6270', '#4a4a52');
        Gfx.rect(x, 30, 50, 116, 40, '#dfe4ea'); Gfx.rect(x, 30, 50, 116, 3, '#a8b0bc');
        Gfx.rect(x, 33, 44, 110, 8, '#3aa6dc');
        for (let k = 0; k < 6; k++) Gfx.rect(x, 40 + k * 17, 46, 9, 5, '#1d5c86');
        Gfx.ellipse(x, 120, 96, 30, 4, '#5aa8d0');
      },
      anim(ctx, t, ox, oy) {
        for (let i = 0; i < 14; i++) {
          const a = (t * 1.4 + i / 14) % 1;
          Gfx.rect(ctx, ox + 88 + (i - 7) * 4 * a, oy + 44 - Math.sin(a * Math.PI) * 26, 2, 2, '#9ce0fa');
        }
      },
    },
    suits: {
      paint(x) {
        Vignettes.day(x);
        Gfx.rect(x, 104, 46, 62, 26, '#14161c'); Gfx.rect(x, 110, 40, 44, 10, '#14161c');
        Gfx.rect(x, 114, 42, 16, 6, '#5a7090'); Gfx.rect(x, 134, 42, 16, 6, '#5a7090');
        Gfx.disc(x, 116, 72, 6, '#0a0a0e'); Gfx.disc(x, 154, 72, 6, '#0a0a0e');
        for (const [px, tie] of [[34, '#c8241c'], [62, '#2a5ab8']]) {
          Sprites.scaled(x, 3, 7, 16, px, 34, c => Sprites.person(c, 0, 0, { cap: true, hat: '#3a2a1a', shirt: '#2a2e3a', pants: '#2a2e3a', plain: true }));
          Gfx.rect(x, px + 9, 58, 3, 10, tie);
        }
        Gfx.rect(x, 80, 60, 10, 13, '#c8a060'); Gfx.rect(x, 81, 62, 8, 9, '#f4f0e8');
      },
    },
    heat: {
      paint(x) {
        Vignettes.sky(x, '#c86a3a', '#ffd27a');
        Gfx.disc(x, 140, 26, 16, '#fff2b0');
        Vignettes.ground(x, 70, '#d8b878', '#a88a50');
        Gfx.rect(x, 52, 10, 14, 76, '#f4f4f0'); Gfx.rect(x, 54, 12, 10, 72, '#e8e8e4');
        Gfx.disc(x, 59, 88, 10, '#d8392e');
        for (let k = 0; k < 8; k++) Gfx.rect(x, 66, 16 + k * 8, 4, 1, '#5a5a5a');
        Gfx.text(x, '117F', 96, 60, '#8a1a10', { size: 16 });
      },
      anim(ctx, t, ox, oy) {
        const h = 50 + Math.round(Math.sin(t * 2) * 6);
        Gfx.rect(ctx, ox + 57, oy + 86 - h, 4, h, '#d8392e');
        for (let j = 0; j < 4; j++) Gfx.rect(ctx, ox + 90 + Math.round(Math.sin(t * 5 + j) * 3), oy + 20 + j * 8, 60, 1, 'rgba(255,255,230,0.35)');
      },
    },
    lightning: {
      paint(x) {
        Vignettes.sky(x, '#141826', '#3a4258');
        for (let i = 0; i < 7; i++) Sprites.cloud(x, i * 28 - 6, 10 + (i % 2) * 6, 34, '#2a3042', '#3c4458');
        Vignettes.ground(x, 70, '#3a3e36', '#22241e');
        Places.lattice(x, 110, 34, 34, 40, '#6a7280');
      },
      anim(ctx, t, ox, oy) {
        if (Math.floor(t * 3) % 3 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(ox, oy, 176, 104);
          let bx = 124, by = 16;
          while (by < 40) { const nx = bx + Math.round((Gfx.hash(by * 7 + Math.floor(t)) - 0.5) * 10); Gfx.line(ctx, ox + bx, oy + by, ox + nx, oy + by + 6, '#ffffff', 2); bx = nx; by += 6; }
        }
        ctx.fillStyle = 'rgba(190,205,230,0.6)';
        for (let i = 0; i < 40; i++) ctx.fillRect(ox + (Gfx.hash(i) * 180 + t * 40) % 176, oy + (Gfx.hash(i * 3) * 104 + t * 160) % 104, 1, 3);
      },
    },
    laptop: {
      paint(x) {
        Vignettes.room(x, '#2c3040', '#4a3a30');
        Gfx.rect(x, 48, 20, 80, 52, '#2a2a30'); Gfx.rect(x, 52, 24, 72, 44, '#0b1220');
        Gfx.poly(x, [[40, 86], [136, 86], [128, 72], [48, 72]], '#3a3a42');
        Gfx.text(x, 'FLASHING', 88, 32, '#5cff7a', { align: 'center' });
        Gfx.rect(x, 60, 48, 56, 6, '#1a2a1e');
      },
      anim(ctx, t, ox, oy) {
        Gfx.rect(ctx, ox + 61, oy + 49, Math.floor((t * 18) % 54), 4, '#5cff7a');
        if (Math.floor(t * 2) % 2) Gfx.text(ctx, 'DO NOT UNPLUG', ox + 88, oy + 58, '#ffb030', { align: 'center' });
      },
    },
    pallet: {
      paint(x) {
        Vignettes.room(x, '#6a6e78', '#4a4c52');
        Gfx.rect(x, 40, 84, 96, 6, '#a07a48'); Gfx.rect(x, 44, 90, 6, 4, '#7a5a34'); Gfx.rect(x, 126, 90, 6, 4, '#7a5a34');
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
          Gfx.rect(x, 42 + c * 23, 64 - r * 20, 21, 19, '#c8a870'); Gfx.rect(x, 42 + c * 23, 64 - r * 20, 21, 2, '#e4cc98');
          Gfx.rect(x, 46 + c * 23, 70 - r * 20, 13, 6, '#f4f0e8'); Gfx.rect(x, 48 + c * 23, 72 - r * 20, 9, 1, '#5a4020');
        }
      },
      anim(ctx, t, ox, oy) {
        for (let i = 0; i < 5; i++) if (Math.floor(t * 4 + i * 1.3) % 3 === 0) {
          const sx = ox + 36 + Gfx.hash(i) * 104, sy = oy + 8 + Gfx.hash(i * 5) * 60;
          Gfx.rect(ctx, sx - 2, sy, 5, 1, '#fff6c0'); Gfx.rect(ctx, sx, sy - 2, 1, 5, '#fff6c0');
        }
      },
    },
    tacos: {
      paint(x) {
        Vignettes.room(x, '#7a5634', '#5a3a22');
        Gfx.ellipse(x, 88, 74, 56, 14, '#f4f4f0');
        for (let i = 0; i < 5; i++) {
          Gfx.ellipse(x, 52 + i * 18, 66, 9, 6, '#d8b060');
          Gfx.rect(x, 45 + i * 18, 63, 14, 3, i % 2 ? '#e8a030' : '#a8c050');
        }
        for (let i = 0; i < 3; i++) { Gfx.rect(x, 138 + i * 10, 40 + (i % 2) * 4, 8, 16, ['#2a8a3a', '#d8392e', '#2a5ab8'][i]); Gfx.rect(x, 138 + i * 10, 40 + (i % 2) * 4, 8, 2, '#c8ccd4'); }
      },
      anim(ctx, t, ox, oy) { for (let k = 0; k < 3; k++) Vignettes.puffs(ctx, t + k * 0.3, ox + 60 + k * 26, oy + 56, '#f4f0e8'); },
    },
    coin: {
      paint(x) { Vignettes.sky(x, '#141838', '#2a2a5a', 104); Places.stars(x, 30, 100, 7); },
      anim(ctx, t, ox, oy) {
        const w = Math.max(1, Math.round(Math.abs(Math.cos(t * 3)) * 26));
        Gfx.ellipse(ctx, ox + 88, oy + 52, w, 26, '#c88a10');
        Gfx.ellipse(ctx, ox + 88, oy + 52, Math.max(0, w - 3), 23, '#f2b630');
        if (w > 14) Gfx.text(ctx, 'B', ox + 88, oy + 44, '#8a5a08', { size: 16, align: 'center' });
        if (Math.floor(t * 3) % 2) { Gfx.rect(ctx, ox + 120, oy + 30, 5, 1, '#fff6c0'); Gfx.rect(ctx, ox + 122, oy + 28, 1, 5, '#fff6c0'); }
      },
    },
    chart: {
      paint(x) {
        Vignettes.room(x, '#1c2230', '#2a2a34');
        Gfx.rect(x, 24, 8, 128, 76, '#3a4458'); Gfx.rect(x, 27, 11, 122, 70, '#08101c');
        Gfx.text(x, 'DIFFICULTY', 88, 14, '#5cff7a', { align: 'center' });
      },
      anim(ctx, t, ox, oy) {
        let px = ox + 32, py = oy + 74;
        const n = Math.min(22, Math.floor(t * 12));
        for (let i = 1; i <= n; i++) {
          const nx = ox + 32 + i * 5, ny = oy + 74 - Math.round(i * 2 + Math.sin(i) * 3);
          Gfx.line(ctx, px, py, nx, ny, '#ff4a3a'); px = nx; py = ny;
        }
      },
    },
    fiber: {
      paint(x) {
        Vignettes.day(x);
        Gfx.rect(x, 0, 76, 74, 4, '#ff8a2a'); Gfx.rect(x, 102, 78, 74, 4, '#ff8a2a');
        for (let i = 0; i < 4; i++) { Gfx.line(x, 74, 77 + i, 80 + i * 2, 72 + i * 4, '#ffd060'); Gfx.line(x, 102, 79 + i, 96 - i * 2, 74 + i * 4, '#ffd060'); }
        Gfx.rect(x, 140, 50, 3, 30, '#5a4232'); Places.sign(x, 124, 40, 36, 12, '#f2c230', '#3a3020', ['FIBER'], '#1a1a1a');
      },
      anim(ctx, t, ox, oy) { if (Math.floor(t * 5) % 2) { Gfx.px(ctx, ox + 82, oy + 70, '#ffffff'); Gfx.px(ctx, ox + 95, oy + 71, '#fff6a0'); } },
    },
    sick: {
      paint(x) {
        Vignettes.room(x, '#5a6a7a', '#3a3e48');
        Gfx.rect(x, 30, 64, 116, 8, '#6a5a4a'); Gfx.rect(x, 34, 72, 4, 16, '#4a3a2a'); Gfx.rect(x, 138, 72, 4, 16, '#4a3a2a');
        Gfx.rect(x, 50, 56, 90, 10, '#c8d4e8');
        Gfx.ellipse(x, 44, 56, 10, 7, '#e2a878'); Gfx.rect(x, 36, 48, 16, 4, Pal.helmet);
        Gfx.rect(x, 52, 58, 6, 1, '#d8392e');
      },
      anim(ctx, t, ox, oy) {
        for (let k = 0; k < 3; k++) { const a = (t * 0.8 + k / 3) % 1; Gfx.px(ctx, ox + 40 + k * 4, oy + 48 - a * 10, '#9ce0fa'); }
        Gfx.text(ctx, 'z', ox + 60 + Math.round(Math.sin(t * 2) * 2), oy + 34 - Math.round((t * 6) % 10), '#ffffff');
      },
    },
    clock: {
      paint(x) {
        Vignettes.room(x, '#4a4e5a', '#2a2c34');
        Gfx.disc(x, 88, 44, 30, '#2a2a30'); Gfx.disc(x, 88, 44, 27, '#f4f4f0');
        for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; Gfx.px(x, 88 + Math.cos(a) * 23, 44 + Math.sin(a) * 23, '#2a2a30'); }
      },
      anim(ctx, t, ox, oy) {
        const m = t * 6, h = t / 2;
        Gfx.line(ctx, ox + 88, oy + 44, ox + 88 + Math.cos(m) * 21, oy + 44 + Math.sin(m) * 21, '#2a2a30');
        Gfx.line(ctx, ox + 88, oy + 44, ox + 88 + Math.cos(h) * 13, oy + 44 + Math.sin(h) * 13, '#d8392e', 2);
      },
    },
    ants: {
      paint(x) {
        Gfx.rect(x, 0, 0, 176, 104, '#1f6a3a');
        for (let i = 0; i < 176; i += 8) Gfx.rect(x, i, 0, 1, 104, '#2f8a4a');
        for (let k = 0; k < 6; k++) Gfx.rect(x, 20 + k * 26, 30, 16, 16, '#1a1a1e');
        for (let k = 0; k < 9; k++) Gfx.rect(x, 4, 8 + k * 10, 6, 3, '#d8b040');
      },
      anim(ctx, t, ox, oy) {
        for (let i = 0; i < 18; i++) {
          const a = (t * 0.15 + i / 18) % 1, x = ox + a * 176, y = oy + 60 + Math.sin(a * 14 + i) * 8;
          Gfx.rect(ctx, x, y, 3, 2, '#b8281c'); Gfx.px(ctx, x + 3, y, '#b8281c');
        }
      },
    },
    raccoon: {
      paint(x) {
        Vignettes.room(x);
        Vignettes.miner(x, 20, 30, false); Vignettes.miner(x, 120, 30, false);
        Gfx.rect(x, 62, 26, 54, 34, '#14161c');
        Gfx.ellipse(x, 89, 46, 14, 10, '#7a7a80'); Gfx.rect(x, 78, 42, 22, 5, '#1a1a1e');
        Gfx.px(x, 83, 44, '#ffffff'); Gfx.px(x, 95, 44, '#ffffff');
        Gfx.poly(x, [[78, 38], [80, 32], [84, 37]], '#7a7a80'); Gfx.poly(x, [[94, 37], [98, 32], [100, 38]], '#7a7a80');
        Gfx.text(x, 'KEVIN', 89, 66, '#ffd25a', { align: 'center' });
      },
      anim(ctx, t, ox, oy) { if (Math.floor(t * 1.3) % 4 === 0) Gfx.rect(ctx, ox + 82, oy + 44, 14, 1, '#7a7a80'); },
    },
    truck: {
      paint(x) {
        Vignettes.day(x);
        Gfx.rect(x, 30, 50, 116, 22, '#8a2a24'); Gfx.rect(x, 96, 34, 40, 18, '#8a2a24'); Gfx.rect(x, 102, 37, 28, 10, '#9ac8f0');
        for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) Gfx.rect(x, 34 + c * 15, 36 - r * 10 + 14, 13, 9, '#8a929e');
        Gfx.disc(x, 52, 76, 11, '#1c1e25'); Gfx.disc(x, 124, 76, 11, '#1c1e25');
        Gfx.disc(x, 52, 76, 5, '#8a8e98'); Gfx.disc(x, 124, 76, 5, '#8a8e98');
      },
    },
    camera: {
      paint(x) {
        Vignettes.day(x);
        Gfx.line(x, 88, 60, 70, 96, '#2a2a30', 2); Gfx.line(x, 88, 60, 106, 96, '#2a2a30', 2); Gfx.line(x, 88, 60, 88, 96, '#2a2a30', 2);
        Gfx.rect(x, 68, 36, 40, 24, '#2a2a30'); Gfx.disc(x, 112, 48, 9, '#3a3a42'); Gfx.disc(x, 112, 48, 5, '#5a8ac8');
      },
      anim(ctx, t, ox, oy) { if (Math.floor(t * 2) % 2) { Gfx.disc(ctx, ox + 74, oy + 42, 2, '#ff3a2a'); Gfx.text(ctx, 'REC', ox + 80, oy + 39, '#ff3a2a'); } },
    },
    dog: {
      paint(x) {
        Vignettes.day(x);
        Gfx.ellipse(x, 88, 74, 18, 9, '#a8743c');
        Gfx.ellipse(x, 106, 58, 9, 8, '#a8743c'); Gfx.rect(x, 110, 60, 8, 4, '#8a5a2a');
        Gfx.poly(x, [[100, 52], [103, 44], [106, 51]], '#7a4a22');
        Gfx.px(x, 108, 56, '#101010'); Gfx.px(x, 117, 61, '#101010');
        Gfx.rect(x, 76, 80, 4, 8, '#a8743c'); Gfx.rect(x, 96, 80, 4, 8, '#a8743c');
      },
      anim(ctx, t, ox, oy) { const w = Math.sin(t * 14) * 5; Gfx.line(ctx, ox + 71, oy + 70, ox + 62, oy + 64 + w, '#a8743c', 2); },
    },
    dust: {
      paint(x) { Vignettes.sky(x, '#8a7050', '#d8bc8c'); Vignettes.ground(x, 70, '#c8a878', '#a08460'); },
      anim(ctx, t, ox, oy) {
        ctx.fillStyle = 'rgba(150,115,75,0.85)';
        for (let i = 0; i < 80; i++) ctx.fillRect(ox + ((Gfx.hash(i) * 200 - t * (60 + Gfx.hash(i * 2) * 60)) % 176 + 176) % 176, oy + Gfx.hash(i * 7) * 104, 2, 1);
        for (let k = 0; k < 3; k++) Vignettes.puffs(ctx, t + k, ox + 40 + k * 50, oy + 90, '#b89a6a');
      },
    },
    ice: {
      paint(x) {
        Vignettes.sky(x, '#6c7a92', '#dbe2ec'); Vignettes.ground(x, 70, '#eef3f8', '#c2cedc');
        Gfx.rect(x, 20, 30, 136, 26, '#c9ced6'); Gfx.rect(x, 20, 28, 136, 3, '#ffffff');
        for (let i = 0; i < 16; i++) Gfx.poly(x, [[22 + i * 8, 56], [25 + i * 8, 64 + (i % 3) * 3], [28 + i * 8, 56]], '#e8f4ff');
      },
      anim(ctx, t, ox, oy) {
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) ctx.fillRect(ox + (Gfx.hash(i) * 176 + Math.sin(t + i) * 4) % 176, oy + (Gfx.hash(i * 5) * 104 + t * 22) % 104, 1, 1);
      },
    },
  },
};
