/**
 * Track: Air Quality, PM2.5 (NASA SVS 5151, "Particulate Matter (PM) 2.5").
 *
 * Provenance and processing (docs/ASSUMPTIONS.md #31–#35):
 *  - Frames: three frames of the SVS 5151 frame set `MC01_stage4_GMAO_pm25_2048x1024_en-hwtool`, chosen near the
 *    start, middle and end of the 372-frame set. The dates are the ones printed on the frames themselves
 *    (29 Oct 2026 05:00 EDT, 5 Nov 2026 21:00 EST, 13 Nov 2026 15:00 EST). PNG, reduced 2× to 1024×512 (box filter).
 *  - Legend: SVS's `PM2.5_colorbar_plain.png`, read together with the labelled `PM2.5_colorbar.png`: a LOGARITHMIC
 *    scale from 0.4 to 409.6 µg/m³ in 10 equal steps, each step doubling the concentration (labels 0.4, 1.6, 6.4,
 *    25.6, 102.4, 409.6). One legend entry per 1/32 of the bar; legend values are positions in "doubling steps"
 *    (0–10), where concentration = 0.4 × 2^steps µg/m³. The frames show the colours flat (not shaded), so plain
 *    colour matching works (≈ 93 % of pixels decode).
 *  - Country borders, coastlines and the two corner panels (logo, date) are drawn over the data. Their pixels do not
 *    match the legend and count as no data, so the corner cells are silent.
 *
 * The values are read from the COLOUR of a picture of model output, not from the model data itself.
 */
import type { LegendEntry, Track } from '../types/track';

const PM25_LEGEND: readonly LegendEntry[] = [
  { rgb: [255, 249, 204], valueMin: 0.0, valueMax: 0.3125 },
  { rgb: [254, 237, 167], valueMin: 0.3125, valueMax: 0.625 },
  { rgb: [254, 224, 139], valueMin: 0.625, valueMax: 0.9375 },
  { rgb: [254, 205, 99], valueMin: 0.9375, valueMax: 1.25 },
  { rgb: [254, 189, 72], valueMin: 1.25, valueMax: 1.5625 },
  { rgb: [254, 174, 59], valueMin: 1.5625, valueMax: 1.875 },
  { rgb: [254, 159, 46], valueMin: 1.875, valueMax: 2.1875 },
  { rgb: [252, 146, 38], valueMin: 2.1875, valueMax: 2.5 },
  { rgb: [247, 138, 33], valueMin: 2.5, valueMax: 2.8125 },
  { rgb: [242, 126, 27], valueMin: 2.8125, valueMax: 3.125 },
  { rgb: [238, 117, 22], valueMin: 3.125, valueMax: 3.4375 },
  { rgb: [232, 107, 18], valueMin: 3.4375, valueMax: 3.75 },
  { rgb: [226, 101, 14], valueMin: 3.75, valueMax: 4.0625 },
  { rgb: [218, 92, 10], valueMin: 4.0625, valueMax: 4.375 },
  { rgb: [212, 85, 6], valueMin: 4.375, valueMax: 4.6875 },
  { rgb: [206, 78, 3], valueMin: 4.6875, valueMax: 5.0 },
  { rgb: [199, 74, 2], valueMin: 5.0, valueMax: 5.3125 },
  { rgb: [192, 70, 2], valueMin: 5.3125, valueMax: 5.625 },
  { rgb: [185, 67, 3], valueMin: 5.625, valueMax: 5.9375 },
  { rgb: [177, 64, 3], valueMin: 5.9375, valueMax: 6.25 },
  { rgb: [170, 60, 3], valueMin: 6.25, valueMax: 6.5625 },
  { rgb: [162, 56, 4], valueMin: 6.5625, valueMax: 6.875 },
  { rgb: [155, 52, 4], valueMin: 6.875, valueMax: 7.1875 },
  { rgb: [149, 51, 4], valueMin: 7.1875, valueMax: 7.5 },
  { rgb: [143, 49, 4], valueMin: 7.5, valueMax: 7.8125 },
  { rgb: [137, 47, 5], valueMin: 7.8125, valueMax: 8.125 },
  { rgb: [132, 46, 5], valueMin: 8.125, valueMax: 8.4375 },
  { rgb: [127, 44, 5], valueMin: 8.4375, valueMax: 8.75 },
  { rgb: [121, 43, 5], valueMin: 8.75, valueMax: 9.0625 },
  { rgb: [116, 41, 5], valueMin: 9.0625, valueMax: 9.375 },
  { rgb: [109, 39, 6], valueMin: 9.375, valueMax: 9.6875 },
  { rgb: [104, 38, 6], valueMin: 9.6875, valueMax: 10.0 },
];

