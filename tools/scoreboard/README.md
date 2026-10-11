# The shared Hall of Hashers

The online scoreboard for the copy of the game on GitHub Pages. It's a Google
Sheet with a small Apps Script web app attached (`Code.js`):

- `GET` returns the top 10 scores.
- `POST` (a plain-text JSON body) adds a finished trip after checking it: name
  length, known role/difficulty/trip, no impossible scores, one post per game,
  and at most 30 posts per 10 minutes.

The game only calls it when it is served from the host in
`DATA.config.globalScores` (`data/config.js`). Downloaded copies, slow answers
and errors all fall back to the scores kept in the player's browser.

## Managing scores

Open the **Wolf Hollow Trail - Hall of Hashers** spreadsheet in Google Drive.
Every score is a row in the **Scores** tab. Delete a row to remove a score, or
edit a name. Changes show up the next time someone opens the Hall of Hashers.

## Updating the script

Uses [clasp](https://github.com/google/clasp) (`npm install -g @google/clasp`,
then `clasp login`). `.clasp.json` here points at the script and isn't
committed.

```bash
clasp push
clasp redeploy AKfycbyaIQvw4HUFFRyu0nO0PMpPQQhv9vzVSUmPjiTOtYK5ZzVPqq4a4hTGz2mshIAwKinx --description "Hall of Hashers"
```

Redeploying that ID keeps the same web app URL, so the game doesn't need to
change. If a change needs new permissions, run `setup` once from the script
editor to approve them.
