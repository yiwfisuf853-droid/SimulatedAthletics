import { useEffect, useEffectEvent, useRef } from 'react';
import { createSeededMelodyState, getNextSeededPianoNote, resolveAudioSeed } from '@/lib/seededAudio';
import { audioService } from '@/services/audioService';
import { useConfigStore } from '@/stores/configStore';
import { useGameStore } from '@/stores/gameStore';
import type { SeededMelodyState } from '@/types/audio';

export const useAudio = () => {
  const masterVolume = useConfigStore((state) => state.masterVolume);
  const sfxVolume = useConfigStore((state) => state.sfxVolume);
  const musicVolume = useConfigStore((state) => state.musicVolume);
  const muted = useConfigStore((state) => state.muted);
  const configSeed = useConfigStore((state) => state.seed);
  const audioEnabled = useConfigStore((state) => state.modules.audio);
  const gameSeed = useGameStore((state) => state.config?.seed ?? null);
  const engine = useGameStore((state) => state.engine);
  const melodyStateRef = useRef<SeededMelodyState | null>(null);

  const getResolvedSeed = useEffectEvent(() =>
    resolveAudioSeed(useGameStore.getState().config?.seed ?? null, useConfigStore.getState().seed, audioService.getSessionSeed())
  );

  const resetMelodyForSeed = useEffectEvent((seed: string) => {
    melodyStateRef.current = createSeededMelodyState(seed);
    audioService.updateBgmSeed(seed);
  });

  const startScheduler = useEffectEvent(() => {
    audioService.startBgmScheduler(getResolvedSeed());
  });

  const playSuccessfulMoveNote = useEffectEvent(() => {
    const seed = getResolvedSeed();
    const currentMelodyState =
      melodyStateRef.current && melodyStateRef.current.seed === seed
        ? melodyStateRef.current
        : createSeededMelodyState(seed);
    const { noteEvent, nextState } = getNextSeededPianoNote(currentMelodyState);
    melodyStateRef.current = nextState;
    audioService.playSeededPianoNote(noteEvent);
  });

  useEffect(() => {
    audioService.syncConfig({
      masterVolume,
      sfxVolume,
      musicVolume,
      muted: muted || !audioEnabled,
    });
  }, [masterVolume, sfxVolume, musicVolume, muted, audioEnabled]);

  useEffect(() => {
    if (!audioEnabled) {
      audioService.stopBgmScheduler();
      return undefined;
    }

    startScheduler();

    return () => {
      audioService.stopBgmScheduler();
    };
  }, [audioEnabled]);

  useEffect(() => {
    if (!audioEnabled) {
      return;
    }

    audioService.updateBgmSeed(getResolvedSeed());
  }, [gameSeed, configSeed, audioEnabled]);

  useEffect(() => {
    const resumeAudio = () => {
      void audioService.resumeAudioContextFromGesture();
    };

    window.addEventListener('pointerdown', resumeAudio, { passive: true });
    window.addEventListener('keydown', resumeAudio);

    return () => {
      window.removeEventListener('pointerdown', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
    };
  }, []);

  useEffect(() => {
    if (!audioEnabled || !engine) {
      return undefined;
    }

    const offStarted = engine.on('game:started', () => {
      resetMelodyForSeed(getResolvedSeed());
    });
    const offCorrect = engine.on('move:correct', () => {
      playSuccessfulMoveNote();
    });

    return () => {
      offStarted();
      offCorrect();
    };
  }, [engine, audioEnabled]);

  return {
    currentMusicTrackId: audioService.getCurrentMusicTrackId(),
    resumeAudioContextFromGesture: audioService.resumeAudioContextFromGesture.bind(audioService),
    startBgmScheduler: audioService.startBgmScheduler.bind(audioService),
    stopBgmScheduler: audioService.stopBgmScheduler.bind(audioService),
    playSeededPianoNote: audioService.playSeededPianoNote.bind(audioService),
  };
};