export const airQualityPm25Track: Track = {
  id: 'air-quality-pm25',
  title: 'Air Quality: PM2.5',
  summary:
    'Near-surface fine particulate matter (PM2.5) around the world, from a NASA air-quality model visualization.',
  storyText:
    "This NASA visualization shows the concentration of fine particulate matter (PM2.5, particles smaller than 2.5 micrometres) near the surface, estimated from aerosol and weather fields produced by NASA's GEOS-CF model. Scientists and air quality managers track PM2.5 because it contributes to a higher risk of asthma, respiratory inflammation and poor lung function. Large weather systems can carry small particles far from where they started. This track has three frames: 29 October, 5 November and 13 November 2026. Switch between them and listen to how the pattern changes.",
  variable: 'Near-surface PM2.5 (the colour of the map, on a logarithmic scale)',
  source: {
    name: 'NASA Scientific Visualization Studio: Particulate Matter (PM) 2.5 (SVS 5151)',
    url: 'https://svs.gsfc.nasa.gov/5151/',
    credit: "NASA's Global Modeling and Assimilation Office",
    licenseNote:
      'Credit as requested on the SVS page. Usage terms: see the NASA media reproduction guidelines (nasa.gov/multimedia/guidelines). Frames were reduced to 1024×512 by this project.',
  },
  frames: [
    { id: 'frame-2026-10-29', src: '/tracks/air-quality-pm25/frame-2026-10-29.png', label: '29 October 2026, 05:00 EDT', width: 1024, height: 512 },
    { id: 'frame-2026-11-05', src: '/tracks/air-quality-pm25/frame-2026-11-05.png', label: '5 November 2026, 21:00 EST', width: 1024, height: 512 },
    { id: 'frame-2026-11-13', src: '/tracks/air-quality-pm25/frame-2026-11-13.png', label: '13 November 2026, 15:00 EST', width: 1024, height: 512 },
  ],
  legend: PM25_LEGEND,
  diverging: false,
  // The sound covers only the lower 4 of the colour scale's 10 doubling steps (0.4 to 6.4 µg/m³), because the
  // average of a whole cell is mostly pale; darker colours all sound as the highest level (ASSUMPTIONS #33).
  valueRange: { min: 0, max: 4 },
  valueBasis: 'decoded-legend',
  profileId: 'sweep-lr-3band',
  whyNotes:
    'Pitch rises with the colour scale (each step up on the scale means double the concentration), on a pentatonic scale so the sound stays musical. Three voices play the upper, middle and lower parts of the map. Silence means no readable colour. These are design choices to be tuned with listeners, not scientific facts.',
  exploreGrid: { cols: 10, rows: 8 },
  extremeLabels: { max: 'highest', min: 'lowest' },
  guideText: {
    low: 'Low tones: area averages below about 1 microgram per cubic metre, the palest colours.',
    middle: 'Middle tones: area averages from about 1 to about 2.5 micrograms per cubic metre.',
    high: 'High tones: area averages above about 2.5 micrograms per cubic metre, up to the top of this track\'s sound range. Darker colours are not separated.',
    noData: 'Silence: the logo and date panels, or places where the map colours could not be read.',
  },
  aboutText: {
    canTell:
      'Roughly where the map is paler or darker, and how that pattern differs between the three dates. Pitch rises with the colour scale, and left to right on the map is left to right in your headphones.',
    cannotTell:
      "Exact concentrations. The colour scale is logarithmic and each cell averages a large area, so hot spots are smoothed out. The sound range covers only the lower part of the colour scale, so every darker area sounds the same. The words low, middle and high are relative to this track and are not health thresholds. The picture shows model estimates, not a measurement at each place. Country borders and coastlines drawn on the map are ignored, and the two corner panels are silent.",
  },
};
