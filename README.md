# Wolf Hollow Trail

A bitcoin-mining parody of *The Oregon Trail* (1985). You lead a crew of five
across a 1,400-Whatsminer site in Granbury, Texas, from Wolf Hollow to The
Halving. Along the way you cross the air, immersion and hydro cooling zones,
ride out ERCOT peaks and Texas weather, and try to mine every block before
the difficulty adjustment catches up with you. People will die of dysentery.
Miners will die of heat.

**Play it:** https://swiftreason.github.io/wolf-hollow-trail/

## Running it yourself

There's no build step and nothing to install. Download the repo and open
`index.html` in a browser. It works offline, including the fonts.

## How to play

Everything is driven by the keyboard. Press the number or letter next to a
choice.

- Pick a role, name your crew (up to two of each role), choose a start month,
  trip length and difficulty, then buy supplies.
- On the trail, press **Enter** or **Space** for the menu. **F** fast-forwards
  and **J** opens the trail journal.
- The tuning (underclocked / stock / overclocked) and shift length (8, 10 or
  12 hours) trade speed against heat, burnout and crew health.
- At cooling-zone crossings you can haul the miners across hot, re-rack and
  re-cable, hire riggers, or wait for better conditions.
- Salvage the RMA pile for spare parts when you're short.

Three save slots and the Hall of Hashers high scores are kept in your
browser's local storage.

## Changing the game

The content lives in `data/` as plain JavaScript files: events, choice events,
landmarks, crossings, store items, roles, weather, deaths and epitaphs, and
music (as note strings). Edit them and reload. The game logic is in `js/` and
the pixel art is drawn in code in `js/paint/`.

`tools/balance.js` plays thousands of games with a scripted player to check
win rates after a change:

```bash
node tools/balance.js all
node tools/balance.js tech 5 careful 400 long grizzled
```

## Credits

- Fonts: [DotGothic16](https://fonts.google.com/specimen/DotGothic16) and
  [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P), both
  under the SIL Open Font License (see `fonts/`).
- The funeral music is Chopin's Funeral March, which is in the public domain.
  All other music and sound is synthesized in the browser.

This is a parody. It isn't affiliated with or endorsed by the makers of
*The Oregon Trail*, MicroBT, ERCOT or anyone who runs an actual mining site.
