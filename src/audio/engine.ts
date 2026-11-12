/**
 * Audio engine (PROJECT_PLAN §13, AGENTS.md §9). It ONLY plays a `SoundScore`; it makes no mapping decisions.
 *
 * Rules implemented here:
 *  - The audio context is created/resumed only inside `unlock()`, which must be called from a user gesture.
 *    Nothing ever plays automatically.
 *  - Signal path: voice → envelope gain → stereo pan → per-playback bus → master gain → dynamics compressor →
 *    output. The compressor is a SOFT limiter, not a guaranteed brick-wall limiter; the UI must not claim more.
 *  - Starting a new sound stops the previous one (D12); `stopAll()` silences everything within ~30 ms.
 *  - Scores are short (≤ ~25 s, a few dozen notes), so all events are scheduled up front on the audio clock
 *    (no UI timers drive note timing). Envelopes ramp in/out to avoid clicks.
 *  - Browser behaviour (autoplay policy, iOS/Android quirks, mute switches) must be verified on real devices.
 *
 * The engine depends on small structural interfaces so it can be tested with a fake context in Node.
 */
import type { NoteEvent, SoundScore, TimbreId } from '../types/sound';

export interface ParamLike {
  value: number;
  setValueAtTime(value: number, time: number): unknown;
  linearRampToValueAtTime(value: number, time: number): unknown;
  cancelScheduledValues(time: number): unknown;
}
export interface NodeLike {
  connect(destination: unknown): unknown;
  disconnect(): void;
}
export interface OscillatorLike extends NodeLike {
  type: string;
  frequency: ParamLike;
  start(when: number): void;
  stop(when: number): void;
}
export interface GainLike extends NodeLike {
  gain: ParamLike;
}
export interface PannerLike extends NodeLike {
  pan: ParamLike;
}
export interface CompressorLike extends NodeLike {
  threshold: ParamLike;
  knee: ParamLike;
  ratio: ParamLike;
  attack: ParamLike;
  release: ParamLike;
}
export interface AudioContextLike {
  readonly currentTime: number;
  readonly state: string;
  readonly destination: unknown;
  resume(): Promise<void>;
  close(): Promise<void>;
  createGain(): GainLike;
  createOscillator(): OscillatorLike;
  createStereoPanner(): PannerLike;
  createDynamicsCompressor(): CompressorLike;
}

export interface EngineDeps {
  /** Returns a new context, or null when the browser has no Web Audio support. */
  readonly createContext?: () => AudioContextLike | null;
  readonly setTimeout?: (fn: () => void, ms: number) => unknown;
  readonly clearTimeout?: (handle: unknown) => void;
}

export type UnlockResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'unsupported' | 'blocked' };

export type PlayResult =
  | { readonly ok: true; readonly totalSeconds: number }
  | { readonly ok: false; readonly reason: 'locked' };

export interface PlaybackOptions {
  /** Called once when the score has finished (not called when it is stopped or replaced). */
  readonly onEnded?: () => void;
}

export interface AudioEngine {
  unlock(): Promise<UnlockResult>;
  isUnlocked(): boolean;
  play(score: SoundScore, options?: PlaybackOptions): PlayResult;
  stopAll(): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  dispose(): Promise<void>;
}

/** Highest master gain at volume 100 (conservative; design value, verify on real devices). */
export const MAX_MASTER_GAIN = 0.8;
export const LEAD_SECONDS = 0.06;
export const ATTACK_SECONDS = 0.01;
export const RELEASE_SECONDS = 0.05;
export const STOP_RAMP_SECONDS = 0.03;
const BUS_DISCONNECT_DELAY_MS = 120;
const END_MARGIN_SECONDS = 0.15;
const MUTE_RAMP_SECONDS = 0.02;

/** Oscillator shape per timbre. Design choices to be tuned by ear / with testers. */
export const TIMBRE_VOICES: Readonly<Record<TimbreId, { type: string; gainScale: number }>> = {
  soft: { type: 'sine', gainScale: 1 },
  bright: { type: 'triangle', gainScale: 1 },
  hollow: { type: 'square', gainScale: 0.35 },
  neutral: { type: 'sine', gainScale: 1 },
  accent: { type: 'sawtooth', gainScale: 0.3 },
};

/**
 * volumeToGain
 * Formula: gain = (volume / 100)² · MAX_MASTER_GAIN, volume clamped to 0–100 (a squared curve follows loudness
 * perception better than a linear one).
 * EDUCATIONAL/DESIGN CHOICE — not a calibrated loudness model.
 */
export function volumeToGain(volume: number): number {
  const v = Math.min(100, Math.max(0, Number.isFinite(volume) ? volume : 0)) / 100;
  return v * v * MAX_MASTER_GAIN;
}

type GlobalWithAudio = { AudioContext?: new () => unknown; webkitAudioContext?: new () => unknown };

