// Supplies, the store, and trade offers.
window.DATA = window.DATA || {};

// Every supply bucket the game tracks. `noun` is used in "12 spare PSUs",
// `one` in "1 spare PSU".
DATA.supplies = {
  food:       { label: 'Food',              noun: 'rations', one: 'ration', unit: 'rations' },
  ppe:        { label: 'PPE kits',          noun: 'PPE kits', one: 'PPE kit' },
  zipties:    { label: 'Zip ties & cables', noun: 'zip ties', one: 'zip tie' },
  hashboards: { label: 'Spare hashboards',  noun: 'spare hashboards', one: 'spare hashboard', part: true },
  psus:       { label: 'Spare PSUs',        noun: 'spare PSUs', one: 'spare PSU', part: true },
  fans:       { label: 'Spare fans',        noun: 'spare fans', one: 'spare fan', part: true },
  boards:     { label: 'Spare ctrl boards', noun: 'spare control boards', one: 'spare control board', part: true },
  dielectric: { label: 'Dielectric fluid',  noun: 'gal of dielectric fluid', one: 'gal of dielectric fluid', unit: 'gal' },
  glycol:     { label: 'Coolant/glycol',    noun: 'gal of glycol', one: 'gal of glycol', unit: 'gal' },
  hoses:      { label: 'Hoses & fittings',  noun: 'hose kits', one: 'hose kit' },
};

DATA.store = {
  name: 'Granbury General Supply',
  keeper: 'Dale',
  intro: [
    'Hello, I\'m Dale. So you\'re keeping Wolf Hollow alive until the Halving. I can fix you up with what you need:',
    '- more racks of miners',
    '- tacos and energy drinks',
    '- PPE for the whole crew',
    '- zip ties and patch cables',
    '- spare parts',
    '- dielectric fluid, glycol, and hoses for later',
  ],
  groups: [
    { label: 'Miner racks',             items: ['miners'] },
    { label: 'Tacos & energy drinks',   items: ['food'] },
    { label: 'PPE',                     items: ['ppe'] },
    { label: 'Zip ties & cables',       items: ['zipties'] },
    { label: 'Spare parts',             items: ['hashboards', 'psus', 'fans', 'boards'] },
    { label: 'Fluids & hoses',          items: ['dielectric', 'glycol', 'hoses'] },
  ],
  items: {
    miners:     { name: 'Whatsminer racks', unit: 'rack', price: 180000, gives: { miners: 20 },
      advice: 'Twenty Whatsminers to a rack. The site holds 3,125. More miners, more blocks per day.' },
    food:       { name: 'Tacos & energy drinks', unit: 'crate', price: 10000, gives: { food: 25 },
      advice: '25 rations a crate. Five people eat 15 a day. Breakfast tacos are not optional in Texas.' },
    ppe:        { name: 'PPE kits', unit: 'kit', price: 40000, gives: { ppe: 1 },
      advice: 'Gloves, glasses, ear plugs, boots. One per person, minimum. Hearing does not grow back.' },
    zipties:    { name: 'Zip ties & patch cables', unit: 'box of 50', price: 2500, gives: { zipties: 50 },
      advice: 'You will need more than you think. Coyotes like fiber.' },
    hashboards: { name: 'Spare hashboards', unit: 'board', price: 27000, gives: { hashboards: 1 },
      advice: 'The most common failure. One spare puts one miner back online.' },
    psus:       { name: 'Spare PSUs', unit: 'PSU', price: 16000, gives: { psus: 1 },
      advice: 'PSUs pop in heat and storms. Electricians make them pop less.' },
    fans:       { name: 'Spare fans', unit: 'fan', price: 3500, gives: { fans: 1 },
      advice: 'Air-cooled miners eat fans. Immersion miners have no fans. That is the main idea.' },
    boards:     { name: 'Spare control boards', unit: 'board', price: 11000, gives: { boards: 1 },
      advice: 'Control boards die of bad firmware and fire ants. Both are common.' },
    dielectric: { name: 'Dielectric fluid', unit: '55-gal drum', price: 90000, gives: { dielectric: 55 },
      advice: 'Tanks leak and evaporate. Without spare fluid, a bad seal cooks miners.' },
    glycol:     { name: 'Coolant/glycol', unit: '55-gal drum', price: 40000, gives: { glycol: 55 },
      advice: 'The hydro loops drink glycol. It is not Gatorade. People keep checking.' },
    hoses:      { name: 'Hoses & fittings', unit: 'kit', price: 15000, gives: { hoses: 1 },
      advice: 'A burst hose without a spare is a bad day. With a spare it is a wet day.' },
  },
};

// Random offers from "Attempt to trade". Ranges are [min, max].
DATA.trades = [
  { who: 'A contractor',                 give: { food: [30, 60] },      get: { psus: [2, 7] } },
  { who: 'The night shift',              give: { zipties: [50, 100] },  get: { food: [20, 40] } },
  { who: 'A guy from the next site over', give: { ppe: [1, 1] },        get: { hashboards: [2, 4] } },
  { who: 'An HVAC tech',                 give: { food: [10, 25] },      get: { fans: [4, 11] } },
  { who: 'The fiber contractor',         give: { hashboards: [2, 2] },  get: { zipties: [100, 200] } },
  { who: 'A truck driver',               give: { food: [40, 80] },      get: { dielectric: [20, 55] } },
  { who: 'A plumber',                    give: { psus: [2, 2] },        get: { hoses: [1, 2] } },
  { who: 'An electrician from Dallas',   give: { fans: [4, 9] },        get: { boards: [2, 4] } },
  { who: 'Someone in a lifted truck',    give: { food: [20, 40] },      get: { glycol: [15, 30] } },
  { who: 'A crypto podcaster',           give: { food: [15, 30] },      get: { ppe: [1, 1] } },
];
