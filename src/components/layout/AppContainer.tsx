'use client';
import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import GameArea from './GameArea';
import RightPanel from './RightPanel';

const AppContainer: React.FC = () => {
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const phase = useGameStore((state) => state.phase);
  const isIdle = phase === 'idle';

  return (
    <div className="flex h-full w-full max-w-[1560px] min-h-0 flex-col overflow-hidden rounded-[28px] bg-[var(--container-bg)] p-4 shadow-[0_20px_40px_-10px_rgba(0,20,40,0.2)] transition-all duration-300 sm:p-5">
      <GameArea showMoreSettings={showMoreSettings} setShowMoreSettings={setShowMoreSettings} />

      <div className="mt-4 flex min-h-0 justify-end">
        <RightPanel className={`w-full min-h-0 ${isIdle ? 'xl:max-w-[300px]' : 'xl:max-w-[320px]'}`} />
      </div>
    </div>
  );
};

export default AppContainer;
