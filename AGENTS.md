# AGENTS.md — Earth Jukebox: Development Instructions for AI Coding Agents

> **Audience:** every AI coding agent working in this repository.
> **Status:** mandatory rules, not suggestions.
> **Product source of truth:** `PROJECT_PLAN.md`. This file defines *how* you work; the plan defines *what* is built.

---

## 0. How to Use This Document

### 0.1 Precedence

1. **Explicit instructions from the project developer in the current session** (including supplied UI designs).
2. **`PROJECT_PLAN.md`** — scope, modes, mapping design, accessibility requirements, data models, roadmap.
3. **`UI_FUNCTION_MAP.md`** — maps each element of the developer's UI design to components, data, engine functions and behaviour. Subordinate to the designs and the plan; items marked **[NEEDS APPROVAL]** are not authorised.
4. **This file** — engineering process, architecture rules, quality gates.
5. Your own judgment — only where 1–4 are silent, and only with a *documented assumption* (§0.3).

If sources conflict, **stop and ask**. Never resolve a conflict silently.

### 0.2 Hard boundaries

- **Do not modify `PROJECT_PLAN.md`** unless the developer explicitly asks.
- **Do not start application development** until the developer authorises a phase (§17). Phase 0 starts with repository inspection.
- **UI/UX is owned by the developer** (see "UI/UX Ownership").
- **Design decisions D1–D6 are approved** (`UI_FUNCTION_MAP.md` §14). Do not reopen them without the developer.
- **Official NASA resources are released on 13 Nov 2026.** Until they are available to you in the repository, you do not know which datasets, frames, legends, or licences exist. Never assume.

### 0.3 When the plan is silent or ambiguous

1. Check `docs/ASSUMPTIONS.md` (create it in Phase 0 if absent).
2. If the choice affects **mapping rules, accessibility behaviour, data provenance, or scientific claims** → **ask before implementing**.
3. If it's a minor implementation detail → choose the simplest option, **log it in `docs/ASSUMPTIONS.md`**, and mention it in the phase report.
4. Never present an assumption as if it came from the plan.

Known open questions are in **Appendix A**; treat them as *ask first*.

---

## Critical Development Rules

1. **Inspect before you modify.** Read a file before editing it; list a directory before creating files in it; check `package.json` before importing anything.
2. **Never replace existing architecture without approval.**
3. **Never invent APIs, dependencies, endpoints, or backend services.** The app is client-only; no network calls to external data services in MVP.
4. **Keep business logic separate from UI components.** Analysis, mapping, and narration live in `core/`; audio playback lives in `audio/`.
5. **Core logic is pure and deterministic.** Same frame + same profile → identical `SoundScore`. No `Math.random()`, no time dependence inside `core/`.
6. **Use strongly typed TypeScript.** No `any`.
7. **Do not duplicate mapping/analysis logic.** One implementation per concept.
8. **Never present fake or synthetic data as NASA data.** Test fixtures are test-only and labelled.
9. **Never make unsourced scientific claims** in descriptions, story text, or UI copy. Every claim traces to a NASA source recorded in the track data.
10. **Accessibility is a requirement, not polish.** A feature that works only with a mouse or sight is not done.
11. **Audio never autoplays.** Sound starts only after an explicit user action. Stop/Pause must always be reachable.
12. **Never claim a feature works without testing it** (§13.5).
13. **No non-functional buttons or placeholder interactions.**
14. **Preserve existing working functionality.**
15. **Document every simplified/derived mapping** and state what the sound does and does not represent.

---

## UI/UX Ownership

The UI/UX design belongs to the project developer. You implement **functionality inside the developer's structure**.

**You MUST:** follow supplied layouts/designs/copy; reuse existing design tokens and components; wire real data and behaviour into the provided structure; **ask before significant visual changes**; report visual or accessibility problems as **questions**, not redesigns.

**You MUST NOT:** redesign screens, invent a visual direction, add tokens, or add UI elements absent from both the designs and the plan.

**Where no design exists:** build a minimal **placeholder layout** using existing tokens/components, mark it `// PLACEHOLDER-LAYOUT: no design supplied for <name>`, and list it in the phase report. Placeholder *layouts* are allowed; placeholder *behaviour or data* is not.

**If a design element has no defined function, or omits something the plan requires** (e.g., no place for the audio legend, source credit, or a Stop control) → **ask**.

**Accessibility conflicts with a design** (contrast, focus visibility, target size, missing labels) → raise them as questions with the specific WCAG concern; do not silently change the design and do not silently ship the problem.

Where designs live will be indicated by the developer; if you can't find them, ask.

---

## 1. Project Overview and Goals

