# UI_FUNCTION_MAP.md — Earth Jukebox "Audio Map"

> Maps every element of the developer's supplied UI design to the component, data, engine function, and behaviour that must back it.
> **Authority:** subordinate to the developer's designs, `PROJECT_PLAN.md`, and `AGENTS.md`. Where this file proposes something the plan does not cover, it is marked **[NEEDS APPROVAL]** and must be confirmed before implementation.
> **Rule:** no element in this file may be implemented with hardcoded values. Everything shown comes from track data or pure engine functions in `core/`.
>
> **Version 2:** the developer has approved decisions **D1–D6** (see §14). They are incorporated below. Items still marked **[NEEDS APPROVAL]** remain open.
> **Design source:** the Audio Map screen (mobile 375 px, 200 % zoom) and its annotation document. Screens not yet designed are listed in §12.

---

## 0. Design Tokens — `DESIGN.md` "Abyssal Sonics Light" (light theme final, D9)

> **Status:** the token file has been supplied as `DESIGN.md` (YAML front matter + prose). It is the source of token **names and values**. Agents read it, map the YAML tokens to CSS variables / the Tailwind theme once, and never hardcode hex values in components. The earlier dark palette and the sampled screenshot values are superseded.
> `DESIGN.md` contradicts itself in places and some of its accessibility claims are inaccurate (§0.2). Proposals **P1–P8 (§0.4) are approved (D14)** and override `DESIGN.md` wherever they differ.

### 0.1 Tokens this app uses (YAML front matter)

| Role | Token | Hex |
|---|---|---|
| Page background | `background` / `surface` | `#faf8ff` |
| Panel surface | `surface-container-lowest` | `#ffffff` |
| Subtle containers | `surface-container-low` / `surface-container` | `#f2f3ff` / `#eaedff` |
| Text | `on-surface` / `on-surface-variant` | `#131b2e` / `#3e494a` |
| Primary (buttons, accents) | `primary` / `on-primary` | `#006067` / `#ffffff` |
| Primary container | `primary-container` | `#007b83` |
| Secondary | `secondary` | `#006781` |
| Tertiary (warm accent) | `tertiary` / `tertiary-container` | `#903f00` / `#b45309` |
| Error | `error` / `on-error` | `#ba1a1a` / `#ffffff` |
| Outline | `outline` / `outline-variant` | `#6e797a` / `#bdc9ca` |
| Tints (decorative) | `primary-fixed`, `secondary-fixed`, `tertiary-fixed` | `#96f1fa`, `#b9eaff`, `#ffdbca` |
| Text on tints | `on-primary-fixed-variant`, `on-secondary-fixed-variant`, `on-tertiary-fixed-variant` | `#004f54`, `#004d62`, `#763300` |
| Font | Space Grotesk (all roles) | see §0.4 P7 |
| Radius | `DEFAULT` 0.5 rem · `lg` 1 rem | |
| Mobile spacing | margin 1 rem · gutter 1 rem | |

### 0.2 Problems found in `DESIGN.md`

1. **Two primaries.** YAML `primary` is `#006067`; the prose says "Primary Teal `#007b83`" (which is YAML `primary-container`). The exported design screenshots used `#006067`.
2. **Three base-surface definitions.** YAML `#faf8ff`; prose root `#ffffff` with cards `#f8fafc`; screenshots used page `#F8FAFC` with white panels.
3. **Prose-only hex values** not in the YAML: `#0e7490`, `#0d9488`, `#d97706`, `#f8fafc`, `#f1f5f9`, `#e2e8f0`, `#0f172a`, `#1e293b`, `#334155`.
4. **Accessibility claims that are not true** (computed): "Primary Teal `#007b83` meets AAA (7 : 1)" → actual **5.05 : 1** (AA). "Solar Gold `#b45309` ≈ 7.3 : 1" → actual **5.02 : 1** (AA). "Exceeds AAA across all tokens" is false (see below). Do not repeat these claims anywhere.
5. **Failing combinations:** hover `#0d9488` with white text = **3.74** (fails 4.5); alert hover `#d97706` with white text = **3.19** (fails); input/hairline border `#e2e8f0` on white = **1.23** (fails 3 : 1 for control boundaries); `label-sm` is **11 px** and `label-md` **12 px** (below the 14 px minimum this project uses for readable text).
6. **Wording from another concept** (hydrophone, telemetry, sonar, "live streaming signal badges") must not appear in UI copy.

### 0.3 Computed contrast (WCAG formula)

