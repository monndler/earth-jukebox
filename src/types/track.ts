/**
 * Track and frame metadata types.
 * Implements PROJECT_PLAN §14 (Track, FrameRef, LegendEntry) plus the additions approved in
 * UI_FUNCTION_MAP §11 (exploreGrid, extremeLabels, guideText, aboutText) and one optional field
 * (`anomalyBaseline`, see docs/ASSUMPTIONS.md #1).
 *
 * Units: pixels for crop/frame sizes; track value units for `valueRange` and legend values.
 */

/** How the values of a track were obtained. Shown to the user as a badge. */
export type ValueBasis = 'decoded-legend' | 'relative-intensity';

export interface LegendEntry {
  /** Legend colour (0–255 per channel). */
  readonly rgb: readonly [number, number, number];
  /** Value range this colour represents, in track value units. */
  readonly valueMin: number;
  readonly valueMax: number;
}

export interface CropRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface FrameRef {
  readonly id: string;
  /** Same-origin path of the bundled frame image. */
  readonly src: string;
  /** Human label, e.g. a date. */
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

export interface TrackSource {
  readonly name: string;
  readonly url: string;
  readonly credit: string;
  readonly licenseNote: string;
}

export interface GridDims {
  readonly cols: number;
  readonly rows: number;
}

export interface Track {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly storyText: string;
  readonly variable: string;
  readonly units?: string;
  readonly source: TrackSource;
  readonly frames: readonly FrameRef[];
  readonly legend?: readonly LegendEntry[];
  readonly cropRect?: CropRect;
  readonly projection?: { readonly type: string; readonly extent: string };
  /** True for anomaly-style data centred on a baseline (zero). */
  readonly diverging: boolean;
  /**
   * Fixed value range for the whole track (D7). Levels and pitch are computed against it, never
   * against the frame being viewed. For `relative-intensity` tracks use { min: 0, max: 1 }.
   */
  readonly valueRange: { readonly min: number; readonly max: number };
  readonly valueBasis: ValueBasis;
  readonly profileId: string;
  readonly whyNotes: string;
  /** Explore grid size (D1). Default 10 × 8. */
  readonly exploreGrid: GridDims;
  /** Words used by jump buttons and summaries, e.g. 'warmest' / 'coolest' or 'highest' / 'lowest'. */
  readonly extremeLabels: { readonly max: string; readonly min: string };
  readonly guideText: {
    readonly low: string;
    readonly middle: string;
    readonly high: string;
    readonly noData: string;
  };
  readonly aboutText: { readonly canTell: string; readonly cannotTell: string };
  /**
   * Wording of the anomaly baseline, e.g. "the long-term average". Required before a readout may say
   * "above/below baseline". Optional addition to the plan model (docs/ASSUMPTIONS.md #1).
   */
  readonly anomalyBaseline?: string;
}
