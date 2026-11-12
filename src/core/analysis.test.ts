import { describe, expect, it } from 'vitest';
import { analyzeFrame, buildExploreGrid, decodePixel, LEGEND_TOLERANCE } from './analysis';
import { BLUE, LEGEND, RED, fixtureTrack, makeFeatures, makeFrame } from '../test/fixtures';

describe('decodePixel', () => {
  it('treats transparent pixels as no data', () => {
    expect(decodePixel(10, 20, 30, 0, undefined)).toBeNull();
    expect(decodePixel(10, 20, 30, 127, undefined)).toBeNull();
    expect(decodePixel(10, 20, 30, 128, undefined)).not.toBeNull();
  });

  it('uses Rec. 709 luma / 255 without a legend (hand-computed: grey 128 → 128/255)', () => {
    const v = decodePixel(128, 128, 128, 255, undefined);
    expect(v).toBeCloseTo(128 / 255, 10);
    expect(decodePixel(255, 255, 255, 255, undefined)).toBeCloseTo(1, 10);
    expect(decodePixel(0, 0, 0, 255, undefined)).toBe(0);
  });

  it('decodes an exact legend colour to the middle of its range', () => {
    expect(decodePixel(...RED, 255, LEGEND)).toBe(0.5);
    expect(decodePixel(...BLUE, 255, LEGEND)).toBe(1.5);
  });

  it('accepts a near match within tolerance and rejects beyond it', () => {
    expect(decodePixel(255 - 10, 5, 5, 255, LEGEND)).toBe(0.5);
    expect(decodePixel(0, 255, 0, 255, LEGEND)).toBeNull(); // green is far from both entries
    expect(decodePixel(255 - LEGEND_TOLERANCE - 10, 0, 0, 255, LEGEND)).toBeNull();
  });

  it('breaks legend ties by the lowest index', () => {
    const tie = [
      { rgb: [100, 0, 0] as const, valueMin: 0, valueMax: 2 },
      { rgb: [120, 0, 0] as const, valueMin: 10, valueMax: 12 },
    ];
    expect(decodePixel(110, 0, 0, 255, tie)).toBe(1);
  });
});

describe('analyzeFrame', () => {
  const track = fixtureTrack({ valueRange: { min: 0, max: 1 } });

  it('downsamples to hand-computed cell means (4×4 → 2×2)', () => {
    // grey levels 0,64,128,192 per column; rows identical
    const frame = makeFrame(4, 4, (x) => {
      const g = [0, 64, 128, 192][x] ?? 0;
      return [g, g, g, 255];
    });
    const f = analyzeFrame(frame, track, { cols: 2, rows: 2 });
    expect(f.grid.cols).toBe(2);
    expect(f.grid.values[0]).toBeCloseTo((0 + 64) / 2 / 255, 10);
    expect(f.grid.values[1]).toBeCloseTo((128 + 192) / 2 / 255, 10);
    expect(f.grid.values[2]).toBeCloseTo(f.grid.values[0] ?? NaN, 10);
    expect(f.grid.validFraction.every((v) => v === 1)).toBe(true);
  });

  it('reports max and min cells (1-based, first in row-major order on ties)', () => {
    const frame = makeFrame(2, 2, (x, y) => (x === 1 && y === 0 ? [255, 255, 255, 255] : [0, 0, 0, 255]));
    const f = analyzeFrame(frame, track, { cols: 2, rows: 2 });
    expect(f.max).toEqual({ value: 1, row: 1, col: 2 });
    expect(f.min).toEqual({ value: 0, row: 1, col: 1 }); // ties → first in row-major order
  });

  it('marks transparent areas as no data (validFraction 0) and never returns NaN', () => {
    const frame = makeFrame(4, 2, (x) => (x < 2 ? [255, 255, 255, 255] : [0, 0, 0, 0]));
    const f = analyzeFrame(frame, track, { cols: 2, rows: 1 });
    expect(f.grid.validFraction).toEqual([1, 0]);
    expect(f.grid.values[1]).toBe(0);
    expect(Number.isNaN(f.globalMean)).toBe(false);
  });

  it('handles an all-no-data frame and an empty frame without NaN', () => {
    const allClear = makeFrame(4, 4, () => [0, 0, 0, 0]);
    const f = analyzeFrame(allClear, track, { cols: 3, rows: 3 });
    expect(f.max).toBeNull();
    expect(f.min).toBeNull();
    expect(f.validFraction).toBe(0);
    expect(f.globalMean).toBe(0);
    const empty = analyzeFrame({ width: 0, height: 0, rgba: [] }, track, { cols: 2, rows: 2 });
    expect(empty.grid.values).toEqual([0, 0, 0, 0]);
    expect(empty.validFraction).toBe(0);
  });

  it('respects the crop rectangle (exclude a burned-in left bar)', () => {
    const frame = makeFrame(4, 2, (x) => (x < 2 ? [255, 255, 255, 255] : [0, 0, 0, 255]));
    const cropped = fixtureTrack({
      valueRange: { min: 0, max: 1 },
      cropRect: { x: 2, y: 0, width: 2, height: 2 },
    });
    const f = analyzeFrame(frame, cropped, { cols: 1, rows: 1 });
    expect(f.grid.values[0]).toBe(0);
    const clamped = fixtureTrack({ cropRect: { x: -5, y: -5, width: 100, height: 100 } });
    expect(analyzeFrame(frame, clamped, { cols: 1, rows: 1 }).grid.validFraction[0]).toBe(1);
  });

  it('decodes a legend frame: left half red, right half blue, one green (unmatched) column', () => {
    const legendTrack = fixtureTrack({ valueBasis: 'decoded-legend', legend: LEGEND, valueRange: { min: 0, max: 2 } });
    const frame = makeFrame(3, 1, (x) => (x === 0 ? [...RED, 255] : x === 1 ? [...BLUE, 255] : [0, 255, 0, 255]));
    const f = analyzeFrame(frame, legendTrack, { cols: 3, rows: 1 });
    expect(f.grid.values).toEqual([0.5, 1.5, 0]);
    expect(f.grid.validFraction).toEqual([1, 1, 0]);
  });

  it('throws for programmer errors (missing legend, short pixel data, bad grid)', () => {
    const legendTrack = fixtureTrack({ valueBasis: 'decoded-legend' });
    expect(() => analyzeFrame(makeFrame(1, 1, () => [0, 0, 0, 255]), legendTrack)).toThrow();
    expect(() => analyzeFrame({ width: 2, height: 2, rgba: [0, 0, 0, 255] }, track)).toThrow();
    expect(() => analyzeFrame(makeFrame(1, 1, () => [0, 0, 0, 255]), track, { cols: 0, rows: 1 })).toThrow();
  });

  it('is deterministic (byte-identical JSON)', () => {
    const frame = makeFrame(8, 6, (x, y) => [(x * 30) % 256, (y * 40) % 256, 90, 255]);
    const a = JSON.stringify(analyzeFrame(frame, track, { cols: 4, rows: 3 }));
    const b = JSON.stringify(analyzeFrame(frame, track, { cols: 4, rows: 3 }));
    expect(a).toBe(b);
  });
});

