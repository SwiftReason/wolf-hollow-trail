// The shared Hall of Hashers, for the copy of the game hosted on GitHub Pages.
// Scores live in a Google Sheet behind a small web app (tools/scoreboard).
// Every call gives up quietly and returns null: downloaded copies, no
// internet, or a slow answer all leave the game using the scores kept on
// this computer.

const Online = {
  enabled() {
    const C = DATA.config.globalScores;
    return !!(C && C.url && location.hostname === C.host && navigator.onLine !== false);
  },

  async call(body) {
    const C = DATA.config.globalScores;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), C.timeoutMs);
    try {
      // A plain-text body keeps this a "simple" request, which the web app
      // can answer without a CORS preflight.
      const r = await fetch(C.url, body ? { method: 'POST', body: JSON.stringify(body), signal: ctl.signal } : { signal: ctl.signal });
      const j = r.ok ? await r.json() : null;
      return j && j.ok && Array.isArray(j.scores) ? j : null;
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  },

  // The top scores, or null.
  async top() {
    if (!Online.enabled()) return null;
    const j = await Online.call(null);
    return j && j.scores;
  },

  // Post a finished trip. Returns { scores, rank, of }, or null.
  async submit(G, total) {
    if (!Online.enabled()) return null;
    return Online.call({
      id: G.id, name: G.crew[0].name, score: total, role: G.role, diff: G.diff || 'normal', trip: G.length || 'normal',
      days: G.day, alive: Q.alive(G).length, miners: G.fleet.online,
    });
  },
};
