/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { prepareHueLegend } from '../core/analysis';
import { tracks } from './tracks';

/** Reads the width and height from a PNG's IHDR chunk (bytes 16–23). */
function pngSize(path: string): { width: number; height: number } {
  const b = readFileSync(path);
  expect(b.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

describe('real track data (public/tracks)', () => {
  it('has at least one track, with unique frame ids and a non-empty story and credit', () => {
    expect(tracks.length).toBeGreaterThan(0);
    for (const t of tracks) {
      expect(t.frames.length).toBeGreaterThan(0);
      expect(new Set(t.frames.map((f) => f.id)).size).toBe(t.frames.length);
      expect(t.storyText.length).toBeGreaterThan(0);
      expect(t.source.url.startsWith('https://svs.gsfc.nasa.gov/')).toBe(true);
    }
  });

  it('points every frame at an existing same-origin PNG whose size matches its declaration', () => {
    for (const t of tracks) {
      for (const f of t.frames) {
        expect(f.src.startsWith('/tracks/')).toBe(true);
        const size = pngSize(`public${f.src}`);
        expect(size).toEqual({ width: f.width, height: f.height });
        expect(f.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('has a contiguous legend that covers the declared value range (the range may be narrower) for decoded-legend tracks', () => {
    for (const t of tracks) {
      if (t.valueBasis !== 'decoded-legend') {
        expect(t.legend).toBeUndefined();
        continue;
      }
      const legend = t.legend ?? [];
      expect(legend.length).toBeGreaterThan(1);
      expect(legend[0]?.valueMin ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(t.valueRange.min);
      expect(legend[legend.length - 1]?.valueMax ?? Number.NEGATIVE_INFINITY).toBeGreaterThanOrEqual(
        t.valueRange.max,
      );
      for (let i = 1; i < legend.length; i += 1) {
        expect(legend[i]?.valueMin).toBe(legend[i - 1]?.valueMax);
      }
    }
  });

  it('has valid hue-decode settings and thresholds, and a legend with a hue for every entry', () => {
    for (const t of tracks) {
      if (t.noDataThreshold !== undefined) {
        expect(t.noDataThreshold).toBeGreaterThanOrEqual(0);
        expect(t.noDataThreshold).toBeLessThanOrEqual(1);
      }
      if (t.hueDecode !== undefined) {
        expect(t.valueBasis).toBe('decoded-legend');
        expect(t.hueDecode.maxHueDistanceDeg).toBeGreaterThan(0);
        expect(t.hueDecode.maxHueDistanceDeg).toBeLessThanOrEqual(180);
        expect(t.hueDecode.minSaturation).toBeGreaterThanOrEqual(0);
        expect(t.hueDecode.minSaturation).toBeLessThanOrEqual(1);
        expect(t.hueDecode.minValue).toBeGreaterThanOrEqual(0);
        expect(t.hueDecode.minValue).toBeLessThanOrEqual(1);
        expect(() => prepareHueLegend(t.legend ?? [])).not.toThrow();
      }
    }
  });
});
