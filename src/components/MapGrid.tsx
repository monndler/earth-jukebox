/**
 * M-01…M-06: the Explore grid (D2: one element with a text alternative; cells are hidden from assistive tech and
 * are never tab stops). Cell meaning is carried by symbol shape, not by colour (UI_FUNCTION_MAP §0.5).
 */
import { useMemo, useRef, type PointerEvent, type ReactNode } from 'react';
import { readCell } from '../core/mapping';
import { fillTemplate, strings } from '../data/strings';
import type { CellReading, Cursor, ExploreGrid, Level } from '../types/frame';
import type { MappingProfile } from '../types/sound';
import type { Track } from '../types/track';

const SYMBOLS: Readonly<Record<Level, string>> = {
  high: '▲',
  middle: '●',
  low: '▼',
  'no-data': '×',
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function MapGrid(props: {
  readonly grid: ExploreGrid;
  readonly track: Track;
  readonly profile: MappingProfile;
  readonly cursor: Cursor;
  readonly onDrag: (cursor: Cursor) => void;
  readonly onRelease: () => void;
}): ReactNode {
  const { grid, track, profile, cursor } = props;
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const levels = useMemo<readonly CellReading[]>(() => {
    const out: CellReading[] = [];
    for (let row = 1; row <= grid.rows; row += 1) {
      for (let col = 1; col <= grid.cols; col += 1) {
        out.push(readCell(grid, { row, col }, track, profile));
      }
    }
    return out;
  }, [grid, track, profile]);

  function cellAt(e: PointerEvent<HTMLDivElement>): Cursor | null {
    const el = ref.current;
    if (el === null) {
      return null;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return {
      col: clamp(Math.floor(x * grid.cols) + 1, 1, grid.cols),
      row: clamp(Math.floor(y * grid.rows) + 1, 1, grid.rows),
    };
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>): void {
    const cell = cellAt(e);
    if (cell === null) {
      return;
    }
    dragging.current = true;
    ref.current?.setPointerCapture(e.pointerId);
    props.onDrag(cell);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>): void {
    if (!dragging.current) {
      return;
    }
    const cell = cellAt(e);
    if (cell !== null) {
      props.onDrag(cell);
    }
  }

  function endDrag(e: PointerEvent<HTMLDivElement>): void {
    if (!dragging.current) {
      return;
    }
    dragging.current = false;
    ref.current?.releasePointerCapture(e.pointerId);
    props.onRelease();
  }

  return (
    <div className="ej-grid-block">
      <h3 className="ej-h3">{fillTemplate(strings.grid.heading, { cols: grid.cols, rows: grid.rows })}</h3>
      <p className="ej-helper">{strings.grid.instruction}</p>
      <div className="ej-grid-wrap">
        <span className="ej-axis ej-axis--top">{strings.grid.axisUpper}</span>
        <span className="ej-axis ej-axis--bottom">{strings.grid.axisLower}</span>
        <div
          ref={ref}
          className="ej-grid"
          role="img"
          aria-label={fillTemplate(strings.grid.altText, { rows: grid.rows, cols: grid.cols })}
          style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, gridTemplateRows: `repeat(${grid.rows}, 1fr)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {levels.map((r) => {
            const isCursor = r.row === cursor.row && r.col === cursor.col;
            return (
              <div
                key={`${r.row}-${r.col}`}
                aria-hidden="true"
                className={`ej-cell ej-cell--${r.level}${isCursor ? ' ej-cell--cursor' : ''}`}
              >
                {SYMBOLS[r.level]}
              </div>
            );
          })}
        </div>
        <div className="ej-axis-row">
          <span className="ej-axis">{strings.grid.axisLeft}</span>
          <span className="ej-axis">{strings.grid.axisRight}</span>
        </div>
      </div>
      <p className="ej-helper">{strings.grid.symbolsOn}</p>
      <p className="ej-chip">{fillTemplate(strings.grid.cursorChip, { row: cursor.row, col: cursor.col })}</p>
    </div>
  );
}
