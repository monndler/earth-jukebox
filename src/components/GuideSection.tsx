/** U-01…U-03: Sound guide. Descriptions come from the track's data. */
import type { ReactNode } from 'react';
import { strings } from '../data/strings';
import type { ExplorerController, GuideLevel } from '../hooks/useExplorerController';
import type { Track } from '../types/track';

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function GuideSection(props: { readonly track: Track; readonly ctl: ExplorerController }): ReactNode {
  const { track, ctl } = props;
  const items: readonly { level: GuideLevel; label: string; description: string }[] = [
    { level: 'low', label: capitalise(strings.levels.low), description: track.guideText.low },
    { level: 'middle', label: capitalise(strings.levels.middle), description: track.guideText.middle },
    { level: 'high', label: capitalise(strings.levels.high), description: track.guideText.high },
    { level: 'noData', label: strings.guide.noDataLabel, description: track.guideText.noData },
  ];
  return (
    <section className="ej-panel" aria-labelledby="guide-heading">
      <h3 id="guide-heading" className="ej-h3">
        {strings.sections.guide}
      </h3>
      <p className="ej-helper">{strings.guide.intro}</p>
      <ul className="ej-guide">
        {items.map((item) => (
          <li key={item.level}>
            <button type="button" className="ej-btn ej-btn--primary" onClick={() => ctl.playGuide(item.level)}>
              {item.label}
            </button>
            <p className="ej-helper">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
