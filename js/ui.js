// Text-mode screen. Everything is drawn into one 40-column <div> as
// preformatted lines. Input is promise-based: menu() / pause() / ask() resolve
// when the player answers by keyboard or click.

const UI = (() => {
  const W = 40;
  const root = () => document.getElementById('screen');
  let waiter = null;   // { keys: [...], any: bool, resolve }

  function draw(html) {
    root().innerHTML = html;
    window.scrollTo(0, 0);
  }

  function settle(k) {
    if (!waiter) return;
    const w = waiter;
    waiter = null;
    Sound.blip();
    w.resolve(k);
  }

  // Resolve on one of `keys` ('1', 'Y', 'SPACE'...) or, if `any`, on SPACE/ENTER/click.
  function waitKeys(keys, any = false) {
    return new Promise(resolve => { waiter = { keys: keys.map(String), any, resolve }; });
  }
  function cancel() { waiter = null; }

  function normKey(e) {
    if (e.key === ' ') return 'SPACE';
    if (e.key === 'Enter') return 'ENTER';
    if (e.key === 'Escape') return 'ESC';
    return e.key.length === 1 ? e.key.toUpperCase() : e.key;
  }

  document.addEventListener('keydown', e => {
    Sound.init();
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.repeat || !waiter || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = normKey(e);
    if (waiter.any && (k === 'SPACE' || k === 'ENTER')) { e.preventDefault(); settle(k); return; }
    if (waiter.keys.includes(k)) { e.preventDefault(); settle(k); }
  });

  document.addEventListener('click', e => {
    Sound.init();
    if (!waiter) return;
    const opt = e.target.closest('[data-k]');
    if (opt && waiter.keys.includes(opt.dataset.k)) { settle(opt.dataset.k); return; }
    if (waiter.any) settle('ENTER');
  });

  // ---- formatting helpers (all return escaped HTML) ----
  const esc = U.esc;
  const t = s => U.wrap(s, W).map(esc).join('\n');            // wrapped prose
  const hi = html => `<span class="hi">${html}</span>`;
  const dim = html => `<span class="dim">${html}</span>`;
  const rule = () => '-'.repeat(W);
  const center = s => esc(U.center(s, W));
  const kv = (k, v, n = 14) => esc(U.padR(k + ':', n) + v);
  // Clickable text (already escaped). Padding spaces stay outside the span so
  // the hover highlight hugs the words.
  const tap = (text, k, cls = '') => {
    const [, lead, body, tail] = text.match(/^( *)([\s\S]*?)( *)$/);
    return `${lead}<span class="opt${cls && ' ' + cls}"${k ? ` data-k="${esc(k)}"` : ''}>${body}</span>${tail}`;
  };
  const opt = (k, label, disabled) => disabled
    ? dim(`  ${esc(k)}. ${esc(label)}`)
    : tap(`  ${esc(k)}. ${esc(label)}`, k);
  const cursor = '<span class="blink">_</span>';

  // ---- prompts ----
  function menu(head, opts, prompt = 'What is your choice?') {
    draw([head, ...opts.map(o => opt(o.k, o.label, o.disabled)), '', esc(prompt) + ' ' + cursor].join('\n'));
    return waitKeys(opts.filter(o => !o.disabled).map(o => o.k));
  }

  function pause(body, prompt = 'Press SPACE BAR to continue') {
    draw(body + '\n\n' + tap(center(prompt)));
    return waitKeys([], true);
  }

  async function yesNo(body, prompt) {
    draw(body + '\n\n' + esc(prompt) + ' ' +
      tap('Y', 'Y') + '/' + tap('N', 'N') + ' ' + cursor);
    return (await waitKeys(['Y', 'N'])) === 'Y';
  }

  // Text or number entry. Resolves with a trimmed string, or an integer if numeric.
  function ask(body, prompt, { max = 10, numeric = false, allowEmpty = false, value = '' } = {}) {
    return new Promise(resolve => {
      waiter = null;
      draw(body + '\n' + esc(prompt) + ' <input class="tin" autocomplete="off" spellcheck="false">');
      const inp = root().querySelector('input.tin');
      inp.maxLength = max;
      inp.style.width = Math.min(max + 1, W - prompt.length - 2) + 'ch';
      if (numeric) inp.inputMode = 'numeric';
      inp.value = value;
      inp.focus();
      const refocus = () => inp.focus();
      root().addEventListener('click', refocus);
      inp.addEventListener('keydown', e => {
        e.stopPropagation();
        Sound.init();
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const v = inp.value.trim();
        if (numeric) {
          if (v === '' && allowEmpty) { done(0); return; }
          if (!/^\d+$/.test(v)) { Sound.bad(); inp.value = ''; return; }
          done(parseInt(v, 10));
        } else {
          if (!v && !allowEmpty) { Sound.bad(); return; }
          done(v);
        }
      });
      function done(v) {
        root().removeEventListener('click', refocus);
        Sound.blip();
        resolve(v);
      }
    });
  }

  return { W, draw, waitKeys, cancel, menu, pause, yesNo, ask, t, hi, dim, rule, center, kv, esc, opt, tap, cursor };
})();
