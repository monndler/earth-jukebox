import { describe, expect, it } from 'vitest';
import { describeCell, formatValue, summarizeFrame } from './narration';
import { readCell } from './mapping';
import { fixtureProfile, fixtureTrack, makeExploreGrid } from '../test/fixtures';

const profile = fixtureProfile();
const plainTrack = fixtureTrack();
const anomalyTrack = fixtureTrack({
  diverging: true,
  valueRange: { min: -3, max: 3 },
  units: 'degrees',
  anomalyBaseline: 'the long-term average',
});

describe('formatValue', () => {
  it('uses anomaly wording only when units AND a baseline are declared', () => {
    expect(formatValue(2.84, anomalyTrack)).toBe('2.8 degrees above the long-term average');
    expect(formatValue(-1.26, anomalyTrack)).toBe('1.3 degrees below the long-term average');
  });

  it('says plain "x units" when only units are declared, and nothing without units', () => {
    const unitsOnly = fixtureTrack({ diverging: true, units: 'degrees' });
    expect(formatValue(2.84, unitsOnly)).toBe('2.8 degrees');
    expect(formatValue(2, plainTrack)).toBeNull();
  });
});

describe('describeCell', () => {
  const grid = makeExploreGrid(2, 1, [2.9, null]);
  const dataCell = readCell(grid, { row: 1, col: 1 }, plainTrack, profile);
  const noDataCell = readCell(grid, { row: 1, col: 2 }, plainTrack, profile);

  it('short mode: row, column, level', () => {
    expect(describeCell(dataCell, 'short', plainTrack)).toBe('Row 1, column 1, high');
    expect(describeCell(noDataCell, 'short', plainTrack)).toBe('Row 1, column 2, no data');
  });

  it('sound-only mode: empty text', () => {
    expect(describeCell(dataCell, 'sound-only', plainTrack)).toBe('');
    expect(describeCell(noDataCell, 'sound-only', plainTrack)).toBe('');
  });

  it('detailed mode adds the value only when supported and the data share when below 100 %', () => {
    expect(describeCell(dataCell, 'detailed', plainTrack)).toBe('Row 1, column 1, high');
    const reading = readCell(makeExploreGrid(1, 1, [2.9]), { row: 1, col: 1 }, anomalyTrack, profile);
    expect(describeCell(reading, 'detailed', anomalyTrack)).toContain('2.9 degrees above the long-term average');
    const partial = { ...dataCell, dataShare: 0.62 };
    expect(describeCell(partial, 'detailed', plainTrack)).toBe('Row 1, column 1, high, 62 percent of this cell has data');
  });

  it('never says "normal" or "baseline" for a track that does not declare an anomaly baseline', () => {
    const reading = readCell(makeExploreGrid(1, 1, [2.9]), { row: 1, col: 1 }, plainTrack, profile);
    const text = describeCell(reading, 'detailed', plainTrack).toLowerCase();
    expect(text).not.toContain('normal');
    expect(text).not.toContain('baseline');
    expect(text).not.toContain('above');
  });
});

describe('summarizeFrame', () => {
  it('states where the highest and lowest cells are using only left / middle / right', () => {
    const grid = makeExploreGrid(6, 1, [0, 1, 1, 1, 1, 3]);
    const text = summarizeFrame(grid, plainTrack);
    expect(text).toContain('Highest area is on the right side.');
    expect(text).toContain('Lowest area is on the left side.');
    expect(text).not.toMatch(/\b(north|south|east|west|equator|pacific|atlantic|tropics?)\b/i); // word boundaries: 'Lowest' is fine
  });

  it('uses the track’s extreme labels', () => {
    const track = fixtureTrack({ extremeLabels: { max: 'warmest', min: 'coolest' } });
    const text = summarizeFrame(makeExploreGrid(3, 1, [3, 1, 0]), track);
    expect(text).toContain('Warmest area is on the left side.');
    expect(text).toContain('Coolest area is on the right side.');
  });

  it('mentions missing data coverage, a uniform frame, and an empty frame', () => {
    expect(summarizeFrame(makeExploreGrid(2, 2, [1, null, 3, null]), plainTrack)).toContain('About 50 percent of the map has no data.');
    expect(summarizeFrame(makeExploreGrid(2, 1, [2, 2]), plainTrack)).toContain('Values are similar across the whole map.');
    expect(summarizeFrame(makeExploreGrid(2, 1, [null, null]), plainTrack)).toBe('This frame has no data.');
  });

  it('places middle columns “in the middle”', () => {
    const text = summarizeFrame(makeExploreGrid(3, 1, [0, 3, 1]), plainTrack);
    expect(text).toContain('Highest area is in the middle.');
  });
});
