/**
 * Musical scales used to quantise pitch (PROJECT_PLAN §8.3). Standard semitone patterns.
 * Choice of default scale is a design choice, not a scientific fact.
 */
import type { ScaleDef } from '../types/sound';

export const scales: readonly ScaleDef[] = [
  { id: 'pentatonic-major', name: 'Major pentatonic', semitones: [0, 2, 4, 7, 9] },
  { id: 'pentatonic-minor', name: 'Minor pentatonic', semitones: [0, 3, 5, 7, 10] },
  { id: 'major', name: 'Major', semitones: [0, 2, 4, 5, 7, 9, 11] },
];

export function getScale(id: string): ScaleDef {
  const scale = scales.find((s) => s.id === id);
  if (scale === undefined) {
    throw new Error(`Unknown scale id: ${id}`);
  }
  return scale;
}
