/**
 * Owns the single audio engine for the app and keeps it in sync with volume and the Sound On/Off preference.
 * The audio context is created on the first explicit sound button press (a user gesture), never earlier.
 */
import { useCallback, useEffect, useState } from 'react';
import { createAudioEngine, type AudioEngine } from '../audio/engine';
import { strings } from '../data/strings';

export interface AudioHandle {
  readonly engine: AudioEngine;
  /** Creates/resumes the audio context. Resolves false (after reporting the reason) when audio is unavailable. */
  readonly ensureUnlocked: () => Promise<boolean>;
}

export function useAudioEngine(
  volume: number,
  soundEnabled: boolean,
  onError: (text: string) => void,
): AudioHandle {
  const [engine] = useState<AudioEngine>(() => createAudioEngine());

  useEffect(() => {
    engine.setVolume(volume);
  }, [engine, volume]);

  useEffect(() => {
    engine.setMuted(!soundEnabled);
    if (!soundEnabled) {
      engine.stopAll();
    }
  }, [engine, soundEnabled]);

  useEffect(
    () => () => {
      void engine.dispose();
    },
    [engine],
  );

  const ensureUnlocked = useCallback(async (): Promise<boolean> => {
    if (engine.isUnlocked()) {
      return true;
    }
    const result = await engine.unlock();
    if (!result.ok) {
      onError(result.reason === 'unsupported' ? strings.errors.audioUnsupported : strings.errors.audioBlocked);
      return false;
    }
    engine.setVolume(volume);
    return true;
  }, [engine, onError, volume]);

  return { engine, ensureUnlocked };
}
