// Pixel-art drawing helpers. Scenes are drawn at native resolution
// (320x160) with integer coordinates and no anti-aliasing, then scaled up
// with nearest-neighbor, so everything stays crisp.

const Gfx = {
  W: 320,
  H: 160,
  // 4x4 ordered-dither matrix: the 16-bit look for gradients and shading.
  BAYER: [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]],

  canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d').imageSmoothingEnabled = false;
    return c;
  },

  // ---------------------------------------------------------------- color
  rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  hex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  },
  mix(a, b, t) {
    const A = Gfx.rgb(a), B = Gfx.rgb(b);
    return Gfx.hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  },
  // f < 0 darkens toward black, f > 0 lightens toward white.
  shade(c, f) { return f < 0 ? Gfx.mix(c, '#000000', -f) : Gfx.mix(c, '#ffffff', f); },

  // ------------------------------------------------------------ primitives
  rect(ctx, x, y, w, h, c) {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  },
  px(ctx, x, y, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  },

  // Bresenham line, optionally thicker (extra pixels below/right).
  line(ctx, x0, y0, x1, y1, c, thick = 1) {
    ctx.fillStyle = c;
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      ctx.fillRect(x0, y0, thick, thick);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  },

  disc(ctx, cx, cy, r, c) { Gfx.ellipse(ctx, cx, cy, r, r, c); },
  ellipse(ctx, cx, cy, rx, ry, c) {
    ctx.fillStyle = c;
    for (let dy = -ry; dy <= ry; dy++) {
      const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((ry + 0.5) * (ry + 0.5)))));
      ctx.fillRect(Math.round(cx - dx), Math.round(cy + dy), dx * 2 + 1, 1);
    }
  },

  // Filled polygon by scanline (even-odd). pts: [[x, y], ...]
  poly(ctx, pts, c) {
    ctx.fillStyle = c;
    const ys = pts.map(p => p[1]);
    const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const a = Math.round(xs[i]), b = Math.round(xs[i + 1]);
        if (b > a) ctx.fillRect(a, y, b - a, 1);
      }
    }
  },

  // Sparse pixels in a Bayer pattern: density 0..1.
  speckle(ctx, x, y, w, h, c, density) {
    ctx.fillStyle = c;
    const lim = density * 16;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if (Gfx.BAYER[(y + j) & 3][(x + i) & 3] < lim) ctx.fillRect(x + i, y + j, 1, 1);
      }
    }
  },

  // Vertical gradient with ordered dithering between neighboring stops.
  // stops: [[0, '#hex'], [0.6, '#hex'], [1, '#hex']]
  gradient(ctx, x, y, w, h, stops) {
    const img = ctx.createImageData(w, h);
    const cols = stops.map(s => Gfx.rgb(s[1]));
    for (let j = 0; j < h; j++) {
      const t = h > 1 ? j / (h - 1) : 0;
      let k = 0;
      while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      const span = stops[k + 1][0] - stops[k][0] || 1;
      const f = U.clamp((t - stops[k][0]) / span, 0, 1);
      // Quantize to 4 steps between stops, dither the remainder.
      const lvl = f * 4, base = Math.floor(lvl), frac = lvl - base;
      for (let i = 0; i < w; i++) {
        const step = Math.min(4, base + (Gfx.BAYER[(y + j) & 3][(x + i) & 3] < frac * 16 ? 1 : 0)) / 4;
        const a = cols[k], b = cols[k + 1], o = (j * w + i) * 4;
        img.data[o] = a[0] + (b[0] - a[0]) * step;
        img.data[o + 1] = a[1] + (b[1] - a[1]) * step;
        img.data[o + 2] = a[2] + (b[2] - a[2]) * step;
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, x, y);
  },

  // ----------------------------------------------------------------- text
  // Crisp pixel text: render with the font, then threshold the alpha so no
  // anti-aliased edges survive the upscale.
  _textCache: new Map(),
  text(ctx, str, x, y, color, { size = 8, font = 'Press Start 2P', align = 'left', shadow = null } = {}) {
    str = String(str);
    const key = `${str}|${color}|${size}|${font}`;
    let img = Gfx._textCache.get(key);
    if (!img) {
      const m = Gfx.canvas(1, 1).getContext('2d');
      m.font = `${size}px "${font}"`;
      const w = Math.ceil(m.measureText(str).width) + 2, h = Math.ceil(size * 1.4) + 2;
      img = Gfx.canvas(w, h);
      const c = img.getContext('2d');
      c.font = `${size}px "${font}"`;
      c.textBaseline = 'top';
      c.fillStyle = color;
      c.fillText(str, 1, 1);
      const d = c.getImageData(0, 0, w, h);
      for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0;
      c.putImageData(d, 0, 0);
      if (Gfx._textCache.size > 400) Gfx._textCache.clear();
      Gfx._textCache.set(key, img);
    }
    let dx = x;
    if (align === 'center') dx = x - Math.floor((img.width - 2) / 2);
    else if (align === 'right') dx = x - (img.width - 2);
    if (shadow) Gfx.text(ctx, str, (align === 'left' ? x : x) + 1, y + 1, shadow, { size, font, align });
    ctx.drawImage(img, Math.round(dx - 1), Math.round(y - 1));
    return img.width - 2;
  },

  textWidth(str, size = 8, font = 'Press Start 2P') {
    const m = Gfx.canvas(1, 1).getContext('2d');
    m.font = `${size}px "${font}"`;
    return Math.ceil(m.measureText(String(str)).width);
  },

  // ---------------------------------------------------------------- noise
  // Smooth, seamless 1D noise over a period (sum of sines whose periods
  // divide `period`), for mesa skylines that tile.
  ridge(x, period, seed, octaves = [[1, 1], [3, 0.45], [7, 0.2], [13, 0.1]]) {
    let v = 0;
    for (const [f, a] of octaves) v += a * Math.sin((x / period) * Math.PI * 2 * f + seed * f * 1.7);
    return v;
  },

  // Deterministic pseudo-random from an integer.
  hash(n) {
    n = (n ^ 61) ^ (n >>> 16);
    n = n + (n << 3);
    n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d);
    n = n ^ (n >>> 15);
    return (n >>> 0) / 4294967296;
  },
};
