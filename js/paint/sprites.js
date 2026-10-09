// Small reusable pixel-art pieces: the UTV, people, the wolf, trail props.

const Pal = {
  black: '#16181f', tire: '#1c1e25', tireHi: '#41454f', rim: '#2b2e36', spoke: '#5d6373', hub: '#a0a6b6',
  plastic: '#3c4049', plasticHi: '#5b616e',
  navy: '#24375f', navyHi: '#41609e', navyLo: '#152343',
  silver: '#d8dce4', light: '#fff4b0', red: '#d8392e', orange: '#ff9b2a', seat: '#2a2c33',
  skin: '#e2a878', skinLo: '#b97e52', vest: '#ff7a1a', stripe: '#f2f2ea', helmet: '#f6c432', helmetLo: '#c79618',
  jeans: '#3a4a74', boot: '#4a3426',
  crate: '#b07a3e', crateLo: '#7c5428', drum: '#2f72d4', drumHi: '#62a0ee', drumLo: '#1d4f9e',
  ledGreen: '#5cff7a', ledBlue: '#5ac8ff', ledRed: '#ff4a3a',
};

const Sprites = {
  // Side-by-side UTV facing right, modeled on a Tracker 800SX: navy body,
  // black roll cage, brush guard with winch, cargo bed. Box is 50x28 with
  // the tires touching y + 27.
  utv(ctx, x, y, { t = 0, moving = false, cargo = true, driver = true } = {}) {
    const spin = moving ? t * 9 : 0;
    Sprites.wheel(ctx, x + 10, y + 21, 6, spin);
    Sprites.wheel(ctx, x + 38, y + 21, 6, spin + 1);

    const by = y - (moving && Math.floor(t * 9) % 2 ? 1 : 0);    // suspension bob
    const r = (a, b, w, h, c) => Gfx.rect(ctx, x + a, by + b, w, h, c);
    const P = Pal;

    // Cargo first so the bed rim overlaps it: taco crate and a dielectric drum.
    if (cargo) {
      r(2, 5, 6, 5, P.crate); r(2, 7, 6, 1, P.crateLo); r(4, 5, 1, 5, P.crateLo);
      r(9, 4, 4, 6, P.drum); r(9, 4, 4, 1, P.drumHi); r(9, 6, 4, 1, P.drumLo); r(9, 8, 4, 1, P.drumLo);
    }

    // Cargo bed
    r(0, 9, 16, 1, P.plasticHi); r(0, 10, 16, 1, P.plastic);
    r(1, 11, 14, 5, P.navy); r(1, 11, 14, 1, P.navyHi); r(1, 15, 14, 1, P.navyLo);
    r(0, 11, 2, 2, P.red);
    r(8, 13, 5, 1, P.silver);                                       // TRACKER badge
    r(2, 15, 17, 2, P.plastic); r(2, 15, 17, 1, P.plasticHi);       // rear fender

    // Roll cage
    r(13, 0, 19, 2, P.black);
    r(13, 0, 2, 11, P.black);
    Gfx.line(ctx, x + 13, by + 3, x + 6, by + 9, P.black);
    Gfx.line(ctx, x + 31, by + 1, x + 35, by + 9, P.black, 2);

    // Seat and driver in a hard hat and hi-vis vest
    r(16, 3, 4, 9, P.seat); r(16, 11, 10, 2, P.seat);
    if (driver) {
      r(20, 1, 6, 2, P.helmet); r(19, 3, 8, 1, P.helmetLo);
      r(21, 4, 5, 4, P.skin); r(21, 7, 5, 1, P.skinLo); Gfx.px(ctx, x + 24, by + 5, P.black);
      r(20, 8, 6, 5, P.vest); r(20, 10, 6, 1, P.stripe);
      r(25, 9, 5, 2, P.vest); Gfx.px(ctx, x + 30, by + 9, P.skin);
      r(25, 12, 6, 2, P.jeans);
    }
    Gfx.line(ctx, x + 33, by + 11, x + 30, by + 7, P.black);       // steering column
    r(29, 6, 2, 4, P.black);

    // Half door, rocker
    r(16, 13, 15, 6, P.plastic); r(16, 13, 15, 1, P.plasticHi); r(27, 15, 2, 1, P.black);
    r(15, 19, 18, 2, P.black);

    // Hood and nose
    r(31, 10, 12, 5, P.navy); r(31, 9, 6, 1, P.navyHi); r(37, 10, 6, 1, P.navyHi);
    r(43, 10, 3, 5, P.navyLo); r(43, 11, 3, 2, P.light);
    r(33, 11, 4, 2, P.silver);                                      // 800 badge
    Gfx.px(ctx, x + 41, by + 13, P.orange);
    r(30, 15, 16, 2, P.plastic); r(30, 15, 16, 1, P.plasticHi);     // front fender

    // Brush guard and winch
    r(46, 8, 2, 9, P.black); r(42, 8, 5, 1, P.black); r(44, 12, 3, 1, P.black); r(43, 16, 6, 2, P.black);
    r(45, 18, 3, 2, P.silver); Gfx.px(ctx, x + 46, by + 19, P.tireHi);
    r(48, 18, 1, 3, P.red);
  },

  // Knobby tire with a black five-spoke rim. `a` is the rotation angle.
  wheel(ctx, cx, cy, rad, a) {
    Gfx.disc(ctx, cx, cy, rad, Pal.tire);
    for (let k = 0; k < 12; k++) {
      const ang = a + k * Math.PI / 6;
      Gfx.px(ctx, cx + Math.round(Math.cos(ang) * rad), cy + Math.round(Math.sin(ang) * rad), Pal.tireHi);
    }
    Gfx.disc(ctx, cx, cy, rad - 3, Pal.rim);
    for (let k = 0; k < 5; k++) {
      const ang = a + k * Math.PI * 2 / 5;
      Gfx.line(ctx, cx, cy, cx + Math.cos(ang) * (rad - 3), cy + Math.sin(ang) * (rad - 3), Pal.spoke);
    }
    Gfx.px(ctx, cx, cy, Pal.hub);
  },

  // Standing worker, 7x16. o: { hat, shirt, pants, skin, beard, cap }
  person(ctx, x, y, o = {}) {
    const r = (a, b, w, h, c) => Gfx.rect(ctx, x + a, y + b, w, h, c);
    const hat = o.hat || Pal.helmet, shirt = o.shirt || Pal.vest, pants = o.pants || Pal.jeans, skin = o.skin || Pal.skin;
    if (o.cap) { r(1, 0, 5, 2, hat); r(5, 1, 2, 1, hat); }
    else { r(1, 0, 5, 2, hat); r(0, 2, 7, 1, Gfx.shade(hat, -0.25)); }
    r(1, 3, 5, 4, skin);
    Gfx.px(ctx, x + 4, y + 4, Pal.black);
    if (o.beard) r(1, 6, 5, 1, o.beard);
    r(0, 7, 7, 5, shirt);
    if (!o.plain) r(0, 9, 7, 1, Pal.stripe);
    r(1, 12, 2, 3, pants); r(4, 12, 2, 3, pants);
    r(1, 15, 2, 1, Pal.boot); r(4, 15, 2, 1, Pal.boot);
  },

  // Draw any sprite function at a whole-number scale (e.g. a 2x shopkeeper).
  scaled(ctx, scale, w, h, x, y, draw) {
    const c = Gfx.canvas(w, h);
    draw(c.getContext('2d'));
    ctx.drawImage(c, 0, 0, w, h, x, y, w * scale, h * scale);
  },

  // Howling wolf silhouette, about 26x18, facing left.
  wolf(ctx, x, y, c) {
    Gfx.poly(ctx, [[x + 4, y + 10], [x + 2, y + 2], [x + 5, y], [x + 8, y + 3], [x + 10, y + 7],
      [x + 22, y + 8], [x + 26, y + 12], [x + 24, y + 18], [x + 21, y + 18], [x + 20, y + 13],
      [x + 13, y + 13], [x + 12, y + 18], [x + 9, y + 18], [x + 9, y + 12]], c);
    Gfx.poly(ctx, [[x + 5, y + 1], [x + 6, y - 3], [x + 8, y + 2]], c);   // ear
    Gfx.poly(ctx, [[x + 24, y + 9], [x + 30, y + 6], [x + 27, y + 12]], c); // tail
  },

  coyote(ctx, x, y, c) {
    Gfx.rect(ctx, x + 3, y + 3, 10, 4, c);
    Gfx.rect(ctx, x, y + 1, 4, 3, c); Gfx.px(ctx, x + 1, y, c);
    Gfx.rect(ctx, x + 4, y + 7, 1, 3, c); Gfx.rect(ctx, x + 11, y + 7, 1, 3, c);
    Gfx.line(ctx, x + 13, y + 4, x + 16, y + 7, c);
  },

  // --------------------------------------------------------------- props
  tuft(ctx, x, y, c, hi) {
    Gfx.px(ctx, x, y, c); Gfx.px(ctx, x + 1, y - 1, hi); Gfx.px(ctx, x + 2, y, c);
    Gfx.px(ctx, x + 1, y, c); Gfx.px(ctx, x + 3, y - 1, c);
  },
  pricklyPear(ctx, x, y) {
    Gfx.ellipse(ctx, x, y - 4, 3, 4, '#4f8a3a'); Gfx.ellipse(ctx, x + 5, y - 7, 3, 3, '#5e9c44');
    Gfx.ellipse(ctx, x - 4, y - 8, 2, 3, '#5e9c44');
    Gfx.px(ctx, x + 5, y - 11, '#e0405a'); Gfx.px(ctx, x - 4, y - 12, '#f0d040');
    Gfx.px(ctx, x - 1, y - 5, '#cfe0a0'); Gfx.px(ctx, x + 6, y - 7, '#cfe0a0');
  },
  mesquite(ctx, x, y, leaf) {
    Gfx.line(ctx, x, y, x + 1, y - 8, '#5a3e28', 2); Gfx.line(ctx, x + 1, y - 6, x + 6, y - 10, '#5a3e28');
    Gfx.ellipse(ctx, x + 2, y - 12, 8, 4, leaf);
    Gfx.speckle(ctx, x - 5, y - 16, 15, 7, Gfx.shade(leaf, 0.2), 0.25);
  },
  bluebonnets(ctx, x, y) {
    for (let i = 0; i < 9; i++) {
      const dx = (i * 7) % 18, dy = (i * 3) % 4;
      Gfx.rect(ctx, x + dx, y - dy, 1, 3, '#4d7a2c');
      Gfx.rect(ctx, x + dx - 1, y - 4 - dy, 3, 4, '#3a5fcf');
      Gfx.px(ctx, x + dx, y - 5 - dy, '#eef0ff');
    }
  },
  rock(ctx, x, y, c) {
    Gfx.ellipse(ctx, x, y - 2, 4, 2, c);
    Gfx.rect(ctx, x - 2, y - 4, 3, 1, Gfx.shade(c, 0.3));
  },
  cloud(ctx, x, y, w, c, hi) {
    const n = Math.max(2, Math.floor(w / 8));
    for (let i = 0; i < n; i++) Gfx.ellipse(ctx, x + i * 8, y - (i % 2 ? 3 : 0), 7, 4, c);
    Gfx.rect(ctx, x - 4, y, n * 8, 4, c);
    for (let i = 0; i < n; i++) Gfx.rect(ctx, x + i * 8 - 3, y - (i % 2 ? 6 : 3), 6, 1, hi);
  },
  pole(ctx, x, y, h) {
    Gfx.rect(ctx, x, y, 2, h, '#5a4232'); Gfx.rect(ctx, x - 6, y + 3, 14, 2, '#5a4232');
    Gfx.px(ctx, x - 5, y + 2, '#c8ccd0'); Gfx.px(ctx, x + 6, y + 2, '#c8ccd0'); Gfx.px(ctx, x, y - 1, '#c8ccd0');
  },
  // Chain-link fence strip: posts plus a speckled mesh.
  fence(ctx, x, y, w, h, c) {
    Gfx.speckle(ctx, x, y, w, h, c, 0.18);
    Gfx.rect(ctx, x, y, w, 1, c);
    for (let i = 0; i < w; i += 18) Gfx.rect(ctx, x + i, y - 1, 1, h + 1, Gfx.shade(c, -0.25));
  },
};
