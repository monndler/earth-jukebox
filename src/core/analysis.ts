/**
 * Frame analysis (PROJECT_PLAN §9, D1, D7). PURE and deterministic: no DOM, no randomness, no time.
 * The canvas step that produces a `DecodedFrame` lives outside `core/`.
 *
 * EDUCATIONAL APPROXIMATION — a sound translation of a visualization, not a calibrated measurement
 * unless the track's `valueBasis` is 'decoded-legend'.
 */
import type {
  AnalysisGrid,
  DecodedFrame,
  ExploreGrid,
  ExtremeCell,
  FrameFeatures,
} from '../types/frame';
import type { CropRect, GridDims, LegendEntry, Track } from '../types/track';

/** Default fine analysis grid (PROJECT_PLAN §9). */
export const DEFAULT_ANALYSIS_GRID: GridDims = { cols: 36, rows: 18 };

/** Pixels with alpha below this are treated as no data (transparent). */
export const ALPHA_THRESHOLD = 128;

/** Max Euclidean RGB distance for a pixel to match a legend colour; farther → no data. */
export const LEGEND_TOLERANCE = 48;

/**
 * Rec. 709 luma coefficients ×10000 (applied to gamma-encoded sRGB values). Integer arithmetic keeps
 * white exactly 1 and black exactly 0 (the decimal coefficients sum to 0.9999999999999999 in floating point).
 */
const LUMA_R = 2126;
const LUMA_G = 7152;
const LUMA_B = 722;
const LUMA_SCALE = 10000 * 255;

/**
 * decodePixel
 * Formula:     legend path → nearest legend colour within LEGEND_TOLERANCE → (valueMin + valueMax) / 2;
 *              relative-intensity path → (0.2126 R + 0.7152 G + 0.0722 B) / 255 (computed with integer coefficients).
 * Units:       RGBA bytes in; track value units out (legend) or 0–1 (relative intensity).
 * Assumptions: alpha < ALPHA_THRESHOLD is no data; ties between legend entries go to the lowest index.
 * Source:      PROJECT_PLAN §9, D7.
 * EDUCATIONAL APPROXIMATION — not an engineering-grade calculation.
 */
