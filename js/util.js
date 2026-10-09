// Small helpers shared by every script.
const U = {
  ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  chance(p) { return Math.random() < p; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },

  gauss() {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  },

  // Pick one item with probability proportional to wfn(item). Null if all weights are 0.
  weighted(items, wfn) {
    let total = 0;
    const ws = items.map(it => { const w = Math.max(0, wfn(it) || 0); total += w; return w; });
    if (total <= 0) return null;
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r < 0 && ws[i] > 0) return items[i];
    }
    for (let i = items.length - 1; i >= 0; i--) if (ws[i] > 0) return items[i];
    return null;
  },

  esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  },
  num(n) { return Math.round(n).toLocaleString('en-US'); },
  // plural(1, 'miner') -> "1 miner", plural(3, 'miner') -> "3 miners"
  plural(n, word) { return `${U.num(n)} ${word}${n === 1 ? '' : 's'}`; },

  // "{name} drowned" -> "Ann drowned". Numbers get thousands separators.
  tmpl(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, (m, k) =>
      k in vars ? (typeof vars[k] === 'number' ? U.num(vars[k]) : vars[k]) : m);
  },

  // Word-wrap to an array of lines no longer than w.
  wrap(text, w = 40) {
    const out = [];
    for (const para of String(text).split('\n')) {
      if (!para) { out.push(''); continue; }
      let line = '';
      for (const word of para.split(' ')) {
        if (!line) line = word;
        else if ((line + ' ' + word).length <= w) line += ' ' + word;
        else { out.push(line); line = word; }
        while (line.length > w) { out.push(line.slice(0, w)); line = line.slice(w); }
      }
      out.push(line);
    }
    return out;
  },

  padR(s, n) { s = String(s); return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); },
  padL(s, n) { s = String(s); return s.length >= n ? s : ' '.repeat(n - s.length) + s; },
  center(s, n = 40) { s = String(s); return ' '.repeat(Math.max(0, Math.floor((n - s.length) / 2))) + s; },
  // Center inside exactly n columns (pads both sides).
  box(s, n) { s = U.center(s, n); return U.padR(s, n); },
};

// localStorage that never throws (private windows, blocked storage).
const Persist = {
  get(k, def) {
    try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};
