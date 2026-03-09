import { Howl } from 'howler';
import { getBgmGapDurationMs, getSeededBgmTrackIndex } from '@/lib/seededAudio';
import type { AudioConfig, BgmSchedulerState, BgmTrackDefinition, PianoNoteEvent } from '@/types/audio';

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  masterVolume: 1,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  muted: false,
};

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

const midiToFrequency = (midi: number) => 440 * (2 ** ((midi - 69) / 12));

class AudioService {
  private readonly sessionSeed = `audio-session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  private readonly bgmTracks: BgmTrackDefinition[] = [
    {
      id: 'arena-background',
      src: '/background-music.mp3',
    },
  ];
  private readonly bgmHowls = new Map<string, Howl>();
  private schedulerState: BgmSchedulerState = {
    seed: this.sessionSeed,
    cycleIndex: 0,
    status: 'stopped',
    currentTrackId: null,
    nextGapMs: null,
  };
  private bgmTimer: number | null = null;
  private bgmActive = false;
  private bgmRunId = 0;
  private audioConfig: AudioConfig = { ...DEFAULT_AUDIO_CONFIG };
  private audioContext: AudioContext | null = null;
  private pianoBus: GainNode | null = null;
  private audioUnlocked = false;

  constructor() {
    this.initializeBgmTracks();
  }

  getSessionSeed() {
    return this.sessionSeed;
  }

  getCurrentMusicTrackId() {
    return this.schedulerState.currentTrackId;
  }

  syncConfig(config: AudioConfig) {
    this.audioConfig = {
      masterVolume: clampUnit(config.masterVolume),
      sfxVolume: clampUnit(config.sfxVolume),
      musicVolume: clampUnit(config.musicVolume),
      muted: config.muted,
    };
    this.updateBgmVolumes();
    this.updatePianoBusVolume();

    if (this.bgmActive && this.audioUnlocked && this.schedulerState.status === 'idle') {
      this.playCurrentCycleTrack();
    }
  }

  startBgmScheduler(seed: string) {
    this.bgmActive = true;
    this.schedulerState = {
      ...this.schedulerState,
      seed: seed || this.sessionSeed,
      cycleIndex: 0,
      status: 'idle',
      currentTrackId: null,
      nextGapMs: null,
    };
    this.clearBgmTimer();

    if (this.audioUnlocked) {
      this.playCurrentCycleTrack();
    }
  }

  updateBgmSeed(seed: string) {
    this.schedulerState = {
      ...this.schedulerState,
      seed: seed || this.sessionSeed,
    };
  }

  stopBgmScheduler() {
    this.bgmActive = false;
    this.clearBgmTimer();
    this.bgmRunId += 1;

    if (this.schedulerState.currentTrackId) {
      this.bgmHowls.get(this.schedulerState.currentTrackId)?.stop();
    }

    this.schedulerState = {
      ...this.schedulerState,
      status: 'stopped',
      currentTrackId: null,
      nextGapMs: null,
    };
  }

  async resumeAudioContextFromGesture() {
    this.audioUnlocked = true;
    const context = this.ensureAudioContext();
    if (context && context.state !== 'running') {
      await context.resume();
    }

    if (this.bgmActive && this.schedulerState.status === 'idle') {
      this.playCurrentCycleTrack();
    }
  }

  playSeededPianoNote(noteEvent: PianoNoteEvent) {
    if (!this.audioUnlocked) {
      return;
    }

    const context = this.ensureAudioContext();
    if (!context || context.state !== 'running' || !this.pianoBus || this.getSfxOutputVolume() <= 0) {
      return;
    }

    const now = context.currentTime + 0.005;
    const durationSeconds = Math.max(0.22, noteEvent.durationMs / 1000);
    const baseFrequency = midiToFrequency(noteEvent.midi);
    const toneGain = clampUnit(noteEvent.velocity) * 0.65;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(baseFrequency * 5.4, now);
    filter.Q.setValueAtTime(0.75, now);
    filter.connect(this.pianoBus);

    const bodyOsc = context.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(baseFrequency, now);
    bodyOsc.detune.setValueAtTime(-3, now);

    const bodyGain = context.createGain();
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.linearRampToValueAtTime(toneGain, now + 0.012);
    bodyGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, toneGain * 0.32), now + 0.14);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(filter);

    const harmonicOsc = context.createOscillator();
    harmonicOsc.type = 'sine';
    harmonicOsc.frequency.setValueAtTime(baseFrequency * 2, now);
    harmonicOsc.detune.setValueAtTime(4, now);

    const harmonicGain = context.createGain();
    harmonicGain.gain.setValueAtTime(0.0001, now);
    harmonicGain.gain.linearRampToValueAtTime(toneGain * 0.48, now + 0.01);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds * 0.72);

    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(filter);

    const attackOsc = context.createOscillator();
    attackOsc.type = 'square';
    attackOsc.frequency.setValueAtTime(baseFrequency * 4, now);

    const attackGain = context.createGain();
    attackGain.gain.setValueAtTime(0.0001, now);
    attackGain.gain.linearRampToValueAtTime(toneGain * 0.12, now + 0.002);
    attackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    attackOsc.connect(attackGain);
    attackGain.connect(filter);

    bodyOsc.start(now);
    harmonicOsc.start(now);
    attackOsc.start(now);

    bodyOsc.stop(now + durationSeconds + 0.05);
    harmonicOsc.stop(now + durationSeconds + 0.05);
    attackOsc.stop(now + 0.06);
  }

  dispose() {
    this.stopBgmScheduler();
    this.bgmHowls.forEach((howl) => howl.unload());
    this.bgmHowls.clear();
  }

  private initializeBgmTracks() {
    this.bgmTracks.forEach((track) => {
      this.bgmHowls.set(
        track.id,
        new Howl({
          src: [track.src],
          loop: false,
          volume: this.getMusicOutputVolume(),
          html5: false,
          preload: true,
        })
      );
    });
  }

  private ensureAudioContext() {
    if (this.audioContext) {
      return this.audioContext;
    }

    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return null;
    }

    this.audioContext = new AudioContextCtor();
    this.pianoBus = this.audioContext.createGain();
    this.pianoBus.connect(this.audioContext.destination);
    this.updatePianoBusVolume();
    return this.audioContext;
  }

  private getSfxOutputVolume() {
    if (this.audioConfig.muted) {
      return 0;
    }

    return clampUnit(this.audioConfig.masterVolume * this.audioConfig.sfxVolume);
  }

  private getMusicOutputVolume() {
    if (this.audioConfig.muted) {
      return 0;
    }

    return clampUnit(this.audioConfig.masterVolume * this.audioConfig.musicVolume);
  }

  private updatePianoBusVolume() {
    if (!this.audioContext || !this.pianoBus) {
      return;
    }

    this.pianoBus.gain.setTargetAtTime(this.getSfxOutputVolume(), this.audioContext.currentTime, 0.01);
  }

  private updateBgmVolumes() {
    const volume = this.getMusicOutputVolume();
    this.bgmHowls.forEach((howl) => howl.volume(volume));
  }

  private clearBgmTimer() {
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private playCurrentCycleTrack() {
    if (!this.bgmActive || this.bgmTracks.length === 0) {
      return;
    }

    const trackIndex = getSeededBgmTrackIndex(
      this.schedulerState.seed,
      this.schedulerState.cycleIndex,
      this.bgmTracks.length
    );
    const track = this.bgmTracks[trackIndex];
    const howl = this.bgmHowls.get(track.id);

    if (!howl) {
      return;
    }

    this.clearBgmTimer();
    this.bgmRunId += 1;
    const currentRunId = this.bgmRunId;

    this.schedulerState = {
      ...this.schedulerState,
      status: 'playing',
      currentTrackId: track.id,
      nextGapMs: null,
    };

    howl.stop();
    howl.off('end');
    howl.off('loaderror');
    howl.off('playerror');
    howl.once('end', () => this.handleTrackEnded(track.id, currentRunId));
    howl.once('loaderror', () => this.scheduleNextTrackGap(currentRunId));
    howl.once('playerror', () => this.scheduleNextTrackGap(currentRunId));
    howl.play();
  }

  private handleTrackEnded(trackId: string, runId: number) {
    if (!this.bgmActive || this.schedulerState.currentTrackId !== trackId || runId !== this.bgmRunId) {
      return;
    }

    this.scheduleNextTrackGap(runId);
  }

  private scheduleNextTrackGap(runId: number) {
    if (!this.bgmActive || runId !== this.bgmRunId) {
      return;
    }

    const gapMs = getBgmGapDurationMs(this.schedulerState.seed, this.schedulerState.cycleIndex);
    this.schedulerState = {
      ...this.schedulerState,
      status: 'gap',
      currentTrackId: null,
      nextGapMs: gapMs,
    };

    this.clearBgmTimer();
    this.bgmTimer = window.setTimeout(() => {
      if (!this.bgmActive || runId !== this.bgmRunId) {
        return;
      }

      this.schedulerState = {
        ...this.schedulerState,
        cycleIndex: this.schedulerState.cycleIndex + 1,
        status: 'idle',
        nextGapMs: null,
      };
      this.playCurrentCycleTrack();
    }, gapMs);
  }
}

export const audioService = new AudioService();
