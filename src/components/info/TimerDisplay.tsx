'use client';
import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useReplayContext } from '@/contexts/ReplayContext';
import { cn, panelCardClass } from '@/components/ui/classes';

interface TimerDisplayProps {
  compact?: boolean;
  className?: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ compact = false, className = '' }) => {
  const { phase, elapsedTime } = useGameStore();
  const { state } = useReplayContext();
  const isReplay = phase === 'replay';
  const currentTime = isReplay ? state.currentTime : elapsedTime;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div
        className={cn(panelCardClass({ compact: true, align: 'center', tone: 'accent' }), 'flex h-11 items-center justify-center', className)}
      >
        <div className="font-mono text-lg font-bold leading-none tracking-[0.08em] text-[#1a3149] dark:text-[#e0e0e0] sm:text-xl">
          {formatTime(currentTime)}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(panelCardClass({ align: 'center', tone: 'accent' }), 'rounded-[26px]', className)}>
      <div className="font-mono text-3xl font-bold leading-tight tracking-[0.08em] text-[#1a3149] dark:text-[#e0e0e0]">
        {formatTime(currentTime)}
      </div>
    </div>
  );
};

export default TimerDisplay;
