/**
 * Explorer behaviour (UI_FUNCTION_MAP §3–§9): moves the cursor, plays sounds, and produces announcements.
 * Every sound and every piece of text comes from the pure `core/` functions and `strings`; this file only wires
 * them to React state and the audio engine.
 */
import { useCallback, useEffect, useMemo, useRef, type Dispatch } from 'react';
import {
  applySpeed,
  buildCellScore,
  buildMapSweepScore,
  buildOverviewScore,
  buildRowSweepScore,
  findExtremeCell,
  readCell,
  referenceTones,
} from '../core/mapping';
import { describeCell, summarizeFrame } from '../core/narration';
import { getProfile } from '../data/profiles';
import { fillTemplate, strings } from '../data/strings';
import type { Action, AppState, PlaybackStatus, SectionId } from '../store';
import type { AnnouncementMode, CellReading, Cursor, ExploreGrid } from '../types/frame';
import type { MappingProfile, SoundScore } from '../types/sound';
import type { Track } from '../types/track';
import { useAudioEngine } from './useAudioEngine';

/** Wait before announcing a cell after slider/button moves, so fast moves are not read out one by one. */
const ANNOUNCE_DEBOUNCE_MS = 350;

export type GuideLevel = 'low' | 'middle' | 'high' | 'noData';

export interface ExplorerController {
  readonly profile: MappingProfile;
  readonly reading: CellReading;
  readonly summary: string;
  /** Text shown in the visible readout card (always shown, independent of the announcement mode). */
  readonly readoutText: string;
  readonly overviewSeconds: number;
  readonly edges: { readonly up: boolean; readonly down: boolean; readonly left: boolean; readonly right: boolean };
  readonly moveBy: (dRow: number, dCol: number) => void;
  /** Pointer drag over the grid: moves the cursor (with a tone when allowed) without announcing. */
  readonly dragTo: (cursor: Cursor) => void;
  /** Pointer released on the grid: announces the final cell once. */
  readonly commitPointer: () => void;
  readonly setRow: (row: number) => void;
  readonly setCol: (col: number) => void;
  readonly jumpToExtreme: (which: 'max' | 'min') => void;
  readonly jumpTo: (cursor: Cursor) => void;
  readonly hearCell: () => void;
  readonly hearOverview: () => void;
  readonly sweepRow: () => void;
  readonly sweepMap: () => void;
  readonly stopAll: () => void;
  readonly playGuide: (level: GuideLevel) => void;
  readonly toggleSound: () => void;
  readonly setVolume: (volume: number) => void;
  readonly setSpeed: (speed: 0.5 | 1 | 1.5) => void;
  readonly setAnnouncements: (mode: AnnouncementMode) => void;
  readonly setInvert: (invert: boolean) => void;
  readonly setMoveTones: (on: boolean) => void;
  readonly setSection: (section: SectionId) => void;
  readonly setFrame: (index: number) => void;
}

