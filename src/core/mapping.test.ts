import { describe, expect, it } from 'vitest';
import {
  REFERENCE_T,
  applySpeed,
  bandOfRow,
  bandRows,
  buildCellScore,
  buildMapSweepScore,
  buildOverviewScore,
  buildRowSweepScore,
  findExtremeCell,
  levelFromT,
  midiToHz,
  normaliseValue,
  panForCol,
  pitchForT,
  readCell,
  referenceTones,
} from './mapping';
import { getScale } from '../data/scales';
import { fixtureProfile, fixtureTrack, makeExploreGrid } from '../test/fixtures';

const profile = fixtureProfile();
const track = fixtureTrack(); // non-diverging, valueRange 0..3
const diverging = fixtureTrack({ diverging: true, valueRange: { min: -3, max: 3 } });

describe('normaliseValue and levelFromT (D7)', () => {
  it('uses the fixed track range (non-diverging)', () => {
    expect(normaliseValue(0, track)).toBe(0);
    expect(normaliseValue(1.5, track)).toBe(0.5);
    expect(normaliseValue(3, track)).toBe(1);
    expect(normaliseValue(99, track)).toBe(1); // clamped
    expect(normaliseValue(-5, track)).toBe(0);
  });

  it('centres diverging tracks on zero using maxAbs', () => {
    expect(normaliseValue(0, diverging)).toBe(0.5);
    expect(normaliseValue(3, diverging)).toBe(1);
    expect(normaliseValue(-3, diverging)).toBe(0);
    const lopsided = fixtureTrack({ diverging: true, valueRange: { min: -1, max: 3 } });
    expect(normaliseValue(-1, lopsided)).toBeCloseTo(0.5 - 0.5 / 3, 10);
  });

  it('handles degenerate ranges without NaN', () => {
    expect(normaliseValue(2, fixtureTrack({ valueRange: { min: 1, max: 1 } }))).toBe(0.5);
    expect(normaliseValue(2, fixtureTrack({ diverging: true, valueRange: { min: 0, max: 0 } }))).toBe(0.5);
  });

  it('classifies levels with thirds; boundaries belong to middle', () => {
    expect(levelFromT(0, profile)).toBe('low');
    expect(levelFromT(1 / 3 - 1e-9, profile)).toBe('low');
    expect(levelFromT(1 / 3, profile)).toBe('middle');
    expect(levelFromT(0.5, profile)).toBe('middle');
    expect(levelFromT(2 / 3, profile)).toBe('middle');
    expect(levelFromT(2 / 3 + 1e-9, profile)).toBe('high');
    expect(levelFromT(1, profile)).toBe('high');
  });

  it('maps a diverging value at exactly ±⅓·maxAbs to middle and just beyond to low/high', () => {
    expect(levelFromT(normaliseValue(1, diverging), profile)).toBe('middle');
    expect(levelFromT(normaliseValue(-1, diverging), profile)).toBe('middle');
    expect(levelFromT(normaliseValue(1.01, diverging), profile)).toBe('high');
    expect(levelFromT(normaliseValue(-1.01, diverging), profile)).toBe('low');
  });

  it('level is independent of invert (it describes the data)', () => {
    const inverted = fixtureProfile({ invert: true });
    for (const t of [0, 0.2, 0.5, 0.8, 1]) {
      expect(levelFromT(t, inverted)).toBe(levelFromT(t, profile));
    }
  });
});

describe('pitchForT (monotonic, quantised, invert)', () => {
  const scale = getScale(profile.scaleId);
  const allowed = new Set<number>();
  for (let oct = 0; oct <= profile.octaves; oct += 1) {
    for (const s of scale.semitones) {
      allowed.add(profile.baseMidi + s + 12 * oct);
    }
  }

  it('never gives a lower pitch for a higher t', () => {
    let previous = -Infinity;
    for (let i = 0; i <= 100; i += 1) {
      const { freqHz } = pitchForT(i / 100, profile);
      expect(freqHz).toBeGreaterThanOrEqual(previous);
      previous = freqHz;
    }
  });

  it('quantises to the profile scale and stays within the range', () => {
    for (let i = 0; i <= 100; i += 1) {
      const { midi } = pitchForT(i / 100, profile);
      expect(allowed.has(midi)).toBe(true);
    }
    expect(pitchForT(0, profile).midi).toBe(profile.baseMidi);
    expect(pitchForT(1, profile).midi).toBe(profile.baseMidi + 12 * profile.octaves);
  });

  it('reverses with invert', () => {
    const inverted = fixtureProfile({ invert: true });
    expect(pitchForT(0, inverted).midi).toBe(pitchForT(1, profile).midi);
    expect(pitchForT(1, inverted).midi).toBe(pitchForT(0, profile).midi);
    let previous = Infinity;
    for (let i = 0; i <= 100; i += 1) {
      const { freqHz } = pitchForT(i / 100, inverted);
      expect(freqHz).toBeLessThanOrEqual(previous);
      previous = freqHz;
    }
  });

  it('A4 is 440 Hz and A3 is 220 Hz', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 10);
    expect(midiToHz(57)).toBeCloseTo(220, 10);
  });

  it('keeps default band register offsets at 0 (D8: one shared pitch mapping)', () => {
    expect(profile.bands.every((b) => b.registerOffset === 0)).toBe(true);
  });
});

