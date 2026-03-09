'use client';
import React, { useMemo } from 'react';
import { cn, panelCardClass, panelEyebrowClass, panelTitleClass } from '@/components/ui/classes';
import { useI18n } from '@/hooks/useI18n';
import { useAchievementStore } from '@/stores/achievementStore';
import type { AchievementCategory } from '@/types/achievement';

const CATEGORY_ORDER: AchievementCategory[] = ['play', 'performance', 'mastery', 'story', 'social_future'];

const copyForLocale = (locale: string) =>
  locale === 'zh-CN'
    ? {
        title: '成就概览',
        subtitle: '这里会汇总当前本地档案的完成率、最近解锁和各分类进度，方便持续扩展更多成就入口。',
        totalUnlocked: '已解锁',
        completion: '完成率',
        future: '后续联机',
        recentUnlocks: '最近解锁',
        nearCompletion: '接近完成',
        emptyRecent: '还没有新的解锁记录。',
        emptyNear: '目前没有接近完成的目标。',
        complete: '完成',
      }
    : {
        title: 'Achievement Overview',
        subtitle: 'Track local completion, recent unlocks, and category progress from one place while we keep wiring new achievement hooks into the game.',
        totalUnlocked: 'Unlocked',
        completion: 'Completion',
        future: 'Future Multiplayer',
        recentUnlocks: 'Recent Unlocks',
        nearCompletion: 'Near Completion',
        emptyRecent: 'No recent unlocks yet.',
        emptyNear: 'Nothing is close to completion right now.',
        complete: 'Complete',
      };

