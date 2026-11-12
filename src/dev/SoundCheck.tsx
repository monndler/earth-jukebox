// PLACEHOLDER-LAYOUT: no design supplied — DEV-ONLY sound check for hearing the mapping with SYNTHETIC data.
// It is not part of the product UI. Delete src/dev before submission (docs/ASSUMPTIONS.md #17).
import { useMemo, useState } from 'react';
import { createAudioEngine } from '../audio/engine';
import { applySpeed, buildCellScore, buildMapSweepScore, buildOverviewScore, buildRowSweepScore, readCell, referenceTones } from '../core/mapping';
import { describeCell, summarizeFrame } from '../core/narration';
import { getProfile } from '../data/profiles';
import type { SoundScore } from '../types/sound';
import { SYNTHETIC_COLS, SYNTHETIC_ROWS, makeSyntheticGrid, makeSyntheticTrack } from './syntheticGrid';

type Speed = 0.5 | 1 | 1.5;

export default function SoundCheck() {
  const [engine] = useState(() => createAudioEngine());
  const [row, setRow] = useState(5);
  const [col, setCol] = useState(8);
  const [invert, setInvert] = useState(false);
  const [diverging, setDiverging] = useState(false);
  const [moveTones, setMoveTones] = useState(true);
  const [speed, setSpeed] = useState<Speed>(1);
  const [volume, setVolume] = useState(80);
  const [status, setStatus] = useState('Sound is not enabled yet. Press "Enable sound".');

  const grid = useMemo(() => makeSyntheticGrid(diverging), [diverging]);
  const track = useMemo(() => makeSyntheticTrack(diverging), [diverging]);
  const profile = useMemo(() => ({ ...getProfile(track.profileId), invert }), [track, invert]);
  const reading = useMemo(() => readCell(grid, { row, col }, track, profile), [grid, row, col, track, profile]);

  async function enableSound(): Promise<boolean> {
    if (engine.isUnlocked()) {
      return true;
    }
    const result = await engine.unlock();
    if (!result.ok) {
      setStatus(
        result.reason === 'unsupported'
          ? 'This browser does not support Web Audio.'
          : 'The browser blocked audio. Press the button again.',
      );
      return false;
    }
    engine.setVolume(volume);
    setStatus('Sound enabled.');
    return true;
  }

  async function hear(label: string, score: SoundScore): Promise<void> {
    if (!(await enableSound())) {
      return;
    }
    const result = engine.play(score, { onEnded: () => setStatus(`${label}: finished.`) });
    setStatus(result.ok ? `${label}: playing (${score.totalSeconds.toFixed(1)} s)…` : 'Sound is locked.');
  }

  function moveTo(nextRow: number, nextCol: number): void {
    setRow(nextRow);
    setCol(nextCol);
    if (moveTones) {
      const r = readCell(grid, { row: nextRow, col: nextCol }, track, profile);
      void hear('Cell tone', buildCellScore(r, track, profile));
    }
  }

  const tones = referenceTones(track, profile);

  return (
    <main>
      <h1>Sound check (dev only)</h1>
      <p>
        <strong>Synthetic test data — not NASA data.</strong> Use headphones and a low volume first.
      </p>
      <p role="status" aria-live="polite">{status}</p>

      <button type="button" onClick={() => void enableSound()}>Enable sound</button>
      <button type="button" onClick={() => { engine.stopAll(); setStatus('All sound stopped.'); }}>Stop all sound</button>

      <h2>Frame summary</h2>
      <p>{summarizeFrame(grid, track)}</p>

      <h2>Selected cell</h2>
      <label>Row {row} of {SYNTHETIC_ROWS}
        <input type="range" min={1} max={SYNTHETIC_ROWS} value={row} onChange={(e) => moveTo(Number(e.target.value), col)} />
      </label>
      <label>Column {col} of {SYNTHETIC_COLS}
        <input type="range" min={1} max={SYNTHETIC_COLS} value={col} onChange={(e) => moveTo(row, Number(e.target.value))} />
      </label>
      <p role="status" aria-live="polite">{describeCell(reading, 'detailed', track)}</p>
      <button type="button" onClick={() => void hear('Cell tone', buildCellScore(reading, track, profile))}>Hear this cell</button>

      <h2>Sounds</h2>
      <button type="button" onClick={() => void hear('Overview', applySpeed(buildOverviewScore(grid, track, profile), speed))}>Hear overview</button>
      <button type="button" onClick={() => void hear('Row sweep', applySpeed(buildRowSweepScore(grid, row, track, profile), speed))}>Sweep this row</button>
      <button type="button" onClick={() => void hear('Map sweep', applySpeed(buildMapSweepScore(grid, track, profile), speed))}>Sweep whole map</button>

      <h2>Sound guide</h2>
      <button type="button" onClick={() => void hear('Low', tones.low)}>Low</button>
      <button type="button" onClick={() => void hear('Middle', tones.middle)}>Middle</button>
      <button type="button" onClick={() => void hear('High', tones.high)}>High</button>
      <button type="button" onClick={() => void hear('No data', tones.noData)}>No data</button>

      <h2>Settings</h2>
      <label><input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} /> Invert pitch</label>
      <label><input type="checkbox" checked={moveTones} onChange={(e) => setMoveTones(e.target.checked)} /> Play a tone when I move</label>
      <label><input type="checkbox" checked={diverging} onChange={(e) => setDiverging(e.target.checked)} /> Anomaly-style data (adds a quiet zero-reference tone in the map sweep)</label>
      <label>Speed
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value) as Speed)}>
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={1.5}>1.5×</option>
        </select>
      </label>
      <label>Volume {volume}%
        <input type="range" min={0} max={100} value={volume} onChange={(e) => { const v = Number(e.target.value); setVolume(v); engine.setVolume(v); }} />
      </label>
    </main>
  );
}
