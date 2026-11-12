/**
 * Frame analysis, Explore grid and cell reading types (PROJECT_PLAN §14, UI_FUNCTION_MAP §2).
 * All coordinates exposed publicly are 1-based `row`/`col` (matching the UI). Arrays are row-major.
 * Everything here is plain JSON-serialisable data.
 */
import type { GridDims } from './track';

/** A decoded frame. The DOM/canvas step that produces it lives outside `core/`. */
export interface DecodedFrame {
  readonly width: number;
  readonly height: number;
  /** RGBA bytes, length >= width * height * 4. */
  readonly rgba: ArrayLike<number>;
}

/** Fine analysis grid produced from a frame. */
export interface AnalysisGrid extends GridDims {
  /** Mean value of the valid pixels of each cell (0 where the cell has none). */
  readonly values: readonly number[];
  /** Fraction (0–1) of each cell's pixels that carry data. */
  readonly validFraction: readonly number[];
}

export interface ExtremeCell {
  readonly value: number;
  readonly row: number;
  readonly col: number;
}

export interface FrameFeatures {
  readonly grid: AnalysisGrid;
  /** Unweighted (no latitude weighting in P0), weighted by each cell's valid fraction. */
  readonly globalMean: number;
  readonly min: ExtremeCell | null;
  readonly max: ExtremeCell | null;
  /** Mean valid fraction over all analysis cells. */
  readonly validFraction: number;
}

/** Coarse grid used by the Explorer and by every P0 sound (D1). */
export interface ExploreGrid extends GridDims {
  readonly values: readonly number[];
  readonly validFraction: readonly number[];
  readonly noData: readonly boolean[];
}

export type Level = 'low' | 'middle' | 'high' | 'no-data';

export interface Cursor {
  readonly row: number;
  readonly col: number;
}

export interface CellReading {
  readonly row: number;
  readonly col: number;
  readonly isNoData: boolean;
  readonly level: Level;
  /** Value in track units, null for no-data. */
  readonly value: number | null;
  /** Normalised position 0–1 within the track's fixed value range, null for no-data. */
  readonly t: number | null;
  /** Share (0–1) of the cell's area that has data. */
  readonly dataShare: number;
  readonly freqHz: number | null;
  /** Stereo position −1 (left) … +1 (right). */
  readonly pan: number;
  /** Index of the band (voice) that contains the cell's row. */
  readonly band: number;
}

export type AnnouncementMode = 'short' | 'detailed' | 'sound-only';

export interface Settings {
  readonly volume: number;
  readonly speed: 0.5 | 1 | 1.5;
  readonly announcements: AnnouncementMode;
  readonly invert: boolean;
  /** "Play a tone when I move" (D6). */
  readonly moveTones: boolean;
}