| Pair | Ratio | Verdict |
|---|---|---|
| `#006067` on `#ffffff` (white on `#006067`) | **7.32** | ✅ AAA |
| `#007b83` on `#ffffff` | **5.05** | ✅ AA text |
| `#0e7490` on white (checkbox border) | **5.36** | ✅ |
| `#b45309` on white / white on `#b45309` | **5.02** | ✅ AA |
| White on `#ba1a1a` (error) | **6.46** | ✅ |
| `#131b2e` on `#faf8ff` | **16.29** | ✅ |
| `#3e494a` on `#faf8ff` | **8.83** | ✅ |
| `#334155` on `#f1f5f9` | **9.45** | ✅ |
| `#6e797a` (outline) on `#ffffff` / `#faf8ff` | **4.49 / 4.26** | ✅ for non-text (≥ 3), ❌ for small text |
| `#bdc9ca` (outline-variant) on white | **1.70** | ❌ decorative only |
| `#e2e8f0` on white | **1.23** | ❌ decorative only |
| `#0d9488` on white (focus/hover) | **3.74** | ✅ non-text, ❌ text |
| `#d97706` on white | **3.19** | ✅ non-text, ❌ text |
| Symbol on tint, **DESIGN.md tokens only**: `#763300` on `#ffdbca` | **7.24** | ✅ (`#903f00`: 5.61) |
| `#004d62` on `#b9eaff` | **7.27** | ✅ |
| `#004f54` on `#96f1fa` | **7.24** | ✅ |
| `#6e797a` on `#eaedff` (no-data symbol) | **3.86** | ✅ non-text |
| Tints against each other (`#ffdbca` / `#b9eaff` / `#96f1fa`) | **≈ 1.0** | ❌ not distinguishable — cells must be read by **symbol shape and text** |
| White on `#004f54` (proposed hover) | **9.35** | ✅ |
| White on `#93000a` (proposed error hover) | **9.35** | ✅ |

### 0.4 Approved decisions P1–P8 (D14) — these override `DESIGN.md` where they differ

