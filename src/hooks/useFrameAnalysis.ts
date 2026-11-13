/**
 * Loads a track frame, decodes it to pixels in the browser, and runs the pure `core/` analysis.
 * The DOM/canvas step lives here (outside `core/`, PROJECT_PLAN §9). Frames are same-origin files in `public/`.
 */
import { useEffect, useState } from 'react';
import { analyzeFrame, buildExploreGrid, noDataThresholdFor } from '../core/analysis';
import { getProfile } from '../data/profiles';
import type { DecodedFrame, ExploreGrid } from '../types/frame';
import type { Track } from '../types/track';

export type FrameAnalysis =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly grid: ExploreGrid };

type Settled =
  | { readonly key: string; readonly status: 'error' }
  | { readonly key: string; readonly status: 'ready'; readonly grid: ExploreGrid };

/** Decodes an image URL to RGBA pixels at its natural size. Rejects when the image cannot be loaded. */
function loadPixels(src: string, width: number, height: number): Promise<DecodedFrame> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx === null) {
        reject(new Error('Canvas is not available.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height);
      resolve({ width, height, rgba: data.data });
    };
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

export function useFrameAnalysis(track: Track, frameIndex: number): FrameAnalysis {
  const frame = track.frames[frameIndex];
  const key = `${track.id}:${frame?.id ?? 'none'}`;
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (frame === undefined) {
      return undefined;
    }
    let cancelled = false;
    loadPixels(frame.src, frame.width, frame.height)
      .then((decoded) => {
        const features = analyzeFrame(decoded, track);
        const profile = getProfile(track.profileId);
        const grid = buildExploreGrid(features, track.exploreGrid, noDataThresholdFor(track, profile));
        if (!cancelled) {
          setSettled({ key, status: 'ready', grid });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSettled({ key, status: 'error' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [track, frame, key]);

  if (frame === undefined) {
    return { status: 'error' };
  }
  if (settled === null || settled.key !== key) {
    return { status: 'loading' };
  }
  return settled.status === 'ready' ? { status: 'ready', grid: settled.grid } : { status: 'error' };
}
