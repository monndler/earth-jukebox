# EARTH JUKEBOX — PROJECT_PLAN.md

> **Tagline:** Hear the Earth. Understand Our Planet.
> **Challenge:** 2026 NASA Space Apps Challenge — *The Earth Information Jukebox* (Intermediate; Beginner/Youth).
> **Event:** 14–15 November 2026. **Official resources appear 13 November 2026.**
> **Foundation document.** If code and this plan disagree, update this plan deliberately; never drift silently.
> **Version 2:** developer decisions D1–D6 on the Audio Map design are incorporated (Explore grid, assistive-tech exposure of the grid, overview vs. sweep, section navigation, panel surface tint, sound and move-tone behaviour). See Appendix B and `UI_FUNCTION_MAP.md`.

> **Scientific honesty notice.** The challenge asks us to translate NASA EIC *visual frames* into sound. Sonification is an interpretation, not a measurement instrument. Every track must state what the sound represents, how values were obtained (decoded via a legend, or only relative visual intensity), and what is lost in translation. Mapping parameters in this plan are **design choices to be tuned with blind/low-vision testers**, not scientific facts.

---

## 1. Product Overview

**Earth Jukebox** is a web-based, accessibility-first "jukebox" that pairs NASA Earth Information Center (EIC) visualization frames with sonifications generated in real time in the browser. A listener picks a track (an EIC visualization), presses play, and hears the planet's changing patterns — while a spoken-style text description and an audio legend explain how to read the sound.

First planned track (subject to what the 13 Nov resources contain): **Ocean Symphony** — ocean temperature patterns heard as music.

**Core idea:** *sound should be a complete way to understand an Earth visualization, not a decoration on top of one.* The product is designed **with** blind and low-vision (BLV) testers, not just "for" them.

**Differentiators**
1. **Co-designed with BLV volunteers** — the mapping, controls and descriptions are tested with real users and changed based on their feedback.
2. **Explainable translation** — an audio legend ("hear low → mid → high") and a documented mapping; no mystery sounds.
3. **Accessible by construction** — keyboard-only and screen-reader-friendly from day one; the whole app is usable without sight.
4. **Musical but honest** — scales and harmony for pleasant listening, with rests meaning "no data" and a visible/readable statement of limits.
5. **Useful to everyone** — sighted users get frame + sound + description together (multi-sensory), as the brief invites.

---

## 2. Challenge Analysis (traceability)

Source: official challenge text (pasted by the team). Resources tab content: **not yet available (13 Nov)**.

| # | Requirement / signal in the brief | Where addressed |
|---|---|---|
| C1 | Pair **EIC visual frames** with **dynamic sonifications generated in real time** | §8, §9, §13 |
| C2 | User can select/experience a specific EIC visualization alongside its soundscape | §7, §10 |
| C3 | Deliverable may be web jukebox, app, API, or curated generated audio + explanation | §15 (web jukebox chosen) |
| C4 | Accessibility is a **core theme**: screen reader, tactile feedback, rich descriptive text | §11, §16 |
| C5 | Balance data translation with musicality (avoid chaotic noise; use scales/harmony) | §8 |
| C6 | Document the "why": algorithms, artistic choices, creative process | §18 |
| C7 | Emotional impact / storytelling about change and beauty of Earth | §10, §18 |
| C8 | Methods open: computer vision, ML, synthesis, rulesets | §8, §9 (rule-based chosen for MVP) |
| C9 | Resources arrive 13 Nov; plan must adapt | §10, §17, Appendix A |

---

## 3. Problem Statement

EIC visualizations show how the planet is changing, but they are mostly visual. This excludes blind and low-vision people and limits how everyone else can engage with complex Earth science. Sonification can help, but crude pixel-to-sound conversion produces noise that is hard to interpret.

**We need a tool that turns EIC frames into sound that is (a) understandable, (b) pleasant, (c) operable without sight, and (d) honest about what it represents.**

---

## 4. Product Goals

**Primary:** a working, demonstrable web jukebox with 3–5 curated EIC-based tracks, real-time sonification, descriptions, and full keyboard/screen-reader operation, tested by BLV volunteers.

