/**
 * Audio audit (docs/AUDIO_AUDIT.md): checks whether the sound scores the app would play carry differences in the
 * data. It reads each track's real frames from `public/`, runs the app's own `core/` code, and prints a table.
 *
 * Run from the repo root:   npx tsx scripts/audio-audit.ts
 *
 * THIS IS NOT A LISTENING TEST. It measures the notes, not how they feel to a listener.
 * Frames must be 8-bit RGB or RGBA PNG files (non-interlaced), as the shipped frames are.
 */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { analyzeFrame, buildExploreGrid, noDataThresholdFor } from '../src/core/analysis';
import { buildMapSweepScore, buildOverviewScore, buildRowSweepScore, readCell } from '../src/core/mapping';
import { getProfile } from '../src/data/profiles';
import { tracks } from '../src/data/tracks';
import type { DecodedFrame, ExploreGrid } from '../src/types/frame';
import type { SoundScore } from '../src/types/sound';

/** Minimal PNG decoder (8-bit RGB/RGBA, not interlaced) so the script needs no extra packages. */
function decodePng(path: string): DecodedFrame {
  const buf = readFileSync(path);
  if (buf.subarray(1, 4).toString('ascii') !== 'PNG') {
    throw new Error(`${path} is not a PNG`);
  }
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.subarray(pos + 4, pos + 8).toString('ascii');
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9] ?? 0;
      if (bitDepth !== 8 || data[12] !== 0 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`${path}: only 8-bit non-interlaced RGB/RGBA PNG is supported`);
      }
    } else if (type === 'IDAT') {
      idat.push(data);
    }
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)] ?? 0;
    for (let x = 0; x < stride; x += 1) {
      const cur = raw[y * (stride + 1) + 1 + x] ?? 0;
      const left = x >= bpp ? (out[y * stride + x - bpp] ?? 0) : 0;
      const up = y > 0 ? (out[(y - 1) * stride + x] ?? 0) : 0;
      const upLeft = y > 0 && x >= bpp ? (out[(y - 1) * stride + x - bpp] ?? 0) : 0;
      let v: number;
      if (filter === 0) v = cur;
      else if (filter === 1) v = cur + left;
      else if (filter === 2) v = cur + up;
      else if (filter === 3) v = cur + Math.floor((left + up) / 2);
      else {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        v = cur + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      }
      out[y * stride + x] = v & 255;
    }
  }
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    rgba[i * 4] = out[i * bpp] ?? 0;
    rgba[i * 4 + 1] = out[i * bpp + 1] ?? 0;
    rgba[i * 4 + 2] = out[i * bpp + 2] ?? 0;
    rgba[i * 4 + 3] = bpp === 4 ? (out[i * bpp + 3] ?? 255) : 255;
  }
  return { width, height, rgba };
}

const semitones = (f: number, f0: number): number => 12 * Math.log2(f / f0);

function ranks(a: number[]): number[] {
  const idx = a.map((v, i) => [v, i] as const).sort((x, y) => x[0] - y[0]);
  const r = new Array<number>(a.length).fill(0);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1]?.[0] === idx[i]?.[0]) j += 1;
    for (let k = i; k <= j; k += 1) r[idx[k]?.[1] ?? 0] = (i + j) / 2;
    i = j + 1;
  }
  return r;
}

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (let i = 0; i < n; i += 1) {
    sab += ((a[i] ?? 0) - ma) * ((b[i] ?? 0) - mb);
    saa += ((a[i] ?? 0) - ma) ** 2;
    sbb += ((b[i] ?? 0) - mb) ** 2;
  }
  return sab / Math.sqrt(saa * sbb);
}

