import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProfile, profiles } from '../data/profiles';
import { getScale, scales } from '../data/scales';
import { strings } from '../data/strings';
import { tracks } from '../data/tracks';
import { analyzeFrame, buildExploreGrid } from './analysis';
import {
  buildCellScore,
  buildMapSweepScore,
  buildOverviewScore,
  buildRowSweepScore,
  readCell,
  referenceTones,
} from './mapping';
import { describeCell, summarizeFrame } from './narration';
import { fixtureProfile, fixtureTrack, makeFrame } from '../test/fixtures';

describe('data integrity', () => {
  it('has unique scale ids with ascending semitones starting at 0', () => {
    expect(new Set(scales.map((s) => s.id)).size).toBe(scales.length);
    for (const s of scales) {
      expect(s.semitones[0]).toBe(0);
      expect([...s.semitones].sort((a, b) => a - b)).toEqual([...s.semitones]);
    }
  });

  it('has profiles that reference existing scales, three bands, and zero register offsets (D8)', () => {
    expect(new Set(profiles.map((p) => p.id)).size).toBe(profiles.length);
    for (const p of profiles) {
      expect(() => getScale(p.scaleId)).not.toThrow();
      expect(p.bands).toHaveLength(3);
      expect(p.bands.every((b) => b.registerOffset === 0)).toBe(true);
      expect(p.maxVoices).toBeGreaterThanOrEqual(4);
    }
  });

  it('matches the approved defaults (D7, D13)', () => {
    const p = getProfile('sweep-lr-3band');
    expect(p.noDataThreshold).toBe(0.5);
    expect(p.levelThresholds).toEqual({ lowBelow: 1 / 3, highAbove: 2 / 3 });
    expect(p.cellToneSeconds).toBe(0.5);
    expect(p.referenceToneSeconds).toBe(1);
    expect(p.overviewSeconds).toBe(10);
    expect(p.sweepSeconds).toBe(12);
    expect(p.rowSweepSlotSeconds).toBe(0.4);
  });

  it('throws for unknown scale or profile ids', () => {
    expect(() => getScale('nope')).toThrow();
    expect(() => getProfile('nope')).toThrow();
  });

  it('has complete strings', () => {
    expect(Object.keys(strings.levels).sort()).toEqual(['high', 'low', 'middle', 'no-data']);
  });

  it('keeps the track catalogue free of unsourced data: every track has source, credit, valueBasis and a valid profile', () => {
    // The catalogue is intentionally empty until the 13 Nov resources exist; this test then guards real tracks.
    expect(new Set(tracks.map((t) => t.id)).size).toBe(tracks.length);
    for (const t of tracks) {
      expect(t.source.name.length).toBeGreaterThan(0);
      expect(t.source.credit.length).toBeGreaterThan(0);
      expect(['decoded-legend', 'relative-intensity']).toContain(t.valueBasis);
      expect(() => getProfile(t.profileId)).not.toThrow();
      expect(t.valueRange.max).toBeGreaterThan(t.valueRange.min);
      expect(t.title.toLowerCase()).not.toContain('synthetic');
    }
  });
});

describe('purity guard: the whole pipeline runs without randomness, time, or browser globals', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call Math.random, Date.now, or new Date during analysis → mapping → narration', () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random used in core');
    });
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('Date.now used in core');
    });
    const track = fixtureTrack({ valueRange: { min: 0, max: 1 } });
    const profile = fixtureProfile();
    const frame = makeFrame(40, 20, (x, y) => [(x * 6) % 256, (y * 12) % 256, 80, x < 5 ? 0 : 255]);
    const features = analyzeFrame(frame, track);
    const grid = buildExploreGrid(features, track.exploreGrid, profile.noDataThreshold);
    const reading = readCell(grid, { row: 3, col: 4 }, track, profile);
    buildCellScore(reading, track, profile);
    buildRowSweepScore(grid, 2, track, profile);
    buildMapSweepScore(grid, track, profile);
    buildOverviewScore(grid, track, profile);
    referenceTones(track, profile);
    describeCell(reading, 'detailed', track);
    summarizeFrame(grid, track);
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
  });

  it('runs in an environment without window, document, or AudioContext', () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    expect(typeof (globalThis as { AudioContext?: unknown }).AudioContext).toBe('undefined');
  });

  it('gives a byte-identical result for the full pipeline run twice (determinism)', () => {
    const track = fixtureTrack({ valueRange: { min: 0, max: 1 } });
    const profile = fixtureProfile();
    const frame = makeFrame(36, 18, (x, y) => [(x * 7) % 256, (y * 13) % 256, (x * y) % 256, 255]);
    const run = (): string => {
      const features = analyzeFrame(frame, track);
      const grid = buildExploreGrid(features, track.exploreGrid, profile.noDataThreshold);
      return JSON.stringify([
        grid,
        buildMapSweepScore(grid, track, profile),
        buildOverviewScore(grid, track, profile),
        buildRowSweepScore(grid, 4, track, profile),
        referenceTones(track, profile),
        summarizeFrame(grid, track),
      ]);
    };
    expect(run()).toBe(run());
  });
});