**Earth Jukebox** pairs NASA Earth Information Center (EIC) visualization frames with sonifications generated in real time in the browser, for the 2026 NASA Space Apps Challenge "The Earth Information Jukebox". It is **accessibility-first**: the whole experience must be usable without sight.

**Goals (plan §4):** 3–5 curated EIC-based tracks; real-time sonification; audio legend; descriptions; full keyboard and screen-reader operation; validated with blind/low-vision (BLV) testers; honest about what sound can and cannot convey.

**Non-goals:** 3D globe, ML generation, AI voice assistant, live NASA API fetching, accounts, backend.

**Scope tiers (plan §15):** P0 mandatory → P1 only after all P0 is complete and tested → P2 only with approval. **Never work on P1/P2 while any P0 item is unfinished.**

---

## 2. Technology Stack and Architecture Rules

### 2.1 Stack

1. **First action in any session: inspect the repository** (`package.json`, lockfile, configs, `src/` tree, tests). Adopt the **actual** stack and report what you found.
2. If the repo is empty and the developer confirms, use the plan default: **Vite + React + TypeScript**, **Web Audio API** (no audio library), **Vitest**, developer-supplied styling.
3. **Adding any dependency requires approval** (state package, reason, and the no-dependency alternative). This includes audio libraries (e.g., synthesis/music libraries), image-processing libraries, test utilities, accessibility-testing tools, and UI kits.
4. Before using any library or browser API, **verify it exists** in the installed version / target browsers. Do not code from memory of an API you haven't confirmed.
5. Do not use `package.json` scripts you haven't read; never invent script names.

### 2.2 Layering (dependencies point downward only)

```
data/        tracks, mapping profiles, scales, strings (plain typed data)
types/       TypeScript types
core/        PURE: analysis, mapping, narration
audio/       Web Audio engine (side effects) — plays a SoundScore
store/       minimal app/player state
hooks/       adapters (core/audio ↔ React)
components/  presentation
app/ pages   composition
scripts/     offline tools (e.g., frame extraction) — never imported by runtime code
```

Rules:
- `core/*` imports only from `types/` and `data/` (and itself). **No React, DOM, `window`, `AudioContext`, or `localStorage`** in `core/`.
- `audio/*` consumes `SoundScore`; it does **not** compute mapping decisions.
- `components/*` don't compute mappings or thresholds; they display engine outputs.
- `data/*` contains data only — no logic.
- Everything is client-side; **no backend, no API routes, no external data `fetch`** in MVP.
- Tracks, scales, and mapping profiles are **data**, so tuning with testers needs no code change.

---

## 3. Code Organization and File Structure

```
src/
  core/{analysis,mapping,narration}.ts
  audio/engine.ts
  data/{tracks,profiles,scales,strings}.ts
  types/{track,frame,sound}.ts
  store/  hooks/  components/  app/ (or pages)
scripts/              # offline: frame extraction etc.
public/tracks/<id>/   # bundled frames (same-origin)
docs/ASSUMPTIONS.md
```

