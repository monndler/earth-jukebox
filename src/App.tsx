/**
 * App shell: provides the state, shows the Track Library or the Explorer, and hosts the live regions.
 * The catalogue is the REAL tracks only (data/tracks.ts); the synthetic demo track is not shown in the UI.
 */
import { useEffect, type ReactNode } from 'react';
import './explorer.css';
import { Explorer } from './components/Explorer';
import { LiveRegions } from './components/LiveRegions';
import { TrackLibrary } from './components/TrackLibrary';
import { tracks } from './data/tracks';
import { saveSettings, useAppDispatch, useAppState } from './store';
import { AppProvider } from './store/AppProvider';

function Shell(): ReactNode {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { volume, speed, announcements, invert, moveTones } = state;

  useEffect(() => {
    saveSettings({ volume, speed, announcements, invert, moveTones });
  }, [volume, speed, announcements, invert, moveTones]);

  const track = tracks.find((t) => t.id === state.trackId);

  return (
    <>
      <LiveRegions
        announcement={state.announcement}
        announcementKey={state.announcementKey}
        alert={state.alertAnnouncement}
      />
      {state.view === 'explorer' && track !== undefined ? (
        // Re-mount per track so audio and frame state never leak between tracks.
        <Explorer key={track.id} track={track} />
      ) : (
        <TrackLibrary tracks={tracks} onSelect={(trackId) => dispatch({ type: 'SELECT_TRACK', trackId })} />
      )}
    </>
  );
}

export default function App(): ReactNode {
  return (
    <AppProvider defaultTrackId={tracks[0]?.id ?? ''}>
      <Shell />
    </AppProvider>
  );
}