describe('buildExploreGrid', () => {
  it('aggregates with valid-fraction weights (hand-computed 4×2 → 2×1)', () => {
    // analysis row-major: row1: [1,2,3,4], row2: [5,6,7,8]; all fully valid
    const f = makeFeatures(4, 2, [1, 2, 3, 4, 5, 6, 7, 8], [1, 1, 1, 1, 1, 1, 1, 1]);
    const g = buildExploreGrid(f, { cols: 2, rows: 1 }, 0.5);
    expect(g.values).toEqual([(1 + 2 + 5 + 6) / 4, (3 + 4 + 7 + 8) / 4]);
    expect(g.validFraction).toEqual([1, 1]);
    expect(g.noData).toEqual([false, false]);
  });

  it('weights values by each analysis cell’s valid fraction', () => {
    const f = makeFeatures(2, 1, [10, 0], [1, 0.5]);
    const g = buildExploreGrid(f, { cols: 1, rows: 1 }, 0.5);
    // value = (10·1 + 0·0.5) / 1.5
    expect(g.values[0]).toBeCloseTo(10 / 1.5, 10);
    expect(g.validFraction[0]).toBeCloseTo(0.75, 10);
  });

  it('applies the no-data threshold: at it → data, below it → no data', () => {
    const atThreshold = makeFeatures(2, 1, [4, 0], [1, 0]); // mean fraction 0.5
    expect(buildExploreGrid(atThreshold, { cols: 1, rows: 1 }, 0.5).noData).toEqual([false]);
    const below = makeFeatures(4, 1, [4, 0, 0, 0], [1, 0, 0, 0]); // mean fraction 0.25
    expect(buildExploreGrid(below, { cols: 1, rows: 1 }, 0.5).noData).toEqual([true]);
    expect(buildExploreGrid(below, { cols: 1, rows: 1 }, 0.2).noData).toEqual([false]);
  });

  it('treats cells with no valid analysis cell as no data', () => {
    const f = makeFeatures(2, 1, [0, 0], [0, 0]);
    const g = buildExploreGrid(f, { cols: 2, rows: 1 }, 0);
    expect(g.noData).toEqual([true, true]);
    expect(g.values).toEqual([0, 0]);
  });

  it('copes with an analysis grid smaller than the Explore grid (no NaN)', () => {
    const f = makeFeatures(2, 1, [1, 2], [1, 1]);
    const g = buildExploreGrid(f, { cols: 4, rows: 2 }, 0.5);
    expect(g.values.length).toBe(8);
    expect(g.values.every((v) => !Number.isNaN(v))).toBe(true);
    expect(g.noData.some((x) => x)).toBe(true);
  });

  it('is deterministic', () => {
    const f = makeFeatures(6, 3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9], Array(18).fill(1));
    expect(JSON.stringify(buildExploreGrid(f, { cols: 3, rows: 2 }, 0.5))).toBe(
      JSON.stringify(buildExploreGrid(f, { cols: 3, rows: 2 }, 0.5)),
    );
  });
});
