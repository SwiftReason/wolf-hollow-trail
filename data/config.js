// Tunable numbers. Change these to rebalance the game without touching logic.
window.DATA = window.DATA || {};

DATA.config = {
  totalBlocks: 2016,
  year: 2027,
  slots: 1400,            // miner positions at the site
  startMiners: 700,       // inherited from the previous manager
  thPerMiner: 186,        // TH/s per Whatsminer at stock
  baseBlocksPerDay: 20,   // full fleet, stock tuning, 10 hr shifts, healthy crew
  rationsPerPerson: 3,
  startMorale: 70,
  eventChance: 0.24,      // chance of a random event per day, before modifiers
  baseFailRate: 0.0007,   // part failures per online miner per day
  dayMs: 700,             // real-time length of one trail day

  // Network difficulty retargets every `days` days by a random percent in
  // `change`. It mostly goes up, so a slow trip faces a harder network.
  retarget: { days: 14, change: [-2, 4] },

  // burnout: share of part failures that destroy the miner outright (no spare
  // fixes it). Scaled by the zone's `burnout` and, in air cooling, by heat:
  // every `burnoutHeatPer` degrees over 85F adds another 100%.
  burnoutHeatPer: 6,
  tuning: {
    underclocked: { label: 'Underclocked', speed: 0.8, fail: 0.55, heat: 0.7, hash: 0.8, events: 0.85, burnout: 0,
      desc: 'Slower. Cooler. Fewer failures.' },
    stock:        { label: 'Stock', speed: 1, fail: 1, heat: 1, hash: 1, events: 1, burnout: 0.02,
      desc: 'What the manufacturer intended.' },
    overclocked:  { label: 'Overclocked', speed: 1.2, fail: 1.9, heat: 1.4, hash: 1.15, events: 1.2, burnout: 0.3,
      desc: 'Faster. Hotter. Miners burn out for good, worst in the hot aisle.',
      burnNote: 'A miner burned out for good. Spares won\'t fix it. That is what overclocking does.' },
  },

  shifts: {
    8:  { label: '8 hours', speed: 0.85, health: 3, morale: 0.5, events: 0.75,
      desc: 'Slower progress. The crew recovers.' },
    10: { label: '10 hours', speed: 1, health: 0, morale: 0, events: 1,
      desc: 'A normal amount of suffering.' },
    12: { label: '12 hours', speed: 1.25, health: -1.5, morale: -0.4, events: 1.15,
      desc: 'Faster. The crew will not thank you.' },
  },

  // partMix weights decide which part fails. Immersion miners have no fans.
  zones: {
    air:       { label: 'Air-cooled', fail: 1,   fluid: null, burnout: 1,
      partMix: { hashboards: 4, psus: 3, fans: 2.5, boards: 1 } },
    immersion: { label: 'Immersion',  fail: 0.7, fluid: 'dielectric', use: 3, burnout: 0.4,
      partMix: { hashboards: 5, psus: 3, fans: 0, boards: 1.5 } },
    hydro:     { label: 'Hydro',      fail: 0.8, fluid: 'glycol', use: 2, burnout: 0.5,
      partMix: { hashboards: 5, psus: 3, fans: 0.5, boards: 1.5 } },
  },

  // Below these amounts a supply counts as "missing" for event odds.
  short: { foodDays: 3, zipties: 25, dielectric: 20, glycol: 15, hoses: 1, parts: 1 },

  // Final score: survivors by health, then what's left. Miners count for a
  // lot and sats for little, so investing in the site beats hoarding.
  score: {
    health: { good: 500, fair: 400, poor: 300, 'very poor': 200 },
    site: 50,
    minersPerPoint: 2,
    perPart: 2,
    perKit: 2,
    rationsPerPoint: 25,
    tiesPerPoint: 50,
    gallonsPerPoint: 10,
    satsPerPoint: 20000,
    // Points for every day you beat corporate's projection. Rewards speed,
    // so pushing the crew and the fleet can be worth the risk.
    schedule: { days: 300, perDay: 8 },
  },

  ratings: [
    { min: 7000, label: 'Whale' },
    { min: 3500, label: 'Node Runner' },
    { min: 0,    label: 'Pleb' },
  ],

  defaultScores: [
    { name: 'Glycol Gary',      score: 9150 },
    { name: 'Breaker Barb',     score: 7420 },
    { name: 'Aisle 7 Al',       score: 6004 },
    { name: 'Tank Top Tammy',   score: 5090 },
    { name: 'Night Shift Ned',  score: 4200 },
    { name: 'Kevin (raccoon)',  score: 3350 },
    { name: 'Fiber Contractor', score: 2600 },
    { name: 'Corporate',        score: 1800 },
    { name: 'Dusty',            score: 1000 },
    { name: 'An Influencer',    score: 12 },
  ],
};
