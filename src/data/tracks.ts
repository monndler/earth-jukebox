/**
 * Track catalogue.
 *
 * The `tracks` array is the REAL catalogue (empty until 13 Nov resources arrive).
 * `getAllTracks()` includes the synthetic demo track approved for Phase 4 development.
 * Remove the synthetic import before submission.
 */
import type { Track } from '../types/track';
import { syntheticDemoTrack } from './syntheticDemoTrack';

/** Real tracks (PROJECT_PLAN §10, AGENTS.md §11). Empty until resources arrive. */
export const tracks: readonly Track[] = [];

/**
 * All tracks including the dev-only synthetic demo (AGENTS.md §11.5).
 * Remove `syntheticDemoTrack` before submission.
 */
export function getAllTracks(): readonly Track[] {
  return [...tracks, syntheticDemoTrack];
}

export function getTrack(id: string): Track | undefined {
  return getAllTracks().find((t) => t.id === id);
}
