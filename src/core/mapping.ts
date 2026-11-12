/**
 * Sonification mapping (PROJECT_PLAN §8, D1, D3, D7, D8, D12, D13). PURE and deterministic:
 * the same Explore grid + track + profile always give an identical SoundScore.
 * Every sound (cell, row sweep, map sweep, overview, reference tones) is built from the Explore grid (D1).
 *
 * Mapping parameters are DESIGN CHOICES, not scientific facts.
 * EDUCATIONAL APPROXIMATION — a sound translation of a visualization, not a calibrated measurement.
 */
import { getScale } from '../data/scales';
import type { CellReading, Cursor, ExploreGrid, ExtremeCell, Level } from '../types/frame';
import type {
  MappingProfile,
  NoteEvent,
  ScoreKind,
  SoundScore,
  TimbreId,
} from '../types/sound';
import type { Track } from '../types/track';

const MIDI_A4 = 69;
const FREQ_A4_HZ = 440;
/** A note lasts this fraction of its time slot, leaving a short gap between notes. */
const NOTE_SLOT_FRACTION = 0.9;
/** Accent notes start this fraction into the slot and last half of it. */
const ACCENT_OFFSET_FRACTION = 0.05;
const ACCENT_LENGTH_FRACTION = 0.5;

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * normaliseValue
 * Formula:     non-diverging: t = (value − min) / (max − min); diverging: t = 0.5 + 0.5 · value / maxAbs,
 *              maxAbs = max(|min|, |max|); both clamped to 0–1; degenerate ranges give 0.5.
 * Units:       track value units in; unitless 0–1 out.
 * Assumptions: the range is FIXED per track (D7), never taken from the frame being viewed.
 * Source:      PROJECT_PLAN §8.2, D7.
 * EDUCATIONAL APPROXIMATION — not an engineering-grade calculation.
 */
export function normaliseValue(value: number, track: Track): number {
  const { min, max } = track.valueRange;
  if (track.diverging) {
    const maxAbs = Math.max(Math.abs(min), Math.abs(max));
    return maxAbs === 0 ? 0.5 : clamp01(0.5 + (0.5 * value) / maxAbs);
  }
  const span = max - min;
  return span <= 0 ? 0.5 : clamp01((value - min) / span);
}

/**
 * levelFromT
 * Rule:        t < lowBelow → low; t > highAbove → high; otherwise middle (boundaries belong to 'middle').
 *              With thirds this equals "bottom / middle / top third" of the range, and for diverging tracks
 *              "below −⅓·maxAbs / within ±⅓·maxAbs / above +⅓·maxAbs".
 * Assumptions: level is about the DATA value and is independent of `invert`.
 * Source:      D7.
 */
export function levelFromT(t: number, profile: MappingProfile): Exclude<Level, 'no-data'> {
  if (t < profile.levelThresholds.lowBelow) {
    return 'low';
  }
  if (t > profile.levelThresholds.highAbove) {
    return 'high';
  }
  return 'middle';
}

export function midiToHz(midi: number): number {
  return FREQ_A4_HZ * Math.pow(2, (midi - MIDI_A4) / 12);
}

/**
 * pitchForT
 * Formula:     degrees = scaleLength · octaves + 1; index = round(t' · (degrees − 1)); t' = 1 − t when inverted;
 *              midi = baseMidi + scale[index mod len] + 12 · floor(index / len) + registerOffset; Hz = 440 · 2^((midi − 69)/12).
 * Units:       t unitless 0–1; result in MIDI note number and Hz.
 * Assumptions: pitch is quantised to the profile's scale (musicality); monotonic: higher t never gives a
 *              lower pitch (unless `invert`); all bands share this mapping (registerOffset defaults to 0).
 * Source:      PROJECT_PLAN §8.2–8.3, D8.
 * EDUCATIONAL APPROXIMATION — not an engineering-grade calculation.
 */
export function pitchForT(
  t: number,
  profile: MappingProfile,
  registerOffset = 0,
): { midi: number; freqHz: number } {
  const scale = getScale(profile.scaleId);
  const len = scale.semitones.length;
  const degrees = len * profile.octaves + 1;
  const tt = clamp01(profile.invert ? 1 - t : t);
  const index = Math.round(tt * (degrees - 1));
  const semitone = (scale.semitones[index % len] ?? 0) + 12 * Math.floor(index / len);
  const midi = profile.baseMidi + semitone + registerOffset;
  return { midi, freqHz: midiToHz(midi) };
}

