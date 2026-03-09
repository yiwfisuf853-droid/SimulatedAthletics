import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ACHIEVEMENT_DEFINITIONS } from '@/core/achievement/definitions';
import { createAchievementProfile, evaluateAchievementEvent, mergeSessionRecap } from '@/core/achievement/evaluator';
import type {
  AchievementCategory,
  AchievementDefinition,
  AchievementEvent,
  AchievementId,
  AchievementProfile,
  AchievementProgress,
  AchievementSessionRecap,
  AchievementUnlockRecord,
} from '@/types/achievement';

interface AchievementStoreState {
  definitions: AchievementDefinition[];
  profile: AchievementProfile;
  unlockQueue: AchievementUnlockRecord[];
  sessionRecaps: Record<string, AchievementSessionRecap>;
  lastCompletedSessionId: string | null;
  registerDefinitions: (definitions: AchievementDefinition[]) => void;
  trackEvent: (event: AchievementEvent) => void;
  shiftUnlockQueue: () => void;
  clearSessionRecap: (sessionId: string) => void;
  getProgress: (achievementId: AchievementId) => AchievementProgress;
  getAchievementsByCategory: (category: AchievementCategory) => Array<AchievementDefinition & { progress: AchievementProgress }>;
  getNearCompletion: (limit?: number) => Array<AchievementDefinition & { progress: AchievementProgress }>;
}

const DEFAULT_DEFINITIONS = ACHIEVEMENT_DEFINITIONS;

export const useAchievementStore = create<AchievementStoreState>()(
  persist(
    (set, get) => ({
      definitions: DEFAULT_DEFINITIONS,
      profile: createAchievementProfile(DEFAULT_DEFINITIONS),
      unlockQueue: [],
      sessionRecaps: {},
      lastCompletedSessionId: null,

      registerDefinitions: (definitions) => {
        set((state) => ({
          definitions,
          profile: createAchievementProfile(definitions, state.profile),
        }));
      },

      trackEvent: (event) => {
        const { definitions, profile, sessionRecaps } = get();
        const { profile: nextProfile, unlockedIds, progressedIds } = evaluateAchievementEvent(profile, definitions, event);
        const unlockQueue = unlockedIds.map((achievementId) => ({
          achievementId,
          unlockedAt: event.timestamp,
        }));

        const nextSessionRecaps = { ...sessionRecaps };
        if (event.sessionId) {
          nextSessionRecaps[event.sessionId] = mergeSessionRecap(
            sessionRecaps[event.sessionId],
            event.sessionId,
            event.timestamp,
            unlockedIds,
            progressedIds
          );
        }

        set((state) => ({
          profile: nextProfile,
          unlockQueue: [...state.unlockQueue, ...unlockQueue],
          sessionRecaps: nextSessionRecaps,
          lastCompletedSessionId: event.type === 'game:completed' ? event.sessionId ?? state.lastCompletedSessionId : state.lastCompletedSessionId,
        }));
      },

      shiftUnlockQueue: () => {
        set((state) => ({
          unlockQueue: state.unlockQueue.slice(1),
        }));
      },

      clearSessionRecap: (sessionId) => {
        set((state) => {
          const nextSessionRecaps = { ...state.sessionRecaps };
          delete nextSessionRecaps[sessionId];
          return {
            sessionRecaps: nextSessionRecaps,
          };
        });
      },

      getProgress: (achievementId) => {
        return get().profile.progress[achievementId];
      },

      getAchievementsByCategory: (category) => {
        const { definitions, profile } = get();
        return definitions
          .filter((definition) => definition.category === category)
          .map((definition) => ({
            ...definition,
            progress: profile.progress[definition.id],
          }));
      },

      getNearCompletion: (limit = 3) => {
        const { definitions, profile } = get();
        return definitions
          .map((definition) => ({
            ...definition,
            progress: profile.progress[definition.id],
          }))
          .filter(({ progress, futureOnly }) => !futureOnly && !progress.unlocked && progress.currentValue > 0)
          .sort((left, right) => {
            const leftRatio = left.progress.currentValue / left.progress.targetValue;
            const rightRatio = right.progress.currentValue / right.progress.targetValue;
            return rightRatio - leftRatio || right.progress.currentValue - left.progress.currentValue;
          })
          .slice(0, limit);
      },
    }),
    {
      name: 'simulated-athletics-achievements',
      partialize: (state) => ({
        profile: state.profile,
      }),
      merge: (persistedState, currentState) => {
        const persistedProfile = (persistedState as Partial<AchievementStoreState> | undefined)?.profile;

        return {
          ...currentState,
          profile: createAchievementProfile(currentState.definitions, persistedProfile),
          unlockQueue: [],
          sessionRecaps: {},
          lastCompletedSessionId: null,
        };
      },
    }
  )
);
