'use client';
import React from 'react';
import AchievementSessionSummary from '@/components/achievement/AchievementSessionSummary';
import { useConfigStore } from '@/stores/configStore';
import { useGameStore } from '@/stores/gameStore';
import GameGrid from './GameGrid';
import IntroMessage from './IntroMessage';
import KeyDisplay from './KeyDisplay';
import ReplayGrid from './ReplayGrid';
import KeyboardScorePanel from '../panels/KeyboardScorePanel';

const GameBoard: React.FC = () => {
  const { phase, grid, sessionId } = useGameStore();
  const modules = useConfigStore((state) => state.modules);
  const isReplay = phase === 'replay';
  const isActive = phase === 'playing' || phase === 'finished' || phase === 'final_clicked' || phase === 'replay';
  const showKeyboardScore = isActive && modules.keyboardScore && grid.length > 0;
  const showSessionSummary = phase === 'final_clicked' && modules.achievements;

  if (phase === 'idle' && grid.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        <IntroMessage />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <div className="flex h-full w-full max-w-[1360px] min-h-0 flex-col items-center justify-center gap-4">
        {showKeyboardScore && (
          <KeyboardScorePanel className="w-full max-w-[960px] shrink-0 max-h-[26vh]" />
        )}

        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div className="relative flex w-full max-w-[960px] items-center justify-center">
            {isReplay ? <ReplayGrid /> : <GameGrid />}
          </div>
        </div>

        {showSessionSummary && <AchievementSessionSummary sessionId={sessionId} className="w-full max-w-[860px] shrink-0" />}
        <KeyDisplay />
      </div>
    </div>
  );
};

export default GameBoard;
