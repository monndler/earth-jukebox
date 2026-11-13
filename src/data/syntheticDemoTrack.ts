/**
 * SYNTHETIC DEMO TRACK for Phase 4 development (AGENTS.md §11.5).
 * Synthetic test data — not NASA data.
 * Remove before submission. Listed in the Phase 4 report.
 *
 * This file provides a Track definition and a deterministic ExploreGrid so the
 * Explorer can run end-to-end without real NASA frames.
 */
import type { ExploreGrid } from '../types/frame';
import type { Track } from '../types/track';

const COLS = 10;
const ROWS = 8;

/**
 * getSyntheticDemoGrid
 * A left→right gradient with one Gaussian "bump" near column 8, row 4, and a
 * block of no-data cells at rows 7–8, columns 1–2. Deterministic — no randomness.
 * NOT NASA data.
 */
export function getSyntheticDemoGrid(): ExploreGrid {
  const values: number[] = [];
  const validFraction: number[] = [];
  const noData: boolean[] = [];
  for (let row = 1; row <= ROWS; row += 1) {
    for (let col = 1; col <= COLS; col += 1) {
      const gradient = 0.3 + (2.1 * (col - 1)) / (COLS - 1);
      const bump = 0.6 * Math.exp(-(((col - 8) ** 2) / 2 + ((row - 4) ** 2) / 3));
      const raw = Math.min(3, gradient + bump);
      const isEmpty = row >= 7 && col <= 2;
      values.push(isEmpty ? 0 : raw);
      validFraction.push(isEmpty ? 0 : 1);
      noData.push(isEmpty);
    }
  }
  return { cols: COLS, rows: ROWS, values, validFraction, noData };
}

export const syntheticDemoTrack: Track = {
  id: 'synthetic-demo',
  title: 'Synthetic test data — not NASA data',
  summary: 'A synthetic gradient with a warm bump and some missing-data cells, for development only.',
  storyText: '',
  variable: 'synthetic values',
  source: {
    name: 'None (synthetic)',
    url: '',
    credit: 'Synthetic data generated for development — not from NASA',
    licenseNote: 'Not applicable',
  },
  frames: [],
  diverging: false,
  valueRange: { min: 0, max: 3 },
  valueBasis: 'relative-intensity',
  profileId: 'sweep-lr-3band',
  whyNotes: 'Synthetic gradient for testing the audio mapping before real NASA data arrives.',
  exploreGrid: { cols: COLS, rows: ROWS },
  extremeLabels: { max: 'highest', min: 'lowest' },
  guideText: {
    low: 'Low values — the quieter, lower-pitched part of the map',
    middle: 'Middle values — the mid-range',
    high: 'High values — the louder, higher-pitched part of the map',
    noData: 'No data (silence) — this area has no information',
  },
  aboutText: {
    canTell:
      'Whether a region has relatively higher or lower values than another. Where the highest and lowest areas are. That some areas have no data.',
    cannotTell:
      'What the values mean in physical units. The exact boundaries between regions. Any real-world phenomenon — this is synthetic data.',
  },
};