/** Stereo position for a 1-based column: −panWidth (first) … +panWidth (last). */
export function panForCol(col: number, cols: number, panWidth: number): number {
  if (cols <= 1) {
    return 0;
  }
  return (-1 + (2 * (col - 1)) / (cols - 1)) * panWidth;
}

/**
 * bandRows
 * Rule (D8): rows are split into three consecutive groups, as even as possible, with the remainder given
 * to the outer bands: base = ⌊rows/3⌋; remainder 0 → base, base, base; 1 → base, base+1, base;
 * 2 → base+1, base, base+1. Fewer than 3 rows → as many bands as rows. Row indices are 1-based.
 * Examples: 8 → 3+2+3, 7 → 2+3+2, 9 → 3+3+3.
 */
export function bandRows(rows: number): number[][] {
  if (rows < 1) {
    return [];
  }
  let sizes: number[];
  if (rows < 3) {
    sizes = Array.from({ length: rows }, () => 1);
  } else {
    const base = Math.floor(rows / 3);
    const rem = rows - 3 * base;
    if (rem === 0) {
      sizes = [base, base, base];
    } else if (rem === 1) {
      sizes = [base, base + 1, base];
    } else {
      sizes = [base + 1, base, base + 1];
    }
  }
  const bands: number[][] = [];
  let next = 1;
  for (const size of sizes) {
    const band: number[] = [];
    for (let k = 0; k < size; k += 1) {
      band.push(next);
      next += 1;
    }
    bands.push(band);
  }
  return bands;
}

/** Index (0-based) of the band that contains the 1-based row. */
export function bandOfRow(row: number, rows: number): number {
  const bands = bandRows(rows);
  const index = bands.findIndex((band) => band.includes(row));
  if (index < 0) {
    throw new RangeError(`Row ${row} is outside a grid of ${rows} rows.`);
  }
  return index;
}

function timbreOfBand(band: number, profile: MappingProfile): TimbreId {
  return profile.bands[band]?.timbre ?? 'neutral';
}

function offsetOfBand(band: number, profile: MappingProfile): number {
  return profile.bands[band]?.registerOffset ?? 0;
}

function cellIndex(grid: ExploreGrid, row: number, col: number): number {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 1 || row > grid.rows || col < 1 || col > grid.cols) {
    throw new RangeError(`Cell (row ${row}, col ${col}) is outside a ${grid.rows}×${grid.cols} grid.`);
  }
  return (row - 1) * grid.cols + (col - 1);
}

/**
 * readCell — everything the UI needs to know about one Explore cell.
 * Throws RangeError for an out-of-range cursor (a programmer error: the store enforces bounds).
 */
export function readCell(
  grid: ExploreGrid,
  cursor: Cursor,
  track: Track,
  profile: MappingProfile,
): CellReading {
  const i = cellIndex(grid, cursor.row, cursor.col);
  const band = bandOfRow(cursor.row, grid.rows);
  const pan = panForCol(cursor.col, grid.cols, profile.panWidth);
  const dataShare = grid.validFraction[i] ?? 0;
  if (grid.noData[i] === true) {
    return {
      row: cursor.row,
      col: cursor.col,
      isNoData: true,
      level: 'no-data',
      value: null,
      t: null,
      dataShare,
      freqHz: null,
      pan,
      band,
    };
  }
  const value = grid.values[i] ?? 0;
  const t = normaliseValue(value, track);
  return {
    row: cursor.row,
    col: cursor.col,
    isNoData: false,
    level: levelFromT(t, profile),
    value,
    t,
    dataShare,
    freqHz: pitchForT(t, profile, offsetOfBand(band, profile)).freqHz,
    pan,
    band,
  };
}

/**
 * findExtremeCell — the highest / lowest-valued cell that has data (by VALUE, independent of `invert`).
 * Ties: the first in row-major order. Returns null when every cell is no-data. Coordinates are 1-based.
 */
export function findExtremeCell(grid: ExploreGrid, which: 'max' | 'min'): ExtremeCell | null {
  let best: ExtremeCell | null = null;
  for (let i = 0; i < grid.values.length; i += 1) {
    if (grid.noData[i] === true) {
      continue;
    }
    const value = grid.values[i] ?? 0;
    const better =
      best === null || (which === 'max' ? value > best.value : value < best.value);
    if (better) {
      best = { value, row: Math.floor(i / grid.cols) + 1, col: (i % grid.cols) + 1 };
    }
  }
  return best;
}

