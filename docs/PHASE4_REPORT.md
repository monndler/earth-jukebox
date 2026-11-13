# Phase 4 report — Explorer UI (13 Nov 2026)

## What was built
- `hooks/useFrameAnalysis.ts` — loads a frame, decodes it on a canvas, runs `analyzeFrame` + `buildExploreGrid` with `noDataThresholdFor`.
- `hooks/useAudioEngine.ts` — one audio engine; unlock on the first explicit sound button; volume and Sound On/Off sync.
- `hooks/useExplorerController.ts` — cursor, tones, sweeps, overview, guide, jumps, settings, announcements (all text from `strings`, all sound from `core/mapping`).
- `components/` — Header, TrackInfo (badge, title, source, notice, frame choice), SectionNav (D4), ExploreSection, MapGrid (D2), PlaybackBar (D10), GuideSection, SettingsSection, AboutSection, TrackLibrary (PLACEHOLDER-LAYOUT), Explorer, LiveRegions, shared controls.
- `App.tsx`, `explorer.css` (tokens only), `store/AppProvider.tsx`, `SET_FRAME` action.
- Bug fixed: JSX inside `store/index.ts` (ASSUMPTIONS #22).

## Verification status (be precise)
| Check | Result |
|---|---|
| Core/audio/data tests (107) | PASS in a temporary offline runner; **run `npm test` to confirm** |
| Typecheck of `core/`, `data/`, `audio/` | PASS (TypeScript 6.0.3) |
| Typecheck of UI code | PASS: `tsc -b` succeeded on the Vercel build (13 Nov 2026, commit 82147e0) with the real React types. |
| `npm run lint` | NOT RUN |
| `vite build` | First Vercel build failed only on the CSS file name (fixed); not yet re-run |
| Running the app in a browser | NOT RUN |
| Keyboard-only, screen-reader, 200 % zoom, contrast, listening tests (UI_FUNCTION_MAP §13) | NOT RUN |
| D1…D14 acceptance items | Implemented from the spec; none verified in a browser |

## Not done / open
- Track Library, loading, error and empty states are PLACEHOLDER-LAYOUT (§12).
- Space Grotesk font file not added (needs approval; system fallback used).
- Sweep progress indicator not added (needs approval).
- Frame choice (ASSUMPTIONS #23) needs approval.
- `src/App.css` is the leftover Vite template file and is no longer imported. Styles live in `src/explorer.css` (not `app.css`: on Windows that name collides with `App.css`). `src/dev/` is unused.
- Tolerances for the hue decode and the 0.1 no-data threshold must be checked by listening (#16, #17).