const AchievementSettingsPanel: React.FC = () => {
  const { locale, t } = useI18n();
  const copy = copyForLocale(locale);
  const definitions = useAchievementStore((state) => state.definitions);
  const profile = useAchievementStore((state) => state.profile);
  const recentUnlocks = useAchievementStore((state) => state.profile.recentUnlocks);
  const getNearCompletion = useAchievementStore((state) => state.getNearCompletion);
  const nearCompletion = getNearCompletion(4);
  const unlockedCount = definitions.filter((definition) => profile.progress[definition.id].unlocked).length;
  const completionRate = definitions.length === 0 ? 0 : Math.round((unlockedCount / definitions.length) * 100);

  const categoryLabels: Record<AchievementCategory, string> = {
    play: t('achievementCategoryPlay'),
    performance: t('achievementCategoryPerformance'),
    mastery: t('achievementCategoryMastery'),
    story: t('achievementCategoryStory'),
    social_future: t('achievementCategorySocialFuture'),
  };

  const achievementTitleById = useMemo(
    () =>
      Object.fromEntries(
        definitions.map((definition) => [definition.id, t(definition.titleKey)])
      ) as Record<string, string>,
    [definitions, t]
  );

  const categoryGroups = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: definitions
          .filter((definition) => definition.category === category)
          .map((definition) => ({
            definition,
            progress: profile.progress[definition.id],
          })),
      })).filter((group) => group.items.length > 0),
    [definitions, profile.progress]
  );

  return (
    <div className="space-y-4">
      <div className={cn(panelCardClass({ tone: 'accent' }), 'space-y-4')}>
        <div className="space-y-2">
          <div className={panelEyebrowClass}>{copy.title}</div>
          <div className={cn(panelTitleClass, 'text-base')}>{copy.subtitle}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] bg-white/80 px-4 py-4 dark:bg-[#383d43]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d8398] dark:text-[#b8c2cb]">
              {copy.totalUnlocked}
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#173550] dark:text-[#eef5fb]">
              {unlockedCount} / {definitions.length}
            </div>
          </div>

          <div className="rounded-[20px] bg-white/80 px-4 py-4 dark:bg-[#383d43]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d8398] dark:text-[#b8c2cb]">
              {copy.completion}
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#173550] dark:text-[#eef5fb]">{completionRate}%</div>
          </div>

          <div className="rounded-[20px] bg-white/80 px-4 py-4 dark:bg-[#383d43]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d8398] dark:text-[#b8c2cb]">
              {copy.recentUnlocks}
            </div>
            <div className="mt-2 text-sm font-semibold text-[#173550] dark:text-[#eef5fb]">
              {recentUnlocks[0] ? achievementTitleById[recentUnlocks[0].achievementId] : t('achievementNoneYet')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="space-y-4">
          {categoryGroups.map((group) => (
            <div key={group.category} className={panelCardClass({ tone: 'muted' })}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className={panelTitleClass}>{categoryLabels[group.category]}</div>
                <span className="text-xs text-[#6d8398] dark:text-[#b8c2cb]">
                  {group.items.filter((item) => item.progress.unlocked).length}/{group.items.length} {copy.complete}
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map(({ definition, progress }) => {
                  const ratio = Math.min(1, progress.targetValue === 0 ? 0 : progress.currentValue / progress.targetValue);
                  const isHidden = Boolean(definition.hidden && !progress.unlocked);
                  const title = isHidden ? t('achievementHiddenTitle') : t(definition.titleKey);
                  const description = isHidden ? t('achievementHiddenDescription') : t(definition.descriptionKey);
                  const statusLabel = definition.futureOnly
                    ? copy.future
                    : progress.unlocked
                      ? t('achievementStatusUnlocked')
                      : t('achievementStatusInProgress');

                  return (
                    <div key={definition.id} className="rounded-[20px] bg-white/85 px-4 py-3 dark:bg-[#383d43]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[#18334c] dark:text-[#eef5fb]">{title}</div>
                          <div className="mt-1 text-sm leading-6 text-[#50687d] dark:text-[#c6d0d8]">{description}</div>
                          <div className="mt-2 text-xs text-[#62798f] dark:text-[#b8c2cb]">{statusLabel}</div>
                        </div>

                        <div className="shrink-0 text-sm font-semibold text-[#173550] dark:text-[#eef5fb]">
                          {progress.currentValue}/{progress.targetValue}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[#74889b] dark:text-[#b8c2cb]">
                          <span>{t('achievementProgressLabel')}</span>
                          <span>{Math.round(ratio * 100)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#dce9f4] dark:bg-[#2a3440]">
                          <div
                            className="h-full rounded-full bg-[#1f5b9e] dark:bg-[#8dc9ff]"
                            style={{ width: `${Math.round(ratio * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className={panelCardClass({ tone: 'muted' })}>
            <div className="mb-3 flex items-center justify-between">
              <div className={panelTitleClass}>{copy.recentUnlocks}</div>
              <div className="text-xs text-[#6d8398] dark:text-[#b8c2cb]">{t('achievementStatusUnlocked')}</div>
            </div>

            <div className="space-y-2">
              {recentUnlocks.length === 0 && (
                <div className="rounded-2xl bg-white/85 px-4 py-4 text-sm text-[#62798f] dark:bg-[#383d43] dark:text-[#b8c2cb]">
                  {copy.emptyRecent}
                </div>
              )}

              {recentUnlocks.map((entry) => (
                <div key={`${entry.achievementId}-${entry.unlockedAt}`} className="rounded-2xl bg-white/85 px-4 py-3 dark:bg-[#383d43]">
                  <div className="font-semibold text-[#18334c] dark:text-[#eef5fb]">{achievementTitleById[entry.achievementId]}</div>
                  <div className="mt-1 text-xs text-[#62798f] dark:text-[#b8c2cb]">
                    {new Date(entry.unlockedAt).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={panelCardClass({ tone: 'muted' })}>
            <div className="mb-3 flex items-center justify-between">
              <div className={panelTitleClass}>{copy.nearCompletion}</div>
              <div className="text-xs text-[#6d8398] dark:text-[#b8c2cb]">{t('achievementStatusInProgress')}</div>
            </div>

            <div className="space-y-2">
              {nearCompletion.length === 0 && (
                <div className="rounded-2xl bg-white/85 px-4 py-4 text-sm text-[#62798f] dark:bg-[#383d43] dark:text-[#b8c2cb]">
                  {copy.emptyNear}
                </div>
              )}

              {nearCompletion.map(({ id, progress }) => (
                <div key={id} className="rounded-2xl bg-white/85 px-4 py-3 dark:bg-[#383d43]">
                  <div className="font-semibold text-[#18334c] dark:text-[#eef5fb]">{achievementTitleById[id]}</div>
                  <div className="mt-1 text-xs text-[#62798f] dark:text-[#b8c2cb]">
                    {progress.currentValue}/{progress.targetValue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementSettingsPanel;