function makeScore(
  track: Track,
  profile: MappingProfile,
  kind: ScoreKind,
  totalSeconds: number,
  events: NoteEvent[],
): SoundScore {
  return { totalSeconds, events, meta: { trackId: track.id, profileId: profile.id, kind } };
}

function sortEvents(events: NoteEvent[]): NoteEvent[] {
  return [...events].sort((a, b) => {
    if (a.tSec !== b.tSec) {
      return a.tSec - b.tSec;
    }
    if (a.voice !== b.voice) {
      return a.voice < b.voice ? -1 : 1;
    }
    return a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0;
  });
}

/** buildCellScore — one tone for the selected cell (silence for a no-data cell). Not scaled by speed (D13). */
export function buildCellScore(reading: CellReading, track: Track, profile: MappingProfile): SoundScore {
  const events: NoteEvent[] = [];
  if (!reading.isNoData && reading.freqHz !== null) {
    events.push({
      tSec: 0,
      durSec: profile.cellToneSeconds,
      freqHz: reading.freqHz,
      gain: profile.gains.note,
      pan: reading.pan,
      voice: `band-${reading.band}`,
      timbre: timbreOfBand(reading.band, profile),
      kind: 'note',
    });
  }
  return makeScore(track, profile, 'cell', profile.cellToneSeconds, events);
}

/**
 * buildRowSweepScore — the selected row played west→east, one slot per cell, using the timbre of the band
 * that contains the row (D8). No-data cells are rests. Duration = cols × rowSweepSlotSeconds (before speed).
 */
export function buildRowSweepScore(
  grid: ExploreGrid,
  row: number,
  track: Track,
  profile: MappingProfile,
): SoundScore {
  cellIndex(grid, row, 1); // validates the row
  const band = bandOfRow(row, grid.rows);
  const slot = profile.rowSweepSlotSeconds;
  const events: NoteEvent[] = [];
  for (let col = 1; col <= grid.cols; col += 1) {
    const i = (row - 1) * grid.cols + (col - 1);
    if (grid.noData[i] === true) {
      continue;
    }
    const t = normaliseValue(grid.values[i] ?? 0, track);
    events.push({
      tSec: (col - 1) * slot,
      durSec: slot * NOTE_SLOT_FRACTION,
      freqHz: pitchForT(t, profile, offsetOfBand(band, profile)).freqHz,
      gain: profile.gains.note,
      pan: panForCol(col, grid.cols, profile.panWidth),
      voice: `band-${band}`,
      timbre: timbreOfBand(band, profile),
      kind: 'note',
    });
  }
  return makeScore(track, profile, 'row-sweep', grid.cols * slot, sortEvents(events));
}

/**
 * buildMapSweepScore — full-detail sweep (D3): for each column, one note per band (mean of the band's valid
 * cells), panned left→right. Extreme-cell accent: one accent note in the column of the highest cell and of the
 * lowest cell (highest wins if both fall in one column), only when the frame has a range. Diverging tracks get a
 * quiet zero-reference drone. Duration = profile.sweepSeconds (before speed).
 * Not implemented in P0: variability → timbre roughness (docs/ASSUMPTIONS.md #3).
 */
