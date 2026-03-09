import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StoryRunEngine } from '@/core/story/StoryRunEngine';
import { STORY_CHAPTERS, STORY_DEFAULT_PROFILE, STORY_SKINS, STORY_STAGES } from '@/data/storyContent';
import type {
  RunEngine,
  SkinDefinition,
  StoryAccessStatus,
  StoryChapterDefinition,
  StoryProfile,
  StoryRunResult,
  StoryRunState,
  StoryStageDefinition,
  StoryUnlockChange,
  StoryView,
} from '@/types/story';

interface StoryStore {
  view: StoryView;
  selectedStageId: string | null;
  profile: StoryProfile;
  runState: StoryRunState | null;
  runResult: StoryRunResult | null;
  engine: RunEngine | null;
  enterHome: () => void;
  selectStage: (stageId: string) => void;
  startStage: (stageId?: string) => { ok: boolean; reason?: string };
  submitCellTap: (cellId: string) => void;
  useHint: () => void;
  retryStage: () => { ok: boolean; reason?: string };
  leaveRun: () => void;
  buySkin: (skinId: string) => { ok: boolean; reason?: string };
  equipSkin: (skinId: string) => { ok: boolean; reason?: string };
  continueFromResult: () => void;
  getStage: (stageId: string) => StoryStageDefinition | null;
  getChapter: (chapterId: string) => StoryChapterDefinition | null;
  getSkin: (skinId: string) => SkinDefinition | null;
  getAccessStatus: (stageId: string) => StoryAccessStatus;
  getEffectiveEntryCost: (stageId: string) => number;
  getNextStageId: (stageId: string) => string | null;
}

const stageMap = Object.fromEntries(STORY_STAGES.map((stage) => [stage.id, stage])) as Record<string, StoryStageDefinition>;
const chapterMap = Object.fromEntries(STORY_CHAPTERS.map((chapter) => [chapter.id, chapter])) as Record<string, StoryChapterDefinition>;
const skinMap = Object.fromEntries(STORY_SKINS.map((skin) => [skin.id, skin])) as Record<string, SkinDefinition>;

const getStage = (stageId: string) => stageMap[stageId] ?? null;
const getChapter = (chapterId: string) => chapterMap[chapterId] ?? null;
const getSkin = (skinId: string) => skinMap[skinId] ?? null;

const getEquippedSkin = (profile: StoryProfile) => getSkin(profile.equippedSkinId);

const getEntryCostReduction = (skin: SkinDefinition | null) =>
  (skin?.modifiers.find((modifier) => modifier.type === 'stage_entry_cost_reduction')?.value as number | undefined) ?? 0;

const getStyleBonusRate = (skin: SkinDefinition | null) =>
  (skin?.modifiers.find((modifier) => modifier.type === 'style_currency_bonus_rate')?.value as number | undefined) ?? 0;

const buildAccessReasons = (profile: StoryProfile, stage: StoryStageDefinition): string[] =>
  stage.accessConditions.flatMap((condition) => {
    if (condition.type === 'chapter_complete' && !profile.completedChapterIds.includes(condition.chapterId)) {
      const chapter = getChapter(condition.chapterId);
      return [`Finish ${chapter?.title ?? condition.chapterId} first.`];
    }

    if (condition.type === 'stage_complete' && !profile.stageStates[condition.stageId]?.completed) {
      const dependency = getStage(condition.stageId);
      return [`Clear ${dependency?.title ?? condition.stageId} first.`];
    }

    if (condition.type === 'resource_at_least') {
      const current = profile[condition.resourceKey];
      if (current < condition.amount) {
        const label = condition.resourceKey === 'progressCurrency' ? 'progress credits' : 'style credits';
        return [`Need ${condition.amount} ${label}.`];
      }
    }

    if (condition.type === 'skin_owned' && !profile.ownedSkinIds.includes(condition.skinId)) {
      const skin = getSkin(condition.skinId);
      return [`Own ${skin?.name ?? condition.skinId} to enter.`];
    }

    return [];
  });

const getAccessStatus = (profile: StoryProfile, stageId: string): StoryAccessStatus => {
  const stage = getStage(stageId);
  if (!stage) {
    return {
      unlocked: false,
      reasons: ['Stage not found.'],
    };
  }

  const reasons = buildAccessReasons(profile, stage);
  return {
    unlocked: reasons.length === 0,
    reasons,
  };
};

const getEffectiveEntryCost = (profile: StoryProfile, stageId: string) => {
  const stage = getStage(stageId);
  if (!stage) {
    return 0;
  }

  const reduction = getEntryCostReduction(getEquippedSkin(profile));
  return Math.max(0, stage.rules.entryCost - reduction);
};

const computeCompletedChapters = (profile: StoryProfile): string[] =>
  STORY_CHAPTERS.filter((chapter) => chapter.stageIds.every((stageId) => profile.stageStates[stageId]?.completed)).map((chapter) => chapter.id);

