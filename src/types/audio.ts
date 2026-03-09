export interface AudioConfig {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
}

export interface PianoNoteEvent {
  seed: string;
  successIndex: number;
  midi: number;
  velocity: number;
  durationMs: number;
}

export interface SeededMelodyState {
  seed: string;
  noteIndex: number;
  scaleIndex: number;
  direction: -1 | 1;
  accentEvery: number;
}

export interface BgmTrackDefinition {
  id: string;
  src: string;
}

export interface BgmSchedulerState {
  seed: string;
  cycleIndex: number;
  status: 'idle' | 'playing' | 'gap' | 'stopped';
  currentTrackId: string | null;
  nextGapMs: number | null;
}
