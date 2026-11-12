/**
 * User-facing strings produced by `core/narration` (English). Kept in data so a second language can be
 * added later (P1). Templates use {placeholders}.
 */
export const strings = {
  levels: { low: 'low', middle: 'middle', high: 'high', 'no-data': 'no data' },
  cell: {
    short: 'Row {row}, column {col}, {level}',
    shortNoData: 'Row {row}, column {col}, no data',
    detailedHead: 'Row {row}, column {col}',
    dataShare: '{percent} percent of this cell has data',
    valueAbove: '{amount} {units} above {baseline}',
    valueBelow: '{amount} {units} below {baseline}',
    valuePlain: '{amount} {units}',
  },
  summary: {
    empty: 'This frame has no data.',
    uniform: 'Values are similar across the whole map.',
    extremeLine: '{label} area is {where}.',
    coverage: 'About {percent} percent of the map has no data.',
    where: { left: 'on the left side', middle: 'in the middle', right: 'on the right side' },
  },
} as const;
