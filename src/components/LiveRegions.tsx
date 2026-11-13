/** Polite live region for status/cell text and an alert region for errors (UI_FUNCTION_MAP §9). */
import type { ReactNode } from 'react';

export function LiveRegions(props: {
  readonly announcement: string;
  readonly announcementKey: number;
  readonly alert: string;
}): ReactNode {
  return (
    <>
      <div className="ej-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {/* The key forces the same text to be announced again. */}
        <span key={props.announcementKey}>{props.announcement}</span>
      </div>
      <div role="alert" className={props.alert === '' ? 'ej-sr-only' : 'ej-alert'}>
        {props.alert}
      </div>
    </>
  );
}
