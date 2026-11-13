/**
 * Track catalogue.
 *
 * The `tracks` array is the REAL catalogue (NASA-sourced tracks only).
 * `getAllTracks()` includes the synthetic demo track approved for Phase 4 development.
 * Remove the synthetic import before submission.
 */
import type { Track } from '../types/track';
import { oceanSymphonyTrack } from './oceanSymphony';
import { syntheticDemoTrack } from './syntheticDemoTrack';

/** Real tracks (PROJECT_PLAN §10, AGENTS.md §11). */
export const tracks: readonly Track[] = [oceanSymphonyTrack];

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
