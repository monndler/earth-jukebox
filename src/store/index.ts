/**
 * Minimal app state (UI_FUNCTION_MAP §1, AGENTS.md §5).
 * Context + useReducer — no external dependency.
 * Settings persisted under jukebox:v1:settings (versioned, validated, try/catch).
 */
import { createContext, useContext, type Dispatch } from 'react';
import type { AnnouncementMode, Cursor, Settings } from '../types/frame';

/* ─── Types ─── */

export type PlaybackStatus =
  | 'idle'
  | 'overview'
  | 'row-sweep'
  | 'map-sweep'
  | 'cell'
  | 'guide';

export type SectionId = 'explore' | 'guide' | 'settings' | 'about';
export type AppView = 'library' | 'explorer';

export interface AppState {
  readonly view: AppView;
  readonly trackId: string;
  readonly frameIndex: number;
  readonly cursor: Cursor;
  readonly soundEnabled: boolean;
  readonly playback: PlaybackStatus;
  readonly volume: number;
  readonly speed: 0.5 | 1 | 1.5;
  readonly announcements: AnnouncementMode;
  readonly invert: boolean;
  readonly moveTones: boolean;
  readonly activeSection: SectionId;
  /** Text for the polite live region. */
  readonly announcement: string;
  /** Counter to force re-announcement of the same text. */
  readonly announcementKey: number;
  /** Text for role="alert" errors. */
  readonly alertAnnouncement: string;
}

export type Action =
  | { readonly type: 'SET_VIEW'; readonly view: AppView }
  | { readonly type: 'SELECT_TRACK'; readonly trackId: string }
  | { readonly type: 'SET_CURSOR'; readonly cursor: Cursor }
  | { readonly type: 'SET_FRAME'; readonly frameIndex: number }
  | { readonly type: 'SET_PLAYBACK'; readonly playback: PlaybackStatus }
  | { readonly type: 'SET_SOUND_ENABLED'; readonly enabled: boolean }
  | { readonly type: 'SET_VOLUME'; readonly volume: number }
  | { readonly type: 'SET_SPEED'; readonly speed: 0.5 | 1 | 1.5 }
  | { readonly type: 'SET_ANNOUNCEMENTS'; readonly mode: AnnouncementMode }
  | { readonly type: 'SET_INVERT'; readonly invert: boolean }
  | { readonly type: 'SET_MOVE_TONES'; readonly on: boolean }
  | { readonly type: 'SET_SECTION'; readonly section: SectionId }
  | { readonly type: 'ANNOUNCE'; readonly text: string }
  | { readonly type: 'ANNOUNCE_ERROR'; readonly text: string };

/* ─── Persistence (jukebox:v1:settings) ─── */

const SETTINGS_KEY = 'jukebox:v1:settings';

interface PersistedSettings {
  volume?: number;
  speed?: 0.5 | 1 | 1.5;
  announcements?: AnnouncementMode;
  invert?: boolean;
  moveTones?: boolean;
}

function isValidSpeed(s: unknown): s is 0.5 | 1 | 1.5 {
  return s === 0.5 || s === 1 || s === 1.5;
}

function isValidAnnouncementMode(m: unknown): m is AnnouncementMode {
  return m === 'short' || m === 'detailed' || m === 'sound-only';
}

function loadPersistedSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const obj = parsed as Record<string, unknown>;
    const result: PersistedSettings = {};
    if (typeof obj['volume'] === 'number' && obj['volume'] >= 0 && obj['volume'] <= 100) {
      result.volume = obj['volume'];
    }
    if (isValidSpeed(obj['speed'])) result.speed = obj['speed'];
    if (isValidAnnouncementMode(obj['announcements'])) result.announcements = obj['announcements'];
    if (typeof obj['invert'] === 'boolean') result.invert = obj['invert'];
    if (typeof obj['moveTones'] === 'boolean') result.moveTones = obj['moveTones'];
    return result;
  } catch {
    return {};
  }
}

export function saveSettings(settings: Settings): void {
  try {
    const data: PersistedSettings = {
      volume: settings.volume,
      speed: settings.speed,
      announcements: settings.announcements,
      invert: settings.invert,
      moveTones: settings.moveTones,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable — ignore */
  }
}

/* ─── Initial state ─── */

export function createInitialState(defaultTrackId: string): AppState {
  const p = loadPersistedSettings();
  return {
    view: defaultTrackId ? 'explorer' : 'library',
    trackId: defaultTrackId,
    frameIndex: 0,
    cursor: { row: 1, col: 1 },
    soundEnabled: true,
    playback: 'idle',
    volume: p.volume ?? 80,
    speed: p.speed ?? 1,
    announcements: p.announcements ?? 'short',
    invert: p.invert ?? false,
    moveTones: p.moveTones ?? true,
    activeSection: 'explore',
    announcement: '',
    announcementKey: 0,
    alertAnnouncement: '',
  };
}

/* ─── Reducer ─── */

function assertNever(x: never): never {
  throw new Error(`Unexpected action: ${JSON.stringify(x)}`);
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SELECT_TRACK':
      return {
        ...state,
        trackId: action.trackId,
        frameIndex: 0,
        cursor: { row: 1, col: 1 },
        playback: 'idle',
        view: 'explorer',
      };
    case 'SET_CURSOR':
      return { ...state, cursor: action.cursor };
    case 'SET_FRAME':
      return { ...state, frameIndex: Math.max(0, Math.floor(action.frameIndex)), playback: 'idle' };
    case 'SET_PLAYBACK':
      return { ...state, playback: action.playback };
    case 'SET_SOUND_ENABLED':
      return { ...state, soundEnabled: action.enabled };
    case 'SET_VOLUME':
      return { ...state, volume: Math.min(100, Math.max(0, action.volume)) };
    case 'SET_SPEED':
      if (!isValidSpeed(action.speed)) return state;
      return { ...state, speed: action.speed };
    case 'SET_ANNOUNCEMENTS':
      if (!isValidAnnouncementMode(action.mode)) return state;
      return { ...state, announcements: action.mode };
    case 'SET_INVERT':
      return { ...state, invert: action.invert };
    case 'SET_MOVE_TONES':
      return { ...state, moveTones: action.on };
    case 'SET_SECTION':
      return { ...state, activeSection: action.section };
    case 'ANNOUNCE':
      return { ...state, announcement: action.text, announcementKey: state.announcementKey + 1 };
    case 'ANNOUNCE_ERROR':
      return { ...state, alertAnnouncement: action.text };
    default:
      return assertNever(action);
  }
}

/* ─── Context ─── */

export const StateContext = createContext<AppState | null>(null);
export const DispatchContext = createContext<Dispatch<Action> | null>(null);

export function useAppState(): AppState {
  const ctx = useContext(StateContext);
  if (ctx === null) throw new Error('useAppState must be used inside AppProvider');
  return ctx;
}

export function useAppDispatch(): Dispatch<Action> {
  const ctx = useContext(DispatchContext);
  if (ctx === null) throw new Error('useAppDispatch must be used inside AppProvider');
  return ctx;
}