describe('panForCol', () => {
  it('runs from left (−1) to right (+1) and handles a single column', () => {
    expect(panForCol(1, 5, 1)).toBe(-1);
    expect(panForCol(3, 5, 1)).toBe(0);
    expect(panForCol(5, 5, 1)).toBe(1);
    expect(panForCol(1, 1, 1)).toBe(0);
    expect(panForCol(5, 5, 0.5)).toBe(0.5);
  });
});

describe('bandRows (D8)', () => {
  it('splits rows as evenly as possible, remainder to the outer bands', () => {
    expect(bandRows(3).map((b) => b.length)).toEqual([1, 1, 1]);
    expect(bandRows(7).map((b) => b.length)).toEqual([2, 3, 2]);
    expect(bandRows(8).map((b) => b.length)).toEqual([3, 2, 3]);
    expect(bandRows(9).map((b) => b.length)).toEqual([3, 3, 3]);
    expect(bandRows(8)).toEqual([[1, 2, 3], [4, 5], [6, 7, 8]]);
  });

  it('uses as many bands as rows when there are fewer than three', () => {
    expect(bandRows(1)).toEqual([[1]]);
    expect(bandRows(2)).toEqual([[1], [2]]);
    expect(bandRows(0)).toEqual([]);
  });

  it('finds the band of a row and rejects an invalid row', () => {
    expect(bandOfRow(1, 8)).toBe(0);
    expect(bandOfRow(4, 8)).toBe(1);
    expect(bandOfRow(8, 8)).toBe(2);
    expect(() => bandOfRow(9, 8)).toThrow(RangeError);
  });
});

describe('readCell, findExtremeCell, buildCellScore', () => {
  // 3 cols × 2 rows: [1, 2, 3 / null, 3, 0]
  const grid = makeExploreGrid(3, 2, [1, 2, 3, null, 3, 0]);

  it('reads a data cell with level, pitch, pan and band', () => {
    const r = readCell(grid, { row: 1, col: 3 }, track, profile);
    expect(r.isNoData).toBe(false);
    expect(r.value).toBe(3);
    expect(r.t).toBe(1);
    expect(r.level).toBe('high');
    expect(r.pan).toBe(1);
    expect(r.band).toBe(0);
    expect(r.freqHz).toBeCloseTo(pitchForT(1, profile).freqHz, 10);
  });

  it('reads a no-data cell as silent', () => {
    const r = readCell(grid, { row: 2, col: 1 }, track, profile);
    expect(r.isNoData).toBe(true);
    expect(r.level).toBe('no-data');
    expect(r.freqHz).toBeNull();
    expect(buildCellScore(r, track, profile).events).toEqual([]);
  });

  it('throws RangeError for an out-of-range cursor', () => {
    expect(() => readCell(grid, { row: 3, col: 1 }, track, profile)).toThrow(RangeError);
    expect(() => readCell(grid, { row: 1, col: 0 }, track, profile)).toThrow(RangeError);
  });

  it('finds extremes by value, ignores no-data, breaks ties row-major', () => {
    expect(findExtremeCell(grid, 'max')).toEqual({ value: 3, row: 1, col: 3 });
    expect(findExtremeCell(grid, 'min')).toEqual({ value: 0, row: 2, col: 3 });
    expect(findExtremeCell(makeExploreGrid(2, 1, [null, null]), 'max')).toBeNull();
  });

  it('builds a one-note cell score with the cell tone length', () => {
    const r = readCell(grid, { row: 1, col: 2 }, track, profile);
    const s = buildCellScore(r, track, profile);
    expect(s.events).toHaveLength(1);
    expect(s.events[0]?.durSec).toBe(profile.cellToneSeconds);
    expect(s.meta.kind).toBe('cell');
  });
});

