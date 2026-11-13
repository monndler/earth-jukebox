import { describe, expect, it } from 'vitest';
import {
  analyzeFrame,
  buildExploreGrid,
  decodePixelByHue,
  noDataThresholdFor,
  prepareHueLegend,
  rgbToHsv,
} from './analysis';
import { fixtureProfile, fixtureTrack, makeFrame } from '../test/fixtures';
import type { HueDecode, LegendEntry } from '../types/track';

/** TEST-ONLY synthetic legend: blue 0–10, green 10–20, red 20–30 (values are not NASA data). */
const HUE_LEGEND: readonly LegendEntry[] = [
  { rgb: [0, 0, 255], valueMin: 0, valueMax: 10 },
  { rgb: [0, 255, 0], valueMin: 10, valueMax: 20 },
  { rgb: [255, 0, 0], valueMin: 20, valueMax: 30 },
];
const HUE: HueDecode = { maxHueDistanceDeg: 20, minSaturation: 0.35, minValue: 0.15 };

describe('rgbToHsv (hand-computed)', () => {
  it('gives the primary and secondary hues', () => {
    expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 1, v: 1 });
    expect(rgbToHsv(0, 255, 0)).toEqual({ h: 120, s: 1, v: 1 });
    expect(rgbToHsv(0, 0, 255)).toEqual({ h: 240, s: 1, v: 1 });
    expect(rgbToHsv(255, 255, 0)).toEqual({ h: 60, s: 1, v: 1 });
  });

  it('reports zero saturation for greys and keeps brightness separate from hue', () => {
    expect(rgbToHsv(128, 128, 128).s).toBe(0);
    expect(rgbToHsv(0, 0, 0)).toEqual({ h: 0, s: 0, v: 0 });
    const dark = rgbToHsv(100, 0, 0);
    expect(dark.h).toBe(0);
    expect(dark.s).toBe(1);
    expect(dark.v).toBeCloseTo(100 / 255, 10);
  });

  it('wraps magenta-ish reds into 300–360 degrees', () => {
    expect(rgbToHsv(255, 0, 51).h).toBeCloseTo(348, 10);
  });
});

describe('prepareHueLegend', () => {
  it('stores the hue and the middle of each value range', () => {
    const p = prepareHueLegend(HUE_LEGEND);
    expect(p.map((e) => e.hue)).toEqual([240, 120, 0]);
    expect(p.map((e) => e.value)).toEqual([5, 15, 25]);
  });

  it('rejects a grey legend colour', () => {
    expect(() => prepareHueLegend([{ rgb: [90, 90, 90], valueMin: 0, valueMax: 1 }])).toThrow(RangeError);
  });
});

describe('decodePixelByHue', () => {
  const prepared = prepareHueLegend(HUE_LEGEND);

  it('ignores brightness: a dark red decodes like a bright red', () => {
    expect(decodePixelByHue(255, 0, 0, 255, prepared, HUE)).toBe(25);
    expect(decodePixelByHue(100, 0, 0, 255, prepared, HUE)).toBe(25);
    expect(decodePixelByHue(0, 90, 0, 255, prepared, HUE)).toBe(15);
  });

  it('treats grey, black, too-dark and transparent pixels as no data', () => {
    expect(decodePixelByHue(128, 128, 128, 255, prepared, HUE)).toBeNull(); // grey land
    expect(decodePixelByHue(0, 0, 0, 255, prepared, HUE)).toBeNull(); // background
    expect(decodePixelByHue(30, 0, 0, 255, prepared, HUE)).toBeNull(); // v = 30/255 < 0.15
    expect(decodePixelByHue(255, 0, 0, 127, prepared, HUE)).toBeNull(); // transparent
    expect(decodePixelByHue(255, 0, 0, 128, prepared, HUE)).toBe(25);
  });

  it('measures hue distance around the colour wheel (350° is 10° from red)', () => {
    expect(decodePixelByHue(255, 0, 42.5, 255, prepared, HUE)).toBe(25);
  });

  it('rejects a hue farther than the tolerance from every legend colour', () => {
    // magenta (300°) is 60° from blue and 60° from red
    expect(decodePixelByHue(255, 0, 255, 255, prepared, HUE)).toBeNull();
    expect(decodePixelByHue(255, 0, 255, 255, prepared, { ...HUE, maxHueDistanceDeg: 60 })).toBe(5);
  });

  it('breaks hue ties by the lowest legend index', () => {
    const tie = prepareHueLegend([
      { rgb: [255, 0, 0], valueMin: 0, valueMax: 2 },
      { rgb: [255, 255, 0], valueMin: 10, valueMax: 12 },
    ]);
    // (255, 127.5, 0) has hue exactly 30°: 30° from both red (0°) and yellow (60°)
    expect(rgbToHsv(255, 127.5, 0).h).toBe(30);
    expect(decodePixelByHue(255, 127.5, 0, 255, tie, { ...HUE, maxHueDistanceDeg: 40 })).toBe(1);
  });
});

