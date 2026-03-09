/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { REPLAY_RECORD_EVENT } from '@/contexts/replayEvents';
import { ReplayPlayer, type ReplayState } from '@/core/replay/ReplayPlayer';
import { trackAchievementEvent } from '@/services/achievementService';
import { toAchievementConfigSnapshot } from '@/types/achievement';
import type { GameRecord } from '@/types/game';

interface ReplayContextValue {
  record: GameRecord | null;
  state: ReplayState;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSpeed: (speed: number) => void;
  seekTo: (step: number) => void;
  reset: () => void;
  currentSpeed: number;
}

const defaultState: ReplayState = {
  grid: [],
  score: 0,
  combo: 0,
  multiplier: 1,
  mistakeCount: 0,
  currentTime: 0,
  step: 0,
  totalSteps: 0,
  isPlaying: false,
  currentMinCell: null,
};

const ReplayContext = createContext<ReplayContextValue>({
  record: null,
  state: defaultState,
  play: () => {},
  pause: () => {},
  toggle: () => {},
  stepForward: () => {},
  stepBackward: () => {},
  setSpeed: () => {},
  seekTo: () => {},
  reset: () => {},
  currentSpeed: 1,
});

export const ReplayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [record, setRecord] = useState<GameRecord | null>(null);
  const [state, setState] = useState<ReplayState>(defaultState);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const playerRef = useRef<ReplayPlayer | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const initPlayer = (nextRecord: GameRecord) => {
    unsubRef.current?.();
    playerRef.current?.pause();

    const player = new ReplayPlayer({
      config: nextRecord.config,
      initialGrid: nextRecord.initialGrid,
      actions: nextRecord.actions,
    });
    playerRef.current = player;
    setState(player.getState());
    unsubRef.current = player.subscribe((nextState) => setState({ ...nextState }));
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const nextRecord = (event as CustomEvent<GameRecord | null>).detail;
      if (nextRecord) {
        setRecord(nextRecord);
        initPlayer(nextRecord);
      } else {
        unsubRef.current?.();
        playerRef.current?.pause();
        playerRef.current = null;
        setRecord(null);
        setState(defaultState);
        setCurrentSpeed(1);
      }
    };

    window.addEventListener(REPLAY_RECORD_EVENT, handler);
    return () => window.removeEventListener(REPLAY_RECORD_EVENT, handler);
  }, []);

  const emitReplayEvent = (mode: 'play' | 'step_forward' | 'step_backward' | 'seek') => {
    if (!record) return;

    trackAchievementEvent({
      type: 'replay:played',
      timestamp: Date.now(),
      source: 'ui',
      sessionId: record.id || null,
      phase: 'replay',
      config: toAchievementConfigSnapshot(record.config),
      payload: {
        step: playerRef.current?.getState().step ?? state.step,
        totalSteps: record.actions.length,
        mode,
      },
    });
  };

  const play = () => {
    playerRef.current?.play();
    emitReplayEvent('play');
  };

  const toggle = () => {
    if (!playerRef.current) return;
    playerRef.current.toggle();
    if (!playerRef.current.getState().isPlaying) return;
    emitReplayEvent('play');
  };

  const stepForward = () => {
    playerRef.current?.stepForward();
    emitReplayEvent('step_forward');
  };

  const stepBackward = () => {
    playerRef.current?.stepBackward();
    emitReplayEvent('step_backward');
  };

  const seekTo = (step: number) => {
    playerRef.current?.seekTo(step);
    emitReplayEvent('seek');
  };

  return (
    <ReplayContext.Provider
      value={{
        record,
        state,
        play,
        pause: () => playerRef.current?.pause(),
        toggle,
        stepForward,
        stepBackward,
        setSpeed: (speed) => {
          setCurrentSpeed(speed);
          playerRef.current?.setSpeed(speed);
        },
        seekTo,
        reset: () => playerRef.current?.reset(),
        currentSpeed,
      }}
    >
      {children}
    </ReplayContext.Provider>
  );
};

export const useReplayContext = () => useContext(ReplayContext);
