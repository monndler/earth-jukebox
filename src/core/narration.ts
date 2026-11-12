/**
 * Text produced from the same data as the sound (PROJECT_PLAN §8.5, UI_FUNCTION_MAP S-00 / X-03).
 * PURE. A statement is only made when the data supports it: no named geography (left / middle / right only),
 * no "above baseline" wording unless the track declares units and an anomaly baseline.
 */
import { strings } from '../data/strings';
import { findExtremeCell } from './mapping';
import type { AnnouncementMode, CellReading, ExploreGrid } from '../types/frame';
import type { Track } from '../types/track';

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = vars[key];
    return v === undefined ? match : String(v);
  });
}

function capitalise(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * formatValue — readable value text, or null when the track cannot support one.
 * Anomaly wording ("above/below …") only for diverging tracks that declare both units and `anomalyBaseline`;
 * plain "x units" when only units are declared; null for relative-intensity tracks without units.
 */
export function formatValue(value: number, track: Track): string | null {
  if (track.units === undefined) {
    return null;
  }
  const amount = Math.abs(value).toFixed(1);
  if (track.diverging && track.anomalyBaseline !== undefined) {
    const template = value >= 0 ? strings.cell.valueAbove : strings.cell.valueBelow;
    return fill(template, { amount, units: track.units, baseline: track.anomalyBaseline });
  }
  const plain = value.toFixed(1);
  return fill(strings.cell.valuePlain, { amount: plain, units: track.units });
}

/** describeCell — live-region text for a cell by announcement mode. 'sound-only' returns ''. */
export function describeCell(reading: CellReading, mode: AnnouncementMode, track: Track): string {
  if (mode === 'sound-only') {
    return '';
  }
  const vars = { row: reading.row, col: reading.col };
  if (reading.isNoData) {
    return fill(strings.cell.shortNoData, vars);
  }
  if (mode === 'short') {
    return fill(strings.cell.short, { ...vars, level: strings.levels[reading.level] });
  }
  const parts: string[] = [
    fill(strings.cell.detailedHead, vars),
    strings.levels[reading.level],
  ];
  if (reading.value !== null) {
    const valueText = formatValue(reading.value, track);
    if (valueText !== null) {
      parts.push(valueText);
    }
  }
  if (reading.dataShare < 1) {
    parts.push(fill(strings.cell.dataShare, { percent: Math.round(reading.dataShare * 100) }));
  }
  return parts.join(', ');
}

function whereOf(col: number, cols: number): string {
  if (col <= cols / 3) {
    return strings.summary.where.left;
  }
  if (col > (2 * cols) / 3) {
    return strings.summary.where.right;
  }
  return strings.summary.where.middle;
}

/**
 * summarizeFrame — overview text. Only states what the Explore grid supports: where the highest and lowest
 * cells are (left / middle / right) and how much of the map has no data.
 */
export function summarizeFrame(grid: ExploreGrid, track: Track): string {
  const maxCell = findExtremeCell(grid, 'max');
  const minCell = findExtremeCell(grid, 'min');
  if (maxCell === null || minCell === null) {
    return strings.summary.empty;
  }
  const sentences: string[] = [];
  if (maxCell.value === minCell.value) {
    sentences.push(strings.summary.uniform);
  } else {
    sentences.push(
      fill(strings.summary.extremeLine, {
        label: capitalise(track.extremeLabels.max),
        where: whereOf(maxCell.col, grid.cols),
      }),
    );
    sentences.push(
      fill(strings.summary.extremeLine, {
        label: capitalise(track.extremeLabels.min),
        where: whereOf(minCell.col, grid.cols),
      }),
    );
  }
  const noDataCount = grid.noData.filter((x) => x).length;
  if (noDataCount > 0) {
    const percent = Math.round((noDataCount / grid.noData.length) * 100);
    sentences.push(fill(strings.summary.coverage, { percent }));
  }
  return sentences.join(' ');
}
