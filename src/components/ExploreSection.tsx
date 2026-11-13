/** Explore section: overview card (4.1), grid (4.2), sliders (4.3), cell card (4.4), move panel (4.5). */
import type { ReactNode } from 'react';
import { fillTemplate, strings } from '../data/strings';
import type { ExplorerController } from '../hooks/useExplorerController';
import type { AppState } from '../store';
import type { ExploreGrid } from '../types/frame';
import type { Track } from '../types/track';
import { MapGrid } from './MapGrid';

function panWord(pan: number): string {
  if (pan < -0.2) {
    return strings.cellCard.panWords.left;
  }
  if (pan > 0.2) {
    return strings.cellCard.panWords.right;
  }
  return strings.cellCard.panWords.center;
}

export function ExploreSection(props: {
  readonly track: Track;
  readonly grid: ExploreGrid;
  readonly state: AppState;
  readonly ctl: ExplorerController;
}): ReactNode {
  const { track, grid, state, ctl } = props;
  const { cursor } = state;
  const { reading, edges } = ctl;
  const bandTimbre = ctl.profile.bands[reading.band]?.timbre;

  return (
    <div className="ej-explore">
      {/* 4.1 Audio overview */}
      <section className="ej-panel" aria-labelledby="overview-heading">
        <div className="ej-row">
          <h3 id="overview-heading" className="ej-h3">
            {strings.common.summaryHeading}
          </h3>
          <span className="ej-chip">
            {fillTemplate(strings.overview.durationChip, { seconds: Math.round(ctl.overviewSeconds) })}
          </span>
        </div>
        <button
          type="button"
          className="ej-btn ej-btn--primary"
          aria-pressed={state.playback === 'overview'}
          onClick={ctl.hearOverview}
        >
          {strings.overview.hearOverview}
        </button>
        <p className="ej-summary">{ctl.summary}</p>
      </section>

      {/* 4.2 Map grid */}
      <section className="ej-panel">
        <MapGrid
          grid={grid}
          track={track}
          profile={ctl.profile}
          cursor={cursor}
          onDrag={ctl.dragTo}
          onRelease={ctl.commitPointer}
        />
      </section>

      {/* 4.3 Coordinate sliders */}
      <section className="ej-panel">
        <div className="ej-field">
          <label htmlFor="row-slider" className="ej-field__legend">
            {strings.sliders.rowLabel}
          </label>
          <input
            id="row-slider"
            type="range"
            min={1}
            max={grid.rows}
            step={1}
            value={cursor.row}
            aria-valuetext={fillTemplate(strings.sliders.rowValue, { row: cursor.row, rows: grid.rows })}
            onChange={(e) => ctl.setRow(Number(e.currentTarget.value))}
          />
        </div>
        <div className="ej-field">
          <label htmlFor="col-slider" className="ej-field__legend">
            {strings.sliders.colLabel}
          </label>
          <input
            id="col-slider"
            type="range"
            min={1}
            max={grid.cols}
            step={1}
            value={cursor.col}
            aria-valuetext={fillTemplate(strings.sliders.colValue, { col: cursor.col, cols: grid.cols })}
            onChange={(e) => ctl.setCol(Number(e.currentTarget.value))}
          />
        </div>
      </section>

      {/* 4.4 Selected cell */}
      <section className="ej-panel" aria-labelledby="cell-heading">
        <h3 id="cell-heading" className="ej-h3">
          {strings.cellCard.cellHeading}
        </h3>
        <p className="ej-readout">{ctl.readoutText}</p>
        <button type="button" className="ej-btn ej-btn--primary" onClick={ctl.hearCell}>
          {strings.cellCard.hearThisCell}
        </button>
        <details className="ej-details">
          <summary>{strings.cellCard.soundDetails}</summary>
          <ul className="ej-list">
            {reading.freqHz !== null ? (
              <li>{fillTemplate(strings.cellCard.pitch, { freq: Math.round(reading.freqHz) })}</li>
            ) : null}
            {!reading.isNoData ? (
              <li>{fillTemplate(strings.cellCard.panPosition, { position: panWord(reading.pan) })}</li>
            ) : null}
            {!reading.isNoData && bandTimbre !== undefined ? (
              <li>{fillTemplate(strings.cellCard.timbre, { timbre: bandTimbre })}</li>
            ) : null}
            <li>{fillTemplate(strings.cellCard.dataShareDetail, { percent: Math.round(reading.dataShare * 100) })}</li>
          </ul>
        </details>
      </section>

      {/* 4.5 Move around the map */}
      <section className="ej-panel" aria-labelledby="move-heading">
        <h3 id="move-heading" className="ej-h3">
          {strings.common.moveHeading}
        </h3>
        <div className="ej-dpad">
          <button
            type="button"
            className="ej-btn ej-btn--secondary ej-dpad__up"
            aria-disabled={edges.up}
            onClick={() => ctl.moveBy(-1, 0)}
          >
            {edges.up ? strings.directions.topEdge : fillTemplate(strings.directions.upTo, { row: cursor.row - 1 })}
          </button>
          <button
            type="button"
            className="ej-btn ej-btn--secondary ej-dpad__left"
            aria-disabled={edges.left}
            onClick={() => ctl.moveBy(0, -1)}
          >
            {edges.left
              ? strings.directions.leftEdge
              : fillTemplate(strings.directions.leftTo, { col: cursor.col - 1 })}
          </button>
          <p className="ej-dpad__center">{fillTemplate(strings.directions.currentCell, { row: cursor.row, col: cursor.col })}</p>
          <button
            type="button"
            className="ej-btn ej-btn--secondary ej-dpad__right"
            aria-disabled={edges.right}
            onClick={() => ctl.moveBy(0, 1)}
          >
            {edges.right
              ? strings.directions.rightEdge
              : fillTemplate(strings.directions.rightTo, { col: cursor.col + 1 })}
          </button>
          <button
            type="button"
            className="ej-btn ej-btn--secondary ej-dpad__down"
            aria-disabled={edges.down}
            onClick={() => ctl.moveBy(1, 0)}
          >
            {edges.down
              ? strings.directions.bottomEdge
              : fillTemplate(strings.directions.downTo, { row: cursor.row + 1 })}
          </button>
        </div>
        <div className="ej-stack">
          <button type="button" className="ej-btn ej-btn--primary" onClick={ctl.sweepRow}>
            {strings.sweep.sweepThisRow}
          </button>
          <button type="button" className="ej-btn ej-btn--secondary" onClick={() => ctl.jumpToExtreme('max')}>
            {fillTemplate(strings.jumps.jumpToMax, { label: track.extremeLabels.max })}
          </button>
          <button type="button" className="ej-btn ej-btn--secondary" onClick={() => ctl.jumpToExtreme('min')}>
            {fillTemplate(strings.jumps.jumpToMin, { label: track.extremeLabels.min })}
          </button>
          <button type="button" className="ej-btn ej-btn--secondary" onClick={() => ctl.jumpTo({ row: 1, col: 1 })}>
            {strings.jumps.jumpToStart}
          </button>
          <button
            type="button"
            className="ej-btn ej-btn--secondary"
            onClick={() => ctl.jumpTo({ row: grid.rows, col: grid.cols })}
          >
            {fillTemplate(strings.jumps.jumpToEnd, { rows: grid.rows, cols: grid.cols })}
          </button>
        </div>
      </section>
    </div>
  );
}
