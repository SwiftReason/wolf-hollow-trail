// RMA Pile Salvage: the hunting mini-game. Parts ride three conveyor lanes
// toward the scrapper; move the claw between lanes and grab the good ones.
// It plays in the scene window.

const Salvage = {
  LANES: [64, 100, 136],   // part center lines, in scene pixels
  CLAW_X: 64,
  PX: 2,                   // sprite pixel size

  async run(G) {
    const S = DATA.salvage;
    const head = UI.hi(UI.center('RMA PILE SALVAGE')) + '\n';
    if (G.s.zipties < S.minTies) {
      Sound.bad();
      await UI.pause(head + '\n' + UI.t(S.noTies));
      return null;
    }
    G.salvages = G.salvages || [];
    const recent = G.salvages.filter(b => G.blocks - b < S.recentBlocks).length;
    const good = Math.max(0.2, S.goodRatio - S.pickedOver * recent);
    const carry = Math.round(S.carry * Q.perk(G, 'salvage'));

    const prev = Scene.save();
    const prevMusic = Music.play('salvage');
    Scene.run((ctx, dt, t) => Salvage.drawIdle(ctx, t));
    await UI.pause(head + '\n' + UI.t(S.intro) + '\n\n' +
      (recent ? UI.hi(UI.t(S.pickedOverText)) + '\n\n' : '') +
      UI.t(`You can carry ${carry} parts. Each grab gets ${S.perGrab} and uses ${S.tieCost} zip ties. You have ${U.num(G.s.zipties)}.`) + '\n\n' +
      UI.t(S.controls), 'Press SPACE BAR to start');

    const res = await Salvage.play(G, good);
    Scene.restore(prev);
    if (prevMusic) Music.play(prevMusic);
    G.salvages.push(G.blocks);

    // A Miner Tech brings some dead hashboards back to life.
    const lines = [];
    const tech = Q.alive(G).find(c => c.role === 'tech');
    if (tech && res.dead.hashboards) {
      const p = 1 - Math.pow(1 - S.techFixChance, Q.count(G, 'tech'));
      let fixed = 0;
      for (let i = 0; i < res.dead.hashboards; i++) if (U.chance(p)) fixed++;
      if (fixed) {
        res.got.hashboards += fixed;
        lines.push(U.tmpl(S.techFix, { name: tech.name, n: fixed, s: fixed > 1 ? 's' : '' }));
      }
    }

    let hb = res.got.hashboards, psu = res.got.psus;
    const total = hb + psu;
    const summary = [];
    if (hb) summary.push(`${hb} good hashboard${hb > 1 ? 's' : ''}`);
    if (psu) summary.push(`${psu} good PSU${psu > 1 ? 's' : ''}`);
    const dead = res.dead.hashboards + res.dead.psus;
    let first = summary.length ? `You grabbed ${summary.join(' and ')}.` : S.nothing;
    if (dead) first += ` ${dead} dead part${dead > 1 ? 's' : ''} went in the dumpster.`;
    lines.unshift(first);
    for (const name of res.zaps) lines.push(U.tmpl(S.zap, { name }));
    if (total > carry) {
      hb = Math.round(hb * carry / total);
      psu = carry - hb;
      lines.push(U.tmpl(S.overCarry, { carry }));
    }
    const gains = [];
    if (hb) gains.push(`+${hb} spare hashboard${hb > 1 ? 's' : ''}`);
    if (psu) gains.push(`+${psu} spare PSU${psu > 1 ? 's' : ''}`);
    if (gains.length) lines.push(gains.join(', ') + '.');
    G.s.hashboards += hb;
    G.s.psus += psu;
    const fixedFleet = Sim.repair(G);
    if (fixedFleet) lines.push(`Your crew put ${U.plural(fixedFleet, 'broken miner')} back online.`);
    (hb + psu) ? Sound.good() : Sound.bad();
    Journal.add(G, 'Salvaged the RMA pile. ' + lines.join(' '));
    await UI.pause(head + '\n' + lines.map(UI.t).join('\n\n'));

    // Salvage takes the day.
    return Travel.process(G, Sim.day(G, { noProgress: true, noEvents: true }));
  },

  // ------------------------------------------------------------- drawing
  backdrop() {
    if (Salvage._bg) return Salvage._bg;
    const c = Gfx.canvas(320, 160), x = c.getContext('2d');
    Gfx.gradient(x, 0, 0, 320, 160, [[0, '#2c303c'], [1, '#16181f']]);
    for (let s = 0; s < 3; s++) {
      const sy = 16 + s * 12;
      Gfx.rect(x, 60, sy + 8, 250, 2, '#4a4030');
      for (let i = 0; i < 24; i++) {
        const h = 4 + Math.floor(Gfx.hash(i * 5 + s) * 4);
        Gfx.rect(x, 62 + i * 10, sy + 8 - h, 8, h, ['#3e4450', '#2f5a3e', '#5a4a3a', '#3a3e4a'][(i + s) % 4]);
      }
    }
    Places.sign(x, 226, 2, 88, 12, '#d8a820', '#4a3a10', ['RMA CAGE'], '#16181f');
    // The scrapper
    Gfx.rect(x, 0, 44, 30, 116, '#5a3a2a');
    for (let k = 0; k < 116; k += 8) Gfx.poly(x, [[0, 44 + k], [30, 44 + k - 6], [30, 44 + k - 2], [0, 44 + k + 4]], '#e8b020');
    Gfx.rect(x, 26, 44, 4, 116, '#2a1a12');
    'SCRAP'.split('').forEach((ch, i) => Gfx.text(x, ch, 15, 62 + i * 12, '#ffffff', { align: 'center', shadow: '#2a1a12' }));
    // Belts and the claw's rail
    for (const ly of Salvage.LANES) {
      Gfx.rect(x, 30, ly + 10, 290, 5, '#3a3d48');
      Gfx.rect(x, 30, ly + 10, 290, 1, '#6a6e7a');
    }
    Gfx.rect(x, 30, 30, 290, 3, '#6a6e7a');
    return (Salvage._bg = c);
  },

  drawPart(ctx, p, t) {
    const S = DATA.salvage, PX = Salvage.PX, rows = S.sprites[p.type];
    const w = rows[0].length * PX, h = rows.length * PX;
    const x0 = Math.round(p.x - w / 2), y0 = Math.round(Salvage.LANES[p.lane] - p.rise - h / 2);
    const main = p.ok ? '#3faa5a' : '#5a5e66', acc = p.ok ? '#e8c040' : '#7a7e86';
    const body = p.type === 'psus' ? (p.ok ? '#b8bec8' : '#6a6e76') : main;
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch !== '#' && ch !== '+') continue;
        Gfx.rect(ctx, x0 + i * PX, y0 + j * PX, PX, PX, ch === '+' ? acc : body);
      }
    });
    if (p.ok) {
      if (Math.floor((t + p.seed) * 3) % 2) Gfx.rect(ctx, x0 + w - 6, y0 - 4, 3, 3, Pal.ledGreen);
    } else {
      Gfx.line(ctx, x0 + 2, y0 + 1, x0 + w - 3, y0 + h - 2, '#d8392e', 2);
      Gfx.line(ctx, x0 + w - 3, y0 + 1, x0 + 2, y0 + h - 2, '#d8392e', 2);
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.8 + p.seed + i / 3) % 1;
        ctx.globalAlpha = 1 - ph;
        Gfx.rect(ctx, x0 + w / 2 - 5 + i * 4, y0 - 4 - ph * 16, 3, 3, '#9aa0aa');
      }
      ctx.globalAlpha = 1;
    }
  },

  drawClaw(ctx, lane, reach) {
    const ly = Salvage.LANES[lane], x = Salvage.CLAW_X;
    Gfx.rect(ctx, x - 6, 28, 12, 6, '#d8a820');
    Gfx.rect(ctx, x - 1, 34, 2, ly - 50 + reach, '#c8ccd4');
    const jy = ly - 16 + reach;
    Gfx.rect(ctx, x - 9, jy, 18, 3, '#d8a820');
    Gfx.rect(ctx, x - 9, jy, 3, 9, '#d8a820');
    Gfx.rect(ctx, x + 6, jy, 3, 9, '#d8a820');
  },

  drawIdle(ctx, t) {
    ctx.drawImage(Salvage.backdrop(), 0, 0);
    Salvage.drawClaw(ctx, 1, 0);
    Salvage.drawPart(ctx, { type: 'hashboards', ok: true, lane: 0, x: 200, rise: 0, seed: 0 }, t);
    Salvage.drawPart(ctx, { type: 'psus', ok: false, lane: 1, x: 150, rise: 0, seed: 0.5 }, t);
    Salvage.drawPart(ctx, { type: 'psus', ok: true, lane: 2, x: 250, rise: 0, seed: 0.2 }, t);
  },

  // ---------------------------------------------------------------- game
  play(G, goodRatio) {
    return new Promise(resolve => {
      const S = DATA.salvage, LANES = Salvage.LANES, X = Salvage.CLAW_X;
      let lane = 1, tt = 0, nextSpawn = 0.3, grabAnim = 0, done = false;
      let parts = [], floats = [];
      const res = { got: { hashboards: 0, psus: 0 }, dead: { hashboards: 0, psus: 0 }, zaps: [] };
      const float = (text, x, y) => floats.push({ text, x, y, life: 1 });

      UI.draw(UI.hi(UI.center('RMA PILE SALVAGE')) + '\n\n' +
        UI.center('UP/DOWN  move the claw') + '\n' + UI.center('SPACE  grab') + '\n' +
        UI.center('ENTER  stop') + '\n\n' + UI.dim(UI.center('or tap a lane')));

      function grab() {
        grabAnim = 0.18;
        if (G.s.zipties < S.tieCost) { Sound.bad(); float('NO TIES', X + 30, LANES[lane] - 24); return; }
        const p = parts.filter(q => !q.grabbed && q.lane === lane && Math.abs(q.x - X) < S.reach)
          .sort((a, b) => Math.abs(a.x - X) - Math.abs(b.x - X))[0];
        if (!p) { Sound.tone(140, 0.05); return; }
        p.grabbed = true;
        G.s.zipties -= S.tieCost;
        Sound.clank();
        if (p.ok) {
          res.got[p.type] += S.perGrab;
          Sound.notes('lead', ['C6', 'G6'], 0.05, 0.5);
          float('+' + S.perGrab, p.x, LANES[p.lane] - 24);
        } else {
          res.dead[p.type] += S.perGrab;
          Sound.bad();
          float('DEAD', p.x, LANES[p.lane] - 24);
          if (p.type === 'psus' && U.chance(S.zapChance)) {
            const c = U.pick(Q.alive(G));
            c.health = Math.max(1, c.health - S.zapDamage);
            res.zaps.push(c.name);
            Sound.zap();
            float('ZAP!', p.x, LANES[p.lane] - 36);
          }
        }
      }

      function onKey(e) {
        if (done) return;
        if (e.repeat && e.key === ' ') return;
        const k = e.key;
        if (k === 'ArrowUp' || k === 'w' || k === 'W') { lane = Math.max(0, lane - 1); Sound.blip(); }
        else if (k === 'ArrowDown' || k === 's' || k === 'S') { lane = Math.min(2, lane + 1); Sound.blip(); }
        else if (k === ' ') grab();
        else if (k === 'Enter' || k === 'Escape') end();
        else return;
        e.preventDefault();
      }
      function onPointer(e) {
        if (done) return;
        e.preventDefault();
        Sound.init();
        const r = Scene.canvas.getBoundingClientRect();
        const y = (e.clientY - r.top) * 160 / r.height;
        lane = LANES.reduce((best, ly, i) => Math.abs(ly - y) < Math.abs(LANES[best] - y) ? i : best, 0);
        grab();
      }
      document.addEventListener('keydown', onKey);
      Scene.canvas.addEventListener('pointerdown', onPointer);

      function end() {
        if (done) return;
        done = true;
        document.removeEventListener('keydown', onKey);
        Scene.canvas.removeEventListener('pointerdown', onPointer);
        resolve(res);
      }

      Scene.run((ctx, dt, t) => {
        if (!done) {
          tt += dt;
          const k = Math.min(1, tt / S.seconds);
          const speed = S.speed[0] + (S.speed[1] - S.speed[0]) * k;
          nextSpawn -= dt;
          if (nextSpawn <= 0) {
            parts.push({ type: U.chance(0.55) ? 'hashboards' : 'psus', ok: U.chance(goodRatio),
              lane: U.ri(0, 2), x: 350, rise: 0, grabbed: false, seed: Math.random() * 10 });
            nextSpawn = (S.spawn[0] + (S.spawn[1] - S.spawn[0]) * k) * (0.7 + Math.random() * 0.6);
          }
          for (const p of parts) {
            if (p.grabbed) p.rise += 160 * dt;
            else p.x -= speed * dt;
          }
          parts = parts.filter(p => p.x > 10 && p.rise < 70);
          for (const f of floats) { f.life -= dt; f.y -= 16 * dt; }
          floats = floats.filter(f => f.life > 0);
          grabAnim -= dt;
          if (tt >= S.seconds) end();
        }

        ctx.drawImage(Salvage.backdrop(), 0, 0);
        const roll = Math.floor(tt * (S.speed[0] + 30)) % 12;
        for (const ly of LANES) for (let bx = 320 - roll; bx > 30; bx -= 12) Gfx.rect(ctx, bx, ly + 12, 5, 2, '#5a5e6a');
        for (const p of parts) Salvage.drawPart(ctx, p, t);
        Salvage.drawClaw(ctx, lane, grabAnim > 0 ? 8 : 0);
        for (const f of floats) {
          ctx.globalAlpha = Math.max(0, f.life);
          Gfx.text(ctx, f.text, f.x, f.y, '#ffd25a', { align: 'center', shadow: '#16181f' });
        }
        ctx.globalAlpha = 1;
        const got = res.got.hashboards + res.got.psus;
        Gfx.text(ctx, `TIME ${Math.max(0, Math.ceil(S.seconds - tt))}`, 36, 4, '#ffd25a', { shadow: '#000000' });
        Gfx.text(ctx, `GOOD ${got}`, 126, 4, '#ffffff', { shadow: '#000000' });
        Gfx.text(ctx, `TIES ${G.s.zipties}`, 36, 16, '#c8ccd4', { shadow: '#000000' });
      });
    });
  },
};