const applyRunResult = (profile: StoryProfile, result: StoryRunResult): { profile: StoryProfile; unlockChanges: StoryUnlockChange[] } => {
  const stage = getStage(result.stageId);
  if (!stage) {
    return { profile, unlockChanges: [] };
  }

  const previousBestElapsedMs = profile.stageStates[result.stageId]?.bestElapsedMs;

  const nextProfile: StoryProfile = {
    ...profile,
    stageStates: {
      ...profile.stageStates,
      [result.stageId]: {
        completed: result.success || profile.stageStates[result.stageId]?.completed || false,
        attempts: profile.stageStates[result.stageId]?.attempts ?? 0,
        bestElapsedMs:
          result.success && result.elapsedMs !== undefined
            ? previousBestElapsedMs === null || previousBestElapsedMs === undefined
              ? result.elapsedMs
              : Math.min(previousBestElapsedMs, result.elapsedMs)
            : previousBestElapsedMs ?? null,
        rewardsClaimed: result.success || profile.stageStates[result.stageId]?.rewardsClaimed || false,
      },
    },
  };
  const unlockChanges: StoryUnlockChange[] = [];

  if (result.success) {
    nextProfile.progressCurrency += result.rewardsGranted.progressCurrency;
    nextProfile.styleCurrency += result.rewardsGranted.styleCurrency;

    result.rewardsGranted.skinUnlockIds.forEach((skinId) => {
      if (!nextProfile.ownedSkinIds.includes(skinId)) {
        nextProfile.ownedSkinIds = [...nextProfile.ownedSkinIds, skinId];
        const skin = getSkin(skinId);
        unlockChanges.push({
          type: 'skin',
          id: skinId,
          title: skin?.name ?? skinId,
        });
      }
    });

    result.rewardsGranted.stageUnlockIds.forEach((stageId) => {
      const stageDefinition = getStage(stageId);
      if (stageDefinition) {
        unlockChanges.push({
          type: 'stage',
          id: stageId,
          title: stageDefinition.title,
        });
      }
    });

    const previousChapterIds = new Set(profile.completedChapterIds);
    nextProfile.completedChapterIds = computeCompletedChapters(nextProfile);
    nextProfile.completedChapterIds.forEach((chapterId) => {
      if (!previousChapterIds.has(chapterId)) {
        const chapter = getChapter(chapterId);
        unlockChanges.push({
          type: 'chapter',
          id: chapterId,
          title: chapter?.title ?? chapterId,
        });
      }
    });
  }

  return {
    profile: nextProfile,
    unlockChanges,
  };
};

const mergeProfile = (persistedProfile?: Partial<StoryProfile>): StoryProfile => {
  const base = STORY_DEFAULT_PROFILE;
  return {
    ...base,
    ...persistedProfile,
    ownedSkinIds: persistedProfile?.ownedSkinIds?.length ? persistedProfile.ownedSkinIds : base.ownedSkinIds,
    completedChapterIds: persistedProfile?.completedChapterIds?.length ? persistedProfile.completedChapterIds : base.completedChapterIds,
    stageStates: persistedProfile?.stageStates ?? base.stageStates,
    equippedSkinId:
      persistedProfile?.equippedSkinId && getSkin(persistedProfile.equippedSkinId) ? persistedProfile.equippedSkinId : base.equippedSkinId,
  };
};

