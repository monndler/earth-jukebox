/**
 * Track: Ocean Symphony (NASA SVS 3912, "Global Sea Surface Currents and Temperature").
 *
 * Provenance and processing (docs/ASSUMPTIONS.md #16–#20):
 *  - Frames: SVS 3912 frame set `frames/2048x1024_1x1_30p/orig`, frames 23000, 27000 and 31000. The dates come
 *    from SVS's `flat_ecco2_dates.txt` (23000 = 2007-03-25T12:00Z, 27000 = 2007-09-13T12:00Z,
 *    31000 = 2008-03-03T12:00Z). TIFF converted to PNG (lossless) and reduced 2× to 1024×512 (box filter).
 *  - Legend: SVS's `sst_ecco2_cbar.png` (0–32 °C). One entry per 1 °C, colour sampled from the middle of that
 *    part of the bar. The scale marks (0, 10, 20, 32) were read from the colourbar image; positions between
 *    marks are interpolated linearly.
 *  - The frame draws the legend colours as thin lines of varying brightness on black, so exact colour
 *    matching fails (measured ≈ 1 % of pixels). `hueDecode` matches by hue instead (ASSUMPTIONS #16).
 *
 * The values are read from the COLOUR of a picture of model output. They are not the model data itself.
 */
import type { LegendEntry, Track } from '../types/track';

const SST_LEGEND: readonly LegendEntry[] = [
  { rgb: [52, 99, 246], valueMin: 0, valueMax: 1 },
  { rgb: [51, 115, 234], valueMin: 1, valueMax: 2 },
  { rgb: [50, 130, 223], valueMin: 2, valueMax: 3 },
  { rgb: [50, 146, 211], valueMin: 3, valueMax: 4 },
  { rgb: [50, 160, 199], valueMin: 4, valueMax: 5 },
  { rgb: [50, 176, 186], valueMin: 5, valueMax: 6 },
  { rgb: [51, 188, 176], valueMin: 6, valueMax: 7 },
  { rgb: [52, 201, 163], valueMin: 7, valueMax: 8 },
  { rgb: [54, 214, 152], valueMin: 8, valueMax: 9 },
  { rgb: [55, 227, 140], valueMin: 9, valueMax: 10 },
  { rgb: [57, 237, 129], valueMin: 10, valueMax: 11 },
  { rgb: [58, 248, 119], valueMin: 11, valueMax: 12 },
  { rgb: [60, 255, 107], valueMin: 12, valueMax: 13 },
  { rgb: [61, 255, 96], valueMin: 13, valueMax: 14 },
  { rgb: [64, 255, 86], valueMin: 14, valueMax: 15 },
  { rgb: [74, 255, 74], valueMin: 15, valueMax: 16 },
  { rgb: [92, 255, 64], valueMin: 16, valueMax: 17 },
  { rgb: [115, 255, 54], valueMin: 17, valueMax: 18 },
  { rgb: [139, 255, 46], valueMin: 18, valueMax: 19 },
  { rgb: [169, 255, 40], valueMin: 19, valueMax: 20 },
  { rgb: [198, 255, 35], valueMin: 20, valueMax: 21 },
  { rgb: [223, 255, 34], valueMin: 21, valueMax: 22 },
  { rgb: [242, 255, 33], valueMin: 22, valueMax: 23 },
  { rgb: [251, 252, 33], valueMin: 23, valueMax: 24 },
  { rgb: [250, 231, 32], valueMin: 24, valueMax: 25 },
  { rgb: [250, 205, 30], valueMin: 25, valueMax: 26 },
  { rgb: [249, 179, 29], valueMin: 26, valueMax: 27 },
  { rgb: [248, 146, 27], valueMin: 27, valueMax: 28 },
  { rgb: [247, 109, 26], valueMin: 28, valueMax: 29 },
  { rgb: [247, 70, 25], valueMin: 29, valueMax: 30 },
  { rgb: [247, 26, 25], valueMin: 30, valueMax: 31 },
  { rgb: [247, 0, 24], valueMin: 31, valueMax: 32 },
];

export const oceanSymphonyTrack: Track = {
  id: 'ocean-symphony',
  title: 'Ocean Symphony',
  summary:
    'Global sea surface currents coloured by temperature, from a NASA visualization of ocean-model output.',
  storyText:
    'This NASA visualization shows sea surface current flows, coloured by sea surface temperature. It was made from output of the ECCO2 ocean model, a joint MIT and JPL project that uses a computer model to combine satellite and in-situ observations of the global ocean and sea ice. Only the surface flows are shown. This track has three frames: 25 March 2007, 13 September 2007 and 3 March 2008. Switch between them and listen to how the pattern of warmer and cooler water changes.',
  variable: 'Sea surface temperature (the colour of the current lines)',
  units: '°C',
  source: {
    name: 'NASA Scientific Visualization Studio: Global Sea Surface Currents and Temperature (SVS 3912)',
    url: 'https://svs.gsfc.nasa.gov/3912/',
    credit: 'NASA/Goddard Space Flight Center Scientific Visualization Studio',
    licenseNote:
      'Credit as requested on the SVS page. Usage terms: see the NASA media reproduction guidelines (nasa.gov/multimedia/guidelines). Frames were converted from TIFF to PNG and reduced to 1024×512 by this project.',
  },
  frames: [
    { id: 'frame-23000', src: '/tracks/ocean-symphony/frame-23000.png', label: '25 March 2007', width: 1024, height: 512 },
    { id: 'frame-27000', src: '/tracks/ocean-symphony/frame-27000.png', label: '13 September 2007', width: 1024, height: 512 },
    { id: 'frame-31000', src: '/tracks/ocean-symphony/frame-31000.png', label: '3 March 2008', width: 1024, height: 512 },
  ],
  legend: SST_LEGEND,
  // Matched by hue because the frame shades the legend colours (see header). Tolerances were chosen by
  // measuring the three frames; they are design choices to be re-checked (ASSUMPTIONS #16).
  hueDecode: { maxHueDistanceDeg: 10, minSaturation: 0.35, minValue: 0.15 },
  // Thin lines cover only part of each cell, so a lower threshold than the D7 default (ASSUMPTIONS #17).
  noDataThreshold: 0.1,
  diverging: false,
  valueRange: { min: 0, max: 32 },
  valueBasis: 'decoded-legend',
  profileId: 'sweep-lr-3band',
  whyNotes:
    'Pitch rises with temperature on a pentatonic scale, so the sound stays musical. Three voices play the upper, middle and lower parts of the map. Silence means no readable colour. These are design choices to be tuned with listeners, not scientific facts.',
  exploreGrid: { cols: 10, rows: 8 },
  extremeLabels: { max: 'warmest', min: 'coolest' },
  guideText: {
    low: 'Low tones: the coolest third of the temperature range of this track.',
    middle: 'Middle tones: the middle third of the temperature range.',
    high: 'High tones: the warmest third of the temperature range.',
    noData: 'Silence: land, or ocean where too few coloured current lines could be read.',
  },
  aboutText: {
    canTell:
      'Roughly where the surface water is cooler or warmer: pitch rises with temperature, and left to right on the map is left to right in your headphones. Which areas are silent. How the pattern differs between the three dates.',
    cannotTell:
      'Exact temperatures. Each cell is an average over a large area, and temperatures are read from the colour of thin current lines in a picture, not from the model data itself. The brightness of the lines is ignored. Silence can mean land or ocean with too few readable lines. The picture comes from a model that combines observations, so it is not a measurement at each place. Current direction and speed are not conveyed.',
  },
};
