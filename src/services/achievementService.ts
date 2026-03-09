import { ACHIEVEMENT_DEFINITIONS } from '@/core/achievement/definitions';
import { evaluateAchievementEvent } from '@/core/achievement/evaluator';
import { useAchievementStore } from '@/stores/achievementStore';
import type { AchievementDefinition, AchievementEvent, AchievementProfile, AchievementUpdateResult } from '@/types/achievement';

export const registerAchievementDefinitions = (definitions: AchievementDefinition[] = ACHIEVEMENT_DEFINITIONS) => {
  useAchievementStore.getState().registerDefinitions(definitions);
};

export const trackAchievementEvent = (event: AchievementEvent) => {
  useAchievementStore.getState().trackEvent(event);
};

export const evaluateAchievementEventForProfile = (
  profile: AchievementProfile,
  definitions: AchievementDefinition[],
  event: AchievementEvent
): AchievementUpdateResult => evaluateAchievementEvent(profile, definitions, event);