export const useStoryStore = create<StoryStore>()(
  persist(
    (set, get) => ({
      view: 'home',
      selectedStageId: STORY_STAGES[0]?.id ?? null,
      profile: STORY_DEFAULT_PROFILE,
      runState: null,
      runResult: null,
      engine: null,
      enterHome: () => {
        get().engine?.dispose();
        set({
          view: 'home',
          runState: null,
          runResult: null,
          engine: null,
        });
      },
      selectStage: (stageId) => {
        set({
          selectedStageId: stageId,
          view: 'prep',
          runResult: null,
        });
      },
      startStage: (stageId) => {
        const targetStageId = stageId ?? get().selectedStageId;
        if (!targetStageId) {
          return { ok: false, reason: 'No stage selected.' };
        }

        const stage = getStage(targetStageId);
        if (!stage) {
          return { ok: false, reason: 'Stage not found.' };
        }

        const profile = get().profile;
        const access = getAccessStatus(profile, targetStageId);
        if (!access.unlocked) {
          return { ok: false, reason: access.reasons[0] };
        }

        const entryCost = getEffectiveEntryCost(profile, targetStageId);
        if (profile.progressCurrency < entryCost) {
          return { ok: false, reason: 'Not enough progress credits.' };
        }

        get().engine?.dispose();
        const equippedSkin = getEquippedSkin(profile);
        const engine = new StoryRunEngine(stage, equippedSkin);

        const nextProfile: StoryProfile = {
          ...profile,
          progressCurrency: profile.progressCurrency - entryCost,
          stageStates: {
            ...profile.stageStates,
            [targetStageId]: {
              completed: profile.stageStates[targetStageId]?.completed ?? false,
              attempts: (profile.stageStates[targetStageId]?.attempts ?? 0) + 1,
              bestElapsedMs: profile.stageStates[targetStageId]?.bestElapsedMs ?? null,
              rewardsClaimed: profile.stageStates[targetStageId]?.rewardsClaimed ?? false,
            },
          },
        };

        engine.subscribe((runState) => {
          const previousPhase = get().runState?.phase;
          set({ runState });

          if (runState.phase !== 'running' && previousPhase === 'running') {
            const rawResult = engine.getResult();
            if (!rawResult) {
              return;
            }

            const equippedSkin = getSkin(nextProfile.equippedSkinId);
            const styleMultiplier = 1 + getStyleBonusRate(equippedSkin);
            const adjustedRewards = rawResult.success
              ? {
                  ...rawResult.rewardsGranted,
                  styleCurrency: Math.round(rawResult.rewardsGranted.styleCurrency * styleMultiplier),
                  skinUnlockIds: [...rawResult.rewardsGranted.skinUnlockIds],
                  stageUnlockIds: [...rawResult.rewardsGranted.stageUnlockIds],
                }
              : {
                  ...rawResult.rewardsGranted,
                  skinUnlockIds: [...rawResult.rewardsGranted.skinUnlockIds],
                  stageUnlockIds: [...rawResult.rewardsGranted.stageUnlockIds],
                };

            const completedResult: StoryRunResult = {
              ...rawResult,
              usedSkinId: nextProfile.equippedSkinId,
              rewardsGranted: adjustedRewards,
              unlockChanges: [],
            };
            const applied = applyRunResult(get().profile, completedResult);
            const finalResult: StoryRunResult = {
              ...completedResult,
              unlockChanges: applied.unlockChanges,
            };

            engine.dispose();
            set({
              profile: applied.profile,
              runResult: finalResult,
              view: 'result',
              engine: null,
            });
          }
        });

        set({
          profile: nextProfile,
          selectedStageId: targetStageId,
          view: 'run',
          runState: engine.getState(),
          runResult: null,
          engine,
        });
        engine.start();
        return { ok: true };
      },
      submitCellTap: (cellId) => {
        get().engine?.handleInput({
          type: 'tap_cell',
          cellId,
        });
      },
      useHint: () => {
        get().engine?.handleInput({
          type: 'use_hint',
        });
      },
      retryStage: () => {
        const stageId = get().selectedStageId;
        if (!stageId) {
          return { ok: false, reason: 'No stage selected.' };
        }
        return get().startStage(stageId);
      },
      leaveRun: () => {
        get().engine?.dispose();
        set({
          view: 'prep',
          runState: null,
          runResult: null,
          engine: null,
        });
      },
      buySkin: (skinId) => {
        const skin = getSkin(skinId);
        if (!skin) {
          return { ok: false, reason: 'Skin not found.' };
        }

        const profile = get().profile;
        if (profile.ownedSkinIds.includes(skinId)) {
          return { ok: false, reason: 'Skin already owned.' };
        }

        if (profile.styleCurrency < skin.cost) {
          return { ok: false, reason: 'Not enough style credits.' };
        }

        set({
          profile: {
            ...profile,
            styleCurrency: profile.styleCurrency - skin.cost,
            ownedSkinIds: [...profile.ownedSkinIds, skinId],
          },
        });
        return { ok: true };
      },
      equipSkin: (skinId) => {
        const profile = get().profile;
        if (!profile.ownedSkinIds.includes(skinId)) {
          return { ok: false, reason: 'Skin not owned.' };
        }

        set({
          profile: {
            ...profile,
            equippedSkinId: skinId,
          },
        });
        return { ok: true };
      },
      continueFromResult: () => {
        const runResult = get().runResult;
        if (!runResult) {
          set({ view: 'home' });
          return;
        }

        const nextStageId = get().getNextStageId(runResult.stageId);
        if (runResult.success && nextStageId) {
          set({
            selectedStageId: nextStageId,
            view: 'prep',
            runState: null,
            runResult: null,
          });
          return;
        }

        set({
          view: 'home',
          runState: null,
          runResult: null,
        });
      },
      getStage,
      getChapter,
      getSkin,
      getAccessStatus: (stageId) => getAccessStatus(get().profile, stageId),
      getEffectiveEntryCost: (stageId) => getEffectiveEntryCost(get().profile, stageId),
      getNextStageId: (stageId) => {
        const currentIndex = STORY_STAGES.findIndex((stage) => stage.id === stageId);
        if (currentIndex === -1 || currentIndex === STORY_STAGES.length - 1) {
          return null;
        }
        return STORY_STAGES[currentIndex + 1]?.id ?? null;
      },
    }),
    {
      name: 'simulated-athletics-story',
      partialize: (state) => ({
        profile: state.profile,
        selectedStageId: state.selectedStageId,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<StoryStore>;
        return {
          ...currentState,
          selectedStageId: persisted.selectedStageId ?? currentState.selectedStageId,
          profile: mergeProfile(persisted.profile),
          view: 'home',
          runState: null,
          runResult: null,
          engine: null,
        };
      },
    }
  )
);
