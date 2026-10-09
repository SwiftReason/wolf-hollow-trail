// Jobs at the site. The player's role sets starting sats and score multiplier.
// Perks apply for every living crew member with that role and stack
// multiplicatively (two Electricians: psuFail 0.6 * 0.6).
window.DATA = window.DATA || {};

DATA.maxPerRole = 2;

DATA.roles = [
  {
    id: 'manager', name: 'Site Manager', short: 'Manager', pick: 'Be a Site Manager',
    sats: 16000000, mult: 1,
    lost: 'Nobody is left to manage the site.',
    perk: 'One-time "escalate to corporate" cancels a bad event. Corporate visits hurt morale less.',
    perks: { corporateMorale: 0.5 },   // each living manager also gets one escalation
  },
  {
    id: 'electrician', name: 'Electrician', short: 'Electrician', pick: 'Be an Electrician',
    sats: 12000000, mult: 1.5,
    lost: 'You no longer have an Electrician.',
    perk: 'Fewer PSU and electrical failures. Better odds running through ERCOT Peak.',
    perks: { psuFail: 0.6, ercotOdds: 1.3 },
  },
  {
    id: 'maintenance', name: 'Facility Maintenance', short: 'Maintenance', pick: 'Work Facility Maintenance',
    sats: 9000000, mult: 2,
    lost: 'Nobody is left in Facility Maintenance.',
    perk: 'Fewer hydro leaks and immersion spills. Safer cooling crossings. Fans and HVAC fail less.',
    perks: { fanFail: 0.6, crossingOdds: 1.3 },
  },
  {
    id: 'inventory', name: 'Inventory', short: 'Inventory', pick: 'Work Inventory',
    sats: 7000000, mult: 2.5,
    lost: 'Nobody is left in Inventory. The spreadsheet is orphaned.',
    perk: '20% store discount. Sometimes finds unlogged spare parts.',
    perks: { priceMult: 0.8 },
  },
  {
    id: 'tech', name: 'Miner Technician', short: 'Miner Tech', pick: 'Be a Miner Technician',
    sats: 5000000, mult: 3,
    lost: 'You no longer have a Miner Technician.',
    perk: 'Repairs hashboards instead of replacing them. Bonus in RMA Pile Salvage.',
    perks: { hbRepairFail: 0.5, benchRepair: 4.5, salvage: 1.25 },
  },
];
