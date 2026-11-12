/**
 * DEV-ONLY synthetic data for the sound check. NOT NASA data. Delete src/dev before submission
 * (docs/ASSUMPTIONS.md #17). Deterministic (no randomness).
 */
import type { ExploreGrid } from '../types/frame';
import type { Track } from '../types/track';

export const SYNTHETIC_COLS = 10;
export const SYNTHETIC_ROWS = 8;

/** A left→right gradient with one "bump" and a block of no-data cells. */
export function makeSyntheticGrid(diverging: boolean): ExploreGrid {
  const values: number[] = [];
  const validFraction: number[] = [];
  const noData: boolean[] = [];
  for (let row = 1; row <= SYNTHETIC_ROWS; row += 1) {
    for (let col = 1; col <= SYNTHETIC_COLS; col += 1) {
      const gradient = 0.3 + (2.1 * (col - 1)) / (SYNTHETIC_COLS - 1);
      const bump = 0.6 * Math.exp(-(((col - 8) ** 2) / 2 + ((row - 4) ** 2) / 3));
      const raw = Math.min(3, gradient + bump);
      const isEmpty = row >= 7 && col <= 2;
      values.push(isEmpty ? 0 : diverging ? raw - 1.5 : raw);
      validFraction.push(isEmpty ? 0 : 1);
      noData.push(isEmpty);
    }
  }
  return { cols: SYNTHETIC_COLS, rows: SYNTHETIC_ROWS, values, validFraction, noData };
}

export function makeSyntheticTrack(diverging: boolean): Track {
  return {
    id: 'dev-synthetic',
    title: 'Synthetic test data — not NASA data',
    summary: 'Dev-only synthetic grid for hearing the mapping.',
    storyText: '',
    variable: 'synthetic values',
    source: { name: 'none (synthetic)', url: '', credit: 'none', licenseNote: 'not applicable' },
    frames: [],
    diverging,
    valueRange: diverging ? { min: -1.5, max: 1.5 } : { min: 0, max: 3 },
    valueBasis: 'relative-intensity',
    profileId: 'sweep-lr-3band',
    whyNotes: '',
    exploreGrid: { cols: SYNTHETIC_COLS, rows: SYNTHETIC_ROWS },
    extremeLabels: { max: 'highest', min: 'lowest' },
    guideText: { low: 'Low values', middle: 'Middle values', high: 'High values', noData: 'No data (silence)' },
    aboutText: { canTell: '', cannotTell: '' },
  };
}