export function buildMapSweepScore(
  grid: ExploreGrid,
  track: Track,
  profile: MappingProfile,
): SoundScore {
  const bands = bandRows(grid.rows);
  const slot = profile.sweepSeconds / grid.cols;
  const events: NoteEvent[] = [];
  const maxCell = findExtremeCell(grid, 'max');
  const minCell = findExtremeCell(grid, 'min');
  const hasRange = maxCell !== null && minCell !== null && maxCell.value !== minCell.value;

  for (let col = 1; col <= grid.cols; col += 1) {
    const tSec = (col - 1) * slot;
    const pan = panForCol(col, grid.cols, profile.panWidth);
    for (let b = 0; b < bands.length; b += 1) {
      let sum = 0;
      let count = 0;
      for (const row of bands[b] ?? []) {
        const i = (row - 1) * grid.cols + (col - 1);
        if (grid.noData[i] !== true) {
          sum += grid.values[i] ?? 0;
          count += 1;
        }
      }
      if (count === 0) {
        continue; // all no-data → silence for this band in this column
      }
      const t = normaliseValue(sum / count, track);
      events.push({
        tSec,
        durSec: slot * NOTE_SLOT_FRACTION,
        freqHz: pitchForT(t, profile, offsetOfBand(b, profile)).freqHz,
        gain: profile.gains.note,
        pan,
        voice: `band-${b}`,
        timbre: timbreOfBand(b, profile),
        kind: 'note',
      });
    }
    if (hasRange) {
      const accent = maxCell.col === col ? maxCell : minCell.col === col ? minCell : null;
      if (accent !== null) {
        const t = normaliseValue(accent.value, track);
        events.push({
          tSec: tSec + slot * ACCENT_OFFSET_FRACTION,
          durSec: slot * ACCENT_LENGTH_FRACTION,
          freqHz: pitchForT(t, profile).freqHz,
          gain: profile.gains.accent,
          pan,
          voice: 'accent',
          timbre: 'accent',
          kind: 'accent',
        });
      }
    }
  }
  if (track.diverging) {
    events.push({
      tSec: 0,
      durSec: profile.sweepSeconds,
      freqHz: pitchForT(0.5, profile).freqHz,
      gain: profile.gains.drone,
      pan: 0,
      voice: 'drone',
      timbre: 'soft',
      kind: 'drone',
    });
  }
  return makeScore(track, profile, 'map-sweep', profile.sweepSeconds, sortEvents(events));
}

/**
 * buildOverviewScore — short single-voice summary (D3): one note per column from the mean of the column's valid
 * cells, in a neutral voice distinct from the band timbres. Duration = profile.overviewSeconds (before speed).
 */
export function buildOverviewScore(
  grid: ExploreGrid,
  track: Track,
  profile: MappingProfile,
): SoundScore {
  const slot = profile.overviewSeconds / grid.cols;
  const events: NoteEvent[] = [];
  for (let col = 1; col <= grid.cols; col += 1) {
    let sum = 0;
    let count = 0;
    for (let row = 1; row <= grid.rows; row += 1) {
      const i = (row - 1) * grid.cols + (col - 1);
      if (grid.noData[i] !== true) {
        sum += grid.values[i] ?? 0;
        count += 1;
      }
    }
    if (count === 0) {
      continue;
    }
    const t = normaliseValue(sum / count, track);
    events.push({
      tSec: (col - 1) * slot,
      durSec: slot * NOTE_SLOT_FRACTION,
      freqHz: pitchForT(t, profile).freqHz,
      gain: profile.gains.overview,
      pan: panForCol(col, grid.cols, profile.panWidth),
      voice: 'overview',
      timbre: 'neutral',
      kind: 'note',
    });
  }
  return makeScore(track, profile, 'overview', profile.overviewSeconds, events);
}

/** Normalised positions of the level midpoints used by the sound guide (D7): 1/6, 1/2, 5/6. */
export const REFERENCE_T = { low: 1 / 6, middle: 1 / 2, high: 5 / 6 } as const;

/**
 * referenceTones — Sound-guide tones at the MIDPOINT of each level (D7), using the same pitch mapping as every
 * other sound (so `invert` is honoured). "No data" is silence.
 */
export function referenceTones(
  track: Track,
  profile: MappingProfile,
): { low: SoundScore; middle: SoundScore; high: SoundScore; noData: SoundScore } {
  const make = (t: number): SoundScore =>
    makeScore(track, profile, 'reference', profile.referenceToneSeconds, [
      {
        tSec: 0,
        durSec: profile.referenceToneSeconds,
        freqHz: pitchForT(t, profile).freqHz,
        gain: profile.gains.reference,
        pan: 0,
        voice: 'reference',
        timbre: 'neutral',
        kind: 'note',
      },
    ]);
  return {
    low: make(REFERENCE_T.low),
    middle: make(REFERENCE_T.middle),
    high: make(REFERENCE_T.high),
    noData: makeScore(track, profile, 'reference', profile.referenceToneSeconds, []),
  };
}

/**
 * applySpeed — scales a score's times by 1/speed (D12/D13). Use for sweeps and the overview only; tone lengths of
 * cell and reference tones are not scaled. Pitch is unchanged.
 */
export function applySpeed(score: SoundScore, speed: number): SoundScore {
  if (!(speed > 0)) {
    throw new RangeError('Speed must be greater than 0.');
  }
  return {
    totalSeconds: score.totalSeconds / speed,
    events: score.events.map((e) => ({ ...e, tSec: e.tSec / speed, durSec: e.durSec / speed })),
    meta: score.meta,
  };
}
