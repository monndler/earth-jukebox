/**
 * Mapping profile and sound score types (PROJECT_PLAN §14). The `SoundScore` is the contract between
 * `core/mapping` and `audio/`: the audio engine only plays it.
 * Units: seconds for times, Hz for frequencies, gain 0–1, pan −1…+1.
 */

export type TimbreId = 'soft' | 'bright' | 'hollow' | 'neutral' | 'accent';
export type NoteKind = 'note' | 'accent' | 'drone';
export type ScoreKind = 'cell' | 'row-sweep' | 'map-sweep' | 'overview' | 'reference';

export interface NoteEvent {
  readonly tSec: number;
  readonly durSec: number;
  readonly freqHz: number;
  readonly gain: number;
  readonly pan: number;
  readonly voice: string;
  readonly timbre: TimbreId;
  readonly kind: NoteKind;
}

export interface SoundScore {
  readonly totalSeconds: number;
  readonly events: readonly NoteEvent[];
  readonly meta: {
    readonly trackId: string;
    readonly profileId: string;
    readonly kind: ScoreKind;
  };
}

export interface BandSpec {
  readonly timbre: TimbreId;
  /** Semitones added to the shared pitch mapping. Must stay 0 by default (D8). */
  readonly registerOffset: number;
}

export interface ScaleDef {
  readonly id: string;
  readonly name: string;
  /** Semitone offsets within one octave, ascending, starting at 0. */
  readonly semitones: readonly number[];
}

export interface MappingProfile {
  readonly id: string;
  readonly name: string;
  readonly scaleId: string;
  /** Number of octaves spanned by the pitch range (above the base note). */
  readonly octaves: number;
  /** MIDI note number of the lowest pitch. */
  readonly baseMidi: number;
  /** Up to three band voices, upper → lower (D8). They differ by timbre only. */
  readonly bands: readonly BandSpec[];
  readonly sweepSeconds: number;
  readonly rowSweepSlotSeconds: number;
  readonly cellToneSeconds: number;
  readonly overviewSeconds: number;
  readonly referenceToneSeconds: number;
  /** Stereo spread 0–1 (1 = full left/right). */
  readonly panWidth: number;
  /** Maximum simultaneous band + accent voices (the zero-reference drone is a separate layer). */
  readonly maxVoices: number;
  readonly invert: boolean;
  /** An Explore cell is no-data when its valid fraction is below this (D7). */
  readonly noDataThreshold: number;
  /** Level boundaries on the normalised 0–1 scale (D7): thirds. */
  readonly levelThresholds: { readonly lowBelow: number; readonly highAbove: number };
  readonly gains: {
    readonly note: number;
    readonly accent: number;
    readonly drone: number;
    readonly overview: number;
    readonly reference: number;
  };
}