**Learning/experience goals** (a listener should be able to):
- Tell roughly whether the high or low values are on the left or right, upper or lower part of a frame.
- Tell whether one frame is "higher overall" than another.
- Notice change across time (when a track has multiple frames).
- Know what the sound means (legend) and what it cannot tell them.

**Product goals:** every control works; same frame + same mapping → same sound; a first-time user can start a track in < 1 minute using only a keyboard and screen reader.

**Non-goals:** 3D globe, machine-learning generation, AI voice assistant, live NASA API fetching, accounts, backend, multiplayer.

---

## 5. Target Users

| User | Needs | Implication |
|---|---|---|
| Blind / low-vision learners and enthusiasts | Independent access to Earth science | Audio-first UX, screen reader + keyboard, clear legend, text descriptions |
| Teachers/volunteers working with BLV students | Shareable, explainable material | Documented mappings, story text, simple controls |
| Sighted students and public | Engaging multi-sensory learning | Frame + sound + text together |
| Hackathon judges | Quick, memorable demo | 90-second demo path, strong story, evidence of user testing |

---

## 6. Core Experience (User Journey)

```
Open app → Start audio (explicit button) → Pick a track
   → Hear audio legend (optional, learnable reference tones)
   → Play the frame (sweep) → Read/hear description
   → Adjust speed/volume/loop → Next frame / next track
   → Explore the frame cell-by-cell with sliders and direction buttons (or touch)
```

**Rules**
- **Audio never starts automatically.** Browsers restrict autoplay; more importantly, sudden sound is hostile to screen-reader users. Playback begins only after an explicit user action.
- Moving focus or activating screen-reader speech must never be fought by loud sonification: provide pause/stop at a predictable key and keep default volume moderate.
- Every control is reachable by keyboard and has an accessible name and state.

---

## 7. Product Modes

| Mode | Description | Priority |
|---|---|---|
| **Sweep whole map** | The frame is played left→right over a set duration with three band voices; pitch conveys value, pan conveys horizontal position (built from the Explore grid) | **P0** |
| **Audio Legend** | Reference tones for low / mid / high (and "no data" silence) | **P0** |
| **Track Library** | Curated tracks with story text, source credits, frames | **P0** |
| **Description** | Auto-generated frame summary + curated story text, readable by screen readers | **P0** |
| **Explore (Grid)** | A cursor moves over a coarse Explore grid (default 10 × 8) via sliders, direction buttons, jumps, or touch/drag; each cell has a tone and a text readout; sweep a single row | **P0** |
| **Jump actions** | Jump to the highest/lowest cell, to start, to end | **P0** |
| **Settings** | Announcements (Short / Detailed / Sound only), volume, speed, invert pitch, "Play a tone when I move" | **P0** |
| **Time Lapse** | Play through multiple frames of a track in sequence with date announcements | P1 (P0 if resources provide time series and time allows) |
| **Overview** | ~10 s single-voice summary of the whole frame (column means) plus a text summary | **P0** |
| **Audio Export (WAV)** | Render a frame's sonification to a downloadable file | P1 |
| **Indonesian/English UI** | Externalised strings from day one; second language later | P1 |

---

## 8. Sonification Design

> **All parameters below are initial design hypotheses.** They live in data (`MappingProfile`) so they can be tuned with BLV testers without code changes. Where research suggests listeners differ in preferred polarity (e.g., higher pitch = more vs. less), the app offers an **invert** option and we test it.

### 8.1 What is being sonified

From each frame we derive a **value grid** (downsampled), not raw pixels:

1. **If a legend (colorbar/colormap) is available:** decode each pixel's colour to the value range it represents (nearest-legend match within a tolerance; unmatched/transparent → "no data"). The sound then represents *data values* as displayed.
2. **If no legend is available:** use a documented **relative visual intensity** scalar (e.g., perceptual lightness or a palette-order index). The track must then be labelled **"visual translation — not calibrated data."**

Every track declares which of the two it uses.

### 8.2 Initial mapping (profile `sweep-lr-3band`, P0 default)

