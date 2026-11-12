# ASSUMPTIONS.md

Decisions made where PROJECT_PLAN.md / UI_FUNCTION_MAP.md / AGENTS.md were silent or needed a small addition. Each entry: what, why, where used. Items marked **[CONFIRM]** need the developer's approval.

| # | Assumption | Why | Where |
|---|---|---|---|
| 1 | `Track.anomalyBaseline?: string` was added (optional). **[CONFIRM]** | UI_FUNCTION_MAP S-00 forbids "above/below baseline" wording unless the track declares an anomaly baseline; the plan model had no field for it. | `types/track.ts`, `core/narration.ts` |
| 2 | Public coordinates are 1-based `{row, col}` (matching the UI); internal arrays are row-major; `null` (never `undefined`) is used in JSON-serialisable outputs. | Consistency with the UI labels ("Row 5, Column 8") and byte-for-byte determinism tests. | all of `core/`, `types/frame.ts` |
| 3 | Variability → timbre roughness (PROJECT_PLAN §8.2 table row) is **not implemented** in P0. **[CONFIRM]** | Not part of the approved D1–D13 decisions or the UI; adds sound complexity without a UI element. Accents (highest/lowest cell) are implemented. | `core/mapping.ts` (`buildMapSweepScore`) |
| 4 | Accent rule: one accent per column, in the column of the highest cell and of the lowest cell (highest wins if both share a column); none when the frame has no range. | Keeps simultaneous voices ≤ `maxVoices` (3 bands + 1 accent). | `core/mapping.ts` |
| 5 | Relative-intensity values are Rec. 709 luma in 0–1 (integer coefficients); such tracks should use `valueRange = { min: 0, max: 1 }`. | Plan §8.1 asks for a documented relative-intensity scalar. | `core/analysis.ts` |
| 6 | `ALPHA_THRESHOLD = 128` and `LEGEND_TOLERANCE = 48` (Euclidean RGB distance). **[CONFIRM after real legends exist]** | Initial values; the real NASA colourbars (13 Nov) decide the right tolerance. | `core/analysis.ts` |
| 7 | Analysis cells are treated as equal area; no latitude weighting in P0. | Plan: area weighting only when the track declares projection/extent. | `core/analysis.ts` |
| 8 | Level thresholds live on the normalised 0–1 scale (`lowBelow = 1/3`, `highAbove = 2/3`); boundaries belong to "middle". For diverging tracks this equals ±⅓·maxAbs. | Implements D7 with one rule for both track types. | `core/mapping.ts`, `data/profiles.ts` |
| 9 | Gains (`note 0.25`, `accent 0.2`, `drone 0.08`, `overview 0.35`, `reference 0.35`) are initial design values. **[CONFIRM in Phase 3 on real devices]** | Conservative levels; real loudness depends on the audio engine's limiter, not yet built. | `data/profiles.ts` |
| 10 | `applySpeed` scales sweep and overview scores only; cell and reference tone lengths are not scaled. | D13. | `core/mapping.ts` |
| 11 | A cell tone uses the timbre of the band that contains the cell's row. | D8 (row sweep uses its band's timbre); keeps cell tone and sweep consistent. | `core/mapping.ts` |
| 12 | With fewer than 3 Explore rows, there are as many bands as rows. | D8. | `core/mapping.ts` (`bandRows`) |
| 13 | Decoding an image into pixels (canvas) is **not** in `core/`; a thin utility will do it in Phase 3/4. `core/` takes a plain `DecodedFrame`. | AGENTS §7: no DOM in `core/`. | `types/frame.ts` |
| 14 | `src/data/tracks.ts` is empty on purpose until the 13 Nov resources are available. No synthetic data is shown as NASA data; fixtures are test-only (`src/test/fixtures.ts`). | AGENTS §11. | `data/tracks.ts`, `test/` |
| 15 | Built and tested with Vitest 5.1.0 and TypeScript 7.0.2 in a sandbox, with `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`. Your repository's versions may differ. | Reproducibility note. | `tsconfig.json` (sandbox) |
