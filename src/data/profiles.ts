/**
 * Mapping profiles (PROJECT_PLAN §8.2). All values are DESIGN CHOICES to be tuned with blind and
 * low-vision testers — not scientific facts. Initial durations follow D13; thresholds follow D7;
 * bands follow D8 (one shared pitch mapping, timbre differs, register offset 0).
 */
import type { MappingProfile } from '../types/sound';

export const profiles: readonly MappingProfile[] = [
  {
    id: 'sweep-lr-3band',
    name: 'Left-to-right sweep, three bands',
    scaleId: 'pentatonic-major',
    octaves: 2,
    baseMidi: 57, // A3
    bands: [
      { timbre: 'bright', registerOffset: 0 }, // upper band
      { timbre: 'soft', registerOffset: 0 }, // middle band
      { timbre: 'hollow', registerOffset: 0 }, // lower band
    ],
    sweepSeconds: 12,
    rowSweepSlotSeconds: 0.4,
    cellToneSeconds: 0.5,
    overviewSeconds: 10,
    referenceToneSeconds: 1.0,
    panWidth: 1,
    maxVoices: 4,
    invert: false,
    noDataThreshold: 0.5,
    levelThresholds: { lowBelow: 1 / 3, highAbove: 2 / 3 },
    gains: { note: 0.25, accent: 0.2, drone: 0.08, overview: 0.35, reference: 0.35 },
  },
];

export function getProfile(id: string): MappingProfile {
  const profile = profiles.find((p) => p.id === id);
  if (profile === undefined) {
    throw new Error(`Unknown mapping profile id: ${id}`);
  }
  return profile;
}
