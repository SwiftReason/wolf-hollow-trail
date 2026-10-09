// Stops along the trail, in order. `block` is distance from the start on a
// Normal (2,016-block) trip; Short and Long trips scale these.
// type: start | town (store) | landmark | crossing | ercot | difficulty | mempool | end
// zone: the cooling zone you're in after leaving this landmark (omit = no change)
// Each landmark's picture is painted in js/paint/places.js under its id.
window.DATA = window.DATA || {};

DATA.landmarks = [
  {
    id: 'wolf_hollow', name: 'Wolf Hollow', mapKey: 'W', block: 0, type: 'start', zone: 'air',
    store: true, priceMult: 1,
    desc: '1,400 Whatsminers on a caliche pad outside Granbury, Texas. The wolves left. The hum stayed.',
    talk: [
      'Dusty, a night-shift tech, tells you: "Change the filters. Nobody changes the filters."',
      'A man in a hard hat says: "The last manager made it to the Substation. We do not talk about the last manager."',
      'The security guard says: "Wolves? No. Coyotes. They eat the fiber."',
    ],
  },
  {
    id: 'substation', name: 'The Substation', mapKey: 'S', block: 130, type: 'town', zone: 'air',
    store: true, priceMult: 1.15,
    desc: '138 kV comes in. Hashrate goes out. A sign says DANGER. A second sign says DANGER, louder.',
    talk: [
      'An Electrician says: "If it hums, it\'s fine. If it stops humming, run."',
      'A lineman from Oncor says: "Y\'all pull a lot of power for people who don\'t make anything."',
      'A woman eating a kolache says: "Rattlesnakes love the transformer yard. It\'s warm."',
    ],
  },
  {
    id: 'hot_aisle', name: 'The Hot Aisle', mapKey: 'H', block: 280, type: 'landmark', zone: 'air',
    desc: 'Air goes in cool and comes out angry. Someone wrote ABANDON HOPE on the door in dry-erase marker two years ago.',
    talk: [
      'A tech with no eyebrows says: "You get used to it. You don\'t, but you say you do."',
      'A man in earmuffs says something. Nobody hears it.',
    ],
  },
  {
    id: 'immersion_lake', name: 'Immersion Lake', mapKey: 'I', block: 440, type: 'crossing', zone: 'immersion',
    desc: 'Forty tanks of dielectric fluid, still as a church. The fleet has to be migrated across.',
    talk: [
      'A Maintenance tech says: "The fluid is fine. The floor is the problem."',
      'Someone points at tank 12 and says: "There is a phone in there. Do not ask."',
    ],
  },
  {
    id: 'hydro_pass', name: 'Hydro Pass', mapKey: 'Y', block: 640, type: 'crossing', zone: 'hydro',
    store: true, priceMult: 1.2,
    desc: 'Supply on the left. Return on the right. Allegedly.',
    talk: [
      'A plumber says: "Righty tighty. Lefty... I forget."',
      'A tech says: "The blue one is glycol. The green one is also glycol. The yellow one is Gatorade. Probably."',
    ],
  },
  {
    id: 'ercot_peak', name: 'ERCOT Peak', mapKey: 'E', block: 820, type: 'ercot',
    desc: 'Grid load is at a record. This could be a 4CP interval. Nobody will know until October.',
    talk: [
      'Your Electrician says: "Curtail. Or don\'t. It\'s only the whole year\'s transmission bill."',
      'A grid operator on the phone says: "Please." Then hangs up.',
    ],
  },
  {
    id: 'difficulty_adj', name: 'Difficulty Adjustment', mapKey: 'D', block: 1008, type: 'difficulty',
    store: true, priceMult: 1.3,
    desc: 'Halfway there. The network has reconsidered how hard your life should be.',
    talk: [
      'An analyst with a laptop says: "Hashprice is down. It\'s always down. That\'s what it does."',
      'A man in a vest says: "Number go up. Not that number. The other one."',
    ],
  },
  {
    id: 'north_forty', name: 'The North Forty', mapKey: 'N', block: 1220, type: 'crossing', zone: 'air',
    desc: "Corporate's new air-cooled expansion: containers on a fresh dirt pad, no shade for a mile. The fleet has to come off the hydro loops.",
    talk: [
      'A crane operator says: "They poured this pad in August. You can still smell it."',
      'Your Maintenance tech says: "Air cooling again. I just got used to being wet."',
      'A surveyor says: "Phase 3 goes over there. Phase 3 always goes over there."',
    ],
  },
  {
    id: 'mempool_swamp', name: 'The Mempool Swamp', mapKey: 'M', block: 1440, type: 'mempool',
    desc: 'Three hundred thousand unconfirmed transactions. Something is minting JPEGs again.',
    talk: [
      'A stranger says: "My transaction has been pending since March. Which March, I won\'t say."',
      'A pool operator says: "Fees are great. Don\'t ask why."',
    ],
  },
  {
    id: 'loading_dock', name: 'The Loading Dock', mapKey: 'L', block: 1720, type: 'town',
    store: true, priceMult: 1.45,
    desc: 'Pallets come in. Pallets do not go out. Inventory has a theory.',
    talk: [
      'A driver says: "I have 40 drums of fluid for a site called Wolf Holler. Is that you?"',
      'Inventory says: "Everything is accounted for. Do not open that container."',
    ],
  },
  {
    id: 'halving', name: 'The Halving', mapKey: '$', block: 2016, type: 'end',
    desc: 'The block subsidy drops from 3.125 to 1.5625 BTC. You made it. The economics did not.',
    talk: [],
  },
];