describe('analyzeFrame with hueDecode', () => {
  const track = fixtureTrack({
    valueBasis: 'decoded-legend',
    legend: HUE_LEGEND,
    hueDecode: HUE,
    valueRange: { min: 0, max: 30 },
  });

  it('decodes shaded legend colours and counts black pixels as no data', () => {
    // left column: dark red (shaded); right column: black background
    const frame = makeFrame(2, 2, (x) => (x === 0 ? [120, 0, 0, 255] : [0, 0, 0, 255]));
    const f = analyzeFrame(frame, track, { cols: 1, rows: 1 });
    expect(f.grid.values[0]).toBe(25);
    expect(f.grid.validFraction[0]).toBeCloseTo(0.5, 10);
  });

  it('gives the same result for the same frame twice (determinism)', () => {
    const frame = makeFrame(4, 4, (x, y) => ((x + y) % 2 === 0 ? [0, 140, 0, 255] : [10, 10, 10, 255]));
    const a = JSON.stringify(analyzeFrame(frame, track, { cols: 2, rows: 2 }));
    const b = JSON.stringify(analyzeFrame(frame, track, { cols: 2, rows: 2 }));
    expect(a).toBe(b);
  });

  it('refuses hueDecode on a relative-intensity track', () => {
    const bad = fixtureTrack({ valueBasis: 'relative-intensity', hueDecode: HUE });
    const frame = makeFrame(1, 1, () => [255, 0, 0, 255]);
    expect(() => analyzeFrame(frame, bad, { cols: 1, rows: 1 })).toThrow();
  });

  it('keeps exact-colour decoding unchanged when hueDecode is absent', () => {
    const plain = fixtureTrack({ valueBasis: 'decoded-legend', legend: HUE_LEGEND });
    const frame = makeFrame(1, 1, () => [120, 0, 0, 255]); // dark red is far from pure red in RGB
    const f = analyzeFrame(frame, plain, { cols: 1, rows: 1 });
    expect(f.grid.validFraction[0]).toBe(0);
  });
});

describe('per-track no-data threshold', () => {
  const profile = fixtureProfile();

  it('falls back to the profile threshold and honours a track override', () => {
    expect(noDataThresholdFor(fixtureTrack(), profile)).toBe(profile.noDataThreshold);
    expect(noDataThresholdFor(fixtureTrack({ noDataThreshold: 0.1 }), profile)).toBe(0.1);
  });

  it('changes which Explore cells are no data at, below and above the threshold', () => {
    // one analysis cell with valid fraction 0.2
    const features = {
      grid: { cols: 1, rows: 1, values: [10], validFraction: [0.2] },
      globalMean: 10,
      min: null,
      max: null,
      validFraction: 0.2,
    };
    const dims = { cols: 1, rows: 1 };
    expect(buildExploreGrid(features, dims, 0.5).noData).toEqual([true]);
    expect(buildExploreGrid(features, dims, 0.1).noData).toEqual([false]);
    expect(buildExploreGrid(features, dims, 0.2).noData).toEqual([false]); // at the threshold → data
  });
});