describe('same value → same pitch everywhere (D1)', () => {
  const grid = makeExploreGrid(2, 3, [2, 2, 2, 2, 2, 2]);
  const expected = pitchForT(normaliseValue(2, track), profile).freqHz;

  it('cell tone, row sweep, map sweep, overview and (matching t) reference tones agree', () => {
    const cell = buildCellScore(readCell(grid, { row: 2, col: 1 }, track, profile), track, profile);
    expect(cell.events[0]?.freqHz).toBeCloseTo(expected, 10);
    for (const e of buildRowSweepScore(grid, 2, track, profile).events) {
      expect(e.freqHz).toBeCloseTo(expected, 10);
    }
    for (const e of buildMapSweepScore(grid, track, profile).events.filter((x) => x.kind === 'note')) {
      expect(e.freqHz).toBeCloseTo(expected, 10);
    }
    for (const e of buildOverviewScore(grid, track, profile).events) {
      expect(e.freqHz).toBeCloseTo(expected, 10);
    }
  });

  it('invert changes all of them consistently', () => {
    const inv = fixtureProfile({ invert: true });
    const invExpected = pitchForT(normaliseValue(2, track), inv).freqHz;
    expect(invExpected).not.toBeCloseTo(expected, 5);
    for (const e of buildOverviewScore(grid, track, inv).events) {
      expect(e.freqHz).toBeCloseTo(invExpected, 10);
    }
    for (const e of buildRowSweepScore(grid, 1, track, inv).events) {
      expect(e.freqHz).toBeCloseTo(invExpected, 10);
    }
  });
});

describe('buildRowSweepScore', () => {
  const grid = makeExploreGrid(4, 8, [
    ...[0, 1, null, 3],
    ...Array<number>(28).fill(1),
  ]);

  it('plays west→east, skips no-data cells, uses the row band timbre and slot timing', () => {
    const s = buildRowSweepScore(grid, 1, track, profile);
    const times = s.events.map((e) => e.tSec);
    expect(times).toHaveLength(3); // column 3 is a rest
    [0, 0.4, 1.2].forEach((expected, i) => expect(times[i]).toBeCloseTo(expected, 10));
    expect(s.totalSeconds).toBeCloseTo(4 * 0.4, 10);
    expect(s.events.every((e) => e.timbre === profile.bands[0]?.timbre)).toBe(true);
    expect(buildRowSweepScore(grid, 5, track, profile).events.every((e) => e.timbre === profile.bands[1]?.timbre)).toBe(true);
    expect(buildRowSweepScore(grid, 8, track, profile).events.every((e) => e.timbre === profile.bands[2]?.timbre)).toBe(true);
    expect(s.events[0]?.pan).toBe(-1);
    expect(s.events[2]?.pan).toBe(1);
  });

  it('rejects an invalid row', () => {
    expect(() => buildRowSweepScore(grid, 9, track, profile)).toThrow(RangeError);
  });
});

