/**
 * TEST-ONLY fixtures. Synthetic data — NOT NASA data. Never import this file from app code.
 */
import type { DecodedFrame, ExploreGrid, FrameFeatures } from '../types/frame';
import type { MappingProfile } from '../types/sound';
import type { LegendEntry, Track } from '../types/track';
import { getProfile } from '../data/profiles';

export function fixtureTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'fixture-track',
    title: 'Fixture track (synthetic test data — not NASA data)',
    summary: 'fixture',
    storyText: 'fixture',
    variable: 'fixture variable',
    source: { name: 'fixture', url: 'https://example.invalid', credit: 'fixture', licenseNote: 'fixture' },
    frames: [],
    diverging: false,
    valueRange: { min: 0, max: 3 },
    valueBasis: 'relative-intensity',
    profileId: 'sweep-lr-3band',
    whyNotes: 'fixture',
    exploreGrid: { cols: 10, rows: 8 },
    extremeLabels: { max: 'highest', min: 'lowest' },
    guideText: { low: 'low', middle: 'middle', high: 'high', noData: 'no data' },
    aboutText: { canTell: 'fixture', cannotTell: 'fixture' },
    ...overrides,
  };
}

export function fixtureProfile(overrides: Partial<MappingProfile> = {}): MappingProfile {
  return { ...getProfile('sweep-lr-3band'), ...overrides };
}

/** Build an RGBA frame from a per-pixel function returning [r, g, b, a]. */
export function makeFrame(
  width: number,
  height: number,
  pixel: (x: number, y: number) => readonly [number, number, number, number],
): DecodedFrame {
  const rgba: number[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      rgba.push(...pixel(x, y));
    }
  }
  return { width, height, rgba };
}

/** Build an Explore grid from a row-major list; `null` marks a no-data cell. */
export function makeExploreGrid(
  cols: number,
  rows: number,
  cells: readonly (number | null)[],
): ExploreGrid {
  return {
    cols,
    rows,
    values: cells.map((c) => c ?? 0),
    validFraction: cells.map((c) => (c === null ? 0 : 1)),
    noData: cells.map((c) => c === null),
  };
}

export function makeFeatures(
  cols: number,
  rows: number,
  values: readonly number[],
  validFraction: readonly number[],
): FrameFeatures {
  return {
    grid: { cols, rows, values, validFraction },
    globalMean: 0,
    min: null,
    max: null,
    validFraction: 1,
  };
}

export const RED: readonly [number, number, number] = [255, 0, 0];
export const BLUE: readonly [number, number, number] = [0, 0, 255];
export const LEGEND: readonly LegendEntry[] = [
  { rgb: RED, valueMin: 0, valueMax: 1 },
  { rgb: BLUE, valueMin: 1, valueMax: 2 },
];
