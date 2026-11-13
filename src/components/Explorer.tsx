/** The Explorer screen: header, track info, section navigation, the active section, and the sticky bar. */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { strings } from '../data/strings';
import { useExplorerController } from '../hooks/useExplorerController';
import { useFrameAnalysis } from '../hooks/useFrameAnalysis';
import { useAppDispatch, useAppState } from '../store';
import type { Track } from '../types/track';
import { AboutSection } from './AboutSection';
import { ExploreSection } from './ExploreSection';
import { GuideSection } from './GuideSection';
import { Header } from './Header';
import { PlaybackBar } from './PlaybackBar';
import { SectionNav } from './SectionNav';
import { SettingsSection } from './SettingsSection';
import { TrackInfo } from './TrackInfo';
import type { ExploreGrid } from '../types/frame';

/** Everything that needs the decoded grid. Mounted only once the frame is ready. */
function ExplorerReady(props: { readonly track: Track; readonly grid: ExploreGrid }): ReactNode {
  const { track, grid } = props;
  const state = useAppState();
  const dispatch = useAppDispatch();
  const ctl = useExplorerController({ track, grid, state, dispatch });
  const [reserve, setReserve] = useState(0);
  const onReserve = useCallback((px: number) => setReserve(px), []);

  // Keep focused content clear of the sticky bar (D10).
  useEffect(() => {
    const root = document.documentElement;
    root.style.scrollPaddingBottom = reserve > 0 ? `${reserve}px` : '';
    return () => {
      root.style.scrollPaddingBottom = '';
    };
  }, [reserve]);

  const onExplore = state.activeSection === 'explore';

  return (
    <div className="ej-page" style={{ paddingBottom: reserve > 0 ? `${reserve}px` : undefined }}>
      <Header
        soundEnabled={state.soundEnabled}
        onBack={() => {
          ctl.stopAll();
          dispatch({ type: 'SET_VIEW', view: 'library' });
        }}
        onToggleSound={ctl.toggleSound}
      />
      <main>
        <TrackInfo
          track={track}
          frameIndex={state.frameIndex}
          onFrameChange={ctl.setFrame}
        />
        <SectionNav active={state.activeSection} onSelect={ctl.setSection} />
        {onExplore ? <ExploreSection track={track} grid={grid} state={state} ctl={ctl} /> : null}
        {state.activeSection === 'guide' ? <GuideSection track={track} ctl={ctl} /> : null}
        {state.activeSection === 'settings' ? <SettingsSection state={state} ctl={ctl} /> : null}
        {state.activeSection === 'about' ? <AboutSection track={track} /> : null}
      </main>
      {onExplore ? <PlaybackBar onSweepMap={ctl.sweepMap} onStopAll={ctl.stopAll} onReserve={onReserve} /> : null}
    </div>
  );
}

export function Explorer(props: { readonly track: Track }): ReactNode {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const analysis = useFrameAnalysis(props.track, state.frameIndex);

  if (analysis.status === 'loading') {
    // PLACEHOLDER-LAYOUT: loading state is not designed yet.
    return (
      <main className="ej-page">
        <p role="status">{strings.loading.text}</p>
      </main>
    );
  }
  if (analysis.status === 'error') {
    // PLACEHOLDER-LAYOUT: error state is not designed yet.
    return (
      <main className="ej-page">
        <p role="alert" className="ej-alert">
          {strings.errors.frameLoadFailed}
        </p>
        <button type="button" className="ej-btn ej-btn--secondary" onClick={() => dispatch({ type: 'SET_VIEW', view: 'library' })}>
          {strings.header.backLabel}
        </button>
      </main>
    );
  }
  return <ExplorerReady track={props.track} grid={analysis.grid} />;
}
