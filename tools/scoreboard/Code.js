// Wolf Hollow Trail: the shared Hall of Hashers.
//
// An Apps Script web app on top of a Google Sheet. The game on GitHub Pages
// calls it: GET returns the top scores, POST adds a finished trip. Everything
// lives in the "Scores" tab. To remove an entry, delete its row.
//
// Deployed with clasp from this folder (see README.md here).

const SHEET = 'Scores';
const HEAD = ['Date', 'Name', 'Score', 'Role', 'Difficulty', 'Trip', 'Days', 'Survivors', 'Miners', 'Game ID'];
const TOP = 10;

// Must match data/roles.js and data/config.js in the game.
const ROLES = {
  manager: { name: 'Site Manager', mult: 1 },
  electrician: { name: 'Electrician', mult: 1.5 },
  maintenance: { name: 'Facility Maintenance', mult: 2 },
  inventory: { name: 'Inventory', mult: 2.5 },
  tech: { name: 'Miner Technician', mult: 3 },
};
const DIFFS = { greenhorn: 0.75, normal: 1, grizzled: 1.5 };
// The most a trip of each length can score before the role and difficulty
// bonuses, with room to spare. Anything over this was not played.
const MAX_SUBTOTAL = { short: 8500, normal: 10000, long: 13000 };
const MAX_POSTS = 30;          // per 10 minutes, across everyone

// The made-up names the game ships with, so there is someone to beat.
const SEED = [
  ['Glycol Gary', 9150], ['Breaker Barb', 7420], ['Aisle 7 Al', 6004], ['Tank Top Tammy', 5090],
  ['Night Shift Ned', 4200], ['Kevin (raccoon)', 3350], ['Fiber Contractor', 2600],
  ['Corporate', 1800], ['Dusty', 1000], ['An Influencer', 12],
];

// Run once from the editor: makes the Scores tab and asks for permission.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET, 0);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEAD);
    const now = new Date();
    sh.getRange(2, 1, SEED.length, HEAD.length).setValues(
      SEED.map(([name, score], i) => [now, name, score, '', '', '', '', '', '', 'seed-' + i]));
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold');
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd h:mm');
    sh.autoResizeColumns(1, HEAD.length);
  }
  const extra = ss.getSheetByName('Sheet1');
  if (extra && ss.getSheets().length > 1 && extra.getLastRow() === 0) ss.deleteSheet(extra);
}

function doGet() {
  return json({ ok: true, scores: rows().slice(0, TOP).map(pub) });
}

function doPost(e) {
  let entry;
  try {
    entry = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'bad request' });
  }
  const clean = check(entry);
  if (typeof clean === 'string') return json({ ok: false, error: clean });

  const cache = CacheService.getScriptCache();
  const posts = Number(cache.get('posts') || 0);
  if (posts >= MAX_POSTS) return json({ ok: false, error: 'busy' });
  cache.put('posts', String(posts + 1), 600);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
    const ids = sh.getRange(2, 10, Math.max(1, sh.getLastRow() - 1), 1).getValues().map(r => String(r[0]));
    if (!ids.includes(clean.id)) {
      sh.appendRow([new Date(), clean.name, clean.score, ROLES[clean.role].name, clean.diff, clean.trip,
        clean.days, clean.alive, clean.miners, clean.id]);
    }
  } finally {
    lock.releaseLock();
  }
  const all = rows();
  const rank = all.findIndex(r => r.id === clean.id) + 1;
  return json({ ok: true, rank, of: all.length, scores: all.slice(0, TOP).map(pub) });
}

// Returns a cleaned entry, or a reason to refuse it.
function check(x) {
  if (!x || typeof x !== 'object') return 'bad request';
  const id = String(x.id || '');
  if (!/^[a-z0-9]{6,24}$/.test(id)) return 'bad id';
  let name = String(x.name || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  if (!name || name.length > 12) return 'bad name';
  if (/^[=+\-@]/.test(name)) name = "'" + name;   // never let a name become a formula
  if (!ROLES[x.role] || !(x.diff in DIFFS) || !(x.trip in MAX_SUBTOTAL)) return 'bad trip';
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  if (!int(x.days, 1, 1000) || !int(x.alive, 1, 5) || !int(x.miners, 1, 3125)) return 'bad trip';
  const max = Math.round(MAX_SUBTOTAL[x.trip] * ROLES[x.role].mult * DIFFS[x.diff]);
  if (!int(x.score, 0, max)) return 'bad score';
  return { id, name, role: x.role, diff: x.diff, trip: x.trip, days: x.days, alive: x.alive, miners: x.miners, score: x.score };
}

// Every entry, best first.
function rows() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, HEAD.length).getValues()
    .filter(r => r[1] !== '' && typeof r[2] === 'number')
    .map(r => ({ date: r[0], name: String(r[1]).slice(0, 16), score: r[2], role: String(r[3]), id: String(r[9]) }))
    .sort((a, b) => b.score - a.score);
}

function pub(r) { return { name: r.name, score: r.score, role: r.role, id: r.id }; }

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
