/** PLACEHOLDER-LAYOUT: the Track Library is not designed yet (UI_FUNCTION_MAP §12). A plain list of tracks. */
import type { ReactNode } from 'react';
import { strings } from '../data/strings';
import type { Track } from '../types/track';

export function TrackLibrary(props: {
  readonly tracks: readonly Track[];
  readonly onSelect: (trackId: string) => void;
}): ReactNode {
  if (props.tracks.length === 0) {
    return (
      <main className="ej-page">
        <h1 className="ej-header__title">{strings.app.title}</h1>
        <p role="status">{strings.empty.text}</p>
      </main>
    );
  }
  return (
    <main className="ej-page">
      <h1 className="ej-header__title">{strings.app.title}</h1>
      <section className="ej-panel" aria-labelledby="library-heading">
        <h2 id="library-heading" className="ej-h3">
          {strings.trackLibrary.heading}
        </h2>
        <p className="ej-helper">{strings.trackLibrary.selectPrompt}</p>
        <ul className="ej-guide">
          {props.tracks.map((t) => (
            <li key={t.id}>
              <button type="button" className="ej-btn ej-btn--primary" onClick={() => props.onSelect(t.id)}>
                {t.title}
              </button>
              <p className="ej-helper">{t.summary}</p>
            </li>
          ))}
        </ul>
        <p className="ej-helper">{strings.trackLibrary.placeholderNote}</p>
      </section>
    </main>
  );
}