function capitalise(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function useExplorerController(args: {
  readonly track: Track;
  readonly grid: ExploreGrid;
  readonly state: AppState;
  readonly dispatch: Dispatch<Action>;
}): ExplorerController {
  const { track, grid, state, dispatch } = args;

  const announce = useCallback((text: string) => dispatch({ type: 'ANNOUNCE', text }), [dispatch]);
  const announceError = useCallback((text: string) => dispatch({ type: 'ANNOUNCE_ERROR', text }), [dispatch]);

  const audio = useAudioEngine(state.volume, state.soundEnabled, announceError);
  const { engine, ensureUnlocked } = audio;

  const profile = useMemo<MappingProfile>(
    () => ({ ...getProfile(track.profileId), invert: state.invert }),
    [track.profileId, state.invert],
  );
  const reading = useMemo(() => readCell(grid, state.cursor, track, profile), [grid, state.cursor, track, profile]);
  const summary = useMemo(() => summarizeFrame(grid, track), [grid, track]);

  const cellMode: AnnouncementMode = state.announcements === 'sound-only' ? 'short' : state.announcements;
  const readoutText = describeCell(reading, cellMode, track);

  /* ── announcements ── */

  const pendingAnnounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingAnnounce = useCallback(() => {
    if (pendingAnnounce.current !== null) {
      clearTimeout(pendingAnnounce.current);
      pendingAnnounce.current = null;
    }
  }, []);

  useEffect(() => cancelPendingAnnounce, [cancelPendingAnnounce]);

  const announceCellNow = useCallback(
    (r: CellReading) => {
      cancelPendingAnnounce();
      if (state.announcements !== 'sound-only') {
        announce(describeCell(r, state.announcements, track));
      }
    },
    [announce, cancelPendingAnnounce, state.announcements, track],
  );

  const announceCellSoon = useCallback(
    (r: CellReading) => {
      cancelPendingAnnounce();
      if (state.announcements === 'sound-only') {
        return;
      }
      const text = describeCell(r, state.announcements, track);
      pendingAnnounce.current = setTimeout(() => {
        pendingAnnounce.current = null;
        announce(text);
      }, ANNOUNCE_DEBOUNCE_MS);
    },
    [announce, cancelPendingAnnounce, state.announcements, track],
  );

  /* ── sound ── */

  /** Automatic tone when the cursor moves (D6): only with move tones on, sound on, audio already unlocked. */
  const autoTone = useCallback(
    (r: CellReading) => {
      if (!state.moveTones || !state.soundEnabled || !engine.isUnlocked()) {
        return;
      }
      if (state.playback !== 'idle' && state.playback !== 'cell') {
        return;
      }
      engine.play(buildCellScore(r, track, profile));
    },
    [engine, profile, state.moveTones, state.playback, state.soundEnabled, track],
  );

  /** Explicit sound buttons always play, and turn Sound on if it was off (D6). */
  const playExplicit = useCallback(
    async (
      score: SoundScore,
      playback: PlaybackStatus,
      startText: string | null,
      endText: string | null,
    ): Promise<void> => {
      const wasOff = !state.soundEnabled;
      if (wasOff) {
        dispatch({ type: 'SET_SOUND_ENABLED', enabled: true });
      }
      const unlocked = await ensureUnlocked();
      if (!unlocked) {
        return;
      }
      engine.setMuted(false);
      const result = engine.play(score, {
        onEnded: () => {
          dispatch({ type: 'SET_PLAYBACK', playback: 'idle' });
          if (endText !== null) {
            announce(endText);
          }
        },
      });
      if (!result.ok) {
        return;
      }
      dispatch({ type: 'SET_PLAYBACK', playback });
      const lines = [wasOff ? strings.header.soundTurnedOn : null, startText].filter(
        (t): t is string => t !== null,
      );
      if (lines.length > 0) {
        announce(lines.join('. '));
      }
    },
    [announce, dispatch, engine, ensureUnlocked, state.soundEnabled],
  );

  const stopAll = useCallback(() => {
    cancelPendingAnnounce();
    engine.stopAll();
    dispatch({ type: 'SET_PLAYBACK', playback: 'idle' });
    announce(strings.playback.allStopped);
  }, [announce, cancelPendingAnnounce, dispatch, engine]);

  const hearCell = useCallback(() => {
    if (reading.isNoData) {
      announce(strings.cellCard.noDataSilence);
      return;
    }
    void playExplicit(buildCellScore(reading, track, profile), 'cell', null, null);
  }, [announce, playExplicit, profile, reading, track]);

  const hearOverview = useCallback(() => {
    if (state.playback === 'overview') {
      stopAll();
      return;
    }
    const score = applySpeed(buildOverviewScore(grid, track, profile), state.speed);
    void playExplicit(score, 'overview', strings.overview.playingOverview, strings.overview.overviewFinished);
  }, [grid, playExplicit, profile, state.playback, state.speed, stopAll, track]);

  const sweepRow = useCallback(() => {
    const score = applySpeed(buildRowSweepScore(grid, state.cursor.row, track, profile), state.speed);
    void playExplicit(
      score,
      'row-sweep',
      fillTemplate(strings.sweep.sweepingRow, { row: state.cursor.row }),
      strings.sweep.rowSweepFinished,
    );
  }, [grid, playExplicit, profile, state.cursor.row, state.speed, track]);

  const sweepMap = useCallback(() => {
    const score = applySpeed(buildMapSweepScore(grid, track, profile), state.speed);
    void playExplicit(score, 'map-sweep', strings.playback.sweepingWholeMap, strings.playback.sweepFinished);
  }, [grid, playExplicit, profile, state.speed, track]);

  const playGuide = useCallback(
    (level: GuideLevel) => {
      const tones = referenceTones(track, profile);
      const score = tones[level];
      const description = level === 'noData' ? '' : track.guideText[level];
      const text =
        level === 'noData'
          ? strings.guide.noDataPlaying
          : fillTemplate(strings.guide.playingRef, {
              level: capitalise(strings.levels[level]),
              description,
            });
      void playExplicit(score, 'guide', text, null);
    },
    [playExplicit, profile, track],
  );

  /* ── cursor ── */

  const applyCursor = useCallback(
    (next: Cursor, mode: 'soon' | 'now' | 'none', tone: boolean): CellReading => {
      const cursor = {
        row: clamp(Math.round(next.row), 1, grid.rows),
        col: clamp(Math.round(next.col), 1, grid.cols),
      };
      dispatch({ type: 'SET_CURSOR', cursor });
      const r = readCell(grid, cursor, track, profile);
      if (tone) {
        autoTone(r);
      }
      if (mode === 'soon') {
        announceCellSoon(r);
      } else if (mode === 'now') {
        announceCellNow(r);
      }
      return r;
    },
    [announceCellNow, announceCellSoon, autoTone, dispatch, grid, profile, track],
  );

  const edges = useMemo(
    () => ({
      up: state.cursor.row <= 1,
      down: state.cursor.row >= grid.rows,
      left: state.cursor.col <= 1,
      right: state.cursor.col >= grid.cols,
    }),
    [grid.cols, grid.rows, state.cursor.col, state.cursor.row],
  );

  const moveBy = useCallback(
    (dRow: number, dCol: number) => {
      const blocked =
        (dRow < 0 && edges.up) || (dRow > 0 && edges.down) || (dCol < 0 && edges.left) || (dCol > 0 && edges.right);
      if (blocked) {
        const text =
          dRow < 0
            ? strings.directions.topEdge
            : dRow > 0
              ? strings.directions.bottomEdge
              : dCol < 0
                ? strings.directions.leftEdge
                : strings.directions.rightEdge;
        announce(text);
        return;
      }
      applyCursor({ row: state.cursor.row + dRow, col: state.cursor.col + dCol }, 'soon', true);
    },
    [announce, applyCursor, edges, state.cursor.col, state.cursor.row],
  );

  const dragTo = useCallback(
    (cursor: Cursor) => {
      if (cursor.row === state.cursor.row && cursor.col === state.cursor.col) {
        return;
      }
      applyCursor(cursor, 'none', true);
    },
    [applyCursor, state.cursor.col, state.cursor.row],
  );

  const commitPointer = useCallback(() => {
    announceCellNow(reading);
  }, [announceCellNow, reading]);

  const setRow = useCallback(
    (row: number) => {
      applyCursor({ row, col: state.cursor.col }, 'soon', true);
    },
    [applyCursor, state.cursor.col],
  );

  const setCol = useCallback(
    (col: number) => {
      applyCursor({ row: state.cursor.row, col }, 'soon', true);
    },
    [applyCursor, state.cursor.row],
  );

  const jumpTo = useCallback(
    (cursor: Cursor) => {
      applyCursor(cursor, 'now', true);
    },
    [applyCursor],
  );

  const jumpToExtreme = useCallback(
    (which: 'max' | 'min') => {
      const extreme = findExtremeCell(grid, which);
      if (extreme === null) {
        announce(capitalise(strings.levels['no-data']));
        return;
      }
      const r = applyCursor({ row: extreme.row, col: extreme.col }, 'none', true);
      cancelPendingAnnounce();
      announce(
        fillTemplate(strings.jumps.jumpedTo, {
          label: capitalise(track.extremeLabels[which]),
          row: r.row,
          col: r.col,
          level: strings.levels[r.level],
        }),
      );
    },
    [announce, applyCursor, cancelPendingAnnounce, grid, track.extremeLabels],
  );

  /* ── settings and navigation ── */

  const toggleSound = useCallback(() => {
    const enabled = !state.soundEnabled;
    dispatch({ type: 'SET_SOUND_ENABLED', enabled });
    if (!enabled) {
      dispatch({ type: 'SET_PLAYBACK', playback: 'idle' });
    }
    announce(enabled ? strings.header.announceOn : strings.header.announceOff);
  }, [announce, dispatch, state.soundEnabled]);

  const setVolume = useCallback((volume: number) => dispatch({ type: 'SET_VOLUME', volume }), [dispatch]);

  const setSpeed = useCallback(
    (speed: 0.5 | 1 | 1.5) => {
      dispatch({ type: 'SET_SPEED', speed });
      announce(fillTemplate(strings.settings.speedApplies, { speed }));
    },
    [announce, dispatch],
  );

  const setAnnouncements = useCallback(
    (mode: AnnouncementMode) => {
      dispatch({ type: 'SET_ANNOUNCEMENTS', mode });
      announce(
        mode === 'short'
          ? strings.settings.short
          : mode === 'detailed'
            ? strings.settings.detailed
            : strings.settings.soundOnly,
      );
    },
    [announce, dispatch],
  );

  const setInvert = useCallback(
    (invert: boolean) => {
      dispatch({ type: 'SET_INVERT', invert });
      announce(invert ? strings.settings.invertOn : strings.settings.invertOff);
    },
    [announce, dispatch],
  );

  const setMoveTones = useCallback(
    (on: boolean) => {
      dispatch({ type: 'SET_MOVE_TONES', on });
      announce(on ? strings.settings.moveTonesOn : strings.settings.moveTonesOff);
    },
    [announce, dispatch],
  );

  const setSection = useCallback(
    (section: SectionId) => {
      dispatch({ type: 'SET_SECTION', section });
      announce(fillTemplate(strings.sections.showing, { section: strings.sections[section] }));
    },
    [announce, dispatch],
  );

  const setFrame = useCallback(
    (index: number) => {
      const frame = track.frames[index];
      if (frame === undefined) {
        return;
      }
      engine.stopAll();
      dispatch({ type: 'SET_FRAME', frameIndex: index });
      announce(fillTemplate(strings.frames.showing, { label: frame.label }));
    },
    [announce, dispatch, engine, track.frames],
  );

  return {
    profile,
    reading,
    summary,
    readoutText,
    overviewSeconds: profile.overviewSeconds / state.speed,
    edges,
    moveBy,
    dragTo,
    commitPointer,
    setRow,
    setCol,
    jumpToExtreme,
    jumpTo,
    hearCell,
    hearOverview,
    sweepRow,
    sweepMap,
    stopAll,
    playGuide,
    toggleSound,
    setVolume,
    setSpeed,
    setAnnouncements,
    setInvert,
    setMoveTones,
    setSection,
    setFrame,
  };
}