/** Default context factory. The single cast is at the browser boundary (structural interfaces above). */
function defaultCreateContext(): AudioContextLike | null {
  const g = globalThis as GlobalWithAudio;
  const Ctor = g.AudioContext ?? g.webkitAudioContext;
  if (Ctor === undefined) {
    return null;
  }
  return new Ctor() as unknown as AudioContextLike;
}

interface ActivePlayback {
  readonly id: number;
  readonly bus: GainLike;
  readonly endTimer: unknown;
}

export function createAudioEngine(deps: EngineDeps = {}): AudioEngine {
  const createContext = deps.createContext ?? defaultCreateContext;
  const timers = globalThis as unknown as {
    setTimeout: (fn: () => void, ms: number) => unknown;
    clearTimeout: (handle: unknown) => void;
  };
  const setTimer = deps.setTimeout ?? ((fn: () => void, ms: number): unknown => timers.setTimeout(fn, ms));
  const clearTimer = deps.clearTimeout ?? ((handle: unknown): void => timers.clearTimeout(handle));

  let ctx: AudioContextLike | null = null;
  let master: GainLike | null = null;
  let volume = 80;
  let muted = false;
  let playId = 0;
  let active: ActivePlayback | null = null;

  function applyMasterGain(): void {
    if (ctx === null || master === null) {
      return;
    }
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(muted ? 0 : volumeToGain(volume), now + MUTE_RAMP_SECONDS);
  }

  function silenceActive(): void {
    if (ctx === null || active === null) {
      return;
    }
    const { bus, endTimer } = active;
    active = null;
    clearTimer(endTimer);
    const now = ctx.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(0, now + STOP_RAMP_SECONDS);
    // Disconnecting the bus guarantees silence even for notes that had not started yet.
    setTimer(() => bus.disconnect(), BUS_DISCONNECT_DELAY_MS);
  }

  function scheduleNote(context: AudioContextLike, bus: GainLike, event: NoteEvent, t0: number): void {
    const voice = TIMBRE_VOICES[event.timbre];
    const start = t0 + event.tSec;
    const end = start + event.durSec;
    const attack = Math.min(ATTACK_SECONDS, event.durSec * 0.2);
    const release = Math.min(RELEASE_SECONDS, event.durSec * 0.3);
    const peak = Math.min(1, Math.max(0, event.gain * voice.gainScale));

    const osc = context.createOscillator();
    osc.type = voice.type;
    osc.frequency.setValueAtTime(event.freqHz, start);

    const env = context.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(peak, start + attack);
    env.gain.setValueAtTime(peak, end - release);
    env.gain.linearRampToValueAtTime(0, end);

    const panner = context.createStereoPanner();
    panner.pan.setValueAtTime(Math.min(1, Math.max(-1, event.pan)), start);

    osc.connect(env);
    env.connect(panner);
    panner.connect(bus);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  return {
    async unlock(): Promise<UnlockResult> {
      try {
        if (ctx === null) {
          const created = createContext();
          if (created === null) {
            return { ok: false, reason: 'unsupported' };
          }
          ctx = created;
          master = ctx.createGain();
          master.gain.value = muted ? 0 : volumeToGain(volume);
          const compressor = ctx.createDynamicsCompressor();
          compressor.threshold.value = -12;
          compressor.knee.value = 6;
          compressor.ratio.value = 12;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.25;
          master.connect(compressor);
          compressor.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        return { ok: true };
      } catch {
        // Reported to the caller as a typed result; the UI must show a message and offer to try again.
        return { ok: false, reason: 'blocked' };
      }
    },

    isUnlocked(): boolean {
      return ctx !== null && ctx.state !== 'closed';
    },

    play(score: SoundScore, options: PlaybackOptions = {}): PlayResult {
      if (ctx === null || master === null) {
        return { ok: false, reason: 'locked' };
      }
      silenceActive();
      const context = ctx;
      const bus = context.createGain();
      bus.gain.value = 1;
      bus.connect(master);
      const t0 = context.currentTime + LEAD_SECONDS;
      for (const event of score.events) {
        scheduleNote(context, bus, event, t0);
      }
      playId += 1;
      const id = playId;
      const endTimer = setTimer(() => {
        if (active === null || active.id !== id) {
          return;
        }
        const finished = active;
        active = null;
        setTimer(() => finished.bus.disconnect(), BUS_DISCONNECT_DELAY_MS);
        options.onEnded?.();
      }, (LEAD_SECONDS + score.totalSeconds + END_MARGIN_SECONDS) * 1000);
      active = { id, bus, endTimer };
      return { ok: true, totalSeconds: score.totalSeconds };
    },

    stopAll(): void {
      silenceActive();
    },

    setVolume(next: number): void {
      volume = Math.min(100, Math.max(0, Number.isFinite(next) ? next : 0));
      applyMasterGain();
    },

    setMuted(next: boolean): void {
      muted = next;
      applyMasterGain();
    },

    async dispose(): Promise<void> {
      silenceActive();
      if (ctx !== null) {
        const closing = ctx;
        ctx = null;
        master = null;
        await closing.close();
      }
    },
  };
}
