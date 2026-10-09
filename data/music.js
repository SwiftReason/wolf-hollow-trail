// Music, synthesized live (see js/audio.js). All tunes are original except
// the funeral march, which is Chopin (public domain).
//
// FORMAT
//   bpm      tempo in quarter notes per minute
//   bar      sixteenths per bar (16 = 4/4, 12 = 3/4); used only to check lengths
//   swing    0..0.5, pushes off-beat eighths late (country shuffle feel)
//   loop     repeat forever, or play once
//   voices   each plays its own line, looping on its own
//     inst   lead | reed | pluck | bass | pad | organ | drums
//     vol    0..1
//     notes  space-separated tokens: NOTE:LEN, where LEN is in sixteenths
//            (default 2). Notes like C4, F#3, Bb2. Chords join with +
//            (G3+B3+D4:4). A dot is a rest (.:4). Drums: k kick, s snare,
//            h hat (k+h:2). Bar lines | are ignored, they're just for reading.
window.DATA = window.DATA || {};

DATA.music = {
  // Lonesome 3/4 in A minor, with a wolf somewhere out there.
  title: {
    bpm: 80, bar: 12, loop: true,
    voices: [
      { inst: 'lead', vol: 0.9, notes: `
        E4:6 A4:3 B4:3 | C5:6 B4:3 A4:3 | G4:6 E4:6 | D4:9 .:3 |
        E4:3 A4:3 C5:6 | B4:3 A4:3 F4:6 | G#4:6 B4:6 | A4:12 |` },
      { inst: 'pluck', vol: 0.7, notes: `
        A2:4 E3:4 A3:4 | F2:4 C3:4 F3:4 | C3:4 G3:4 C4:4 | G2:4 D3:4 G3:4 |
        A2:4 E3:4 A3:4 | F2:4 C3:4 F3:4 | E2:4 B2:4 E3:4 | A2:4 E3:4 A3:4 |` },
      { inst: 'pad', vol: 0.45, notes: `
        A3+C4+E4:12 | F3+A3+C4:12 | E3+G3+C4:12 | D3+G3+B3:12 |
        A3+C4+E4:12 | F3+A3+C4:12 | E3+G#3+B3:12 | A3+C4+E4:12 |` },
    ],
  },

  // Country shuffle in G for the open trail. A section, then B.
  trail: {
    bpm: 124, bar: 16, swing: 0.28, loop: true,
    voices: [
      { inst: 'reed', vol: 0.55, notes: `
        B4:4 D5:2 B4:2 A4:4 G4:4 | B4:2 D5:2 E5:4 D5:8 | E5:4 G5:2 E5:2 D5:4 C5:4 | B4:4 A4:2 B4:2 G4:8 |
        A4:4 B4:2 C5:2 D5:4 A4:4 | C5:4 B4:2 A4:2 G4:4 E4:4 | D4:4 G4:2 B4:2 A4:4 F#4:4 | G4:12 .:4 |
        G4:4 B4:4 E5:6 D5:2 | C5:4 E5:4 G5:4 E5:4 | D5:6 B4:2 G4:4 B4:4 | A4:8 F#4:4 A4:4 |
        B4:4 E5:2 D5:2 B4:4 G4:4 | A4:4 C5:2 B4:2 A4:4 E4:4 | F#4:4 A4:2 D5:2 C5:4 A4:4 | G4:16 |` },
      { inst: 'pluck', vol: 0.5, notes: `
        .:4 G3+B3+D4:4 .:4 G3+B3+D4:4 | .:4 G3+B3+D4:4 .:4 G3+B3+D4:4 | .:4 C4+E4+G3:4 .:4 C4+E4+G3:4 | .:4 G3+B3+D4:4 .:4 G3+B3+D4:4 |
        .:4 D3+F#3+A3:4 .:4 D3+F#3+A3:4 | .:4 C4+E4+G3:4 .:4 C4+E4+G3:4 | .:4 G3+B3+D4:4 .:4 D3+F#3+A3:4 | .:4 G3+B3+D4:4 .:4 G3+B3+D4:4 |
        .:4 E3+G3+B3:4 .:4 E3+G3+B3:4 | .:4 C4+E4+G3:4 .:4 C4+E4+G3:4 | .:4 G3+B3+D4:4 .:4 G3+B3+D4:4 | .:4 D3+F#3+A3:4 .:4 D3+F#3+A3:4 |
        .:4 E3+G3+B3:4 .:4 E3+G3+B3:4 | .:4 C4+E4+G3:4 .:4 C4+E4+G3:4 | .:4 D3+F#3+A3:4 .:4 D3+F#3+A3:4 | .:4 G3+B3+D4:4 .:4 G3+B3+D4:4 |` },
      { inst: 'bass', vol: 0.8, notes: `
        G2:4 .:4 D3:4 .:4 | G2:4 .:4 D3:4 .:4 | C3:4 .:4 G2:4 .:4 | G2:4 .:4 D3:4 .:4 |
        D3:4 .:4 A2:4 .:4 | C3:4 .:4 G2:4 .:4 | G2:4 .:4 D3:4 .:4 | G2:4 .:4 D3:4 .:4 |
        E2:4 .:4 B2:4 .:4 | C3:4 .:4 G2:4 .:4 | G2:4 .:4 D3:4 .:4 | D3:4 .:4 A2:4 .:4 |
        E2:4 .:4 B2:4 .:4 | C3:4 .:4 G2:4 .:4 | D3:4 .:4 A2:4 .:4 | G2:4 .:4 D3:4 G2:4 |` },
      { inst: 'drums', vol: 0.5, notes: `
        k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 |
        k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 k:2 s:2 s:2 |
        k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 |
        k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 s:2 s:2 s:2 |` },
    ],
  },

  // Campfire guitar for stopping at a landmark.
  camp: {
    bpm: 92, bar: 16, loop: true,
    voices: [
      { inst: 'pluck', vol: 0.85, notes: `
        G2:2 D3:2 G3:2 B3:2 D4:2 B3:2 G3:2 D3:2 | C3:2 G3:2 C4:2 E4:2 G4:2 E4:2 C4:2 G3:2 |
        D3:2 A3:2 D4:2 F#4:2 A4:2 F#4:2 D4:2 A3:2 | G2:2 D3:2 G3:2 B3:2 D4:2 B3:2 G3:2 D3:2 |
        E3:2 B3:2 E4:2 G4:2 B4:2 G4:2 E4:2 B3:2 | C3:2 G3:2 C4:2 E4:2 G4:2 E4:2 C4:2 G3:2 |
        D3:2 A3:2 D4:2 F#4:2 A4:2 F#4:2 D4:2 A3:2 | G2:2 D3:2 G3:2 B3:2 G3:8 |` },
      { inst: 'pad', vol: 0.4, notes: `
        G3+B3+D4:16 | E3+G3+C4:16 | F#3+A3+D4:16 | G3+B3+D4:16 |
        E3+G3+B3:16 | E3+G3+C4:16 | F#3+A3+D4:16 | G3+B3+D4:16 |` },
    ],
  },

  // Jaunty general-store ragtime in C.
  store: {
    bpm: 148, bar: 16, swing: 0.15, loop: true,
    voices: [
      { inst: 'lead', vol: 0.5, notes: `
        E5:2 G5:2 E5:2 C5:2 D5:4 E5:4 | F5:2 A5:2 F5:2 C5:2 E5:4 F5:4 | G5:4 F5:2 E5:2 D5:4 B4:4 | C5:8 .:8 |` },
      { inst: 'pluck', vol: 0.45, notes: `
        .:2 C4+E4+G4:2 .:2 C4+E4+G4:2 .:2 C4+E4+G4:2 .:2 C4+E4+G4:2 | .:2 C4+F4+A4:2 .:2 C4+F4+A4:2 .:2 C4+F4+A4:2 .:2 C4+F4+A4:2 |
        .:2 B3+D4+G4:2 .:2 B3+D4+G4:2 .:2 B3+D4+F4:2 .:2 B3+D4+F4:2 | .:2 C4+E4+G4:2 .:2 C4+E4+G4:2 .:8 |` },
      { inst: 'bass', vol: 0.75, notes: `
        C3:4 G2:4 C3:4 G2:4 | F2:4 C3:4 F2:4 C3:4 | G2:4 D3:4 G2:4 D3:4 | C3:4 G2:4 C3:8 |` },
      { inst: 'drums', vol: 0.35, notes: `
        k:4 h:4 s:4 h:4 | k:4 h:4 s:4 h:4 | k:4 h:4 s:4 h:4 | k:4 h:4 s:4 h:4 |` },
    ],
  },

  // Tense E minor groove for the RMA pile.
  salvage: {
    bpm: 156, bar: 16, loop: true,
    voices: [
      { inst: 'lead', vol: 0.45, notes: `
        E4:2 .:2 G4:2 .:2 B4:4 A4:2 G4:2 | F#4:2 .:2 A4:2 .:2 B4:6 .:2 |
        E4:2 .:2 G4:2 .:2 B4:4 D5:2 B4:2 | C5:4 B4:4 A4:4 F#4:4 |` },
      { inst: 'bass', vol: 0.8, notes: `
        E2:2 E2:2 E3:2 E2:2 G2:2 E2:2 D3:2 E2:2 | E2:2 E2:2 E3:2 E2:2 B2:2 A2:2 G2:2 F#2:2 |
        E2:2 E2:2 E3:2 E2:2 G2:2 E2:2 D3:2 E2:2 | C3:2 C3:2 C3:2 C3:2 B2:2 B2:2 B2:2 B2:2 |` },
      { inst: 'drums', vol: 0.5, notes: `
        k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 |
        k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 s:2 s:2 s:2 |` },
    ],
  },

  // Chopin, Piano Sonata No. 2, third movement (public domain).
  funeral: {
    bpm: 50, bar: 16, loop: true,
    voices: [
      { inst: 'organ', vol: 0.6, notes: `
        Bb3:4 Bb3:3 Bb3:1 Bb3:4 Db4:3 C4:1 | C4:3 Bb3:1 Bb3:3 A3:1 Bb3:8 |` },
      { inst: 'pad', vol: 0.4, notes: `
        Bb2+Db3+F3:16 | F2+C3+Eb3:8 Bb2+Db3+F3:8 |` },
      { inst: 'bass', vol: 0.6, notes: `
        Bb1:4 F2:4 Bb1:4 F2:4 | F2:4 C2:4 Bb1:8 |` },
    ],
  },

  victory: {
    bpm: 120, bar: 16, loop: true,
    voices: [
      { inst: 'lead', vol: 0.6, notes: `
        C5:2 C5:2 C5:2 E5:6 D5:2 E5:2 | G5:8 E5:4 C5:4 | F5:4 E5:2 D5:2 E5:4 C5:4 | D5:4 B4:4 C5:8 |` },
      { inst: 'pad', vol: 0.35, notes: `
        C4+E4+G4:16 | C4+E4+G4:16 | F3+A3+C4:16 | G3+B3+D4:8 C4+E4+G4:8 |` },
      { inst: 'bass', vol: 0.75, notes: `
        C3:4 G2:4 C3:4 G2:4 | C3:4 G2:4 C3:4 G2:4 | F2:4 C3:4 F2:4 C3:4 | G2:4 D3:4 C3:8 |` },
      { inst: 'drums', vol: 0.45, notes: `
        k:4 s:4 k:4 s:4 | k:4 s:4 k:4 s:4 | k:4 s:4 k:4 s:4 | k:2 k:2 s:4 k:4 s:2 s:2 |` },
    ],
  },

  gameover: {
    bpm: 56, bar: 16, loop: false,
    voices: [
      { inst: 'lead', vol: 0.55, notes: `E4:8 D4:8 | C4:8 B3:8 | A3:16 |` },
      { inst: 'pad', vol: 0.4, notes: `A2+C3+E3:16 | F2+A2+C3:8 E2+G#2+B2:8 | A2+C3+E3:16 |` },
    ],
  },
};

// Which track plays where. Screens ask for a mood; this maps it to a tune.
DATA.musicFor = {
  title: 'title', trail: 'trail', landmark: 'camp', store: 'store', salvage: 'salvage',
  death: 'funeral', victory: 'victory', gameover: 'gameover',
};