describe('buildMapSweepScore (D3, D8)', () => {
  // 3 cols × 6 rows; bands rows 1-2, 3-4, 5-6.
  const cells: (number | null)[] = [];
  for (let row = 1; row <= 6; row += 1) {
    for (let col = 1; col <= 3; col += 1) {
      // upper band: value 3, middle band: value 0, lower band: no data in column 2 only
      if (row <= 2) cells.push(3);
      else if (row <= 4) cells.push(0);
      else cells.push(col === 2 ? null : 1.5);
    }
  }
  const grid = makeExploreGrid(3, 6, cells);
  const score = buildMapSweepScore(grid, track, profile);

  it('has the sweep duration and time-ordered events', () => {
    expect(score.totalSeconds).toBe(profile.sweepSeconds);
    const times = score.events.map((e) => e.tSec);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('plays a silent band where a band is all no-data (lower band, column 2)', () => {
    const slot = profile.sweepSeconds / 3;
    const lowerInCol2 = score.events.filter((e) => e.voice === 'band-2' && e.tSec === slot);
    expect(lowerInCol2).toHaveLength(0);
    expect(score.events.filter((e) => e.voice === 'band-2').length).toBe(2);
  });

  it('maps the same value to the same pitch in every band; bands differ by timbre only', () => {
    const grid2 = makeExploreGrid(2, 6, Array<number>(12).fill(2));
    const notes = buildMapSweepScore(grid2, track, profile).events.filter((e) => e.kind === 'note');
    const freqs = new Set(notes.map((e) => e.freqHz));
    expect(freqs.size).toBe(1);
    expect(new Set(notes.map((e) => e.timbre)).size).toBe(3);
  });

  it('adds one accent in the column of the highest and lowest cells, none for a flat frame', () => {
    const accents = score.events.filter((e) => e.kind === 'accent');
    expect(accents.length).toBeGreaterThan(0);
    expect(accents.every((e) => e.timbre === 'accent')).toBe(true);
    const flat = buildMapSweepScore(makeExploreGrid(2, 3, Array<number>(6).fill(1)), track, profile);
    expect(flat.events.some((e) => e.kind === 'accent')).toBe(false);
  });

  it('never exceeds maxVoices simultaneous band/accent voices (drone is a separate layer)', () => {
    const boundaries = new Set<number>();
    for (const e of score.events) {
      boundaries.add(e.tSec);
    }
    for (const t of boundaries) {
      const active = score.events.filter((e) => e.kind !== 'drone' && e.tSec <= t && t < e.tSec + e.durSec);
      expect(active.length).toBeLessThanOrEqual(profile.maxVoices);
    }
  });

  it('pans left to right', () => {
    const notes = score.events.filter((e) => e.voice === 'band-0');
    expect(notes[0]?.pan).toBe(-1);
    expect(notes[notes.length - 1]?.pan).toBe(1);
  });

  it('adds a quiet zero-reference drone only for diverging tracks', () => {
    expect(score.events.some((e) => e.kind === 'drone')).toBe(false);
    const d = buildMapSweepScore(grid, diverging, profile);
    const drones = d.events.filter((e) => e.kind === 'drone');
    expect(drones).toHaveLength(1);
    expect(drones[0]?.durSec).toBe(profile.sweepSeconds);
    expect(drones[0]?.freqHz).toBeCloseTo(pitchForT(0.5, profile).freqHz, 10);
  });

  it('is deterministic (byte-identical JSON)', () => {
    expect(JSON.stringify(buildMapSweepScore(grid, track, profile))).toBe(JSON.stringify(score));
  });
});

describe('buildOverviewScore (D3)', () => {
  it('is a single neutral voice with the overview duration; skips no-data columns', () => {
    const grid = makeExploreGrid(3, 2, [1, null, 2, 1, null, 2]);
    const s = buildOverviewScore(grid, track, profile);
    expect(s.totalSeconds).toBe(profile.overviewSeconds);
    expect(new Set(s.events.map((e) => e.voice))).toEqual(new Set(['overview']));
    expect(s.events.every((e) => e.timbre === 'neutral')).toBe(true);
    expect(s.events).toHaveLength(2); // column 2 is entirely no data
    expect(s.events.every((e) => !profile.bands.some((b) => b.timbre === e.timbre))).toBe(true);
  });
});

describe('referenceTones (D7)', () => {
  it('plays tones that fall inside their own level, ascending, and silence for no data', () => {
    const tones = referenceTones(track, profile);
    expect(levelFromT(REFERENCE_T.low, profile)).toBe('low');
    expect(levelFromT(REFERENCE_T.middle, profile)).toBe('middle');
    expect(levelFromT(REFERENCE_T.high, profile)).toBe('high');
    const f = (s: typeof tones.low) => s.events[0]?.freqHz ?? 0;
    expect(f(tones.low)).toBeLessThan(f(tones.middle));
    expect(f(tones.middle)).toBeLessThan(f(tones.high));
    expect(tones.noData.events).toEqual([]);
    expect(tones.low.totalSeconds).toBe(profile.referenceToneSeconds);
  });

  it('honours invert like every other sound', () => {
    const inv = referenceTones(track, fixtureProfile({ invert: true }));
    expect(inv.low.events[0]?.freqHz ?? 0).toBeGreaterThan(inv.high.events[0]?.freqHz ?? 0);
  });
});

describe('applySpeed', () => {
  it('scales times by 1/speed and leaves pitch alone', () => {
    const grid = makeExploreGrid(2, 1, [1, 2]);
    const base = buildOverviewScore(grid, track, profile);
    const fast = applySpeed(base, 2);
    expect(fast.totalSeconds).toBe(base.totalSeconds / 2);
    expect(fast.events[1]?.tSec).toBe((base.events[1]?.tSec ?? 0) / 2);
    expect(fast.events[0]?.freqHz).toBe(base.events[0]?.freqHz);
    expect(() => applySpeed(base, 0)).toThrow(RangeError);
  });
});
