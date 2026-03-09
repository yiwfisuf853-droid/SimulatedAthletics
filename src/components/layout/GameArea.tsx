'use client';
import React, { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import ConfigBar from '../game/ConfigBar';
import GameBoard from '../game/GameBoard';
import MoreSettingsPanel from '../panels/MoreSettingsPanel';

interface GameAreaProps {
  showMoreSettings: boolean;
  setShowMoreSettings: (show: boolean) => void;
}

const GameArea: React.FC<GameAreaProps> = ({ showMoreSettings, setShowMoreSettings }) => {
  const phase = useGameStore((state) => state.phase);
  const isIdle = phase === 'idle';

  useEffect(() => {
    if (!isIdle && showMoreSettings) {
      setShowMoreSettings(false);
    }
  }, [isIdle, showMoreSettings, setShowMoreSettings]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isIdle && <ConfigBar onMoreSettings={() => setShowMoreSettings(!showMoreSettings)} />}

      <div
        className={`relative mt-4 flex min-h-0 flex-1 items-center justify-center rounded-[28px] bg-[#f9fcff] transition-all duration-300 dark:bg-[#2d2d2d] ${
          isIdle ? 'p-4 sm:p-5' : 'p-2 sm:p-3 md:p-4'
        }`}
      >
        <GameBoard />

        {isIdle && showMoreSettings && (
          <div
            className="absolute inset-0 z-20 flex min-h-0 items-start justify-center bg-[rgba(15,23,42,0.16)] p-4 backdrop-blur-[2px]"
            onClick={() => setShowMoreSettings(false)}
          >
            <div className="flex h-full min-h-0 w-full max-w-[1080px] items-stretch">
              <MoreSettingsPanel onClose={() => setShowMoreSettings(false)} phase={phase} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameArea;
