import { SeededRandom } from '@/lib/random';
import type { PianoNoteEvent, SeededMelodyState } from '@/types/audio';

const PIANO_SCALE_MIDI = [60, 62, 64, 67, 69, 72, 74, 76, 79] as const;
const MIN_BGM_GAP_MS = 12_000;
const MAX_BGM_GAP_MS = 28_000;

const clampScaleIndex = (index: number) => Math.max(0, Math.min(PIANO_SCALE_MIDI.length - 1, index));

const bounceScaleIndex = (index: number, direction: -1 | 1) => {
  if (index < 0) {
    return { scaleIndex: clampScaleIndex(Math.abs(index)), direction: 1 as const };
  }

  if (index >= PIANO_SCALE_MIDI.length) {
    const overflow = index - (PIANO_SCALE_MIDI.length - 1);
    return {
      scaleIndex: clampScaleIndex((PIANO_SCALE_MIDI.length - 1) - overflow),
      direction: -1 as const,
    };
  }

  return { scaleIndex: index, direction };
};

export const createSeededMelodyState = (seed: string): SeededMelodyState => {
  const rng = new SeededRandom(`melody:init:${seed}`);

  return {
    seed,
    noteIndex: 0,
    scaleIndex: rng.randInt(1, Math.max(2, PIANO_SCALE_MIDI.length - 1)),
    direction: rng.random() > 0.5 ? 1 : -1,
    accentEvery: rng.randInt(3, 7),
  };
};

export const getNextSeededPianoNote = (
  state: SeededMelodyState
): {
  nextState: SeededMelodyState;
  noteEvent: PianoNoteEvent;
} => {
  const rng = new SeededRandom(`melody:step:${state.seed}:${state.noteIndex}`);
  let direction = state.direction;

  if (rng.random() > 0.72) {
    direction = direction === 1 ? -1 : 1;
  }

  const stepSize = rng.random() > 0.84 ? 2 : 1;
  const targetIndex = state.scaleIndex + direction * stepSize;
  const bounced = bounceScaleIndex(targetIndex, direction);
  const velocityBase = state.noteIndex % state.accentEvery === state.accentEvery - 1 ? 0.92 : 0.74;
  const velocity = Math.min(0.98, velocityBase + rng.random() * 0.08);
  const durationMs = 420 + rng.randInt(0, 121);
  const noteEvent: PianoNoteEvent = {
    seed: state.seed,
    successIndex: state.noteIndex + 1,
    midi: PIANO_SCALE_MIDI[bounced.scaleIndex],
    velocity,
    durationMs,
  };

  return {
    noteEvent,
    nextState: {
      ...state,
      noteIndex: state.noteIndex + 1,
      scaleIndex: bounced.scaleIndex,
      direction: bounced.direction,
    },
  };
};

export const getSeededPianoSequence = (seed: string, length: number): PianoNoteEvent[] => {
  const events: PianoNoteEvent[] = [];
  let state = createSeededMelodyState(seed);

  for (let index = 0; index < length; index += 1) {
    const step = getNextSeededPianoNote(state);
    events.push(step.noteEvent);
    state = step.nextState;
  }

  return events;
};

export const getBgmGapDurationMs = (seed: string, cycleIndex: number) => {
  const rng = new SeededRandom(`bgm:gap:${seed}:${cycleIndex}`);
  return MIN_BGM_GAP_MS + rng.randInt(0, MAX_BGM_GAP_MS - MIN_BGM_GAP_MS + 1);
};

export const getSeededBgmTrackIndex = (seed: string, cycleIndex: number, trackCount: number) => {
  if (trackCount <= 1) {
    return 0;
  }

  const rng = new SeededRandom(`bgm:track:${seed}:${cycleIndex}`);
  return rng.randInt(0, trackCount);
};

export const resolveAudioSeed = (
  gameSeed: string | null | undefined,
  configSeed: string | null | undefined,
  fallbackSeed: string
) => {
  if (gameSeed && gameSeed.trim()) {
    return gameSeed.trim();
  }

  if (configSeed && configSeed.trim()) {
    return configSeed.trim();
  }

  return fallbackSeed;
};
