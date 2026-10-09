// New game: pick your job, name the crew, assign their jobs, pick a month.

const Setup = {
  async run(slot) {
    Scene.show('wolf_hollow');
    const role = await Setup.pickRole();
    const me = await UI.ask(UI.t('What is your first name?') + '\n', '>', { max: 10 });
    const names = await Setup.nameCrew(me);
    const roles = await Setup.assignRoles(names, role.id);
    const month = await Setup.pickMonth();
    const length = await Setup.pickFrom('How long a trail?', DATA.config.lengths,
      l => `${l.label} (${U.num(l.blocks)} blocks)`);
    const diff = await Setup.pickFrom('How hard should Texas be?', DATA.config.difficulties,
      d => d.score === 1 ? d.label : `${d.label} (x${d.score} score)`);
    return newGame({ role: role.id, names, roles, month, length, diff, slot });
  },

  // A menu built from a config table: { id: { label, desc } }. Returns the id.
  async pickFrom(question, table, label) {
    const ids = Object.keys(table);
    const desc = ids.map((id, i) => UI.hi(UI.esc(`${i + 1}. ${table[id].label}`)) + '\n' + UI.t('   ' + table[id].desc)).join('\n');
    const k = await UI.menu(UI.t(question) + '\n\n' + desc + '\n', ids.map((id, i) => ({ k: String(i + 1), label: label(table[id]) })));
    return ids[parseInt(k, 10) - 1];
  },

  async pickRole() {
    while (true) {
      const opts = DATA.roles.map((r, i) => ({ k: String(i + 1), label: r.pick }));
      opts.push({ k: String(DATA.roles.length + 1), label: 'Find out the differences' });
      const k = await UI.menu(UI.t('Many kinds of people work at Wolf Hollow.') + '\n\nYou may:\n', opts);
      const i = parseInt(k, 10) - 1;
      if (i < DATA.roles.length) return DATA.roles[i];
      await Setup.differences();
    }
  },

  async differences() {
    const lines = [UI.hi(UI.center('THE JOBS')), UI.rule()];
    for (const r of DATA.roles) {
      lines.push(UI.hi(UI.esc(r.name)));
      lines.push(UI.esc(`${U.num(r.sats)} sats  x${r.mult} score`));
      lines.push(UI.t(r.perk));
      lines.push('');
    }
    await UI.pause(lines.join('\n').trimEnd());
  },

  async nameCrew(me) {
    while (true) {
      const names = [me];
      let taken = '';
      for (let i = 1; i < 5; i++) {
        const head = UI.t('What are the first names of the four other members of your crew?') + '\n\n' +
          names.map((n, j) => UI.esc(`  ${j + 1}. ${n}`)).join('\n') + '\n' +
          (taken ? UI.hi(UI.t(`You already have a ${taken}. Nobody would know who you meant.`)) + '\n' : '');
        const name = await UI.ask(head, `  ${i + 1}.`, { max: 10 });
        taken = names.find(n => n.toLowerCase() === name.toLowerCase()) || '';
        if (taken) { Sound.bad(); i--; continue; }
        names.push(name);
      }
      const list = names.map((n, j) => UI.esc(`  ${j + 1}. ${n}`)).join('\n');
      if (await UI.yesNo(UI.t('Your crew:') + '\n\n' + list, 'Are these names correct?')) return names;
    }
  },

  async assignRoles(names, myRole) {
    const max = DATA.maxPerRole;
    while (true) {
      const roles = [myRole];
      for (let i = 1; i < names.length; i++) {
        const used = r => roles.filter(x => x === r.id).length;
        const sofar = roles.map((r, j) => UI.esc(`  ${U.padR(names[j], 11)} ${Q.role(r).name}`)).join('\n');
        const head = UI.t(`No more than ${max} people per job.`) + '\n\n' + sofar + '\n\n' +
          UI.hi(UI.esc(`What does ${names[i]} do?`)) + '\n';
        const opts = DATA.roles.map((r, j) => ({
          k: String(j + 1),
          label: used(r) >= max ? `${r.name} (full)` : r.name,
          disabled: used(r) >= max,
        }));
        const k = await UI.menu(head, opts);
        roles.push(DATA.roles[parseInt(k, 10) - 1].id);
      }
      const list = roles.map((r, j) => UI.esc(`  ${U.padR(names[j], 11)} ${Q.role(r).name}`)).join('\n');
      if (await UI.yesNo(UI.t('Your crew:') + '\n\n' + list, 'Is this correct?')) return roles;
    }
  },

  async pickMonth() {
    const months = [2, 3, 4, 5, 6, 7];   // March through August
    while (true) {
      const opts = months.map((m, i) => ({ k: String(i + 1), label: DATA.weather.months[m].name }));
      opts.push({ k: '7', label: 'Ask for advice' });
      const k = await UI.menu(UI.t(`It is ${DATA.config.year}. The Halving waits for no one. You must choose a month to start.`) + '\n', opts);
      if (k !== '7') return months[parseInt(k, 10) - 1];
      await UI.pause(UI.t(
        'You attend a safety meeting. Dusty, from the night shift, has thoughts.\n\n' +
        '"Start in summer and the air-cooled racks cook. So do you. The hot aisle hit 117 last August.\n\n' +
        'Start in spring and it\'s storms. Lightning loves a substation.\n\n' +
        'Either way, the immersion and hydro zones come later. By then it\'s somebody else\'s problem. Usually yours."'));
    }
  },
};
