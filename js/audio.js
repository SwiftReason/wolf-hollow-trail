// Synthesized 16-bit-style audio: instruments, a small sequencer for the
// tunes in data/music.js, sound effects, and weather/engine ambience.
// Nothing is loaded from files. The audio context starts on first input.

const Sound = {
  ctx: null,
  // Volumes 0-10. Older versions stored on/off switches; honor those.
  musicVol: Persist.get('wht.musicVol', Persist.get('wht.music', Persist.get('wht.sound', true)) ? 4 : 0),
  sfxVol: Persist.get('wht.sfxVol', Persist.get('wht.sfx', Persist.get('wht.sound', true)) ? 7 : 0),
  get musicOn() { return Sound.musicVol > 0; },
  get sfxOn() { return Sound.sfxVol > 0; },
  get on() { return Sound.musicOn || Sound.sfxOn; },
  musicGain() { return Sound.musicVol / 10 * 0.7; },
  sfxGain() { return Sound.sfxVol / 10; },

  init() {
    if (Sound.ctx) { if (Sound.ctx.state === 'suspended') Sound.ctx.resume(); return; }
    try { Sound.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = Sound.ctx;

    // Master chain: everything -> compressor -> speakers.
    Sound.comp = c.createDynamicsCompressor();
    Sound.comp.threshold.value = -16;
    Sound.comp.ratio.value = 4;
    Sound.comp.connect(c.destination);
    Sound.master = Sound.gain(0.85, Sound.comp);

    // Music gets a little hall reverb, like an SNES echo buffer.
    Sound.musicBus = Sound.gain(Sound.musicGain(), Sound.master);
    Sound.verb = c.createConvolver();
    Sound.verb.buffer = Sound.impulse(1.6);
    Sound.verbSend = Sound.gain(0.22, Sound.verb);
    Sound.musicBus.connect(Sound.verbSend);
    Sound.verb.connect(Sound.master);
    Sound.sfxBus = Sound.gain(Sound.sfxGain(), Sound.master);

    Sound.noise = Sound.noiseBuffer(2);
    Sound.pulse25 = Sound.pulseWave(0.25);
    Sound.pulse12 = Sound.pulseWave(0.125);
    Ambience.build();
    Music.resume();
    if (Music.name === 'title') Sound.howl();
  },

  // ------------------------------------------------------------ plumbing
  gain(v, to) {
    const g = Sound.ctx.createGain();
    g.gain.value = v;
    if (to) g.connect(to);
    return g;
  },
  filter(type, freq, q, to) {
    const f = Sound.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    if (to) f.connect(to);
    return f;
  },
  osc(type, freq, to) {
    const o = Sound.ctx.createOscillator();
    if (type instanceof PeriodicWave) o.setPeriodicWave(type); else o.type = type;
    o.frequency.value = freq;
    if (to) o.connect(to);
    return o;
  },
  noiseSrc(to, loop = false) {
    const s = Sound.ctx.createBufferSource();
    s.buffer = Sound.noise;
    s.loop = loop;
    if (to) s.connect(to);
    return s;
  },
  noiseBuffer(sec) {
    const c = Sound.ctx, b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  },
  impulse(sec) {
    const c = Sound.ctx, n = c.sampleRate * sec, b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    }
    return b;
  },
  // Pulse wave with a given duty cycle: the classic NES/SNES lead timbre.
  pulseWave(duty) {
    const n = 48, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return Sound.ctx.createPeriodicWave(re, im);
  },
  // Attack / decay / sustain / release on a gain param.
  env(param, t, dur, { a = 0.01, d = 0.1, s = 0.7, r = 0.1, peak = 0.2 } = {}) {
    param.cancelScheduledValues(t);
    param.setValueAtTime(0.0001, t);
    param.linearRampToValueAtTime(peak, t + a);
    param.setTargetAtTime(peak * s, t + a, d / 3);
    const end = t + Math.max(dur, a + 0.01);
    param.setTargetAtTime(0.0001, end, r / 3);
    return end + r * 2;
  },
  freq(name) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(name);
    if (!m) return 0;
    const semis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (semis - 9) / 12 + (parseInt(m[3], 10) - 4));
  },

  // ---------------------------------------------------------- instruments
  // Play one note on `inst` at time t for dur seconds into `out`.
  play(inst, f, t, dur, vel, out) {
    const c = Sound.ctx;
    if (inst === 'drums') return Sound.drum(f, t, vel, out);
    const g = Sound.gain(0, out);
    let end;
    if (inst === 'lead' || inst === 'reed') {
      const lp = Sound.filter('lowpass', inst === 'reed' ? 2200 : 3600, 0.7, g);
      const o1 = Sound.osc(Sound.pulse25, f, lp);
      const o2 = inst === 'reed' ? Sound.osc(Sound.pulse12, f * 1.004, lp) : null;
      const vib = Sound.osc('sine', inst === 'reed' ? 6.2 : 5.4);
      const depth = Sound.gain(0);
      depth.gain.setValueAtTime(0, t);
      depth.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(0.3, dur));
      vib.connect(depth);
      depth.connect(o1.frequency);
      if (o2) depth.connect(o2.frequency);
      end = Sound.env(g.gain, t, dur, { a: 0.012, d: 0.12, s: 0.75, r: 0.09, peak: 0.16 * vel });
      for (const o of [o1, o2, vib]) if (o) { o.start(t); o.stop(end); }
    } else if (inst === 'pluck') {
      const lp = Sound.filter('lowpass', 3200, 1.5, g);
      lp.frequency.setValueAtTime(3200, t);
      lp.frequency.exponentialRampToValueAtTime(700, t + 0.25);
      const o1 = Sound.osc('triangle', f, lp), o2 = Sound.osc(Sound.pulse25, f, Sound.gain(0.35, lp));
      end = Sound.env(g.gain, t, Math.min(dur, 0.05), { a: 0.003, d: 0.25, s: 0.25, r: 0.35, peak: 0.2 * vel });
      for (const o of [o1, o2]) { o.start(t); o.stop(end); }
    } else if (inst === 'bass') {
      const lp = Sound.filter('lowpass', 900, 1, g);
      const o1 = Sound.osc('triangle', f, lp), o2 = Sound.osc('square', f, Sound.gain(0.18, lp));
      end = Sound.env(g.gain, t, dur * 0.9, { a: 0.005, d: 0.15, s: 0.55, r: 0.06, peak: 0.32 * vel });
      for (const o of [o1, o2]) { o.start(t); o.stop(end); }
    } else if (inst === 'pad') {
      const lp = Sound.filter('lowpass', 1400, 0.5, g);
      const o1 = Sound.osc('sawtooth', f * 0.996, lp), o2 = Sound.osc('sawtooth', f * 1.004, lp);
      end = Sound.env(g.gain, t, dur, { a: 0.35, d: 0.3, s: 0.85, r: 0.6, peak: 0.07 * vel });
      for (const o of [o1, o2]) { o.start(t); o.stop(end); }
    } else if (inst === 'organ') {
      const o1 = Sound.osc('sine', f, g), o2 = Sound.osc('square', f * 2, Sound.gain(0.08, g)), o3 = Sound.osc('sine', f * 3, Sound.gain(0.25, g));
      end = Sound.env(g.gain, t, dur, { a: 0.04, d: 0.2, s: 0.9, r: 0.25, peak: 0.2 * vel });
      for (const o of [o1, o2, o3]) { o.start(t); o.stop(end); }
    }
  },

  drum(kind, t, vel, out) {
    const c = Sound.ctx;
    if (kind === 'k') {
      const g = Sound.gain(0, out), o = Sound.osc('sine', 150, g);
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(0.55 * vel, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.start(t); o.stop(t + 0.25);
    } else if (kind === 's') {
      const g = Sound.gain(0, out), n = Sound.noiseSrc(Sound.filter('bandpass', 1800, 0.8, g));
      g.gain.setValueAtTime(0.32 * vel, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      n.start(t, Math.random()); n.stop(t + 0.18);
      const tg = Sound.gain(0, out), o = Sound.osc('triangle', 190, tg);
      tg.gain.setValueAtTime(0.2 * vel, t);
      tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.start(t); o.stop(t + 0.1);
    } else if (kind === 'h') {
      const g = Sound.gain(0, out), n = Sound.noiseSrc(Sound.filter('highpass', 7000, 0.5, g));
      g.gain.setValueAtTime(0.12 * vel, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      n.start(t, Math.random()); n.stop(t + 0.06);
    }
  },

  // -------------------------------------------------------------- effects
  ready() { return Sound.ctx && Sound.sfxOn; },
  now() { return Sound.ctx.currentTime + 0.005; },
  notes(inst, list, step, vel = 1) {
    if (!Sound.ready()) return;
    let t = Sound.now();
    for (const n of list) {
      if (n) Sound.play(inst, typeof n === 'number' ? n : Sound.freq(n), t, step * 0.9, vel, Sound.sfxBus);
      t += step;
    }
  },
  tone(freq, dur, { type = 'square', vol = 0.05 } = {}) {
    if (!Sound.ready()) return;
    const t = Sound.now(), g = Sound.gain(0, Sound.sfxBus), o = Sound.osc(type, freq, g);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  },

  blip()   { Sound.notes('lead', ['E6'], 0.035, 0.35); },
  step()   {},
  good()   { Sound.notes('lead', ['C6', 'E6', 'G6', 'C7'], 0.06, 0.6); },
  bad() {
    if (!Sound.ready()) return;
    const t = Sound.now(), g = Sound.gain(0, Sound.sfxBus);
    const o = Sound.osc('sawtooth', 220, Sound.filter('lowpass', 1200, 1, g));
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.3);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.start(t); o.stop(t + 0.4);
  },
  arrive() {
    Sound.notes('lead', ['G5', 'C6', 'E6', 'G6', null, 'E6', 'G6'], 0.09, 0.7);
    Sound.notes('pluck', ['C4', 'G4', 'C5'], 0.09, 0.8);
  },
  // Coin "ching" for purchases.
  buy() { Sound.notes('lead', ['B5', 'E6'], 0.07, 0.7); },
  // Metal-on-metal claw grab.
  clank() {
    if (!Sound.ready()) return;
    const t = Sound.now();
    const g = Sound.gain(0, Sound.sfxBus);
    for (const f of [520, 790, 1230]) { const o = Sound.osc('square', f, Sound.gain(0.3, g)); o.start(t); o.stop(t + 0.15); }
    g.gain.setValueAtTime(0.09, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    const ng = Sound.gain(0.15, Sound.sfxBus), n = Sound.noiseSrc(Sound.filter('bandpass', 2600, 1, ng));
    ng.gain.setValueAtTime(0.15, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    n.start(t, Math.random()); n.stop(t + 0.08);
  },
  zap() {
    if (!Sound.ready()) return;
    const t = Sound.now(), g = Sound.gain(0, Sound.sfxBus), o = Sound.osc('sawtooth', 1400, g);
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.25);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.start(t); o.stop(t + 0.32);
    const ng = Sound.gain(0, Sound.sfxBus), n = Sound.noiseSrc(ng);
    ng.gain.setValueAtTime(0.06, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    n.start(t, Math.random()); n.stop(t + 0.22);
  },
  // Rolling thunder, a moment after the flash.
  thunder(delay = 0.4) {
    if (!Sound.ready()) return;
    const t = Sound.now() + delay, g = Sound.gain(0, Sound.sfxBus);
    const lp = Sound.filter('lowpass', 500, 0.7, g);
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.exponentialRampToValueAtTime(60, t + 2.5);
    const n = Sound.noiseSrc(lp, true);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.8, t + 0.06);
    g.gain.setTargetAtTime(0.0001, t + 0.3, 0.8);
    n.start(t); n.stop(t + 3.5);
  },
  // A lone wolf, out past the containers.
  howl() {
    if (!Sound.ready()) return;
    const t = Sound.now() + 0.3, g = Sound.gain(0, Sound.sfxBus);
    const o = Sound.osc('triangle', 420, Sound.filter('lowpass', 1600, 0.5, g));
    o.frequency.setValueAtTime(420, t);
    o.frequency.linearRampToValueAtTime(690, t + 0.6);
    o.frequency.linearRampToValueAtTime(640, t + 1.6);
    o.frequency.linearRampToValueAtTime(470, t + 2.3);
    const vib = Sound.osc('sine', 5), d = Sound.gain(9);
    vib.connect(d); d.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.4);
    g.gain.setTargetAtTime(0.0001, t + 1.9, 0.25);
    o.start(t); vib.start(t); o.stop(t + 2.6); vib.stop(t + 2.6);
  },
  // Church-bell toll when someone dies; the funeral march follows.
  death() {
    if (!Sound.ready()) return;
    const t = Sound.now();
    for (const [f, v] of [[196, 0.17], [392, 0.08], [588, 0.04], [784, 0.03]]) {
      const g = Sound.gain(0, Sound.sfxBus), o = Sound.osc('sine', f, g);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
      o.start(t); o.stop(t + 3.1);
    }
  },
  win() { Sound.arrive(); },

  // ------------------------------------------------------------- settings
  setMusicVol(v) {
    Sound.musicVol = U.clamp(Math.round(v), 0, 10);
    Persist.set('wht.musicVol', Sound.musicVol);
    if (Sound.ctx) Sound.musicBus.gain.setTargetAtTime(Sound.musicGain(), Sound.ctx.currentTime, 0.1);
    if (Sound.musicOn) Music.resume();
    else { clearInterval(Music.timer); Music.timer = null; }
  },
  setSfxVol(v) {
    Sound.sfxVol = U.clamp(Math.round(v), 0, 10);
    Persist.set('wht.sfxVol', Sound.sfxVol);
    if (Sound.ctx) Sound.sfxBus.gain.setTargetAtTime(Sound.sfxGain(), Sound.ctx.currentTime, 0.1);
  },
  setMusic(on) { Sound.setMusicVol(on ? 7 : 0); },
  setSfx(on) { Sound.setSfxVol(on ? 7 : 0); },
};

// ------------------------------------------------------------------ music
// Lookahead sequencer: every 25 ms, schedule notes due in the next 150 ms.
const Music = {
  name: null,
  timer: null,
  voices: [],
  parsed: {},

  // "C4+E4:4 .:2 G4" -> [{ notes: ['C4','E4'], len: 4 }, { notes: [], len: 2 }, ...]
  parse(str) {
    return str.replace(/\|/g, ' ').trim().split(/\s+/).filter(Boolean).map(tok => {
      const [n, l] = tok.split(':');
      return { notes: n === '.' ? [] : n.split('+'), len: l ? parseFloat(l) : 2 };
    });
  },
  // Lengths per voice in sixteenths, for checking a tune adds up.
  lengths(name) {
    return DATA.music[name].voices.map(v => Music.parse(v.notes).reduce((a, e) => a + e.len, 0));
  },

  // Ask for a mood (see DATA.musicFor) or a track name. Returns the previous
  // track so callers can put it back.
  play(what) {
    const name = DATA.musicFor[what] || what;
    const prev = Music.name;
    if (name === Music.name && Music.timer) return prev;
    Music.name = name;
    Music.start();
    return prev;
  },
  resume() { if (Music.name && !Music.timer) Music.start(); },

  start() {
    clearInterval(Music.timer);
    Music.timer = null;
    const T = DATA.music[Music.name];
    if (!T || !Sound.ctx || !Sound.musicOn) return;
    const c = Sound.ctx, t0 = c.currentTime + 0.12;
    // Fade out whatever is still ringing from the last track.
    if (Music.out) {
      const old = Music.out;
      old.gain.setTargetAtTime(0.0001, c.currentTime, 0.08);
      setTimeout(() => old.disconnect(), 600);
    }
    Music.out = Sound.gain(1, Sound.musicBus);
    if (!Music.parsed[Music.name]) Music.parsed[Music.name] = T.voices.map(v => Music.parse(v.notes));
    Music.voices = T.voices.map((v, i) => ({ ...v, events: Music.parsed[Music.name][i], i: 0, pos: 0, start: t0, done: false }));
    Music.timer = setInterval(Music.tick, 25);
    Music.tick();
  },

  tick() {
    const T = DATA.music[Music.name], c = Sound.ctx;
    if (!T || !c) return;
    const s16 = 60 / T.bpm / 4, ahead = c.currentTime + 0.15, swing = T.swing || 0;
    let alive = 0;
    for (const v of Music.voices) {
      if (v.done) continue;
      alive++;
      while (true) {
        const ev = v.events[v.i];
        const at = v.start + (v.pos + (v.pos % 4 === 2 ? swing : 0)) * s16;
        if (at > ahead) break;
        if (ev.notes.length && at >= c.currentTime - 0.02) {
          for (const n of ev.notes) {
            const f = v.inst === 'drums' ? n : Sound.freq(n);
            if (f) Sound.play(v.inst, f, at, ev.len * s16, v.vol ?? 1, Music.out);
          }
        }
        v.pos += ev.len;
        v.i++;
        if (v.i >= v.events.length) {
          if (!T.loop) { v.done = true; break; }
          v.start += v.pos * s16;
          v.pos = 0;
          v.i = 0;
        }
      }
    }
    if (!alive) { clearInterval(Music.timer); Music.timer = null; }
  },

  stop() {
    clearInterval(Music.timer);
    Music.timer = null;
    Music.name = null;
    if (Music.out && Sound.ctx) Music.out.gain.setTargetAtTime(0.0001, Sound.ctx.currentTime, 0.1);
  },
};

// ------------------------------------------------------------- ambience
// Continuous engine, rain, and wind beds. set() glides them to new levels.
const Ambience = {
  levels: { engine: 0, rain: 0, wind: 0 },
  build() {
    const c = Sound.ctx;
    // UTV engine: a low twin-cylinder putter.
    Ambience.engine = Sound.gain(0, Sound.sfxBus);
    const elp = Sound.filter('lowpass', 240, 1.2, Ambience.engine);
    const putter = Sound.gain(0.7, elp);
    const o1 = Sound.osc('sawtooth', 46, putter), o2 = Sound.osc('square', 92.5, Sound.gain(0.4, putter));
    const lfo = Sound.osc('sine', 11), lfoDepth = Sound.gain(0.3);
    lfo.connect(lfoDepth); lfoDepth.connect(putter.gain);
    Ambience.engineOsc = [o1, o2];
    for (const o of [o1, o2, lfo]) o.start();
    // Rain: bright hiss.
    Ambience.rain = Sound.gain(0, Sound.sfxBus);
    Sound.noiseSrc(Sound.filter('highpass', 1200, 0.5, Sound.filter('lowpass', 7000, 0.5, Ambience.rain)), true).start();
    // Wind: low noise with a slowly wandering band.
    Ambience.wind = Sound.gain(0, Sound.sfxBus);
    const bp = Sound.filter('bandpass', 450, 0.8, Ambience.wind);
    Sound.noiseSrc(bp, true).start();
    const wl = Sound.osc('sine', 0.13), wd = Sound.gain(260);
    wl.connect(wd); wd.connect(bp.frequency); wl.start();
  },
  set(lv) {
    if (!Sound.ctx || !Ambience.engine) return;
    const t = Sound.ctx.currentTime;
    for (const k of ['engine', 'rain', 'wind']) {
      const v = lv[k] || 0;
      if (Math.abs(v - Ambience.levels[k]) < 0.001) continue;
      Ambience.levels[k] = v;
      Ambience[k].gain.setTargetAtTime(v, t, 0.4);
    }
    // Rev up a little when driving.
    for (const o of Ambience.engineOsc) o.detune.setTargetAtTime(lv.engine > 0.03 ? 380 : 0, t, 0.3);
  },
};
