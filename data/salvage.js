// RMA Pile Salvage: the hunting mini-game. Parts ride the conveyor out of the
// RMA cage; grab the good ones, skip the dead ones.
window.DATA = window.DATA || {};

DATA.salvage = {
  seconds: 30,
  carry: 22,             // base parts you can haul back (Miner Techs raise it)
  perGrab: 2,            // parts per grab: the pile is zip-tied in pairs
  tieCost: 2,            // zip ties used to tag each grabbed part
  minTies: 10,           // won't start below this
  goodRatio: 0.6,        // share of good parts on a fresh pile
  pickedOver: 0.25,      // good ratio lost per salvage within `recentBlocks`
  recentBlocks: 80,
  zapChance: 0.3,        // grabbing a dead PSU sometimes bites back
  zapDamage: 8,
  techFixChance: 0.5,    // a Miner Tech revives a dead hashboard this often
  speed: [70, 130],      // conveyor scene-px/sec at start and end (scene is 320 wide)
  spawn: [0.75, 0.45],   // seconds between parts at start and end
  reach: 22,             // how far from the claw (scene px) a grab still connects

  parts: {
    hashboards: { label: 'hashboard' },
    psus:       { label: 'PSU' },
  },

  intro: 'The RMA pile is a mountain of parts nobody logged, zip-tied in pairs. Some still work. Grab the good ones off the conveyor before they go to the scrapper.',
  controls: 'UP/DOWN to move the claw. SPACE to grab. Or tap a lane. ENTER to stop.',
  noTies: 'You have no zip ties to tag parts with. Inventory will not accept untagged parts.',
  pickedOverText: 'The pile has been picked over recently.',
  zap: '{name} grabbed a dead PSU. It was not entirely dead.',
  techFix: '{name} revived {n} dead hashboard{s} on the bench.',
  overCarry: 'You can only carry {carry} parts back to the cage.',
  nothing: 'You came back with nothing. Security watched the whole time.',

  // Pixel sprites. '#' = main color, '+' = highlight, anything else = empty.
  sprites: {
    hashboards: [
      '++++++++++++++++++++++',
      '+....................+',
      '+.##.##.##.##.##.##..+',
      '+.##.##.##.##.##.##.#+',
      '+....................+',
      '++++++++++++++++++++++',
      ' #  #     #  #    #  ',
    ],
    psus: [
      '+++++++++++++',
      '+...........+',
      '+..#####....+',
      '+.#.....#...+',
      '+.#.###.#.#.+',
      '+.#.....#...+',
      '+..#####..#.+',
      '+...........+',
      '+++++++++++++',
    ],
  },
};
