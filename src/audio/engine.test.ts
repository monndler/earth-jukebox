import { describe, expect, it } from 'vitest';
import {
  ATTACK_SECONDS,
  LEAD_SECONDS,
  MAX_MASTER_GAIN,
  STOP_RAMP_SECONDS,
  TIMBRE_VOICES,
  createAudioEngine,
  volumeToGain,
} from './engine';
import type {
  AudioContextLike,
  CompressorLike,
  GainLike,
  OscillatorLike,
  ParamLike,
  PannerLike,
} from './engine';
import type { NoteEvent, SoundScore } from '../types/sound';

// ---- TEST-ONLY fake Web Audio context (no sound is produced) ----
class FakeParam implements ParamLike {
  value = 0;
  readonly sets: { value: number; time: number }[] = [];
  readonly ramps: { value: number; time: number }[] = [];
  cancels = 0;
  setValueAtTime(value: number, time: number): void {
    this.sets.push({ value, time });
    this.value = value;
  }
  linearRampToValueAtTime(value: number, time: number): void {
    this.ramps.push({ value, time });
  }
  cancelScheduledValues(): void {
    this.cancels += 1;
  }
}
class FakeNode {
  readonly connections: unknown[] = [];
  disconnected = false;
  connect(destination: unknown): void {
    this.connections.push(destination);
  }
  disconnect(): void {
    this.disconnected = true;
  }
}
class FakeOsc extends FakeNode implements OscillatorLike {
  type = 'sine';
  frequency = new FakeParam();
  startedAt: number | null = null;
  stoppedAt: number | null = null;
  start(when: number): void {
    this.startedAt = when;
  }
  stop(when: number): void {
    this.stoppedAt = when;
  }
}
class FakeGain extends FakeNode implements GainLike {
  gain = new FakeParam();
}
class FakePanner extends FakeNode implements PannerLike {
  pan = new FakeParam();
}
class FakeCompressor extends FakeNode implements CompressorLike {
  threshold = new FakeParam();
  knee = new FakeParam();
  ratio = new FakeParam();
  attack = new FakeParam();
  release = new FakeParam();
}
class FakeContext implements AudioContextLike {
  currentTime = 10;
  state = 'suspended';
  readonly destination = { name: 'destination' };
  resumeCalls = 0;
  closed = false;
  readonly oscillators: FakeOsc[] = [];
  readonly gains: FakeGain[] = [];
  readonly panners: FakePanner[] = [];
  readonly compressors: FakeCompressor[] = [];
  resume(): Promise<void> {
    this.resumeCalls += 1;
    this.state = 'running';
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.closed = true;
    this.state = 'closed';
    return Promise.resolve();
  }
  createGain(): FakeGain {
    const n = new FakeGain();
    this.gains.push(n);
    return n;
  }
  createOscillator(): FakeOsc {
    const n = new FakeOsc();
    this.oscillators.push(n);
    return n;
  }
  createStereoPanner(): FakePanner {
    const n = new FakePanner();
    this.panners.push(n);
    return n;
  }
  createDynamicsCompressor(): FakeCompressor {
    const n = new FakeCompressor();
    this.compressors.push(n);
    return n;
  }
}

function makeHarness() {
  const ctx = new FakeContext();
  const timers: { id: number; fn: () => void; ms: number; cleared: boolean }[] = [];
  const engine = createAudioEngine({
    createContext: () => ctx,
    setTimeout: (fn, ms) => {
      const t = { id: timers.length + 1, fn, ms, cleared: false };
      timers.push(t);
      return t.id;
    },
    clearTimeout: (h) => {
      const t = timers.find((x) => x.id === h);
      if (t !== undefined) t.cleared = true;
    },
  });
  const fire = (index: number): void => {
    const t = timers[index];
    if (t !== undefined && !t.cleared) t.fn();
  };
  return { ctx, engine, timers, fire };
}

const note = (over: Partial<NoteEvent> = {}): NoteEvent => ({
  tSec: 0,
  durSec: 0.5,
  freqHz: 440,
  gain: 0.25,
  pan: 0,
  voice: 'band-0',
  timbre: 'soft',
  kind: 'note',
  ...over,
});
const score = (events: NoteEvent[], totalSeconds = 1): SoundScore => ({
  totalSeconds,
  events,
  meta: { trackId: 'fixture-track', profileId: 'p', kind: 'cell' },
});

