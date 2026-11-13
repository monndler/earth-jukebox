/**
 * G-10 / B-01 / B-02: the sticky bar (Explore only). D10: sticky only while its height is at most 25 % of the
 * viewport height; otherwise it flows at the end of the section. While sticky, the parent reserves its height
 * as bottom padding (and scroll-padding) so focused content is never hidden.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { strings } from '../data/strings';

/** D10: the bar may stay fixed to the screen only while it uses at most this share of the viewport height. */
const MAX_STICKY_SHARE = 0.25;

export function PlaybackBar(props: {
  readonly onSweepMap: () => void;
  readonly onStopAll: () => void;
  /** Reports the height (px) the page must reserve at the bottom; 0 when the bar is not sticky. */
  readonly onReserve: (px: number) => void;
}): ReactNode {
  const ref = useRef<HTMLElement>(null);
  const [sticky, setSticky] = useState(true);
  const { onReserve } = props;

  useEffect(() => {
    const el = ref.current;
    if (el === null) {
      return undefined;
    }
    const measure = (): void => {
      const height = el.getBoundingClientRect().height;
      const isSticky = height <= window.innerHeight * MAX_STICKY_SHARE;
      setSticky(isSticky);
      onReserve(isSticky ? Math.ceil(height) : 0);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      onReserve(0);
    };
  }, [onReserve]);

  return (
    <footer
      ref={ref}
      className={`ej-bar${sticky ? ' ej-bar--sticky' : ''}`}
      aria-label={strings.playback.barLabel}
    >
      <button type="button" className="ej-btn ej-btn--primary" onClick={props.onSweepMap}>
        {strings.playback.sweepWholeMap}
      </button>
      <button type="button" className="ej-btn ej-btn--stop" onClick={props.onStopAll}>
        <span aria-hidden="true">■ </span>
        {strings.playback.stopAll}
      </button>
    </footer>
  );
}
