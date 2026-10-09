// Ailments: lingering conditions that drain health each day.
// If someone dies while sick, their worst ailment's `death` line is used.
window.DATA = window.DATA || {};

DATA.ailments = {
  tinnitus:        { name: 'tinnitus',          dmg: 0.3, days: [60, 120], death: '{name} died of tinnitus. Probably.' },
  dust_lung:       { name: 'dust lung',         dmg: 3,   days: [8, 16],   death: '{name} died of dust lung from not changing the filters.' },
  heat_exhaustion: { name: 'heat exhaustion',   dmg: 3.5, days: [3, 6],    death: '{name} died of heat stroke in the hot aisle.' },
  wet_boots:       { name: 'wet boots',         dmg: 1,   days: [3, 6],    death: '{name} died of trench foot. The boots never dried.' },
  snakebite:       { name: 'snakebite',         dmg: 4,   days: [4, 8],    death: '{name} died of a rattlesnake bite.' },
  fire_ants:       { name: 'fire ant stings',   dmg: 1.5, days: [2, 4],    death: '{name} died of fire ant stings. There were a lot of them.' },
  broken_leg:      { name: 'a broken leg',      dmg: 2,   days: [12, 20],  death: '{name} died of a broken leg. The ladder is fine.' },
  asic_fever:      { name: 'ASIC fever',        dmg: 3,   days: [5, 10],   death: '{name} died of ASIC fever.' },
  cut_hand:        { name: 'a cut hand',        dmg: 1.2, days: [3, 6],    death: '{name} died of an infected heatsink cut.' },
  glycol_rash:     { name: 'glycol rash',       dmg: 1.5, days: [4, 8],    death: '{name} died of glycol poisoning.' },
  frostbite:       { name: 'frostbite',         dmg: 2.5, days: [5, 9],    death: '{name} froze in the parking lot.' },
  energy_heart:    { name: 'energy drink heart', dmg: 3,  days: [3, 6],    death: '{name} died of energy drink heart.' },
  exhaustion:      { name: 'exhaustion',        dmg: 2.5, days: [4, 8],    death: '{name} worked one too many 12s.' },
  dysentery:       { name: 'dysentery',         dmg: 3.5, days: [5, 10],   death: '{name} died of dysentery.' },
  sunburn:         { name: 'sunburn',           dmg: 0.8, days: [3, 5],    death: '{name} died of sunburn. In Texas this is possible.' },
};

// Used when someone runs out of health with no ailment to blame.
DATA.deathGeneric = {
  starved:    '{name} starved. There were no tacos.',
  overworked: '{name} worked one too many 12s.',
  exhaustion: '{name} died of exhaustion.',
};
