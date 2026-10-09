// Granbury, TX weather. `high` is the average daily high in F.
// storm/ice/dust are the daily odds of that condition starting.
window.DATA = window.DATA || {};

DATA.weather = {
  persist: 0.55,   // chance yesterday's weather carries over
  spread: 7,       // daily temperature wobble (std dev, F)
  months: [
    { name: 'January',   high: 57, storm: .04, ice: .07, dust: .01 },
    { name: 'February',  high: 61, storm: .05, ice: .06, dust: .02 },
    { name: 'March',     high: 69, storm: .08, ice: .01, dust: .05 },
    { name: 'April',     high: 77, storm: .12, ice: 0,   dust: .05 },
    { name: 'May',       high: 84, storm: .14, ice: 0,   dust: .03 },
    { name: 'June',      high: 92, storm: .08, ice: 0,   dust: .05 },
    { name: 'July',      high: 96, storm: .04, ice: 0,   dust: .07 },
    { name: 'August',    high: 97, storm: .04, ice: 0,   dust: .07 },
    { name: 'September', high: 89, storm: .06, ice: 0,   dust: .04 },
    { name: 'October',   high: 79, storm: .07, ice: 0,   dust: .02 },
    { name: 'November',  high: 67, storm: .05, ice: .01, dust: .02 },
    { name: 'December',  high: 58, storm: .04, ice: .06, dust: .01 },
  ],
  conditions: {
    clear: { label: 'clear',         speed: 1 },
    storm: { label: 'storms',        speed: 0.85 },
    ice:   { label: 'ice storm',     speed: 0.5 },
    dust:  { label: 'dust',          speed: 0.9 },
  },
  // First band whose `min` the temperature meets. `tag` is what events key on.
  heat: [
    { min: 103, tag: 'veryhot', label: 'scorching' },
    { min: 96,  tag: 'veryhot', label: 'very hot' },
    { min: 88,  tag: 'hot',     label: 'hot' },
    { min: 68,  tag: 'warm',    label: 'warm' },
    { min: 45,  tag: 'cool',    label: 'cool' },
    { min: -99, tag: 'cold',    label: 'cold' },
  ],
};