| # | Proposal | Reason |
|---|---|---|
| P1 | **Primary buttons use YAML `primary` `#006067`** with white text; `#007b83` only for large fills and graphics | 7.32 vs 5.05; matches the screenshots |
| P2 | **Hover/active states keep ≥ 4.5 : 1 with their text**: primary hover `#004f54` (9.35) instead of `#0d9488` (3.74) | Hover must not break text contrast |
| P3 | **"Stop all sound" uses `error` `#ba1a1a`** (white text, 6.46; hover `#93000a`), with label and icon — not the amber "Solar Alert" | Amber is also the "warm" data colour; avoid a collision. Colour is never the only cue |
| P4 | **Grid cells use DESIGN.md tokens only:** warm → `tertiary-fixed` bg + `#763300` symbol; cool → `secondary-fixed` bg + `#004d62`; mid/teal → `primary-fixed` bg + `#004f54`; no-data → `surface-container` bg + `outline` symbol. Meaning still comes from symbol shape and text | All pairs ≥ 3 : 1 (most ≥ 7) |
| P5 | **Minimum 14 px for any text a user must read**; `label-sm` (11 px) and `label-md` (12 px) are not used for essential text | Low-vision target users |
| P6 | **Control boundaries** (sliders, segmented controls, switch, cell grid lines, inputs) use `outline` `#6e797a` (≥ 3 : 1); hairline `#e2e8f0` only for decorative card borders | WCAG non-text contrast |
| P7 | **Single base-surface rule:** page = `background` `#faf8ff`, panels = `surface-container-lowest` `#ffffff` (confirm vs the screenshots' `#F8FAFC`). **Space Grotesk is bundled with the app** (no runtime request to a font CDN) with a system fallback stack — adding the font files needs approval; test legibility with low-vision volunteers | Static client-only app; consistency |
| P8 | **Focus ring: 3 px `primary` with a 2 px white offset** (DESIGN.md specifies 2 px / 2 px offset) | Stronger for low-vision users |

### 0.5 Rules that follow (apply now)

1. Text ≥ 4.5 : 1 (≥ 3 : 1 only for large text). Meaning-carrying graphics ≥ 3 : 1.
2. **Cell meaning is carried by symbol shape and text.** Tints are decoration only.
3. No dark mode in P0.
4. Disabled controls: `aria-disabled` with a visible reason, not reduced opacity alone.
5. Never repeat DESIGN.md's "AAA" claims; measure instead.
6. **P7 font:** bundling Space Grotesk with the app is approved; include the font's licence file and confirm the licence terms before adding it; provide a system fallback stack; no runtime request to a font CDN.
7. Any colour, hover state, or label size not covered by `DESIGN.md` or P1–P8 requires asking the developer.

---

## 1. State Model (what the UI reads/writes)

Stored (minimal, per `AGENTS.md` §5):

| State | Type | Default | Notes |
|---|---|---|---|
| `trackId` | string | first track | selected track |
| `frameIndex` | number | 0 | single frame in P0 Explorer |
| `cursor` | `{row, col}` (1-based) | `{1,1}` | selected grid cell |
| `soundEnabled` | boolean | true | header "Sound: On/Off" (preference, not audio-context state) |
| `playback` | `'idle' \| 'overview' \| 'row-sweep' \| 'map-sweep' \| 'cell' \| 'guide'` | `'idle'` | what is currently sounding |
| `volume` | 0–100 | 80 | |
| `speed` | `0.5 \| 1 \| 1.5` | 1 | |
| `announcements` | `'short' \| 'detailed' \| 'sound-only'` | `'short'` | |
| `invert` | boolean | false | |
| `moveTones` | boolean | true | Settings: "Play a tone when I move" (D6) |
| `activeSection` | `'explore' \| 'guide' \| 'settings' \| 'about'` | `'explore'` | UI only |

Derived (never stored): `FrameFeatures`, explore grid, `CellReading`, `SoundScore`s, descriptions.

Settings (`volume`, `speed`, `announcements`, `invert`, `moveTones`) may be persisted under `jukebox:v1:settings` (validated on load, `try/catch`, safe fallback). No personal data.

---

## 2. Engine Functions Required (pure, in `core/`)

| Function | Purpose | Used by |
|---|---|---|
| `analyzeFrame(frame, track)` → `FrameFeatures` | value grid + extrema + validity | everything |
| `buildExploreGrid(features, track.exploreGrid, profile.noDataThreshold)` → `ExploreGrid` | Aggregates the finer analysis grid into the coarse Explorer grid (default 10 × 8, D1): cell value = mean of valid analysis cells; a cell is **no-data** when its valid fraction is below `noDataThreshold` (default 0.5, approved D7) | grid, sliders, D-pad, **all sounds in P0** |
| `readCell(grid, cursor, track, profile)` → `CellReading` | `{row, col, isNoData, level, valueText?, freqHz?, pan?}` | readout card, announcements |
| `cellTone(reading, profile)` → `NoteEvent` | one tone for a cell | Hear this cell, drag, sliders, D-pad |
| `findExtremeCell(grid, 'max' \| 'min')` → `{row, col}` | jump targets; tie-break: first in row-major order | Jump actions |
| `buildRowSweepScore(grid, row, profile)` → `SoundScore` | sweep one row west→east | Sweep this row |
| `buildMapSweepScore(grid, profile)` → `SoundScore` | full-detail sweep, three band voices (plan §8.2 profile), built from the Explore grid (D3) | Sweep whole map |
| `buildOverviewScore(grid, profile)` → `SoundScore` | short summary: single voice (column means), ~10 s (D3) | Hear overview |
| `referenceTones(profile, track)` → `{low, middle, high}` notes | sound guide | Sound guide |
| `describeCell(reading, mode, track)` → string | live-region text by announcement mode | announcements |
| `summarizeFrame(features, track)` → string | overview summary sentence; only states what features support | Audio Overview card |

All are deterministic and JSON-serialisable. All pitch decisions (including `invert`) happen here, so cell tones, sweeps, overview, and guide tones are always consistent.

**D1 — one grid for all sounds:** in P0 every sound (cell, row sweep, map sweep, overview, reference tones) is built from the **Explore grid**. The finer analysis grid is used only to compute the Explore-grid cell means.

---

## 3. Global Elements

| ID | UI element | Component | Data / engine | Behaviour | Accessibility / announcement | Status |
|---|---|---|---|---|---|---|
| G-01 | Back arrow (header) | `HeaderBackButton` | — | Returns to the Track Library. Stops all sound first. | Accessible name "Back to track list" | P0 — **Track Library not designed (§12)** |
| G-02 | App title "Earth Jukebox — Audio Map" | `h1` | `strings` | Static | The page's only `h1` | P0 |
| G-03 | "Sound: On/Off" toggle | `SoundToggle` | `soundEnabled` | Global mute. Off → stops current sound and silences everything. **Pressing any explicit sound button while Off turns Sound on, plays the sound, and announces "Sound turned on"** (D6). The first sound button press creates/resumes the audio context (user gesture). | `aria-pressed`; announces "Sound on"/"Sound off" | P0 |
| G-04 | Intro line "Sound starts only when you press a sound button. Stop all sound is always available." | `InfoBanner` | `strings` | Static text | Read in normal order | P0 |
| G-05 | Value-basis badge | `ValueBasisBadge` | `track.valueBasis` → "Decoded from legend" / "Visual translation" | Exactly **one** badge per track | Plain text (not a live region) | P0 |
| G-06 | Track title | `h2` | `track.title` | Static | Heading level 2 | P0 |
| G-07 | Source line "NASA EIC frame — [dataset] — [date]" | `SourceLine` | `track.source`, `frame.label` | Static; never hardcoded | Text | P0 |
| G-08 | Translation notice | `NoticeBox` | `strings[valueBasis]` | Different wording per `valueBasis`; never claims calibration for `relative-intensity` | Text | P0 |
| G-09 | Section navigation (Explore / Guide / Settings / About) | `SectionNav` | `activeSection` | **D4:** simple navigation buttons, **not** an ARIA tab pattern. Only the active section is rendered; heading structure is preserved. Focus stays on the pressed button; announce "Showing {section}". An accordion variant is compared in volunteer testing. | `nav` with an accessible name; buttons with `aria-current="true"` on the active one; no `tablist`/`tab` roles | P0 |
| G-10 | Sticky bar | `PlaybackBar` | see B-01/B-02 | Visible on Explore only. **D10:** measured with a `ResizeObserver`; sticky only while its height ≤ 25 % of the viewport height, otherwise it flows at the end of the section. While sticky, reserve bottom padding and `scroll-padding-bottom` equal to the bar height so focused content is never hidden. | `footer`/region with an accessible name | P0 |

---

## 4. Explore Section

### 4.1 Audio Overview card

| ID | UI element | Component | Data / engine | Behaviour | Accessibility | Status |
|---|---|---|---|---|---|---|
| X-01 | "10 seconds" chip | `DurationChip` | `score.totalSeconds` | Shows real duration of the overview score | Text | P0 |
| X-02 | **Hear overview** button | `Button` | `buildOverviewScore` | Plays the overview; pressing again while playing stops it. Sets `playback='overview'`. Disabled/blocked if `soundEnabled=false` (announce reason). | Name "Hear overview"; announces "Playing overview" / "Overview finished" | P0 (plan update: was P1) |
| X-03 | Summary text | `SummaryText` | `summarizeFrame` | Text generated from features only; region words ("right side") only from grid columns; named geography only if the track declares projection/extent | Static text, readable | P0 |

> **D3 approved — Overview vs. Sweep whole map:** *Overview* = short (~10 s), single-voice summary built from column means; answers "what is the big picture?". *Sweep whole map* = full-detail sweep with the 3-band voices, length from `speed`; answers "what does the map look like in detail?". If volunteers confuse them, merge into one button with a Simple/Full option in Settings.

### 4.2 Map grid

| ID | UI element | Component | Data / engine | Behaviour | Accessibility | Status |
|---|---|---|---|---|---|---|
| M-01 | Grid heading "10 × 8 map grid" | `h3` | `grid.cols × grid.rows` | Numbers from the grid, not typed | Heading | P0 |
| M-02 | Axis labels (West/Equator/East) | `GridAxisLabels` | `track.projection/extent` | Shown **only** if the track declares projection/extent; otherwise generic "left / right / upper / lower" | Text | P0 |
| M-03 | Cell grid (symbols + cursor) | `MapGrid` | `ExploreGrid`, `cursor` | Each cell shows the symbol for `level` (pattern, not colour alone); no-data cell is visibly distinct. Pointer/touch: tap selects a cell; drag moves the cursor. A tone plays on each cell change (throttled, previous tone replaced, no stacking) **only when `moveTones` is on**. **Announce only on pointer-up** to avoid spam. | **D2 approved:** the grid is exposed to assistive tech as one element with a text alternative built from real dimensions (e.g. "{rows} by {cols} map. Use the sliders or move buttons to explore."); **individual cells are hidden from AT** (`aria-hidden`, never tab stops). The AT path is sliders, direction buttons and jump actions. Optional arrow-key support on the focused grid is P1, tested with volunteers. | P0 |
| M-04 | Instruction "Touch a square or use sliders below" | `HelperText` | `strings` | Static | Text | P0 |
| M-05 | "Visual symbols on" label | `HelperText` | `strings` | Static (the old "Tactile patterns" wording is removed; no haptics exist) | Text | P0 |
| M-06 | Cursor indicator ("Row 5, Column 8" chip) | `CursorChip` | `cursor` | Mirrors cursor | Text; not a live region | P0 |

### 4.3 Coordinate sliders

| ID | UI element | Component | Data / engine | Behaviour | Accessibility | Status |
|---|---|---|---|---|---|---|
| C-01 | Row slider (1–8) | native `input[type=range]` + label | `cursor.row`, `grid.rows` | Changing it moves the cursor, updates readout, and plays the cell tone (debounced). Two-way synced with D-pad/jumps/touch. | `aria-valuetext` "Row 5 of 8"; label text visible | P0 |
| C-02 | Column slider (1–10) | same | `cursor.col`, `grid.cols` | same | `aria-valuetext` "Column 8 of 10" | P0 |

### 4.4 Selected cell card

| ID | UI element | Component | Data / engine | Behaviour | Accessibility | Status |
|---|---|---|---|---|---|---|
| S-00 | Readout "Row 5, Column 8 — high — [2.8] degrees above [baseline]" | `CellReadout` | `readCell` + `describeCell` | **Wording depends on track**: anomaly tracks with a declared baseline/units → "… degrees above/below baseline"; otherwise relative level only ("high"). Never say "above normal" unless the track data declares an anomaly baseline. No-data cell → "no data". | Updates a **polite live region** with text per `announcements` mode | P0 |
| S-03 | **Hear this cell** | `Button` | `cellTone` | Plays the selected cell's tone (fixed short duration, constant in profile). No-data → silence + announces "No data — silence". | Name "Hear this cell" | P0 |
| S-04 | Sound details (expandable) | `Disclosure` | `CellReading` (freqHz, scale degree, pan), `profile` | Shows pitch in Hz, pan position, timbre, and the share of the cell's area that has data — **from the engine** | Native disclosure semantics; collapsed by default | P0 |

### 4.5 Move around the map

| ID | UI element | Component | Data / engine | Behaviour | Accessibility | Status |
|---|---|---|---|---|---|---|
| N-01 | Up / Down / Left / Right buttons | `DirectionPad` | `cursor`, grid bounds | Move cursor by one cell, update readout, play cell tone. At an edge: no movement; announce "Top edge" etc.; label shows the destination or "edge". | Names "Up, row 4" etc.; `aria-disabled` + reason at edges | P0 |
| N-02 | Center "R5, C8 Current" | `CurrentCellText` | `cursor` | Non-interactive text (the duplicate PLAY button is removed) | Text | P0 |
| N-03 | **Sweep this row** | `Button` | `buildRowSweepScore` | Plays selected row west→east using the timbre of the band that contains that row (D8); pan follows column; speed from settings | Announces "Sweeping row 5" / "Row sweep finished" | P0 |
| N-04 | Jump to warmest cell | `Button` | `findExtremeCell(max)` | Moves cursor to max cell (row-major tie-break), plays tone, announces result. **Label word ("warmest"/"highest") comes from `track.extremeLabels`**, not hardcoded | Announces "Warmest cell: Row r, Column c, level" | P0 |
| N-05 | Jump to coolest cell | `Button` | `findExtremeCell(min)` | same with min | same | P0 |
| N-06 | Jump to start (R1, C1) | `Button` | grid bounds | Cursor → (1,1) | Announces new cell | P0 |
| N-07 | Jump to end (R8, C10) | `Button` | grid bounds | Cursor → (rows, cols); labels use real dimensions | Announces new cell | P0 |

> Value-extreme jumps use the **normalised value**, independent of `invert` (invert only changes pitch).

> **Move tones (D6):** tones that play *automatically* on cursor movement (sliders, direction buttons, jumps, tap/drag) play only when `moveTones` is on. **Explicit sound buttons** (Hear this cell, Hear overview, Sweeps, Sound guide) always play, and turn Sound on if it was off.

---

## 5. Sticky Bar (Explore only)

| ID | UI element | Component | Data / engine | Behaviour | Accessibility | Status |
|---|---|---|---|---|---|---|
| B-01 | **Sweep whole map** | `Button` | `buildMapSweepScore` | Starts full sweep; duration = base ÷ `speed`; sets `playback='map-sweep'`. Pressing it again while it is playing restarts it from the start and announces "Sweeping whole map" again (D12). Starting any different sound stops the current one first. | Announces "Sweeping whole map" and "Sweep finished" | P0 |
| B-02 | **Stop all sound** | `Button` | audio engine `stopAll` | Immediately silences everything (overview, sweeps, tones, guide), sets `playback='idle'`. Always enabled. Distinguished by label/icon/outline, not colour. | Announces "All sound stopped" | P0 |

---

## 6. Sound Guide Section

| ID | UI element | Component | Data / engine | Behaviour | Accessibility | Status |
|---|---|---|---|---|---|---|
| U-01 | Low / Middle / High buttons | `GuideButton` | `referenceTones`, `track.guideText` | Each plays its reference tone (~1 s) at the **midpoint of that level** (D7). Middle on a diverging track = the zero/baseline reference. Description text per track from data (e.g., "Cooler than normal ocean water" only where the track supports it). | Announces "Playing Low reference tone — [description]" | P0 |
| U-02 | No data button | `GuideButton` | strings | Plays silence; announces "No data — silence". Must look **active/pressable** (the current design makes it look disabled). | Name "No data, silence" | P0 |
| U-03 | Intro text | `HelperText` | `strings` | Static | Text | P0 |

---

## 7. Settings Section

| ID | UI element | Component | Data / engine | Behaviour | Accessibility | Status |
|---|---|---|---|---|---|---|
| T-01 | Announcements: Short / Detailed / Sound only | `SegmentedControl` (radio group) | `announcements` | Controls text produced by `describeCell`: **Short** "Row 5, column 8, high"; **Detailed** adds value text and notes; **Sound only** = no cell announcements (state changes and errors still announced). Visible readout card always stays. | `role="radiogroup"` with labelled radios; changing announces the mode | P0 |
| T-02 | Volume slider | `input[type=range]` | `volume` → engine master gain | Maps 0–100 to master gain (mapping function in `audio/`, capped for safety); applies immediately to current sound | Label + `aria-valuetext` "80 percent" | P0 |
| T-03 | Playback speed 0.5× / 1× / 1.5× | `SegmentedControl` | `speed` | Scales sweep/overview timelines; **does not change pitch**. Applies to the **next** playback, not the one in progress (D12); announces "Speed 1.5×. Applies to the next sound." | radiogroup | P0 |
| T-04 | Invert pitch switch | `Switch` | `invert` | Recomputes all tones (cell, sweeps, overview, guide) with inverted pitch mapping | `role="switch"` with state; announces "Pitch inverted: cooler is higher" / "Pitch normal" | P0 |
| T-05 | Settings heading | `h3` | `strings` | — | Heading | P0 |
| T-06 | "Play a tone when I move" switch | `Switch` | `moveTones` | On: cursor movement (sliders, direction buttons, jumps, tap/drag) plays the cell tone. Off: movement is silent and only text announcements apply. Explicit sound buttons are unaffected. | `role="switch"`; announces "Move tones on/off" | P0 — **not in the current design: `PLACEHOLDER-LAYOUT` until supplied** |

---

## 8. About Section

| ID | UI element | Component | Data / engine | Behaviour | Accessibility | Status |
|---|---|---|---|---|---|---|
| A-01 | "What it can tell you" / "What it cannot tell you" | `AboutText` | `track.aboutText` (per track) | Text from track data; generic fallback by `valueBasis`. The anomaly-specific wording in the current design must **not** appear on tracks that aren't anomaly data. | Headings + paragraphs | P0 |
| A-02 | Satellite dataset attribution | `AttributionList` | `track.source` (name, URL, credit, licence note) | Every NASA frame is credited; licence note shown where required | Links with descriptive names | P0 |

---

## 9. Announcements and Live Regions

| Region | Content | Politeness |
|---|---|---|
| Cell readout | `describeCell(reading, mode)` on cursor change (not during drag; on pointer-up) | polite |
| Playback status | "Playing overview", "Sweeping row 5", "Sweeping whole map", "All sound stopped", "Overview finished" | polite |
| Reference tones | "Playing Low reference tone — …", "No data — silence" | polite |
| Settings changes | "Pitch inverted…", mode changes | polite |
| Errors (frame failed, audio blocked) | plain-language message + next step | `role="alert"` |

Rules: no announcement for every sound event; no duplicate announcements for the same change; "Sound only" suppresses cell announcements.

---

## 10. Keyboard Behaviour

- All controls reachable in a logical order (header → badge/title → section nav → active section → sticky bar).
- Native elements first (`button`, `input[type=range]`, `details`/disclosure).
- **No custom keyboard shortcuts in P0 (D11).** Everything uses native controls; "Stop all sound" stays visible and reachable. `Escape` = Stop all sound is a P1 candidate, adopted only after volunteer testing and only if it does not clash with the disclosure panel or screen-reader commands; any shortcut is documented on screen.
- Focus is never lost: when a pressed control changes state (e.g., a button becomes "stop"), focus stays on it.

---

## 11. Data and Model Additions Required (deviations from PROJECT_PLAN §14) — approved in principle by D1–D6; items marked "confirm" still need a value

| Addition | Why |
|---|---|
| `Track.exploreGrid: { cols, rows }` (default 10 × 8; plan §9 analysis grid is 36 × 18) — **approved, D1** | Coarse Explore grid distinct from the analysis grid |
| `Track.extremeLabels: { max, min }` (e.g., "warmest"/"coolest" or "highest"/"lowest") | Jump button wording must come from data |
| `Track.guideText: { low, middle, high, noData }` | Sound guide descriptions per track |
| `Track.aboutText: { canTell, cannotTell }` | About section per track |
| `MappingProfile.levelThresholds` = thirds of the track's fixed value range (diverging: ±⅓ of `maxAbs`) — **approved, D7**; plus `cellToneSeconds` 0.5, `referenceToneSeconds` 1.0, `overviewSeconds` 10, whole-map sweep 12, row-sweep slot 0.4 s per cell (initial values, D13; all scaled by `speed` except tone lengths) | Make level labels and durations data-driven |
| `Track.valueRange: {min, max}` becomes **required** for tracks used in the Explorer (from the legend, or from the preparation script across all frames of the track) — **D7** | Fixed range so levels and pitch are comparable across frames |
| `CellReading` type; `AnnouncementMode` type; `Settings` type (incl. `moveTones`); `ExploreGrid` type | New types for the Explorer |
| `MappingProfile.noDataThreshold` = 0.5 (**approved, D7**) | Explore-grid cell no-data rule (D1) |
| `Track.projection/extent` already exists; used only when declared | Geographic axis labels |

Scope change recorded: **Explore mode, Overview, Jump actions, and Invert move from P1 to P0** because the supplied design makes them core. `PROJECT_PLAN.md` and `AGENTS.md` were updated (v2) to match.

---

## 12. Screens/States Not Yet Designed (use `PLACEHOLDER-LAYOUT` until supplied)

- **Track Library** (needed by the header back arrow).
- **Intro/first-run** (the current design starts directly at the Explorer; decide whether a first-run explanation is needed).
- **Error states:** frame failed to load; audio blocked/unsupported.
- **Loading state** while a frame is decoded.
- **Empty state** (no track available).
- **"Play a tone when I move" switch** (Settings, D6) needs a design. The "Sound turned on" announcement needs no new visual beyond the toggle's state.
- **Sweep progress indicator** (a visual marker moving across the grid during sweeps) — not in the current design; ask before adding.

---

## 13. Acceptance Checks per Group (report pass/fail/not-run)

- **Header/badges:** exactly one badge; correct per `valueBasis`; credit visible; no hardcoded text.
- **Grid/sliders/D-pad/jumps:** all four methods move the same cursor; readout, sliders, center text and tone stay in sync; edges handled; no-data cells silent.
- **Sweeps/overview:** play and stop correctly; Stop all sound works from every state; no overlapping playback when starting a new sound.
- **Guide:** four buttons work; Middle correct on diverging track.
- **Settings:** each setting changes behaviour as defined and survives reload (if persisted); invert affects all tones.
- **Accessibility:** keyboard-only run; screen-reader run (NVDA/VoiceOver desktop; TalkBack/VoiceOver mobile if possible); live regions not spamming; focus never lost; 200 % text zoom layout works; contrast per §0.
- **Honesty:** no unsupported scientific wording; badge/notice match the track's `valueBasis`.
- **D1:** the Explore grid is derived from the analysis grid; no-data threshold behaves as configured; cell tones, row sweep, map sweep, overview and guide tones agree on pitch for the same value.
- **D2:** cells are not tab stops and are hidden from AT; the grid has one text alternative.
- **D4:** section navigation is buttons with `aria-current`; one section visible at a time; "Showing {section}" announced.
- **D9 (light theme):** colours come from design tokens, not hardcoded; text ≥ 4.5 : 1; symbols and non-text ≥ 3 : 1; cell meaning readable without colour; focus ring (3 px primary, 2 px white offset) visible on every control.
- **D6:** with Sound Off, pressing an explicit sound button turns Sound on and plays; with move tones Off, moving is silent while explicit buttons still play.

---

## 14. Design Decision Log (approved by the developer)

| # | Decision | Where it applies |
|---|---|---|
| D1 | Explore grid is separate from the analysis grid (default 10 × 8), built by aggregating it; all P0 sounds use the Explore grid; no-data by valid-fraction threshold; limitation stated in About | §2, M-01…M-03, §11 |
| D2 | Grid cells are hidden from assistive tech; one described element; AT path = sliders, direction buttons, jumps; arrow keys on the grid are P1 | M-03 |
| D3 | Overview (~10 s, single voice) and Sweep whole map (full detail) are both kept and defined distinctly; merge if testers confuse them | X-02, B-01 |
| D4 | Section navigation = simple buttons with `aria-current`, one section at a time, no tab roles; compare with accordion in testing | G-09 |
| D5 | ~~One derived surface colour `#092737`~~ — superseded by D9 | §0 |
| D6 | Explicit sound buttons turn Sound on and play; new Settings switch "Play a tone when I move" | G-03, T-06, §4.5 note |
| D7 | No-data threshold 0.5; levels = thirds of a fixed per-track value range (diverging ±⅓ of maxAbs); guide tones at level midpoints | §2, §11, S-00, U-01 |
| D8 | Three bands from Explore-grid rows (8 → 3+2+3); one pitch mapping for all bands, timbre differs; neutral overview voice; fallback = sequential sweeps | §2, N-03, X-02 |
| D9 | **Light theme is final**; tokens come from the design file; symbols and non-text need 3 : 1; cell meaning never by tint alone | §0 |
| D10 | Sticky bar: measured with a ResizeObserver; sticks only while its height ≤ 25 % of the viewport height, otherwise flows with the page; bottom padding and `scroll-padding-bottom` equal the bar height | G-10 |
| D11 | No custom keyboard shortcuts in P0; `Escape` = Stop all sound is a P1 candidate after testing | §10 |
| D12 | A different sound button replaces the current sound; the same button restarts it; speed applies to the next playback, volume applies immediately | B-01, X-02, T-02, T-03 |
| D13 | Initial durations: cell tone 0.5 s, reference tone 1.0 s, overview 10 s base, whole-map sweep 12 s base, row sweep 0.4 s per cell; drag tones throttled to one per 120 ms; all tunable in the profile and checked with testers | §11 |
| D14 | `DESIGN.md` proposals **P1–P8 approved**: primary `#006067`; hover/active keep ≥ 4.5 : 1 (`#004f54`); Stop = error red `#ba1a1a` with label and icon; grid symbols/tints from DESIGN.md tokens only; essential text ≥ 14 px; control borders `#6e797a`; page `#faf8ff` + white panels; Space Grotesk bundled with the app; focus ring 3 px primary + 2 px white offset |

### D7 and D8 (detail)

**D7 — thresholds.** No-data: an Explore cell is no-data when less than 50 % of its area has data (`noDataThreshold` = 0.5, per-track configurable). Levels are computed from the track's **fixed** `valueRange` (not from the frame being viewed): non-diverging → low = bottom third, middle = middle third, high = top third; diverging → with `maxAbs = max(|min|, |max|)`: low < −maxAbs/3, middle within ±maxAbs/3, high > +maxAbs/3. Sound-guide reference tones play at the midpoint of each level (non-diverging: min + span·1/6, 1/2, 5/6; diverging: −2/3·maxAbs, 0, +2/3·maxAbs). Sound details and Detailed mode show the share of the cell's area that has data.

**D8 — bands.** Explore-grid rows are split into three consecutive groups, as even as possible, remainder to the outer bands (base = ⌊rows/3⌋; remainder 0 → base, base, base; 1 → base, base+1, base; 2 → base+1, base, base+1; e.g. 8 rows → 3 + 2 + 3, 7 → 2 + 3 + 2, 9 → 3 + 3 + 3; fewer than 3 rows → as many bands as rows). A band's value per column = mean of its valid cells; all no-data → that band is silent in that column. No latitude weighting in P0. **All bands share one pitch mapping (register offset 0); they differ by timbre only.** A row sweep uses the timbre of the band containing that row. The overview uses a neutral voice distinct from the three band timbres. Fallback if testers cannot tell which band is warmer: replace simultaneous bands with three sequential sweeps (upper, middle, lower).

### D10–D13 (detail)

**D10 — sticky bar.** CSS cannot detect text zoom directly, so the app measures: a `ResizeObserver` on the bar and a viewport-size listener compare the bar's height with the viewport height. While the bar is **at most 25 %** of the viewport height it is sticky; above that it switches to normal flow at the end of the Explore section. While sticky, the page reserves bottom padding **and** `scroll-padding-bottom` equal to the bar height so focused elements are never hidden behind it. Bar sizing uses relative units so larger text enlarges it. Verify at 200 % text zoom on a real phone.

**D11 — shortcuts.** P0 has no custom keyboard shortcuts; everything uses native controls. "Stop all sound" stays always visible and reachable. `Escape` = Stop all sound is a P1 candidate, adopted only if volunteers want it and it does not clash with the disclosure panel or screen-reader commands. Any shortcut must be documented on screen.

**D12 — playback behaviour.** Starting a different sound stops the current one and starts the new one. Pressing the **same** sound button again restarts it from the beginning and announces it again ("Sweeping whole map"). Speed changes apply to the **next** playback, not the one in progress; announce "Speed 1.5×. Applies to the next sound." Volume applies immediately. The overview chip shows the real duration of the score for the current speed (10 s at 1×, 20 s at 0.5×, about 6.7 s at 1.5×).

**D13 — initial durations (tunable in the mapping profile; validate with testers).** `cellToneSeconds` 0.5; `referenceToneSeconds` 1.0; `overviewSeconds` 10 (base, scaled by speed); whole-map sweep 12 (base, scaled by speed; plan range 6–30 s); row sweep 0.4 s per cell (slot), scaled by speed; drag/touch tones are throttled to at most one per 120 ms and replace the previous tone.

### Still open

1. Designs for the Track Library, error/loading/empty states, and the "Play a tone when I move" switch.