- Follow the **existing repo conventions** for naming/aliases when they differ. Don't add top-level directories without approval.
- One responsibility per file; no dead code, commented-out blocks, or unused exports.
- Tests live where the repo's convention dictates (check first), co-located by default.
- **User-facing strings** live in `data/strings.ts` (or the repo's i18n equivalent), not scattered in components — this enables the later Indonesian/English UI (P1).

---

## 4. Component Development Guidelines

1. **Check first:** reuse existing components/tokens before creating new ones.
2. **Presentational by default:** props in, events out; no mapping/analysis inside components.
3. **No hardcoded domain content:** track titles, credits, value ranges, descriptions come from `data/tracks` or engine outputs.
4. **No hardcoded colours/fonts/spacing** — tokens come from **`DESIGN.md`** ("Abyssal Sonics Light", light theme final, D9). Read the YAML front matter, map the tokens once to CSS variables / the Tailwind theme, and use only those. The approved decisions **P1–P8 (D14, `UI_FUNCTION_MAP.md` §0.4)** override `DESIGN.md` where they differ: primary `#006067`; hover/active states keep ≥ 4.5 : 1 (`#004f54`); "Stop all sound" uses error red `#ba1a1a` with label and icon; grid symbols and tints use DESIGN.md tokens only (warm `#ffdbca`/`#763300`, cool `#b9eaff`/`#004d62`, mid `#96f1fa`/`#004f54`, no-data `#eaedff`/`#6e797a`); no essential text below 14 px; control boundaries use `#6e797a`; page `#faf8ff` with white panels; Space Grotesk is **bundled** (include its licence file, confirm the licence, system fallback, no CDN request); focus ring is 3 px primary with a 2 px white offset. Never copy DESIGN.md's "AAA" claims; cell meaning is carried by symbol shape and text, never tint alone; symbols and non-text ≥ 3 : 1; text ≥ 4.5 : 1. Any colour, hover state, or label size not covered here → ask.
5. **Every interactive element works** and has an accessible name, role, and state. Don't render controls that can't act.
6. **Semantic HTML first** (`button`, `a`, `label`, `fieldset`, headings, landmarks); ARIA only where native semantics can't express it.
7. **Keyboard:** logical tab order, visible focus, no traps; every action available by keyboard; shortcuts (if any) documented on screen and never conflict with screen-reader keys.
8. **Announcements:** use a polite live region for state changes (play/pause, track/frame change). Don't spam; don't announce every sound event.
9. **Required states** for data-driven components: empty, loading, error, populated (within the developer's design). Ask if the design lacks one the plan requires.
10. **Required content:** source credit for every NASA frame; value-basis label ("decoded from legend" vs. "visual translation — not calibrated data"); limits statement (plan §8, §12).
11. **Respect `prefers-reduced-motion`;** no flashing content.
12. **Audio controls:** Play/Pause/Stop, volume, speed; Stop/Pause always reachable by one predictable control.
13. **No fake features:** no mock "AI voice assistant", live-data badges, or social features.
14. **Typed props**, explicit interfaces, no `any`.
15. **Map grid (D2):** render the grid as one element with a text alternative built from real dimensions; individual cells are `aria-hidden` and never tab stops. Accessible operation is via sliders, direction buttons, and jump actions. Pointer/touch drag may select cells (tones throttled, previous tone replaced).
16. **Section navigation (D4):** simple navigation buttons with `aria-current`; only the active section is rendered; no `tablist`/`tab` roles; announce "Showing {section}".
17. **Sticky bar (D10):** measure with a `ResizeObserver`; sticky only while its height is at most 25 % of the viewport height, otherwise normal flow; while sticky reserve bottom padding and `scroll-padding-bottom` equal to its height so focused content is never hidden.
18. **No custom keyboard shortcuts in P0 (D11).** Use native controls only; `Escape` = Stop all sound is a P1 candidate after volunteer testing.

---

## 5. State Management Rules

1. Keep state **minimal**: current track id, frame index, cursor (row, col), playback status, sound-enabled, volume, speed, announcements mode, invert flag, move-tones flag, active section. Everything else is derived.
2. **Derived, not stored:** `FrameFeatures`, `SoundScore`, and `Description` are computed from `(frame, track, profile)` via `core/*` and memoised by input identity. Never persist them.
3. Actions are small, named, typed (`selectTrack`, `play`, `pause`, `stop`, `setSpeed`, …). Invalid input (unknown track id, out-of-range speed) is rejected with a typed result, not silently coerced.
4. **Audio engine lifecycle** (create/resume context, start/stop nodes) is managed in one place (`audio/` + a hook). Components never touch `AudioContext` directly.
5. If preferences are persisted (e.g., volume, speed), use versioned keys (`jukebox:v1:*`), validate on load, wrap in `try/catch`, and fall back safely. Do not persist anything personal. Do **not** persist volunteer-test data in the app.
6. Never read `localStorage` during module evaluation or server render; handle hydration explicitly if the framework SSRs.

---

## 6. Data Models and TypeScript Standards

### 6.1 Models

Implement the models in **PROJECT_PLAN §14** with those names and fields: `Track`, `FrameRef`, `LegendEntry`, `FrameFeatures`, `MappingProfile`, `SoundScore`, `Description`, `PlayerState`, plus `ExploreGrid`, `CellReading`, `Settings`. Any field change is a plan deviation → **ask first** and record it.

Every `Track` must declare `source` (name, URL, credit, licence note) and `valueBasis` (`'decoded-legend' | 'relative-intensity'`).

### 6.2 Standards

1. `strict: true`; do not loosen `tsconfig`.
2. **No `any`**; use `unknown` + narrowing at boundaries. No `@ts-ignore` without justification and approval.
3. No non-null assertions (`!`) unless a comment proves the invariant.
4. Closed vocabularies as **string-literal unions** (`valueBasis`, note `kind`, player status, voice/timbre ids, scale ids).
5. **Exhaustive `switch`** over unions with a `never` check.
6. `readonly` for data and engine outputs; engine functions **never mutate inputs**.
7. **Units** documented on every numeric field (Hz, seconds, 0–1 normalised, pixels, grid cells).
8. Engine inputs/outputs are **plain JSON-serialisable** objects so results can be compared byte-for-byte in tests.
9. Derive id types from `as const` data where practical.
10. Public functions have explicit parameter and return types.

---

## 7. Frame Analysis Engine Rules (`core/analysis`)

1. **Pure functions**; input is a plain decoded frame (`{ width, height, rgba }`), optional crop rect, optional legend, track metadata. The DOM/canvas step that obtains pixels lives **outside** `core/` (in a hook/utility) and is kept thin.
2. **Value basis is explicit.**
   - With a legend: decode each pixel to the legend value range by nearest-colour match within a **documented tolerance**; unmatched/transparent → **no data**.
   - Without a legend: use a **documented relative-intensity scalar** and label the track accordingly. Never present it as calibrated data.
3. **No-data is first-class** (a mask), not zero.
4. **Crop/mask from metadata** (colourbars, badges, timestamps); never hardcode per-image rectangles in code.
5. **Downsample** to a configurable grid; per-cell mean of valid pixels + valid fraction.
6. **Area weighting** (e.g., by latitude) only when the track declares its projection/extent. Otherwise state "unweighted".
7. **Totality:** handle empty/all-no-data frames, 1-pixel frames, odd sizes — return defined results, never `NaN`/`Infinity`/`undefined` to downstream code.
8. **Determinism:** fixed iteration order; explicit tie-breaks (e.g., first max by row-major order).
9. **Document each function** with: purpose, formula/rule, units, assumptions, what is *ignored*, and the `PROJECT_PLAN` section it implements.
10. Don't read frame files or touch the network in `core/`.
11. **Explore grid (D1):** `buildExploreGrid` aggregates the analysis grid into the coarse Explore grid (`track.exploreGrid`, default 10 × 8): mean of valid analysis cells; a cell is no-data when its valid fraction is below `noDataThreshold` (0.5, D7). Pure, deterministic, tested. The About text must state that cells are averages.

---

## 8. Sonification Mapping Rules (`core/mapping`)

1. `mapFrame(features, profile, track) → SoundScore` is **pure and deterministic**.
2. **Mapping is data-driven** via `MappingProfile` (scale, octaves, bands, sweep duration, max voices, pan width, invert). Tuning must not require code changes.
3. **Monotonic and consistent:** within a profile, higher normalised value → higher pitch (unless `invert` is set). Value range is **fixed per track** so frames in one track are comparable.
4. **Quantise to the profile's scale** (musicality) and respect `maxVoices`.
5. **No-data → rest (silence).** Never synthesise sound for no-data.
6. **Diverging tracks** (`diverging: true`) use the documented zero-reference behaviour; non-diverging tracks must not.
7. **Time and pan** derive from horizontal position and sweep duration exactly as specified in the plan §8.2; do not reorder or reinterpret.
8. **Named geography** (e.g., "tropics") only when the track declares projection/extent; otherwise use "upper/middle/lower" and "left/right".
9. **Everything the sound conveys must be available as text** (legend and description) — keep `core/mapping` and `core/narration` consistent.
10. Mapping constants (default scale, octaves, accent thresholds, sweep limits) are **named constants with comments** — no magic numbers.
11. Mapping parameters are design choices, **not scientific facts**; never describe them as such in UI copy.
12. Do not change the plan's default mapping without approval; propose changes with the reason (ideally tester feedback).
13. **One grid for all sounds (D1):** cell tones, row sweep, map sweep, overview, and reference tones are all built from the Explore grid — never from separate grids.
14. **Overview vs. sweep (D3):** `buildOverviewScore` = ~10 s, single voice, column means. `buildMapSweepScore` = full detail with three band voices (bands formed by grouping Explore-grid rows per D8: 8 rows → 3 + 2 + 3). Both are pure and share the same pitch function.
15. **Invert** is applied inside `core/mapping` only. Value-extreme jumps (highest/lowest cell) use the normalised value, independent of invert; ties break by first in row-major order.
16. **Levels and bands (D7, D8):** levels (low/middle/high) are computed from the track's **fixed** `valueRange` (thirds; diverging ±⅓ of the maximum absolute value), never from the frame being viewed; reference tones play at level midpoints. All bands share one pitch mapping (register offset 0) and differ by timbre only; a row sweep uses its band's timbre; the overview uses a neutral voice. Band grouping: base = ⌊rows/3⌋, remainder to the outer bands.

---

## 9. Audio Rendering Rules (`audio/`)

1. The engine **only plays a `SoundScore`**; it doesn't decide mappings.
2. **Create/resume the audio context only after a user gesture.** Never autoplay. Handle `suspended` state and report failures visibly.
3. Signal path: voices → master gain → **limiter** (dynamics compressor) → output. Conservative default gain; **no sudden loud events**; ramp gains to avoid clicks.
4. **Scheduling:** use the audio clock with lookahead scheduling for timing stability; do not drive note timing from UI timers.
5. **Stop/Pause** must silence promptly and release nodes; no leaked oscillators/nodes; clean up on unmount and track change.
6. Voice count is bounded by `maxVoices`; reuse/limit nodes for low-end phones.
7. **Speed and volume** controls affect playback in a defined way (speed scales the score timeline; document it).
8. Test behaviour on **real devices** (iOS Safari, Android Chrome, desktop) before claiming it works; autoplay and mute/ringer behaviours differ. If you can't test, report **NOT VERIFIED**.
9. WAV export (P1) renders the **same `SoundScore`** via an offline context — no second mapping implementation.
10. **Sound toggle and move tones (D6):** the header toggle is a global mute. Explicit sound buttons (Hear this cell, Hear overview, sweeps, sound guide) always play and turn Sound on if it was off, announcing "Sound turned on". Tones triggered automatically by cursor movement (sliders, direction buttons, jumps, tap/drag) play only when the "Play a tone when I move" setting is on. Starting a new sound replaces or stops the previous one; sounds never stack uncontrollably.
11. **Playback behaviour (D12):** starting a different sound stops the current one; pressing the same sound button restarts it and announces it again; speed changes apply to the next playback only; volume applies immediately.
12. **Durations (D13):** initial values live in the mapping profile, not in code: cell tone 0.5 s, reference tone 1.0 s, overview 10 s base, whole-map sweep 12 s base, row sweep 0.4 s per cell (all scaled by speed except tone lengths); drag/touch tones throttled to one per 120 ms and replacing the previous tone. Tune with volunteers.

---

## 10. Accessibility Rules (acceptance criteria)

Mirror plan §11. Before reporting any UI work done, verify:

- [ ] Whole flow operable by **keyboard only** (start audio → pick track → play/pause/stop → change speed/volume → next frame → read description).
- [ ] **Screen reader pass** (NVDA or VoiceOver on desktop; TalkBack/VoiceOver on a phone where possible): names, roles, states, reading order, live-region announcements.
- [ ] Audio does not autoplay; Stop/Pause always reachable.
- [ ] Map cells are hidden from assistive tech and are never tab stops; the grid has one text alternative (D2).
- [ ] Section navigation uses buttons with `aria-current` and shows one section at a time; no tab roles (D4).
- [ ] Sound toggle behaviour matches D6; turning "Play a tone when I move" off silences movement tones only.
- [ ] Colours come from design tokens (light theme, D9); text ≥ 4.5 : 1; symbols and non-text ≥ 3 : 1; cell meaning readable without colour; focus ring visible on every control.
- [ ] Every sound-conveyed meaning has a text equivalent.
- [ ] Contrast, focus visibility, target size, text resize/reflow checked against **WCAG 2.2 AA** using the developer's palette (report issues; don't restyle).
- [ ] `prefers-reduced-motion` respected; no flashing.
- [ ] Interaction between screen-reader speech and sonification handled as decided with testers (pause/duck on focus move, or explicit Play only).
- [ ] Source credits and limits statement readable by screen readers.

Automated accessibility tooling requires **approval** (new dependency) — until then, manual checks are mandatory and must be reported pass/fail/not-run.

---

## 11. Content, Data, and Provenance Rules

1. **No resource assumptions before 13 Nov.** When resources become available, record in `docs/ASSUMPTIONS.md`: what was provided, where it came from, formats, legends, licences.
2. **Frames are bundled locally** under `public/tracks/<id>/` (same-origin so canvas pixel reads aren't blocked); extraction is done by scripts in `scripts/`. Don't hotlink NASA media at runtime.
3. **Attribution and licence:** each track records source name, URL, credit text, and licence/usage note. If you can't determine usage terms, **ask** — don't include the asset.
4. **Story text and descriptions:** every factual statement is traceable to the track's source (caption, resource page). Mark the source in the data. Don't add climate facts from memory. Don't let auto-summaries claim more than `FrameFeatures` support.
5. **Test fixtures** are generated synthetic frames; they live in test directories, are clearly named (`fixture-*`), and are never shown in the app as NASA content. A clearly labelled **demo/synthetic track** for pre-event development is allowed only if marked "Synthetic test data — not NASA data" in the UI and in `data/tracks`, and removed or hidden from the final submission.
6. **No real-world numbers invented** (value ranges, units, dates). If a legend doesn't state units, don't invent them.
7. **Volunteer testing:** never store or commit participant personal data, audio recordings, or identifiable notes in the repository.

---

## 12. Error Handling

1. **Expected problems are data, not exceptions:** unknown track, frame load failure, unsupported audio → typed results surfaced in the UI with plain-language next steps.
2. **Programmer errors throw** with clear messages and are caught by an error boundary / the framework's error mechanism so one failure doesn't blank the app.
3. **Frame load/decode failure:** show an accessible message (announced to screen readers) and keep the rest of the app usable.
4. **Audio failure** (context blocked/unsupported): visible, announced message with guidance (e.g., "tap Play again").
5. **No silent catches.** Every `catch` recovers *and informs*, or rethrows.
6. No `NaN`/`Infinity` may reach the audio engine or rendering; treat as an engine bug.
7. No `console.log` for control flow; no debug logging left in commits.
8. Error text is plain language: what happened, what to try.

---

## 13. Testing Requirements

### 13.1 Tooling
- **Vitest** for `core/*` (confirm it's installed/configured; otherwise ask). Read `package.json` for the real test command.
- UI test libraries and automated a11y tools need **approval**; until then use the manual checklists (§10, §13.4).

### 13.2 What must be tested (core)
- **Determinism:** same frame + profile → byte-identical `SoundScore` (`JSON.stringify`).
- **Analysis:** legend decoding (exact match, near match within tolerance, unmatched → no data); transparent → no data; crop rect respected; downsample correctness against hand-computed values; empty and all-no-data frames.
- **Mapping:** monotonicity (higher value → higher or equal pitch); scale quantisation; `invert`; voice cap; **no-data → no events**; diverging reference behaviour; pan and time ordering; range fixed per track.
- **Narration:** statements are supported by features; no named geography without declared projection.
- **Explore grid (D1):** aggregation matches hand-computed values; no-data threshold behaviour at, below, and above the threshold; deterministic output; extreme-cell tie-break (row-major); the same value yields the same pitch in cell tone, sweep, overview, and guide; invert affects all of them consistently. **D7/D8:** level boundaries at and around each threshold (non-diverging and diverging); reference tones fall inside their level; band grouping for 3, 7, 8, 9 rows and fewer than 3; a band with all no-data is silent; all bands map the same value to the same pitch.
- **Data integrity:** tracks have unique ids, valid frame refs, source + credit + `valueBasis`; profiles reference existing scales.
- **Purity guard:** a test or check that `core/` doesn't use `Math.random`, `Date`, DOM, or Web Audio APIs.

### 13.3 Fixtures
Small, programmatically generated synthetic frames (gradients, checkerboards, masked regions) with hand-computed expectations. Test-only; never imported by app code.

### 13.4 Manual verification (report each as pass/fail/not-run)
- Every control: click/keyboard-activate it; confirm result.
- Start audio → play → pause → stop → change speed/volume → next frame; no stuck sound, no clicks, no overlapping playback when switching track quickly.
- Reload; switch tracks; resize to ~375 px and desktop.
- Keyboard-only and screen-reader runs (§10).
- Real-device audio checks (iOS/Android/desktop).
- Volunteer-session feedback summarised and mapped to changes (done by the team; agents report implementation status only).

### 13.5 What "tested" means
- **Tested** = you executed the test/command/interaction and observed the result; include the command and result summary in the phase report.
- If you couldn't run it: **"NOT VERIFIED — <reason>"**.
- Never claim passing tests you didn't run; never fabricate output; a passing type-check/build is **not** proof of correct behaviour or accessibility.

---

## 14. Performance Guidelines

1. Measure before optimising; don't claim improvements without numbers.
2. **Analysis should feel instant:** downsample before heavy work; keep frame images modest in size; memoise `FrameFeatures`/`SoundScore` per `(frame, profile)`. If measurement shows jank on a mid-range phone, consider a Web Worker (ask first if it needs build changes).
3. Preload/decode the next frame in a way that doesn't block the main thread or the audio schedule.
4. Audio scheduling uses lookahead on the audio clock; keep the main thread free of long tasks during playback.
5. Bound voices and node counts; dispose nodes after use.
6. Keep bundle small: no heavy dependencies; lazy-load non-critical screens only if measured as useful.
7. Respect low-power devices: no continuous animations needed for core functionality.

---

## 15. Integration Rules

### 15.1 Data flow (the only allowed flow)

```
Track data + frame image ──► pixel decode (thin util)
        │
        ▼
 core/analysis → FrameFeatures
        │
        ├──► core/narration → Description (text, screen-reader readable)
        ▼
 core/mapping (MappingProfile) → SoundScore
        │
        ▼
 audio/engine (after user gesture) → sound
        │
 Player UI (controls, legend, announcements) ←→ minimal store/hooks
```

### 15.2 Integration order
Follow plan §17: types/data → core (with tests on synthetic fixtures) → audio engine → accessible shell → real tracks (after 13 Nov resources) → polish. Build the engine first so the UI never needs fake results.

### 15.3 Wiring checklist (every screen)
- [ ] Reads from store/hooks; no duplicated state.
- [ ] No mapping/analysis logic in the component.
- [ ] Keyboard and screen-reader behaviour verified (not assumed).
- [ ] Required content present: credit, value-basis label, limits.
- [ ] Empty/loading/error states announced accessibly.
- [ ] Stop/Pause reachable; no autoplay.

### 15.4 Working with the developer's designs
1. Map each design element to existing components, engine outputs, and actions.
2. Implement inside that structure; ask before changing layout.
3. Unknown element function or missing required element → ask.
4. No design → `PLACEHOLDER-LAYOUT` rule.

### 15.5 Cross-cutting
- **No mock results.** Never wire the UI to hardcoded sample audio/frames/descriptions.
- Changing track/profile data must not require UI code changes; if it does, the UI hardcodes something — fix it.
- Don't touch other contributors' in-progress work beyond your phase scope; report unavoidable shared-file edits.

---

## 16. Anti-Hallucination Rules

**Repository truth**
1. Never assume file contents, structure, scripts, or dependencies — **look**.
2. Never invent files, components, hooks, props, scripts, packages, endpoints, or backend services.
3. Never import a package not in `package.json` and installed. Never call a library/browser API you haven't confirmed exists in the target environment.

**Honesty about status**
4. Never claim a feature is implemented unless it exists and works; never claim tests passed unless you ran them; never call a phase complete while in-scope items remain.
5. Never fabricate command output, test results, screenshots, device test results, or tester feedback.
6. If you couldn't verify something: **"NOT VERIFIED"** and why.
7. If a feature is too large for the current phase, say so and propose the smallest working version — no stubs with fake behaviour.

**Science and data**
8. Never present synthetic data as NASA data.
9. Never invent datasets, URLs, legends, units, dates, or licence terms. If you don't have the resource, say so.
10. Never state climate/Earth-science facts from memory in app content; use only what the recorded source supports.
11. Never describe a derived/relative-intensity track as calibrated measurement.
12. Never claim accessibility compliance (e.g., "WCAG compliant") without evidence from the checks in §10.
13. Never invent BLV tester results, quotes, or study outcomes.

**UI and process**
14. Never hardcode values that should come from track data or engine output.
15. Never create controls that don't work; never imply features that don't exist (voice assistant, live data, haptics).
16. If requirements are ambiguous, state the assumption first (§0.3).
17. Don't "improve" mapping, scales, or defaults on your own initiative.
18. Don't silently remove or rewrite working code; state intended removals and get approval for non-trivial ones.
19. Map every completion claim to a Definition-of-Done item (plan §20) with evidence.

---

## 17. Workflow

- Work in **small, testable phases**, one at a time:

| Phase | Scope | Exit criteria |
|---|---|---|
| 0 | Inspect repo, confirm stack, scaffold, `docs/ASSUMPTIONS.md` | Plan confirmed; project builds |
| 1 | Types + data scaffolding (no real NASA data yet) | Type-checks; models match plan §14 |
| 2 | `core/` analysis, Explore grid, cell/sweep/overview mapping, narration + tests on synthetic fixtures | Tests pass (§13.2) |
| 3 | `audio/` engine + player hook | Synthetic frame plays; start/pause/stop/speed/volume verified |
| 4 | Accessible Explorer wired to the developer's UI per `UI_FUNCTION_MAP.md` (grid, sliders, direction buttons, jumps, sweeps, overview, guide, settings, about) | Keyboard + screen-reader checklist passes |
| 5 | Real tracks from 13 Nov resources (credits, legends, crops, story text) | ≥ 3 real, credited tracks play end-to-end |
| 6 | P1 features (only if P0 complete) | Per feature |
| 7 | Polish, QA, submission support | Definition of Done met |

- Don't begin a phase until the previous one's exit criteria are met and the developer acknowledged the report (unless told otherwise).
- **Stop and ask** when: instructions conflict; the plan is ambiguous on mapping/accessibility/provenance; a design is missing or conflicts with the plan; a dependency is needed; a visual change seems necessary; code must be removed/restructured; you lack a resource you need.

### Mandatory phase report

```markdown
## Phase <n> Report — <name>

### Implemented
- <what works, plainly>

### Files
- Created: <paths>
- Modified: <paths + one-line reason>
- Deleted: <paths + approval ref> (or "none")

### Tests performed
- <command> → <result>            (or "NOT VERIFIED — <reason>")
- Manual checks (keyboard / screen reader / device): <item> — pass/fail/not-run

### Assumptions made
- <entries in docs/ASSUMPTIONS.md> (or "none")

### Placeholder layouts used
- <paths> (or "none")

### Known issues
- <issue, severity, impact>

### Remaining tasks
- <what's left>

### Questions for the developer
- <blocking / non-blocking>
```

---

## Appendix A — Open Questions (ASK BEFORE IMPLEMENTING)

| # | Question | Why it matters |
|---|---|---|
| 1 | May code/prototypes be prepared before 14 Nov (Local Lead)? | Determines whether Phases 1–4 can start early |
| 2 | Which EIC visualizations/frames, formats, legends, and licences are in the 13 Nov resources? Is an ocean-temperature visualization included? | Decides tracks, value basis, "Ocean Symphony" |
| 3 | Official submission requirements, judging criteria, deadline/time zone? | Defines deliverables |
| 4 | Is a repository initialised? Confirm Vite + React + TS (plan default) or the team's stack | Phase 0 |
| 5 | Hosting platform for the demo link? | Build/deploy setup |
| 6 | Target devices/browsers and screen readers for testing (testers' phones)? | Real-device verification |
| 7 | UI language(s) for the submission (English required? Indonesian P1)? | Strings structure |
| 8 | Is a clearly labelled synthetic demo track allowed for pre-event development, and must it be removed from the final submission? | Provenance rule (§11.5) |
| 9 | ~~Screen-reader speech vs. sonification overlap~~ — resolved by the Announcements setting and "Play a tone when I move" (D6); defaults to be validated with testers | Accessibility behaviour |

---

## Appendix B — Pre-Handoff Checklist for Every Task

- [ ] I inspected existing files before modifying them.
- [ ] No working functionality was removed/changed without being reported.
- [ ] No new dependency without approval.
- [ ] `core/` has no React/DOM/audio/random/time usage.
- [ ] No mapping/analysis logic duplicated outside `core/`.
- [ ] No `any`, no unexplained `!`, no `@ts-ignore`.
- [ ] No hardcoded domain content or fake results in UI.
- [ ] Every new control works and is keyboard- and screen-reader-operable.
- [ ] No autoplay; Stop/Pause reachable.
- [ ] Source credit, value-basis label, and limits are present where required.
- [ ] No unsourced scientific claims; no synthetic data shown as NASA data.
- [ ] Placeholder layouts marked and listed; no visual redesign introduced.
- [ ] Tests/checks run and reported honestly (or marked NOT VERIFIED).
- [ ] Assumptions logged in `docs/ASSUMPTIONS.md`.
- [ ] Phase report complete and accurate.
- [ ] `PROJECT_PLAN.md` was not modified.

---

## Appendix C — Approved Design Decisions and Remaining Open Items

| # | Approved decision |
|---|---|
| D1 | Explore grid (default 10 × 8) separate from the analysis grid; all P0 sounds use it; no-data by valid-fraction threshold |
| D2 | Grid cells hidden from assistive tech; one described element; AT path = sliders, direction buttons, jumps |
| D3 | Overview (~10 s, single voice) and Sweep whole map (full detail) both kept, defined distinctly |
| D4 | Section navigation = simple buttons with `aria-current`; no tab roles |
| D5 | ~~One derived panel colour `#092737`~~ — superseded by D9 |
| D6 | Explicit sound buttons turn Sound on; new "Play a tone when I move" setting |
| D7 | No-data threshold 0.5; levels = thirds of a fixed per-track value range (diverging ±⅓ of the maximum absolute value) |
| D8 | Three bands from Explore-grid rows (8 → 3+2+3); one pitch mapping, timbre differs; neutral overview voice |
| D9 | Light theme is final; tokens from the design file; symbols and non-text ≥ 3 : 1; no meaning by tint alone |
| D10 | Sticky bar measured with ResizeObserver; sticky only while ≤ 25 % of viewport height; reserved padding and scroll-padding |
| D11 | No custom keyboard shortcuts in P0 |
| D12 | Different sound replaces current; same button restarts; speed applies next playback; volume immediate |
| D13 | Initial durations: 0.5 s cell tone, 1.0 s reference tone, 10 s overview, 12 s sweep, 0.4 s per cell row sweep; drag tones throttled 120 ms |
| D14 | `DESIGN.md` proposals P1–P8 approved: primary `#006067`; hover/active keep ≥ 4.5 : 1 (`#004f54`); Stop = error red `#ba1a1a` with label and icon; grid symbols/tints from DESIGN.md tokens only; essential text ≥ 14 px; control borders `#6e797a`; page `#faf8ff` + white panels; Space Grotesk bundled with the app; focus ring 3 px primary + 2 px white offset |

**Scope change:** Explore, Overview, Jump actions, and Invert are P0.

**Still open — ask before implementing:** designs for the Track Library, error/loading/empty states, and the move-tones switch (use `PLACEHOLDER-LAYOUT` until supplied).
