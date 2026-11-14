/** Decorative underwater atmosphere behind every screen. Hidden from assistive technology. */
import type { CSSProperties, ReactNode } from 'react';

/** Number of rising bubbles. Their positions, sizes and timings come from a fixed formula (no randomness). */
const BUBBLES = 12;

function bubbleStyle(i: number): CSSProperties {
  return {
    '--x': `${(i * 37 + 11) % 97}%`,
    '--size': `${5 + ((i * 5) % 7)}px`,
    '--dur': `${16 + ((i * 7) % 11)}s`,
    '--delay': `${-((i * 3) % 14)}s`,
  } as CSSProperties;
}

export function OceanBackdrop(): ReactNode {
  return (
    <div className="ocean-backdrop" aria-hidden="true">
      <div className="ocean-backdrop__caustics" />
      <div className="ocean-backdrop__beam ocean-backdrop__beam--a" />
      <div className="ocean-backdrop__beam ocean-backdrop__beam--b" />
      <div className="ocean-backdrop__beam ocean-backdrop__beam--c" />
      {Array.from({ length: BUBBLES }, (_, i) => (
        <span key={i} className="ocean-backdrop__bubble" style={bubbleStyle(i)} />
      ))}
    </div>
  );
}
