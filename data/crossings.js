// Choice landmarks: cooling-zone migrations ("river crossings"), ERCOT Peak,
// and the Mempool Swamp. Keyed by landmark id.
//
// Crossing readings work like the river's depth: above `safe` things get
// risky, at `danger` they're as bad as they get.
// Tokens: {name} crew member, {n} miners, {gal} gallons, {sats}, {days},
// {amount} lost supplies ("3 spare fans")
window.DATA = window.DATA || {};

DATA.crossings = {
  immersion_lake: {
    intro: 'The fleet must be migrated from air to immersion cooling. {racks} racks to move.',
    reading: { label: 'Fluid temp', unit: 'F', min: 86, max: 124, safe: 100, danger: 120 },
    fluid: 'dielectric', fluidNeed: 110,
    ferry: { who: 'ImmerseCo', price: 450000, days: [2, 5] },
    options: {
      ford:  'Hot-swap them live',
      caulk: 'Drain, swap, refill',
      ferry: 'Hire ImmerseCo',
    },
    info: [
      'HOT-SWAP LIVE: fast and free. Hot fluid makes it dangerous. People have gone in after hashboards.',
      'DRAIN, SWAP, REFILL: takes 3 days and 110 gallons of dielectric fluid. Much safer.',
      'IMMERSECO: contractors do it for you. Costs sats. You wait for them to show up.',
      'WAIT A DAY: the fluid may cool down. Or not.',
    ],
    success: {
      ford:  'You hot-swapped the fleet into the tanks. Nothing caught fire. Lose 1 day.',
      caulk: 'You drained, swapped, and refilled. It took 3 days and {gal} gallons of fluid. The tanks are full.',
      ferry: 'ImmerseCo arrived {days} days late and moved everything. They left a sticker on every tank.',
    },
    fail: {
      ford:  'The hot-swap went sideways. {n} miners went into the tank and stayed there.',
      caulk: 'The refill pump jammed halfway. {n} miners sat dry and overheated.',
      ferry: 'ImmerseCo dropped a rack. {n} miners. They will send a bill.',
    },
    lost: '{amount} went into the tank.',
    deaths: [
      '{name} went into tank 7 after a hashboard and did not come back up.',
      '{name} was lost in the migration. The fluid was very still afterward.',
    ],
  },

  hydro_pass: {
    intro: 'The fleet must be migrated from immersion to hydro cooling. {racks} racks to re-plumb.',
    reading: { label: 'Loop pressure', unit: ' psi', min: 30, max: 95, safe: 50, danger: 85 },
    fluid: 'glycol', fluidNeed: 80,
    ferry: { who: 'Pipe & Pray Plumbing', price: 380000, days: [2, 4] },
    options: {
      ford:  'Re-plumb them live',
      caulk: 'Drain, swap, refill',
      ferry: 'Hire Pipe & Pray',
    },
    info: [
      'RE-PLUMB LIVE: fast and free. High loop pressure turns hoses into weapons.',
      'DRAIN, SWAP, REFILL: takes 3 days and 80 gallons of glycol. Much safer.',
      'PIPE & PRAY PLUMBING: they do it for you. Costs sats. Their name is not reassuring.',
      'WAIT A DAY: the pressure may come down. Or not.',
    ],
    success: {
      ford:  'You re-plumbed the fleet live. Everyone is damp. Lose 1 day.',
      caulk: 'You drained the loops, swapped, and refilled with {gal} gallons of glycol. It took 3 days.',
      ferry: 'Pipe & Pray showed up {days} days late. Everything is connected. Some of it to the right thing.',
    },
    fail: {
      ford:  'A manifold let go during the swap. {n} miners got pressure-washed.',
      caulk: 'Somebody refilled the supply side with the return line open. {n} miners overheated.',
      ferry: 'Pipe & Pray crossed two lines. {n} miners cooked. They prayed.',
    },
    lost: '{amount} went down the floor drain.',
    deaths: [
      '{name} was pressure-washed into the afterlife by a burst manifold.',
      '{name} forgot which valve was the supply side. For the last time.',
    ],
  },
};

DATA.ercot = {
  season: [5, 6, 7, 8],   // 4CP intervals only happen June-September
  info: [
    '4CP: ERCOT bills your next year of transmission based on your load during the four highest peaks of the summer. Nobody knows which intervals count until it\'s over.',
    'CURTAIL: shut the fleet down for 2 days. You get demand-response credits. You mine nothing.',
    'RUN THROUGH: keep mining. If this was a 4CP interval, next year\'s transmission bill comes out of your sats now. The grid may also brown out.',
    'An Electrician can read the load forecast and keeps the fleet alive through brownouts.',
  ],
  curtail:   'You curtailed for 2 days. ERCOT paid {sats} sats in demand-response credits.',
  was4cp:    'It was a 4CP interval. Corporate says the transmission charge comes out of your budget: {sats} sats.',
  not4cp:    'It was not a 4CP interval. Nobody will know until October, but it wasn\'t.',
  curtailed4cp:    'It was a 4CP interval. You dodged it. Corporate does not say thank you.',
  curtailedNo4cp:  'It was not a 4CP interval. You curtailed anyway. ERCOT thanks you for your service.',
  brownout:  'The grid browned out. {n} PSUs did not come back.',
  offSeason: 'It is not 4CP season. Your Electrician wants to know why you stopped.',
};

DATA.mempool = {
  info: [
    'FEES: when the mempool is full, every block pays more. The swamp pays well.',
    'PUSH THE FLEET: run hot for fees. More sats. Miners cook.',
    'MINE NORMALLY: take the fees you get.',
    'WAIT A DAY: fees might climb. The mempool might also clear overnight.',
  ],
  push:   'You pushed the fleet through the swamp. The pool paid {sats} sats in fees. {n} miners cooked.',
  normal: 'You mined through the swamp. The pool paid {sats} sats in fees.',
  climb:  'Fees climbed overnight.',
  fall:   'Fees dropped overnight.',
  crash:  'The mempool cleared overnight. Someone stopped minting JPEGs.',
};
