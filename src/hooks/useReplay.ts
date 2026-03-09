import { useEffect, useState } from 'react';
import { ReplayPlayer, type ReplayState } from '@/core/replay/ReplayPlayer';
import type { GameRecord } from '@/types/game';

export const useReplay = (record: GameRecord) => {
  const [player] = useState(() => new ReplayPlayer({
    config: record.config,
    initialGrid: record.initialGrid,
    actions: record.actions
  }));
  
  const [state, setState] = useState<ReplayState>(player.getState());

  useEffect(() => {
    const unsubscribe = player.subscribe(setState);
    return unsubscribe;
  }, [player]);

  return {
    state,
    play: () => player.play(),
    pause: () => player.pause(),
    toggle: () => player.toggle(),
    stepForward: () => player.stepForward(),
    stepBackward: () => player.stepBackward(),
    setSpeed: (speed: number) => player.setSpeed(speed),
    seekTo: (step: number) => player.seekTo(step),
    reset: () => player.reset()
  };
};