export function decodePixel(
  r: number,
  g: number,
  b: number,
  a: number,
  legend: readonly LegendEntry[] | undefined,
): number | null {
  if (a < ALPHA_THRESHOLD) {
    return null;
  }
  if (legend === undefined) {
    return (LUMA_R * r + LUMA_G * g + LUMA_B * b) / LUMA_SCALE;
  }
  let bestIndex = -1;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < legend.length; i += 1) {
    const entry = legend[i];
    if (entry === undefined) {
      continue;
    }
    const dr = r - entry.rgb[0];
    const dg = g - entry.rgb[1];
    const db = b - entry.rgb[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  const best = bestIndex >= 0 ? legend[bestIndex] : undefined;
  if (best === undefined || bestDist > LEGEND_TOLERANCE) {
    return null;
  }
  return (best.valueMin + best.valueMax) / 2;
}

function clampCrop(crop: CropRect | undefined, frame: DecodedFrame): CropRect {
  if (crop === undefined) {
    return { x: 0, y: 0, width: frame.width, height: frame.height };
  }
  const x = Math.min(Math.max(0, Math.floor(crop.x)), frame.width);
  const y = Math.min(Math.max(0, Math.floor(crop.y)), frame.height);
  const width = Math.max(0, Math.min(Math.floor(crop.width), frame.width - x));
  const height = Math.max(0, Math.min(Math.floor(crop.height), frame.height - y));
  return { x, y, width, height };
}

/** Integer partition of `total` items into `n` groups: group i covers [start, end). */
export function partition(i: number, n: number, total: number): { start: number; end: number } {
  return { start: Math.floor((i * total) / n), end: Math.floor(((i + 1) * total) / n) };
}

/**
 * analyzeFrame
 * Formula:     per analysis cell: value = mean of valid-pixel values; validFraction = valid / total pixels.
 * Units:       cell values in track value units (or 0–1 for relative intensity); fractions 0–1.
 * Assumptions: equal-size cells (integer partition); no latitude weighting in P0; global mean weighted by
 *              each cell's valid fraction; cropRect removes burned-in colourbars/badges.
 * Source:      PROJECT_PLAN §9.
 * EDUCATIONAL APPROXIMATION — not an engineering-grade calculation.
 * Throws for programmer errors (inconsistent frame, legend missing for a 'decoded-legend' track).
 */
export function analyzeFrame(
  frame: DecodedFrame,
  track: Track,
  dims: GridDims = DEFAULT_ANALYSIS_GRID,
): FrameFeatures {
  if (dims.cols < 1 || dims.rows < 1) {
    throw new RangeError('Analysis grid must have at least 1 column and 1 row.');
  }
  if (frame.width < 0 || frame.height < 0 || frame.rgba.length < frame.width * frame.height * 4) {
    throw new RangeError('Decoded frame has fewer pixel bytes than width × height × 4.');
  }
  if (track.valueBasis === 'decoded-legend' && (track.legend === undefined || track.legend.length === 0)) {
    throw new Error(`Track ${track.id} is 'decoded-legend' but has no legend.`);
  }
  const legend = track.valueBasis === 'decoded-legend' ? track.legend : undefined;
  const crop = clampCrop(track.cropRect, frame);
  const { cols, rows } = dims;

  const values: number[] = [];
  const validFraction: number[] = [];
  for (let r = 0; r < rows; r += 1) {
    const ys = partition(r, rows, crop.height);
    for (let c = 0; c < cols; c += 1) {
      const xs = partition(c, cols, crop.width);
      let sum = 0;
      let valid = 0;
      const total = (ys.end - ys.start) * (xs.end - xs.start);
      for (let y = ys.start; y < ys.end; y += 1) {
        for (let x = xs.start; x < xs.end; x += 1) {
          const p = ((crop.y + y) * frame.width + (crop.x + x)) * 4;
          const v = decodePixel(
            frame.rgba[p] ?? 0,
            frame.rgba[p + 1] ?? 0,
            frame.rgba[p + 2] ?? 0,
            frame.rgba[p + 3] ?? 0,
            legend,
          );
          if (v !== null) {
            sum += v;
            valid += 1;
          }
        }
      }
      values.push(valid > 0 ? sum / valid : 0);
      validFraction.push(total > 0 ? valid / total : 0);
    }
  }

  const grid: AnalysisGrid = { cols, rows, values, validFraction };
  let weightedSum = 0;
  let weightTotal = 0;
  let fractionSum = 0;
  let min: ExtremeCell | null = null;
  let max: ExtremeCell | null = null;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i] ?? 0;
    const vf = validFraction[i] ?? 0;
    fractionSum += vf;
    if (vf > 0) {
      weightedSum += value * vf;
      weightTotal += vf;
      const cell = { value, row: Math.floor(i / cols) + 1, col: (i % cols) + 1 };
      if (min === null || value < min.value) {
        min = cell;
      }
      if (max === null || value > max.value) {
        max = cell;
      }
    }
  }
  return {
    grid,
    globalMean: weightTotal > 0 ? weightedSum / weightTotal : 0,
    min,
    max,
    validFraction: values.length > 0 ? fractionSum / values.length : 0,
  };
}

/**
 * buildExploreGrid
 * Formula:     Explore cell value = Σ(value · validFraction) / Σ(validFraction) over the analysis cells it
 *              covers; Explore validFraction = mean validFraction; no-data when validFraction < threshold
 *              (or when no covered cell has data).
 * Units:       same as the analysis grid; fractions 0–1.
 * Assumptions: analysis cells have equal area; integer partition; each cell is an AVERAGE over a possibly
 *              large area, so the "warmest cell" is not the warmest pixel (stated on the About page).
 * Source:      PROJECT_PLAN §9 (3b), D1, D7.
 * EDUCATIONAL APPROXIMATION — not an engineering-grade calculation.
 */
export function buildExploreGrid(
  features: FrameFeatures,
  dims: GridDims,
  noDataThreshold: number,
): ExploreGrid {
  if (dims.cols < 1 || dims.rows < 1) {
    throw new RangeError('Explore grid must have at least 1 column and 1 row.');
  }
  const src = features.grid;
  const values: number[] = [];
  const validFraction: number[] = [];
  const noData: boolean[] = [];
  for (let er = 0; er < dims.rows; er += 1) {
    const rs = partition(er, dims.rows, src.rows);
    for (let ec = 0; ec < dims.cols; ec += 1) {
      const cs = partition(ec, dims.cols, src.cols);
      let sumV = 0;
      let sumW = 0;
      let sumF = 0;
      let count = 0;
      for (let r = rs.start; r < rs.end; r += 1) {
        for (let c = cs.start; c < cs.end; c += 1) {
          const i = r * src.cols + c;
          const vf = src.validFraction[i] ?? 0;
          sumV += (src.values[i] ?? 0) * vf;
          sumW += vf;
          sumF += vf;
          count += 1;
        }
      }
      const frac = count > 0 ? sumF / count : 0;
      const empty = count === 0 || sumW === 0 || frac < noDataThreshold;
      values.push(sumW > 0 ? sumV / sumW : 0);
      validFraction.push(frac);
      noData.push(empty);
    }
  }
  return { cols: dims.cols, rows: dims.rows, values, validFraction, noData };
}