| Visual/data feature | Audio parameter | Notes |
|---|---|---|
| Value (normalised 0–1 within the track's value range) | **Pitch**, quantised to a musical scale (default: pentatonic) across ~2 octaves | Quantising keeps it musical (brief C5); constant range across a track's frames so frames are comparable |
| Horizontal position (sweep time) | **Time** and **stereo pan** (left→right) | Mirrors the visual |
| Vertical position | **Three bands** (upper / middle / lower) as three voices that differ by **timbre only** — one shared pitch mapping, register offset 0 (D8) | Named geographic terms (e.g., "tropics") only if the track declares its projection and extent |
| Local variability (std. dev. within a column band) | **Timbre roughness / brightness** | Higher variability = brighter/rougher |
| Frame extrema (max/min locations) | **Accent notes** with a distinct timbre | Helps find hot/cold spots by ear |
| No-data (transparent/masked) | **Silence (rest)** | Documented in the legend; "silence = no data" |
| Diverging data (e.g., anomalies around zero) | **Reference drone at zero**; above → higher pitch, below → lower pitch | Only for tracks flagged `diverging: true` |

Global defaults: sweep duration 12 s (adjustable 6–30 s); master limiter and conservative default gain; no sudden loud events.

**One grid for all sounds (D1):** in P0 every sound — cell tones, row sweep, map sweep, overview, reference tones — is built from the **Explore grid** (set per track, default 10 × 8), which aggregates the finer analysis grid. The three bands are formed by grouping Explore-grid rows (rule in D8: 8 rows → 3 + 2 + 3).

**Levels and bands (D7, D8):** No-data: an Explore cell is no-data when less than 50 % of its area has data (`noDataThreshold` = 0.5, per-track configurable). Levels are computed from the track's **fixed** `valueRange` (not from the frame being viewed): non-diverging → low = bottom third, middle = middle third, high = top third; diverging → with `maxAbs = max(|min|, |max|)`: low < −maxAbs/3, middle within ±maxAbs/3, high > +maxAbs/3. Sound-guide reference tones play at the midpoint of each level (non-diverging: min + span·1/6, 1/2, 5/6; diverging: −2/3·maxAbs, 0, +2/3·maxAbs). Sound details and Detailed mode show the share of the cell's area that has data. Explore-grid rows are split into three consecutive groups, as even as possible, remainder to the outer bands (base = ⌊rows/3⌋; remainder 0 → base, base, base; 1 → base, base+1, base; 2 → base+1, base, base+1; e.g. 8 rows → 3 + 2 + 3, 7 → 2 + 3 + 2, 9 → 3 + 3 + 3; fewer than 3 rows → as many bands as rows). A band's value per column = mean of its valid cells; all no-data → that band is silent in that column. No latitude weighting in P0. **All bands share one pitch mapping (register offset 0); they differ by timbre only.** A row sweep uses the timbre of the band containing that row. The overview uses a neutral voice distinct from the three band timbres. Fallback if testers cannot tell which band is warmer: replace simultaneous bands with three sequential sweeps (upper, middle, lower).

**Overview vs. sweep (D3):** *Overview* = ~10 s, single voice (column means), answers "what is the big picture?". *Sweep whole map* = full detail with three band voices, answers "what does it look like in detail?". If testers confuse them, merge into one button with a Simple/Full option.

### 8.3 Musicality vs. fidelity

- Quantise to a scale and limit simultaneous voices (≤ 4) to avoid chaos.
- Keep mapping **monotonic and consistent**: higher value never maps to lower pitch within a profile (except via the explicit invert option).
- Artistic choices (scale, timbre, tempo) are allowed but must be documented in the track's "why" notes (brief C6).

### 8.4 Audio legend

A dedicated control plays the reference tones: lowest value, mid value, highest value, and "no data" (silence), each announced in text. Available before and during playback. A track's value range and units (if known from the legend) are announced with it.

### 8.5 Descriptions

Two layers, both available as text for screen readers:
1. **Curated story text** per track — written by the team from the NASA caption/source; every claim traceable to the source (no unsourced climate facts).
2. **Auto summary** per frame — generated by rules from `FrameFeatures` (e.g., "Highest values are concentrated on the right side; about 30 % of the frame has no data"). It may only state what the features support. Region names are used only when projection metadata is declared.

---

## 9. Frame Analysis System

Pure, deterministic functions (no randomness, no DOM inside the analysis core).

1. **Input:** a decoded frame `{ width, height, rgba[] }`, an optional crop rectangle (to exclude colourbars, badges, timestamps burned into EIC frames), optional legend, track metadata.
2. **Valid-pixel mask:** transparent/background/legend-unmatched pixels → no data.
3. **Downsample** to a grid (default 36 × 18, configurable): per-cell mean of valid pixels' values + valid fraction.
3b. **Explore grid (D1):** aggregate the analysis grid into the coarse Explore grid (track setting `exploreGrid`, default 10 × 8): cell value = mean of valid analysis cells; a cell is **no-data** when its valid fraction is below `noDataThreshold` (0.5, D7). Limitation to state on the About page: each cell is an average over a large area when the frame is global, so the "warmest cell" is not the warmest pixel.
4. **Features (`FrameFeatures`):** per-column and per-band means, global mean (area-weighted only when projection is declared), min/max values and locations, variability, valid fraction.
5. **Output:** features → mapping → `SoundScore` (list of timed note events).

**Practical notes**
- EIC frames may come from videos/animations: frames are **extracted ahead of time** into image files (script in `scripts/`) and bundled with the app (same-origin) so the browser canvas can read pixels without cross-origin restrictions.
- Cropping/masking is per-track metadata; never hardcoded in code.
- Image sizes should be reduced before analysis; the analysis must run fast enough for "real-time" feel (target: noticeably instant on a mid-range phone; measure, don't assume).

---

## 10. Content: Tracks and Data Sources

**Resources are released 13 Nov.** Until then:
- Do **not** assume which datasets, visualizations, or legends exist.
- Pre-event development uses **synthetic test frames** (generated gradients/patterns), clearly marked as test fixtures and never presented as NASA content.

**Track selection criteria (decide 13 Nov):**
- Official EIC visualization or frames available from the Resources tab (or a source it links).
- Licence/usage terms checked and credit text recorded.
- A legend/colourbar available (preferred) so values can be decoded.
- Variety: aim for 3–5 tracks (e.g., ocean temperature, a second ocean/atmosphere variable, and one contrasting topic) with at least one multi-frame time series.
- **Ocean Symphony** is the first-choice track *if* a suitable EIC ocean visualization exists in the resources; otherwise the team picks the closest available theme.

**Per track, record:** title, source name/URL, credit/licence note, frame list with date labels, legend (if any), crop rectangle, projection/extent (if known), `diverging` flag, story text, "why these sound choices" note.

---

## 11. Accessibility Requirements

Accessibility is a **core theme** of the challenge, so these are acceptance criteria, not polish.

1. Fully operable by **keyboard**; logical focus order; visible focus; no keyboard traps.
2. **Screen reader** support: semantic HTML first; ARIA only where needed; every control has an accessible name, role, and state; status changes (play/pause, track/frame changes) announced politely via a live region, without spamming.
3. Audio starts only on user action; **Stop/Pause always reachable** with a single, predictable control (and a documented shortcut).
4. Safe sound: limiter, moderate default volume, no sudden loud sounds; volume and speed controls.
5. All meaning conveyed by sound has a **text equivalent** (legend, description, status).
6. Target **WCAG 2.2 AA** for the interface (contrast, target size, text resize, reflow). Colours/layout belong to the developer's design; report issues, don't restyle.
7. Respect `prefers-reduced-motion`; no flashing content.
8. Works on **mobile** (volunteers likely use TalkBack/VoiceOver) and desktop (NVDA/VoiceOver).
9. Plain, concise language; terminology explained.
10. Screen-reader speech vs. sonification overlap is handled by user settings: **Announcements** (Short / Detailed / Sound only) and **Play a tone when I move** (on/off), plus explicit sound buttons. Defaults are validated with testers.
11. **Map grid and assistive tech (D2):** the grid is one described element; individual cells are hidden from assistive tech and are never tab stops. The AT path is sliders, direction buttons, and jump actions. Touch/drag on the grid serves low-vision and sighted users; arrow-key support on the focused grid is P1.
12. **Section navigation (D4):** simple navigation buttons with `aria-current`, one section shown at a time; no ARIA tab pattern in P0.
13. **Sound toggle (D6):** the header toggle is a global mute; pressing any explicit sound button while it is Off turns Sound on, plays, and announces "Sound turned on".

---

## 12. UI/UX Direction

**The UI/UX design is owned by the project developer.** This plan defines **functional requirements** only. The element-by-element mapping of the supplied design to functions is in `UI_FUNCTION_MAP.md`.

**Tokens (D9, D14):** the **light theme is final**; token names and values come from `DESIGN.md` ("Abyssal Sonics Light"), with the approved decisions P1–P8 overriding it where they differ (details, measured contrast, and the list of `DESIGN.md` problems are in `UI_FUNCTION_MAP.md` §0).

Screens/areas needed (layout to be supplied by the developer):

| Area | Purpose | Key working controls |
|---|---|---|
| Home / Intro | Explain the idea and how to listen; start audio | "Start audio", skip to tracks, text explanation of legend |
| Track Library | Choose a track | Track list with title, short description, credit |
| Explorer controls | Play and explore a frame's sonification | Sweep whole map, Stop all sound, Hear overview, Hear this cell, Sweep this row, jump actions, Speed, Volume, Invert, Play-a-tone-when-I-move |
| Description panel | Read what the frame shows/sounds like | Story text, auto summary, source credit, limits note |
| About / Method | The "why" and the algorithm | Mapping explanation, honest limits, credits |
| Explorer sections | Audio Map in four sections: Explore, Sound guide, Settings, About (simple navigation buttons) | Per `UI_FUNCTION_MAP.md` |

Required content in the UI: **source credit for every NASA frame**, the "visual translation vs. calibrated data" label, and a statement of limits.

---

## 13. Technical Architecture

**First action: inspect the repository** and adopt its actual stack. If empty, recommended default (confirm with the team):

| Concern | Default | Rationale |
|---|---|---|
| App | **Vite + React + TypeScript** (static client-side app) | Simple, fast, easy static hosting; a Next.js static setup is acceptable if the team prefers |
| Audio | **Web Audio API** (no extra dependency) | Real-time synthesis; fewer moving parts |
| Styling | Developer-supplied design/tokens (Tailwind if the repo uses it) | UI is developer-owned |
| Tests | **Vitest** for analysis/mapping/narration | Highest-value test surface |
| Assets | Pre-extracted frames bundled under `public/` | Same-origin pixel access |
| Hosting | Static hosting (platform TBD) | No backend |

Everything runs client-side: **no backend, no accounts, no live NASA API calls in MVP.**

### 13.1 Layering

```
data/       track catalogue, mapping profiles, scales, strings (plain, typed)
types/      TypeScript types
core/       PURE: analysis (frame → features), mapping (features+profile → SoundScore), narration (features → text)
audio/      side-effect layer: Web Audio engine that plays a SoundScore
store/      app/player state (minimal)
hooks/      adapters between core/audio and React
components/ presentation (developer's design)
scripts/    offline tools (frame extraction etc.), not part of the runtime
```

### 13.2 Key decisions
1. **Core is pure and deterministic** — same frame + same profile → identical `SoundScore` (JSON-equal). No `Math.random`, no time dependence.
2. **`SoundScore` is the contract** between mapping and audio: the audio engine only plays it, and the same score can later be exported to WAV or described in text.
3. **Real-time = generated in the browser on selection/play**, not pre-recorded audio files.
4. **Data-driven:** tracks, scales, and mapping profiles are data; tuning with testers needs no code change.
5. **Strings externalised** from the start for later Indonesian/English UI.
6. **Audio engine details** (to verify on real devices): create/resume the audio context only after a user gesture; master gain → limiter (compressor) → output; lookahead scheduling for timing stability.

### 13.3 File structure (target)

```
src/
  core/{analysis,mapping,narration}.ts
  audio/engine.ts
  data/{tracks,profiles,scales,strings}.ts
  types/{track,frame,sound}.ts
  store/  hooks/  components/  app/ (or pages)
scripts/            # e.g. frame extraction
public/tracks/<id>/ # bundled frames
docs/ASSUMPTIONS.md
```

---

## 14. Data Models (specification sketch — not implementation)

```
Track          { id, title, summary, storyText, variable, units?, source{name,url,credit,licenseNote},
                 frames: FrameRef[], legend?: LegendEntry[], cropRect?, projection?: {type, extent},
                 diverging: boolean, valueRange: {min,max}   // required, fixed per track (D7), valueBasis: 'decoded-legend' | 'relative-intensity',
                 profileId, whyNotes,
                 exploreGrid: {cols, rows},                       // default 10 × 8 (D1)
                 extremeLabels: {max, min},                       // e.g. 'warmest' / 'coolest'
                 guideText: {low, middle, high, noData},
                 aboutText: {canTell, cannotTell} }
FrameRef       { id, src, label (e.g. date), width, height }
LegendEntry    { rgb: [r,g,b], valueMin, valueMax }
FrameFeatures  { grid: {cols,rows,values[],validFraction[]}, columnMeans[], bandMeans[3],
                 globalMean, min:{value,col,row}, max:{value,col,row}, variability[], validFraction }
MappingProfile { id, name, scaleId, octaves, bands:[{timbre, registerOffset}], sweepSeconds, panWidth,
                 maxVoices, invert, divergingReference?,
                 noDataThreshold, levelThresholds, cellToneSeconds, overviewSeconds, referenceToneSeconds }
SoundScore     { totalSeconds, events: [{ tSec, durSec, freqHz, gain, pan, voice, kind: 'note'|'accent'|'drone' }],
                 meta: { trackId, frameId, profileId } }
Description    { story: string, summary: string[] }
ExploreGrid    { cols, rows, values[], noData[] }
CellReading    { row, col, isNoData, level, valueText?, freqHz?, pan? }
Settings       { volume, speed, announcements: 'short'|'detailed'|'sound-only', invert, moveTones }
PlayerState    { trackId, frameIndex, cursor:{row,col}, playback, soundEnabled, activeSection }   // UI state only
```

---

## 15. MVP Scope

### P0 — Mandatory
- Static web app with working navigation.
- Track library with **3–5 tracks** built from real EIC resources (once available) with credits and story text.
- Frame analysis → mapping → real-time Web Audio playback (Sweep).
- Audio legend (low / mid / high / no-data).
- Description panel (curated + auto summary) readable by screen readers.
- Explorer per the supplied design (`UI_FUNCTION_MAP.md`): Explore grid with sliders and direction buttons, jump actions, Hear this cell, Sweep this row, Sweep whole map, Hear overview, Stop all sound.
- Settings: Announcements (Short / Detailed / Sound only), volume, speed, invert pitch, play-a-tone-when-I-move.
- Prev/next frame (only if a track has multiple frames).
- Full keyboard operation and screen-reader labelling; safe audio defaults.
- "Method / limits" page and per-track source credits.
- Engine unit tests (determinism, mapping monotonicity, no-data → rest).
- At least one **BLV tester session** with documented feedback and changes made.

### P1 — Important (only after P0 is finished and tested)
Arrow-key navigation on the focused grid · time-lapse across frames · WAV export · Indonesian UI · second mapping profile · compare mode.

### P2 — Optional
Haptic/tactile feedback (device-dependent) · richer instrument design · user-supplied frames · ML-based mapping · AI voice assistant · live NASA data fetching.

**Never start P1/P2 while any P0 item is unfinished.**

---

## 16. Co-design and Testing Plan (BLV volunteers)

**Principles:** voluntary participation, informed consent, respect for testers' time (and compensation/appreciation where appropriate), anonymised notes, and changes made visibly in response to feedback. Do not test "to tick a box."

**Session structure (~20–30 min each):**
1. Brief explanation of the idea (no mapping details at first).
2. **Task A — cold listen:** play a track, ask what they think it represents.
3. Teach the legend; **Task B:** is the higher part on the left or right? Which of two frames is higher overall?
4. **Task C (if Explore exists):** find the highest region.
5. **Task D — operation:** start, pause, change speed, switch track using their own screen reader/keyboard/phone.
6. Questions: clarity, pleasantness, fatigue, polarity preference, what's missing, what to remove.

**What to record:** task success/failure and notes (not personal data), preference choices, quotes with permission, and the **resulting design changes**.

**Schedule:** Session 1 before the event (pre-event prototype with synthetic frames, if permitted); Session 2 during the event with real tracks.

---

## 17. Development Roadmap (dates in 2026)

| When | Goal | Exit criteria |
|---|---|---|
| **Mon 9 Nov** | Confirm team + challenge; ask Local Lead the open questions (Appendix A); finalize this plan; inspect/set up repo | Decisions logged; repo ready |
| **Tue 10 – Thu 12 Nov** *(if pre-event work is allowed)* | Types, core analysis/mapping/narration on **synthetic fixtures**, audio engine, accessible app shell; draft deck/proposal skeletons; BLV Session 1 on the sound mapping | Core tests pass; a synthetic frame plays and can be controlled by keyboard |
| **Fri 13 Nov** | Resources released: inventory, check licences, choose 3–5 tracks, extract frames, record legends/crop rects | Track list + credits recorded in `docs/ASSUMPTIONS.md` |
| **Sat 14 Nov** | Integrate real frames; tracks, story text, descriptions; complete P0 | P0 playable end-to-end with real frames |
| **Sun 15 Nov** | BLV Session 2, fixes, polish, record video, finalise deck/proposal, **submit** | Submission complete with buffer before deadline |

If pre-event coding is **not** allowed, Tue–Thu is limited to planning, design, volunteer protocol, and submission-kit drafts; build starts 14 Nov and P1 is dropped.

**Submission kit** (owners to be assigned): working prototype/demo link · source repo · short promo video (problem → demo → why it matters) · pitch deck · project proposal/method document (the "why", algorithms, limits) · credits and data attributions. **Official submission requirements are to be confirmed** from the event pages (Appendix A).

---

## 18. Storytelling and Documentation

- "Why this sound" notes per track (artistic choices, scale, timbre).
- A Method page: how frames become sound, with plain-language explanation and limits.
- Emotional framing: each track's story text should connect change to human meaning, **using only claims supported by its NASA source**.
- Demo script (90 s): open app → start audio → legend → play Ocean Symphony → read description → compare two frames → mention tester feedback and what changed.

---

## 19. Risks and Limitations

| Risk | Impact | Mitigation |
|---|---|---|
| Resources unavailable until 13 Nov | Late integration | Build on synthetic fixtures; keep tracks data-driven; reserve Sat for integration |
| Legend missing → can't decode real values | Mapping less rigorous | Support "relative intensity" mode with an honest label |
| Frames contain burned-in text/colourbars/badges | Analysis errors | Per-track crop/mask metadata |
| Sound is chaotic or fatiguing | Poor experience | Scale quantisation, voice limit, limiter, tester feedback |
| Screen-reader speech conflicts with audio | Unusable for target users | Explicit Play, ducking/pausing rules, tester validation |
| Browser/device audio differences (autoplay rules, mobile quirks) | Demo failure | Test on real iOS/Android/desktop early; explicit start button |
| BLV tester availability | Weak evidence | Schedule now; run a small session pre-event |
| Licensing/attribution of frames | Compliance issues | Record source and credit per track; check usage terms |
| Scope creep (3D globe, ML, voice assistant) | Unfinished P0 | Strict P0/P1/P2 gate |
| Overclaiming science | Credibility loss | "Interpretation, not measurement" notice; claims only from sources |
| Other teams' similar ideas | Less distinctive | Lean on co-design evidence, explainability, and accessibility quality |

**Features to avoid:** 3D globes, ML generation, voice assistants, backend/accounts, live API fetching, unsupported scientific claims, any control that doesn't work.

---

## 20. Definition of Done

- [ ] Static app runs without a backend; navigation works.
- [ ] 3–5 tracks built from real, credited EIC resources; each states its value basis (decoded legend vs. relative intensity).
- [ ] Selecting a track and pressing Play produces sound generated in the browser from the frame.
- [ ] Same frame + profile → identical `SoundScore` (test-verified).
- [ ] Audio legend works; silence = no data is explained.
- [ ] Explorer works end to end: sliders, direction buttons, jumps, and touch/drag move the same cursor; Hear this cell, Sweep this row, Sweep whole map, Hear overview and Stop all sound work; settings (announcements, volume, speed, invert, move tones) behave as specified.
- [ ] Map cells are hidden from assistive tech and are never tab stops; the grid has one text alternative.
- [ ] Descriptions (story + summary) are present and screen-reader readable; every claim traceable to a source.
- [ ] Entire app is operable with keyboard only and with a screen reader (verified manually, results recorded).
- [ ] Audio never autoplays; Stop/Pause always reachable; limiter and safe defaults in place.
- [ ] At least one BLV tester session documented, with design changes made from the feedback.
- [ ] Method/limits page and per-track credits visible.
- [ ] Submission kit complete (demo, repo, video, deck, proposal) by the official deadline.
- [ ] No fake data presented as NASA data; no non-functional controls.

---

## Appendix A — Open Questions (to resolve before/at the start)

1. **Local Lead:** may code/prototypes be prepared before 14 Nov? May pre-event planning, design and volunteer testing be done?
2. **Official submission requirements** and judging criteria; submission deadline and time zone.
3. **Resources (13 Nov):** which EIC visualizations/frames, formats, legends, licences exist? Is an ocean temperature visualization included?
4. **Team:** size, roles (developer(s), audio/sound design, accessibility liaison, writer/designer), and who runs volunteer sessions.
5. **Stack and repo:** is a repository already initialised? Confirm Vite + React + TS or the team's preference.
6. **Hosting** platform for the demo link.
7. **Target devices/browsers** for testing (volunteers' phones and screen readers).
8. **UI language** for submission (English required? Indonesian as P1?).
9. **Volunteer consent and recording policy** (what is recorded, how it's stored, what is shown publicly).

---

## Appendix B — Design Decisions (v2, approved by the developer)

| # | Decision |
|---|---|
| D1 | Explore grid (default 10 × 8) is separate from the analysis grid and built by aggregating it; all P0 sounds use the Explore grid; no-data cells by a valid-fraction threshold; the averaging limitation is stated in About |
| D2 | Grid cells are hidden from assistive tech; one described element; AT path is sliders, direction buttons, jump actions; arrow keys on the grid are P1 |
| D3 | Overview (~10 s, single voice) and Sweep whole map (full detail) are both kept and defined distinctly; merge if testers confuse them |
| D4 | Section navigation uses simple buttons with `aria-current`, one section at a time, no tab roles; compare with an accordion in testing |
| D5 | ~~One derived panel colour `#092737`~~ — superseded by D9 |
| D6 | Explicit sound buttons turn Sound on and play; new Settings switch "Play a tone when I move" |
| D7 | No-data threshold 0.5; levels = thirds of a fixed per-track value range (diverging: ±⅓ of the maximum absolute value); reference tones at level midpoints |
| D8 | Three bands from Explore-grid rows (8 → 3+2+3); one pitch mapping for all bands, timbre differs; neutral overview voice; fallback = sequential sweeps |
| D9 | Light theme is final; tokens come from the design file; symbols and non-text need 3 : 1; cell meaning never by tint alone |
| D10 | Sticky bar: measured with a ResizeObserver; sticks only while its height ≤ 25 % of the viewport height, otherwise flows with the page; bottom padding and `scroll-padding-bottom` equal the bar height |
| D11 | No custom keyboard shortcuts in P0; `Escape` = Stop all sound is a P1 candidate after testing |
| D12 | A different sound button replaces the current sound; the same button restarts it; speed applies to the next playback, volume applies immediately |
| D13 | Initial durations: cell tone 0.5 s, reference tone 1.0 s, overview 10 s base, whole-map sweep 12 s base, row sweep 0.4 s per cell; drag tones throttled to one per 120 ms; all tunable in the profile and checked with testers |
| D14 | `DESIGN.md` proposals P1–P8 approved: primary `#006067`; safe hover states; Stop = error red with label and icon; grid symbols from DESIGN.md tokens; essential text ≥ 14 px; control borders `#6e797a`; page `#faf8ff` + white panels; Space Grotesk bundled; 3 px focus ring |

**Scope change:** Explore, Overview, Jump actions, and Invert moved from P1 to P0.

**Still open:** designs for the Track Library, error/loading/empty states, and the move-tones switch.
