'use client';
import React from 'react';
import { panelCardClass, panelTitleClass } from '@/components/ui/classes';
import { useI18n } from '@/hooks/useI18n';
import { useAchievementStore } from '@/stores/achievementStore';

interface AchievementSessionSummaryProps {
  sessionId: string | null;
  className?: string;
}

const AchievementSessionSummary: React.FC<AchievementSessionSummaryProps> = ({ sessionId, className = '' }) => {
  const { t } = useI18n();
  const { definitions, profile, sessionRecaps } = useAchievementStore();

  if (!sessionId) return null;

  const recap = sessionRecaps[sessionId];
  if (!recap || (recap.unlockIds.length === 0 && recap.progressedIds.length === 0)) {
    return null;
  }

  const progressOnlyIds = recap.progressedIds.filter((achievementId) => !recap.unlockIds.includes(achievementId)).slice(0, 3);

  return (
    <div className={`${panelCardClass({ tone: 'muted' })} ${className}`}>
      <div className={panelTitleClass}>{t('achievementSessionSummary')}</div>

      {recap.unlockIds.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d8297] dark:text-[#b8c2cb]">
            {t('achievementUnlockedThisRun')}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {recap.unlockIds.map((achievementId) => {
              const definition = definitions.find((entry) => entry.id === achievementId);
              if (!definition) return null;
              return (
                <span
                  key={achievementId}
                  className="rounded-full bg-[#e9f6ee] px-3 py-1.5 text-sm font-medium text-[#2c6a3f] dark:bg-[#344f3b] dark:text-[#ddf8e2]"
                >
                  {t(definition.titleKey)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {progressOnlyIds.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d8297] dark:text-[#b8c2cb]">
            {t('achievementProgressThisRun')}
          </div>
          {progressOnlyIds.map((achievementId) => {
            const definition = definitions.find((entry) => entry.id === achievementId);
            const progress = profile.progress[achievementId];
            if (!definition || !progress) return null;

            return (
              <div key={achievementId}>
                <div className="flex items-center justify-between text-sm text-[#27435b] dark:text-[#eef5fb]">
                  <span>{t(definition.titleKey)}</span>
                  <span className="text-xs text-[#6d8297] dark:text-[#b8c2cb]">
                    {Math.min(progress.currentValue, progress.targetValue)} / {progress.targetValue}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[#e5edf5] dark:bg-[#4b525a]">
                  <div
                    className="h-1.5 rounded-full bg-[#1f5b9e]"
                    style={{ width: `${Math.min(progress.currentValue / progress.targetValue, 1) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AchievementSessionSummary;