function busyness(score: SoundScore): string {
  const ev = score.events;
  let maxSim = 0;
  let maxGain = 0;
  for (const e of ev) {
    const sim = ev.filter((o) => o.tSec <= e.tSec + 1e-9 && o.tSec + o.durSec > e.tSec + 1e-9);
    maxSim = Math.max(maxSim, sim.length);
    maxGain = Math.max(maxGain, sim.reduce((s, o) => s + o.gain, 0));
  }
  const notes = ev.filter((e) => e.kind === 'note').sort((a, b) => a.tSec - b.tSec);
  let same = 0;
  let run = 1;
  let longest = 1;
  for (let i = 1; i < notes.length; i += 1) {
    if (Math.abs((notes[i]?.freqHz ?? 0) - (notes[i - 1]?.freqHz ?? 0)) < 0.01) {
      same += 1;
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  const repeated = notes.length > 1 ? Math.round((100 * same) / (notes.length - 1)) : 0;
  return `${ev.length} events, ${(ev.length / score.totalSeconds).toFixed(1)}/s, max ${maxSim} at once, gain ${maxGain.toFixed(2)}, ${repeated}% repeat the previous note, longest run ${longest}`;
}

interface Cell {
  readonly index: number;
  readonly value: number;
  readonly freq: number;
}

for (const track of tracks) {
  const profile = getProfile(track.profileId);
  const possible = profile.octaves * 5 + 1;
  console.log(
    `\n=== ${track.title}${track.experimental === true ? ' (experimental)' : ''} === sound range ${track.valueRange.min}..${track.valueRange.max}, about ${possible} possible pitches`,
  );
  const grids: ExploreGrid[] = track.frames.map((f) => {
    const frame = decodePng(`public${f.src}`);
    return buildExploreGrid(analyzeFrame(frame, track), track.exploreGrid, noDataThresholdFor(track, profile));
  });
  const perFrame: Cell[][] = grids.map((g) => {
    const cells: Cell[] = [];
    for (let r = 1; r <= g.rows; r += 1) {
      for (let c = 1; c <= g.cols; c += 1) {
        const reading = readCell(g, { row: r, col: c }, track, profile);
        if (!reading.isNoData && reading.freqHz !== null) {
          const index = (r - 1) * g.cols + (c - 1);
          cells.push({ index, value: g.values[index] ?? 0, freq: reading.freqHz });
        }
      }
    }
    return cells;
  });
  const f0 = Math.min(...perFrame.flat().map((c) => c.freq));
  perFrame.forEach((cells, k) => {
    const counts = new Map<number, number>();
    cells.forEach((c) => counts.set(Math.round(c.freq * 100), (counts.get(Math.round(c.freq * 100)) ?? 0) + 1));
    const top = Math.max(...counts.values());
    const st = cells.map((c) => semitones(c.freq, f0));
    const mean = st.reduce((s, x) => s + x, 0) / st.length;
    const sd = Math.sqrt(st.reduce((s, x) => s + (x - mean) ** 2, 0) / st.length);
    const corr = pearson(ranks(cells.map((c) => c.value)), ranks(cells.map((c) => c.freq)));
    console.log(
      ` ${track.frames[k]?.label}: ${cells.length}/${(grids[k]?.cols ?? 0) * (grids[k]?.rows ?? 0)} cells with data, ${counts.size} distinct notes, busiest note on ${Math.round((100 * top) / cells.length)}% of cells, pitch sd ${sd.toFixed(1)} st, value-pitch rank corr ${corr.toFixed(3)}`,
    );
  });
  for (let a = 0; a < perFrame.length; a += 1) {
    for (let b = a + 1; b < perFrame.length; b += 1) {
      const before = new Map((perFrame[a] ?? []).map((c) => [c.index, c]));
      const both = (perFrame[b] ?? []).filter((c) => before.has(c.index));
      let changed = 0;
      let big = 0;
      for (const c of both) {
        const d = Math.abs(semitones(c.freq, before.get(c.index)?.freq ?? c.freq));
        if (d > 0.01) changed += 1;
        if (d >= 3) big += 1;
      }
      console.log(
        ` dates "${track.frames[a]?.label}" vs "${track.frames[b]?.label}": ${changed}/${both.length} cells change pitch, ${big} by 3 semitones or more`,
      );
    }
  }
  const last = grids[grids.length - 1];
  if (last !== undefined) {
    console.log(` map sweep : ${busyness(buildMapSweepScore(last, track, profile))}`);
    console.log(` overview  : ${busyness(buildOverviewScore(last, track, profile))}`);
    console.log(` row sweep : ${busyness(buildRowSweepScore(last, Math.ceil(last.rows / 2), track, profile))}`);
  }
}
console.log('\nNot a listening test: see docs/AUDIO_AUDIT.md for what only people can judge.');
