/** G-05 badge, G-06 title, G-07 source line, G-08 notice. Also the frame choice (PLACEHOLDER-LAYOUT). */
import type { ReactNode } from 'react';
import { fillTemplate, strings } from '../data/strings';
import type { Track } from '../types/track';
import { SegmentedControl } from './controls';

export function TrackInfo(props: {
  readonly track: Track;
  readonly frameIndex: number;
  readonly onFrameChange: (index: number) => void;
}): ReactNode {
  const { track, frameIndex } = props;
  const frame = track.frames[frameIndex];
  return (
    <section className="ej-panel" aria-labelledby="track-title">
      <p className="ej-badge">{strings.badges[track.valueBasis]}</p>
      <h2 id="track-title" className="ej-track-title">
        {track.title}
      </h2>
      {frame !== undefined ? (
        <p className="ej-source">
          {fillTemplate(strings.source.line, { dataset: track.source.name, date: frame.label })}
        </p>
      ) : null}
      <p className="ej-notice">{strings.notices[track.valueBasis]}</p>
      {track.frames.length > 1 ? (
        // PLACEHOLDER-LAYOUT: the supplied design has a single frame; this lets listeners compare dates.
        <SegmentedControl
          legend={strings.frames.label}
          options={track.frames.map((f, i) => ({ value: i, label: f.label }))}
          value={frameIndex}
          onChange={props.onFrameChange}
        />
      ) : null}
    </section>
  );
}
