'use client';
import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useLeaderboardStore } from '@/stores/leaderboardStore';
import { cn, panelShellClass } from '@/components/ui/classes';
import Leaderboard from '../info/Leaderboard';
import ScoreDisplay from '../info/ScoreDisplay';
import TimerDisplay from '../info/TimerDisplay';
import ReplayPanel from '../replay/ReplayPanel';

interface RightPanelProps {
  className?: string;
}

const RightPanel: React.FC<RightPanelProps> = ({ className = '' }) => {
  const { phase, startReplay } = useGameStore();
  const { getGameRecord } = useLeaderboardStore();
  const isReplay = phase === 'replay';
  const isGameActive = phase === 'playing';

  const handleReplay = (recordId: string) => {
    const record = getGameRecord(recordId);
    if (record) {
      startReplay(record);
    }
  };

  return (
    <div className={cn(panelShellClass({ variant: 'sidebar' }), 'h-full gap-3', className)}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <TimerDisplay compact className="w-full shrink-0" />
        <ScoreDisplay compact className="w-full" />
      </div>
      {!isReplay && <Leaderboard disabled={isGameActive} onReplay={handleReplay} className="min-h-[220px]" />}
      {isReplay && <ReplayPanel className="min-h-[220px]" />}
    </div>
  );
};

export default RightPanel;
