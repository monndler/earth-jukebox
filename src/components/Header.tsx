/** G-01 back button, G-02 title, G-03 sound toggle, G-04 intro line. */
import type { ReactNode } from 'react';
import { strings } from '../data/strings';

export function Header(props: {
  readonly soundEnabled: boolean;
  readonly onBack: () => void;
  readonly onToggleSound: () => void;
}): ReactNode {
  return (
    <header className="ej-header">
      <div className="ej-header__row">
        <button type="button" className="ej-btn ej-btn--icon" aria-label={strings.header.backLabel} onClick={props.onBack}>
          <span aria-hidden="true">←</span>
        </button>
        <h1 className="ej-header__title">{strings.app.title}</h1>
        <button
          type="button"
          className="ej-btn ej-btn--secondary"
          aria-pressed={props.soundEnabled}
          onClick={props.onToggleSound}
        >
          {props.soundEnabled ? strings.header.soundOn : strings.header.soundOff}
        </button>
      </div>
      <p className="ej-intro">{strings.intro.line}</p>
    </header>
  );
}
