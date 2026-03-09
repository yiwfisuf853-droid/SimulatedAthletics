'use client';
import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useConfigStore } from '@/stores/configStore';
import { useLeaderboardStore } from '@/stores/leaderboardStore';
import { cn, panelCardClass, panelTitleClass } from '@/components/ui/classes';

interface LeaderboardProps {
  disabled?: boolean;
  onReplay?: (recordId: string) => void;
  compact?: boolean;
  className?: string;
  limit?: number;
}

const formatDuration = (duration: number) => {
  if (duration < 60) {
    return `${duration.toFixed(1)}s`;
  }

  const minutes = Math.floor(duration / 60);
  const seconds = (duration % 60).toFixed(1).padStart(4, '0');
  return `${minutes}m ${seconds}s`;
};

const Leaderboard: React.FC<LeaderboardProps> = ({
  disabled = false,
  onReplay,
  compact = false,
  className = '',
  limit = 8,
}) => {
  const { t } = useI18n();
  const modules = useConfigStore((state) => state.modules);
  const { records } = useLeaderboardStore();

  if (!modules.leaderboard) return null;

  const visibleRecords = records.slice(0, limit);

  return (
    <div
      className={cn(
        panelCardClass({ compact, tone: 'muted' }),
        compact ? 'p-3' : 'flex-1 p-4',
        className
      )}
    >
      <div className={cn(panelTitleClass, compact ? 'mb-2 text-sm' : 'mb-3 text-base')}>
        {t('leaderboard')}
      </div>
      <ol className="m-0 list-none space-y-2 p-0">
        {visibleRecords.map((entry, index) => (
          <li
            key={entry.id}
            className={`flex items-center justify-between border-b border-[#e6edf5] text-sm transition-colors dark:border-[#555] ${
              compact ? 'px-1 py-2' : 'px-2 py-2'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[#f0f4f8] dark:hover:bg-[#5a5a5a]'}`}
            onClick={() => !disabled && onReplay?.(entry.id)}
          >
            <span className="w-7 text-[#8a9fb0] dark:text-[#808080]">{index + 1}</span>
            <span className="ml-2 flex-1 font-medium text-[#1a3149] dark:text-[#e0e0e0]">
              {entry.size}x{entry.size} {formatDuration(entry.duration)}
              {entry.lazy && (
                <span className="ml-2 rounded-full bg-[#d1e0f0] px-2 py-0.5 text-xs font-bold text-[#1e3b5c] dark:bg-[#4a6a8a] dark:text-[#e0e0e0]">
                  L
                </span>
              )}
            </span>
            <span className="font-semibold text-[#1f4a7a] dark:text-[#6a9aff]">
              {entry.score.toFixed(1)}
            </span>
          </li>
        ))}
        {visibleRecords.length < limit && Array.from({ length: limit - visibleRecords.length }).map((_, index) => {
          const rank = visibleRecords.length + index + 1;
          return (
            <li key={`empty-${index}`} className={`flex items-center text-sm ${compact ? 'px-1 py-2' : 'p-2'}`}>
              <span className="w-7 text-[#8a9fb0] dark:text-[#808080]">{rank}</span>
              <span className="ml-2 flex-1 text-[#8a9fb0] dark:text-[#808080]">--</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Leaderboard;
