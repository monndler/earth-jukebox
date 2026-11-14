/**
 * User-facing strings (English). Kept in data so a second language can be added later (P1).
 * Templates use {placeholders}. All UI text comes from here — never hardcode in components.
 */
export const strings = {
  /* ─── Existing (Phases 1–3) ─── */
  levels: { low: 'low', middle: 'middle', high: 'high', 'no-data': 'no data' } as const,
  cell: {
    short: 'Row {row}, column {col}, {level}',
    shortNoData: 'Row {row}, column {col}, no data',
    detailedHead: 'Row {row}, column {col}',
    dataShare: '{percent} percent of this cell has data',
    valueAbove: '{amount} {units} above {baseline}',
    valueBelow: '{amount} {units} below {baseline}',
    valuePlain: '{amount} {units}',
  },
  summary: {
    empty: 'This frame has no data.',
    uniform: 'Values are similar across the whole map.',
    extremeLine: '{label} area is {where}.',
    coverage: 'About {percent} percent of the map has no data.',
    where: { left: 'on the left side', middle: 'in the middle', right: 'on the right side' },
  },

  /* ─── Phase 4: Global elements ─── */
  app: {
    title: 'OceanEcho',
  },
  header: {
    announceOn: 'Sound on',
    announceOff: 'Sound off',
    backLabel: 'Back to track list',
    soundOn: 'Sound: On',
    soundOff: 'Sound: Off',
    soundTurnedOn: 'Sound turned on',
  },
  intro: {
    line: 'Sound starts only when you press a sound button. Stop all sound is always available.',
  },
  badges: {
    'decoded-legend': 'Decoded from legend',
    'relative-intensity': 'Visual translation',
  } as const,
  notices: {
    'decoded-legend':
      'Values are decoded from the visualization legend. The sound represents data values as displayed.',
    'relative-intensity':
      'This is a visual translation — not calibrated data. The sound represents relative visual intensity, not measured values.',
  } as const,
  source: {
    line: '{dataset} — {date}',
  },

  /* ─── Landing page (Track Library view) ─── */
  landing: {
    navLabel: 'Main navigation',
    brandLabel: 'OceanEcho home',
    brandA: 'OCEAN',
    brandB: 'ECHO',
    navAbout: 'About',
    navTracks: 'Tracks',
    navHow: 'How it works',
    navCta: 'Listen now',
    eyebrow: 'NASA DATA, HEARD',
    heroLine1: 'Listen to the Ocean.',
    heroLine2: "Discover Earth's",
    heroLine3: 'Changing Voice.',
    heroDescription:
      'What if you could hear our oceans changing? Explore NASA Earth science through sound, turning data into a listening experience for everyone.',
    heroPrimary: 'Explore the tracks',
    heroSecondary: 'See how it works',
    artLabel: 'Abstract glowing blue planet surrounded by sound waves',
    glanceLabel: 'OceanEcho at a glance',
    statTracks: 'Tracks to explore',
    statFrames: 'Dated frames',
    statCells: 'Map cells per track',
    statSources: 'NASA data products',
    statCellsMixed: 'Varies',
    experienceEyebrow: 'THE LISTENING EXPERIENCE',
    experienceHeading: 'Choose a track and let the data become sound.',
    experienceIntro: 'Each track is a NASA visualization with its source, dates and limits stated.',
    empty: 'Tracks are being prepared.',
    cardKicker: 'NASA TRACK',
    cardIndex: '{n} / TRACK',
    cardMeta: '{frames} dated frames · {cols} × {rows} map cells',
    cardButton: 'Enter experience',
    howEyebrow: 'HOW IT WORKS',
    howHeading: 'From a NASA picture to sound.',
    howNote: 'The sounds are design choices to be tuned with listeners, not scientific facts.',
    howSteps: [
      {
        title: 'Choose a NASA map',
        text: 'Each track is a NASA visualization with a known colour scale and date.',
      },
      {
        title: 'We read it into a grid',
        text: 'The map is divided into cells. Each cell gets one value from the colours inside it, or is marked as having no data.',
      },
      {
        title: 'Each cell becomes a tone',
        text: 'Higher values sound higher. Left to right on the map is left to right in your headphones. Silence means no readable data.',
      },
      {
        title: 'You explore by ear',
        text: 'Move with sliders, buttons or touch, and hear one cell, one row, or the whole map.',
      },
    ],
    aboutEyebrow: 'WHY OCEANECHO?',
    aboutHeadingA: 'Data has a voice.',
    aboutHeadingB: "Let's listen.",
    aboutText:
      'OceanEcho transforms NASA Earth information into sound, creating another way to understand our changing planet. Designed to make scientific exploration more engaging and accessible, including for people who are blind or have low vision.',
    footerTagline: "Listen to the Ocean. Discover Earth's Changing Voice.",
    footerCredit: 'OceanEcho · NASA Space Apps Challenge · Earth Jukebox',
  },

  /* ─── Frame choice (PLACEHOLDER-LAYOUT: not in the supplied design) ─── */
  frames: {
    label: 'Frame',
    showing: 'Showing frame {label}',
  },

  /* ─── Sections ─── */
  sections: {
    navLabel: 'Sections',
    explore: 'Explore',
    guide: 'Sound guide',
    settings: 'Settings',
    about: 'About',
    showing: 'Showing {section}',
  },

  /* ─── Explore: Audio Overview ─── */
  overview: {
    hearOverview: 'Hear overview',
    playingOverview: 'Playing overview',
    overviewFinished: 'Overview finished',
    durationChip: '{seconds} seconds',
  },

  /* ─── Explore: Map Grid ─── */
  grid: {
    heading: '{cols} × {rows} map grid',
    altText: '{rows} by {cols} map. Use the sliders or move buttons to explore.',
    instruction: 'Touch a square or use sliders below',
    symbolsOn: 'Visual symbols on',
    cursorChip: 'Row {row}, Column {col}',
    axisLeft: 'Left',
    axisRight: 'Right',
    axisUpper: 'Upper',
    axisLower: 'Lower',
  },

  /* ─── Explore: Sliders ─── */
  sliders: {
    rowLabel: 'Row',
    colLabel: 'Column',
    rowValue: 'Row {row} of {rows}',
    colValue: 'Column {col} of {cols}',
  },

  /* ─── Explore: Cell Card ─── */
  cellCard: {
    hearThisCell: 'Hear this cell',
    noDataSilence: 'No data — silence',
    soundDetails: 'Sound details',
    pitch: 'Pitch: {freq} Hz',
    panPosition: 'Pan: {position}',
    timbre: 'Timbre: {timbre}',
    dataShareDetail: '{percent}% of cell area has data',
    panWords: { left: 'left', center: 'center', right: 'right' },
    cellHeading: 'Selected cell',
  },

  /* ─── Explore: Direction Pad & Jumps ─── */
  directions: {
    upTo: 'Up, row {row}',
    downTo: 'Down, row {row}',
    leftTo: 'Left, column {col}',
    rightTo: 'Right, column {col}',
    topEdge: 'Top edge',
    bottomEdge: 'Bottom edge',
    leftEdge: 'Left edge',
    rightEdge: 'Right edge',
    currentCell: 'R{row}, C{col} Current',
  },
  sweep: {
    sweepThisRow: 'Sweep this row',
    sweepingRow: 'Sweeping row {row}',
    rowSweepFinished: 'Row sweep finished',
  },
  jumps: {
    jumpToMax: 'Jump to {label} cell',
    jumpToMin: 'Jump to {label} cell',
    jumpToStart: 'Jump to start (R1, C1)',
    jumpToEnd: 'Jump to end (R{rows}, C{cols})',
    jumpedTo: '{label} cell: Row {row}, Column {col}, {level}',
  },

  /* ─── Sticky Bar ─── */
  playback: {
    sweepWholeMap: 'Sweep whole map',
    sweepingWholeMap: 'Sweeping whole map',
    sweepFinished: 'Sweep finished',
    stopAll: 'Stop all sound',
    allStopped: 'All sound stopped',
    barLabel: 'Sound controls',
  },

  /* ─── Sound Guide ─── */
  guide: {
    intro: 'Listen to reference tones to learn what the sound levels mean.',
    playingRef: 'Playing {level} reference tone — {description}',
    noDataLabel: 'No data',
    noDataPlaying: 'No data — silence',
  },

  /* ─── Settings ─── */
  settings: {
    heading: 'Settings',
    announcementsLabel: 'Announcements',
    short: 'Short',
    detailed: 'Detailed',
    soundOnly: 'Sound only',
    volumeLabel: 'Volume',
    volumeValue: '{volume} percent',
    speedLabel: 'Playback speed',
    speedApplies: 'Speed {speed}×. Applies to the next sound.',
    invertLabel: 'Invert pitch',
    invertOn: 'Pitch inverted: higher values are lower pitch',
    invertOff: 'Pitch normal: higher values are higher pitch',
    moveTonesLabel: 'Play a tone when I move',
    moveTonesOn: 'Move tones on',
    moveTonesOff: 'Move tones off',
  },

  /* ─── About ─── */
  about: {
    canTellHeading: 'What it can tell you',
    cannotTellHeading: 'What it cannot tell you',
    attributionHeading: 'Dataset attribution',
  },

  /* ─── Track Library ─── */
  trackLibrary: {
    heading: 'Track Library',
    selectPrompt: 'Select a track to explore',
    placeholderNote: 'Layout not yet designed.',
  },

  /* ─── States ─── */
  errors: {
    frameLoadFailed: 'The frame image could not be loaded. Try selecting the track again.',
    audioBlocked: 'Audio was blocked by the browser. Press a sound button to try again.',
    audioUnsupported: 'This browser does not support Web Audio.',
  },
  loading: {
    text: 'Loading frame…',
  },
  common: {
    explore: 'Explore the map',
    moveHeading: 'Move around the map',
    summaryHeading: 'Audio overview',
    settingsSection: 'Settings',
  },
  empty: {
    text: 'No tracks available.',
  },
  synthetic: {
    label: 'Synthetic test data — not NASA data',
  },
} as const;

/** Replace {key} placeholders in a template string. */
export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = vars[key];
    return v === undefined ? match : String(v);
  });
}
