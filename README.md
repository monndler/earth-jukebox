# OceanEcho

> **Listen to the Ocean. Discover Earth's Changing Voice.**
> An accessibility-first web "jukebox" that turns NASA Earth visualization frames into sound, in the browser, in real time.
> Built by team OceanEcho for the 2026 NASA Space Apps Challenge, *The Earth Information Jukebox* ("Earth Jukebox").

**Status: work in progress.** The analysis and sound engine are tested. The Explorer interface is written but has not yet been run in a browser or tested with screen readers or blind and low-vision listeners. See [Status](#status) for exactly what is and is not verified.

## What it does

You pick a track (a NASA visualization), and the app divides the picture into a grid. You explore the grid with sliders, direction buttons, jump buttons, or by touching it, and each cell becomes a short tone. You can also hear a whole-map sweep, a single-row sweep, or a ten-second overview.

Everything is designed to work **without sight**: native controls, one text description for the grid, live-region announcements, and no meaning carried by colour alone.

### How the sound is made

| Picture | Sound |
|---|---|
| Value of a cell (for example temperature) | Pitch, on a musical scale so it stays pleasant to listen to |
| Column (left to right) | Stereo position, left to right |
| Row band (upper, middle, lower) | Three voices with different timbres |
| Cell with no readable data | Silence |

These are **design choices to be tuned with listeners, not scientific facts.** Sonification is an interpretation, not a measurement instrument.

## Scientific honesty

Every track states how its values were obtained and what is lost in translation:

- **Decoded from legend:** values are read from the colours of the visualization using its published colour bar.
- **Visual translation:** only relative visual intensity is used. Nothing is calibrated.

The app never claims more than the picture supports. Each track has an About page ("what it can tell you / what it cannot tell you") and a full credit line.

## Tracks

| Track | Source | Basis |
|---|---|---|
| **Ocean Symphony** | NASA SVS 3912, *Global Sea Surface Currents and Temperature* | Decoded from legend (0–32 °C), matched by hue |
| **Air Quality: PM2.5** | NASA SVS 5151, *Particulate Matter (PM) 2.5* (GMAO, GEOS-CF) | Decoded from legend (logarithmic, 0.4–409.6 µg/m³), plain colour matching |

Ocean Symphony has three frames (25 March 2007, 13 September 2007, 3 March 2008). The values are read from the **colour of a picture** of output from the ECCO2 ocean model (MIT/JPL), not from the model data itself. The brightness of the thin current lines is ignored, and areas with too few readable lines are silent. Details and the measurements behind these choices are in [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) (#16–#21).

Air Quality: PM2.5 also has three frames (29 October, 5 November and 13 November 2026, with the dates printed on the frames). The colour scale is logarithmic, so the app speaks only low, middle and high, never a number, and its sound covers only the lower part of the scale (#31–#35).

## Run it

Requirements: Node.js (a current LTS) and npm.

```bash
npm ci
npm run dev        # start the dev server
npm test           # run the unit tests (Vitest)
npm run build      # typecheck and production build
npm run lint       # ESLint
npm run preview    # serve the production build
```

Use **headphones and a low volume first.** Sound starts only when you press a sound button.

The app is client-only: no server, no accounts, no analytics, and no runtime requests to other sites. The only thing saved in your browser is your settings (volume, speed, announcement mode, invert, move tones) under `jukebox:v1:settings`.

## How it is built

React, TypeScript and Vite, with the Web Audio API. No audio or state libraries.

```
src/
  types/        Shared data shapes (Track, frames, sound score, settings)
  core/         Pure, deterministic functions: frame analysis, mapping to sound, narration
  audio/        Web Audio engine: plays a sound score, nothing else
  data/         Tracks, mapping profile, musical scales, all user-facing strings
  store/        App state (reducer + context), settings persistence
  hooks/        Frame loading, audio engine, the Explorer controller
  components/   The interface
public/tracks/  Frames used by tracks (converted and reduced from NASA originals)
docs/           Decisions and reports
```

The key rule: **`core/` has no randomness, no time, and no browser access.** The same frame always produces the same sound. The pipeline is:

```
frame image → pixels → analysis grid → Explore grid (10 × 8) → sound score → audio engine
```

All sounds (cell, row sweep, map sweep, overview, guide) are built from the same Explore grid, so they always agree on pitch for the same value.

### Adding a track

1. Put the frame images in `public/tracks/<id>/` (PNG or JPEG, same-origin).
2. Add a `Track` in `src/data/` and list it in `src/data/tracks.ts`. A decoded-legend track needs the legend, the value range, and, if the frame shades the legend colours, a `hueDecode` setting.
3. Check the credit, the licence note and the About text. Every NASA frame must be credited, and text must not claim more than the data supports.
4. Run the tests: `src/data/tracks.test.ts` checks that frames exist with the declared size and that the legend is consistent.

## Accessibility

Target users include blind and low-vision people. The design follows these rules:

- Native `button`, `input[type=range]`, radio and `details` elements; no custom keyboard shortcuts.
- The map grid is one element with a text alternative. Its cells are hidden from assistive technology and are never tab stops. The assistive-technology path is the sliders, direction buttons and jump buttons.
- Section navigation uses plain buttons with `aria-current`, not an ARIA tab pattern.
- Polite live region for status and cell text, and an alert region for errors. Cell announcements are debounced, so fast moves are not read out one by one.
- Colour tokens come from [`DESIGN.md`](DESIGN.md), with the overrides in [`UI_FUNCTION_MAP.md`](UI_FUNCTION_MAP.md) §0.4. Text is at least 14 px, and cell meaning is carried by symbol shape, not colour.
- **Stop all sound** is always visible and reachable.

None of this has been checked with real assistive technology yet.

## Status

| Area | State |
|---|---|
| Analysis, mapping, narration, audio engine, track data | Implemented. Unit tests pass in a temporary offline runner (107 tests). Run `npm test` to confirm. |
| Explorer interface | Written. Typechecks with the real React types (`tsc -b` passed on the first Vercel build). **Not yet fully built, linted, or run in a browser.** |
| Keyboard, screen-reader, zoom and contrast checks | Not run |
| Listening tests with blind and low-vision volunteers | Not run. Mapping values and thresholds are initial design choices. |
| Track Library, loading, error and empty screens | Placeholder layout. The designs are not supplied yet. |
| Space Grotesk font | Not bundled yet (system fallback). The font file and licence need approval. |

Open questions and every decision with its evidence are in [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md). The latest phase summary is [`docs/PHASE4_REPORT.md`](docs/PHASE4_REPORT.md).

## Documents

| File | Purpose |
|---|---|
| [`PROJECT_PLAN.md`](PROJECT_PLAN.md) | Product plan, mapping design, architecture |
| [`UI_FUNCTION_MAP.md`](UI_FUNCTION_MAP.md) | Every UI element mapped to its data, function and behaviour |
| [`DESIGN.md`](DESIGN.md) | Design tokens ("Abyssal Sonics Light") |
| [`AGENTS.md`](AGENTS.md) | Working rules for AI coding agents on this repo |
| [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) | Assumptions, decisions and measurements |

## Data and credits

Ocean Symphony uses frames from **NASA Scientific Visualization Studio, *Global Sea Surface Currents and Temperature* (SVS 3912)**, <https://svs.gsfc.nasa.gov/3912/>. Credit: NASA/Goddard Space Flight Center Scientific Visualization Studio. The frames were converted from TIFF to PNG and reduced to 1024 × 512 for this project, and the dates come from the SVS date file for that frame set. Usage terms: see the [NASA media reproduction guidelines](https://www.nasa.gov/multimedia/guidelines/index.html). The licence terms for this project's use are still to be confirmed.

NASA does not endorse this project or any non-U.S. Government entity, and is not responsible for information contained on non-U.S. Government websites.

## Licence

Not yet chosen.