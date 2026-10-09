// Choice events: the trail asks you something. They roll like any other
// event (same weight/zones/months/mods fields as data/events.js).
//
// CHOICES
//   label      what the menu shows
//   requires   { sats: n } or { zipties: n, ... } - option is greyed out without it
//   text       result text (when there's no gamble)
//   effect     applied when chosen (costs go here, e.g. { sats: -150000 })
//   odds       0..1 for a gamble; then `win` / `lose` each have { text, effect }
//   roleBonus  { electrician: 0.15 } added to the odds per living crew member
// Effects are the same as events, plus { miners: n } for new miners.
// {name} is a random crew member.
window.DATA = window.DATA || {};

DATA.events.push(
  { id: 'used_miners', type: 'choice', weight: 0.8, pic: 'truck',
    text: 'A guy in a lifted truck offers 40 used Whatsminers for 500,000 sats. No warranty. He will not say where they came from.',
    choices: [
      { label: 'Buy them (500,000 sats)', requires: { sats: 500000 }, effect: { sats: -500000 },
        odds: 0.6, roleBonus: { tech: 0.1 },
        win: { text: 'They mostly work. 34 more miners online.', effect: { miners: 34 } },
        lose: { text: 'They were in a flood. 9 of them boot.', effect: { miners: 9 } } },
      { label: 'Pass', text: 'He drives off. Something rattles in the bed.' },
    ] },

  { id: 'site_tour', type: 'choice', weight: 0.8, pic: 'suits', corporate: true,
    text: 'Corporate wants a site tour tomorrow. They are bringing someone from finance.',
    choices: [
      { label: 'Clean up for it (lose a day)', text: 'The site has never looked better. Corporate noticed nothing. Morale is up anyway.',
        effect: { days: 1, morale: 8 }, good: true },
      { label: 'Wing it', odds: 0.5, roleBonus: { manager: 0.15 },
        win: { text: 'Corporate admired the cable management. Nobody knows why.', effect: { morale: 5 } },
        lose: { text: 'Finance tripped over a patch cable. There will be a meeting. Morale is low.', effect: { morale: -15 } } },
    ] },

  { id: 'fiber_rush', type: 'choice', weight: 0.7, pic: 'fiber',
    text: 'The uplink keeps dropping. The fiber contractor can fix it today for a 150,000 sat rush fee, or next week for free.',
    choices: [
      { label: 'Pay the rush fee', requires: { sats: 150000 }, effect: { sats: -150000 },
        text: 'Fixed by lunch. It was a loose connector. It is always a loose connector.', good: true },
      { label: 'Wait for the free fix', effect: { days: 2 }, text: 'The free fix took two days. It was a loose connector.' },
    ] },

  { id: 'heat_dome', type: 'choice', weight: 1.2, zones: ['air'], months: [5, 6, 7, 8], pic: 'heat',
    text: 'A heat dome is parked over Granbury. 109F all week. The hot aisle is hotter than the forecast.',
    choices: [
      { label: 'Throttle the fleet for two days', effect: { days: 2 }, text: 'You throttled until it broke. Nothing melted.', good: true },
      { label: 'Run it hot', odds: 0.5, roleBonus: { maintenance: 0.15 },
        win: { text: 'The fleet held. Barely. The fans sounded like a jet.', effect: {} },
        lose: { text: 'The hot aisle won. 35 miners cooked.', effect: { broken: { hashboards: 35 } } } },
    ] },

  { id: 'breakfast', type: 'choice', weight: 0.8, pic: 'tacos',
    text: 'The crew is dragging. Buy breakfast tacos for the whole site? 40,000 sats.',
    mods: { shift: { 12: 2 } },
    choices: [
      { label: 'Buy breakfast (40,000 sats)', requires: { sats: 40000 }, effect: { sats: -40000, morale: 15, allHealth: 5 },
        text: 'Morale is up. Someone saved you the potato one.', good: true },
      { label: 'Tell them to tough it out', effect: { morale: -8 }, text: 'Morale is down. Someone wrote your name on the whiteboard.' },
    ] },

  { id: 'youtuber', type: 'choice', weight: 0.6, pic: 'camera',
    text: 'A YouTuber wants to film "A Day in the Life of a Texas Bitcoin Miner" at the site. He will pay 200,000 sats.',
    choices: [
      { label: 'Let him film', effect: { sats: 200000 }, odds: 0.7,
        win: { text: 'The video has 1.2 million views. You are in the thumbnail, pointing at a fan.', effect: {} },
        lose: { text: 'He touched a live PDU on camera. He is fine. Eight PSUs are not.', effect: { broken: { psus: 8 } } } },
      { label: 'No cameras', text: 'He films the fence from the road instead. It gets more views.' },
    ] },

  { id: 'stray_dog', type: 'choice', weight: 0.6, pic: 'dog',
    text: 'A stray dog has been hanging around the containers for a week. The crew wants to keep it.',
    choices: [
      { label: 'Keep the dog', effect: { morale: 12, supplies: { food: -20 } },
        text: 'The dog is named Hashrate. It barks at coyotes. Morale is up.', good: true },
      { label: 'Call animal control', effect: { morale: -6 }, text: 'Animal control took the dog. Nobody is speaking to you.' },
    ] },

  { id: 'perf_firmware', type: 'choice', weight: 0.7, pic: 'laptop',
    text: 'A forum post promises custom firmware: "+15% hashrate, totally safe." The download link is a Discord.',
    choices: [
      { label: 'Flash the fleet', odds: 0.4, roleBonus: { electrician: 0.12, tech: 0.12 },
        win: { text: 'It worked. Blocks are coming easier. Nobody touch anything.', effect: { difficulty: -0.05 } },
        lose: { text: 'It bricked 40 control boards. The Discord has been deleted.', effect: { broken: { boards: 40 } } } },
      { label: 'Stick with stock firmware', text: 'The forum post was taken down the next day. Good call.', good: true },
    ] },

  { id: 'snake_yard', type: 'choice', weight: 0.7, pic: 'snake', mods: { season: { winter: 0.1, summer: 2 } },
    text: 'There is a rattlesnake coiled in the transformer yard. The breaker you need is right behind it.',
    choices: [
      { label: 'Deal with it yourselves', odds: 0.6,
        win: { text: 'The snake left. Everyone pretends they were not scared.', effect: {} },
        lose: { text: '{name} was bitten reaching for the breaker.', effect: { ailment: 'snakebite' } } },
      { label: 'Call animal control (60,000)', requires: { sats: 60000 }, effect: { sats: -60000 },
        text: 'Animal control relocated the snake. It will be back. They always come back.', good: true },
      { label: 'Wait it out', effect: { days: 1 }, text: 'The snake left after lunch. It took its time.' },
    ] },

  { id: 'noise_complaint', type: 'choice', weight: 0.6, pic: 'suits',
    text: 'The neighbors are complaining about the noise. Again. One of them brought a decibel meter.',
    choices: [
      { label: 'Build a sound wall (250,000)', requires: { sats: 250000 }, effect: { sats: -250000, morale: 5 },
        text: 'The wall is up. The neighbors now complain about the wall.', good: true },
      { label: 'Ignore them', odds: 0.6, roleBonus: { manager: 0.1 },
        win: { text: 'They gave up. For now.', effect: {} },
        lose: { text: 'The county sent an inspector. Lose 2 days of paperwork.', effect: { days: 2, morale: -5 } } },
    ] },

  { id: 'pallet_auction', type: 'choice', weight: 0.6, pic: 'pallet',
    text: 'An RMA liquidation auction has a pallet of mystery PSUs. Starting bid: 120,000 sats.',
    choices: [
      { label: 'Bid on it (120,000 sats)', requires: { sats: 120000 }, effect: { sats: -120000 },
        odds: 0.55, roleBonus: { inventory: 0.15 },
        win: { text: 'Ten working PSUs. Inventory logged them. Twice.', effect: { supplies: { psus: 10 } } },
        lose: { text: 'Two of them work. The rest are very heavy paperweights.', effect: { supplies: { psus: 2 } } } },
      { label: 'Pass', text: 'Someone from the next site over won it. They look happy. Suspiciously happy.' },
    ] },
);
