/** G-09 section navigation (D4): plain buttons with aria-current, not an ARIA tab pattern. */
import type { ReactNode } from 'react';
import { strings } from '../data/strings';
import type { SectionId } from '../store';

const ORDER: readonly SectionId[] = ['explore', 'guide', 'settings', 'about'];

export function SectionNav(props: {
  readonly active: SectionId;
  readonly onSelect: (section: SectionId) => void;
}): ReactNode {
  return (
    <nav className="ej-nav" aria-label={strings.sections.navLabel}>
      {ORDER.map((id) => (
        <button
          key={id}
          type="button"
          className="ej-nav__btn"
          aria-current={props.active === id ? 'true' : undefined}
          onClick={() => props.onSelect(id)}
        >
          {strings.sections[id]}
        </button>
      ))}
    </nav>
  );
}