describe('volumeToGain', () => {
  it('is 0 at 0, capped at 100, monotonic, and never above the cap', () => {
    expect(volumeToGain(0)).toBe(0);
    expect(volumeToGain(100)).toBe(MAX_MASTER_GAIN);
    expect(volumeToGain(150)).toBe(MAX_MASTER_GAIN);
    expect(volumeToGain(-5)).toBe(0);
    expect(volumeToGain(Number.NaN)).toBe(0);
    let prev = -1;
    for (let v = 0; v <= 100; v += 5) {
      const g = volumeToGain(v);
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
    expect(volumeToGain(80)).toBeCloseTo(0.64 * MAX_MASTER_GAIN, 10);
  });
});

describe('unlock (no autoplay)', () => {
  it('creates no context and plays nothing until unlock() is called', () => {
    const { ctx, engine } = makeHarness();
    expect(engine.isUnlocked()).toBe(false);
    const result = engine.play(score([note()]));
    expect(result).toEqual({ ok: false, reason: 'locked' });
    expect(ctx.oscillators).toHaveLength(0);
  });

  it('creates the signal chain once, resumes a suspended context, and is idempotent', async () => {
    const { ctx, engine } = makeHarness();
    expect(await engine.unlock()).toEqual({ ok: true });
    expect(await engine.unlock()).toEqual({ ok: true });
    expect(ctx.resumeCalls).toBe(1); // second call: already running
    expect(ctx.compressors).toHaveLength(1);
    expect(ctx.gains).toHaveLength(1); // master only
    const comp = ctx.compressors[0];
    expect(comp?.connections).toContain(ctx.destination);
    expect(comp?.threshold.value).toBe(-12);
    expect(engine.isUnlocked()).toBe(true);
  });

  it('reports unsupported browsers and blocked contexts as typed results', async () => {
    const unsupported = createAudioEngine({ createContext: () => null });
    expect(await unsupported.unlock()).toEqual({ ok: false, reason: 'unsupported' });
    const ctx = new FakeContext();
    ctx.resume = () => Promise.reject(new Error('blocked'));
    const blocked = createAudioEngine({ createContext: () => ctx });
    expect(await blocked.unlock()).toEqual({ ok: false, reason: 'blocked' });
  });
});

describe('play', () => {
  it('schedules one oscillator per event on the audio clock with the right frequency, timbre, pan and times', async () => {
    const { ctx, engine } = makeHarness();
    await engine.unlock();
    const result = engine.play(
      score([
        note({ tSec: 0, freqHz: 220, pan: -1, timbre: 'soft' }),
        note({ tSec: 0.5, durSec: 0.4, freqHz: 330, pan: 1, timbre: 'hollow', gain: 0.5 }),
      ], 1),
    );
    expect(result).toEqual({ ok: true, totalSeconds: 1 });
    expect(ctx.oscillators).toHaveLength(2);
    const t0 = ctx.currentTime + LEAD_SECONDS;
    const [a, b] = ctx.oscillators;
    expect(a?.type).toBe(TIMBRE_VOICES.soft.type);
    expect(a?.frequency.sets[0]).toEqual({ value: 220, time: t0 });
    expect(a?.startedAt).toBeCloseTo(t0, 10);
    expect(a?.stoppedAt).toBeCloseTo(t0 + 0.5 + 0.02, 10);
    expect(b?.type).toBe(TIMBRE_VOICES.hollow.type);
    expect(b?.startedAt).toBeCloseTo(t0 + 0.5, 10);
    expect(ctx.panners.map((p) => p.pan.sets[0]?.value)).toEqual([-1, 1]);
    // envelope ramps in and out (no clicks)
    const envA = ctx.gains[2]; // gains[0]=master, [1]=bus, [2]=first envelope
    expect(envA?.gain.sets[0]).toEqual({ value: 0, time: t0 });
    expect(envA?.gain.ramps[0]?.time).toBeCloseTo(t0 + ATTACK_SECONDS, 10);
    expect(envA?.gain.ramps[envA.gain.ramps.length - 1]).toEqual({ value: 0, time: t0 + 0.5 });
    // timbre gain scaling: hollow is attenuated
    const envB = ctx.gains[3];
    expect(envB?.gain.ramps[0]?.value).toBeCloseTo(0.5 * TIMBRE_VOICES.hollow.gainScale, 10);
  });

  it('clamps pan and handles very short notes without overlapping envelope times', async () => {
    const { ctx, engine } = makeHarness();
    await engine.unlock();
    engine.play(score([note({ durSec: 0.02, pan: 5 })]));
    expect(ctx.panners[0]?.pan.sets[0]?.value).toBe(1);
    const env = ctx.gains[2];
    const times = [...(env?.gain.sets ?? []), ...(env?.gain.ramps ?? [])].map((e) => e.time);
    expect(Math.min(...times)).toBeGreaterThanOrEqual(ctx.currentTime + LEAD_SECONDS);
  });

  it('accepts an empty score (silence) and still reports completion', async () => {
    const { engine, timers, fire } = makeHarness();
    await engine.unlock();
    let ended = 0;
    expect(engine.play(score([], 1), { onEnded: () => (ended += 1) })).toEqual({ ok: true, totalSeconds: 1 });
    fire(timers.length - 1);
    expect(ended).toBe(1);
  });

  it('calls onEnded once when the score finishes, after total time plus a margin', async () => {
    const { engine, timers, fire } = makeHarness();
    await engine.unlock();
    let ended = 0;
    engine.play(score([note()], 2), { onEnded: () => (ended += 1) });
    const endTimer = timers[timers.length - 1];
    expect(endTimer?.ms).toBeGreaterThan(2000);
    fire(timers.length - 1);
    fire(timers.length - 1);
    expect(ended).toBe(1);
  });
});

describe('replacing and stopping (D12)', () => {
  it('a new sound silences the previous one (bus ramped to 0 then disconnected) and cancels its end callback', async () => {
    const { ctx, engine, timers, fire } = makeHarness();
    await engine.unlock();
    let firstEnded = 0;
    let secondEnded = 0;
    engine.play(score([note()], 2), { onEnded: () => (firstEnded += 1) });
    const firstBus = ctx.gains[1];
    const firstEndTimerIndex = timers.length - 1;
    engine.play(score([note({ freqHz: 880 })], 2), { onEnded: () => (secondEnded += 1) });
    expect(firstBus?.gain.ramps[0]?.value).toBe(0);
    expect(firstBus?.gain.ramps[0]?.time).toBeCloseTo(ctx.currentTime + STOP_RAMP_SECONDS, 10);
    expect(timers[firstEndTimerIndex]?.cleared).toBe(true);
    // fire the delayed disconnect timer created by the replacement
    const disconnectIndex = timers.findIndex((t, i) => i > firstEndTimerIndex && !t.cleared && t.ms < 1000);
    fire(disconnectIndex);
    expect(firstBus?.disconnected).toBe(true);
    // old end callback never fires; the new one does
    fire(firstEndTimerIndex);
    expect(firstEnded).toBe(0);
    fire(timers.length - 1);
    expect(secondEnded).toBe(1);
  });

  it('stopAll silences everything, is safe when nothing plays, and suppresses onEnded', async () => {
    const { ctx, engine, timers, fire } = makeHarness();
    await engine.unlock();
    expect(() => engine.stopAll()).not.toThrow();
    let ended = 0;
    engine.play(score([note()], 2), { onEnded: () => (ended += 1) });
    const bus = ctx.gains[1];
    const endIndex = timers.length - 1;
    engine.stopAll();
    expect(bus?.gain.ramps[0]?.value).toBe(0);
    fire(endIndex);
    expect(ended).toBe(0);
    engine.stopAll(); // second call is harmless
  });
});

describe('volume and mute', () => {
  it('applies the volume curve to the master gain and restores it after unmute', async () => {
    const { ctx, engine } = makeHarness();
    await engine.unlock();
    const master = ctx.gains[0];
    expect(master?.gain.value).toBeCloseTo(volumeToGain(80), 10);
    engine.setVolume(50);
    expect(master?.gain.ramps[master.gain.ramps.length - 1]?.value).toBeCloseTo(volumeToGain(50), 10);
    engine.setMuted(true);
    expect(master?.gain.ramps[master.gain.ramps.length - 1]?.value).toBe(0);
    engine.setMuted(false);
    expect(master?.gain.ramps[master.gain.ramps.length - 1]?.value).toBeCloseTo(volumeToGain(50), 10);
  });

  it('remembers volume and mute set before unlock', async () => {
    const { ctx, engine } = makeHarness();
    engine.setVolume(30);
    engine.setMuted(true);
    await engine.unlock();
    expect(ctx.gains[0]?.gain.value).toBe(0);
  });
});

describe('dispose', () => {
  it('stops sound, closes the context, and locks the engine again', async () => {
    const { ctx, engine } = makeHarness();
    await engine.unlock();
    engine.play(score([note()]));
    await engine.dispose();
    expect(ctx.closed).toBe(true);
    expect(engine.isUnlocked()).toBe(false);
    expect(engine.play(score([note()]))).toEqual({ ok: false, reason: 'locked' });
  });
});
