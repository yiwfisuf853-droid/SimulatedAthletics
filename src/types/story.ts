export type StoryView = 'home' | 'prep' | 'run' | 'result';

export type StoryChapterTheme = 'bronze' | 'ember' | 'glacier';

export type StoryLayoutPreset = 'training_lane' | 'cluster_field' | 'relay_arena';

export type StoryObjectiveType =
  | 'tap_sequence'
  | 'tap_group_any_order'
  | 'tap_simultaneous'
  | 'clear_tagged_cells'
  | 'survive_duration';

export type StoryFailConditionType =
  | 'mistake_limit'
  | 'time_limit'
  | 'miss_simultaneous_window'
  | 'resource_depleted';

export type StoryAccessConditionType =
  | 'chapter_complete'
  | 'stage_complete'
  | 'resource_at_least'
  | 'skin_owned';

export type StoryInputAction =
  | {
      type: 'tap_cell';
      cellId: string;
    }
  | {
      type: 'multi_tap_cells';
      cellIds: string[];
    }
  | {
      type: 'hold_cell';
      cellId: string;
    }
  | {
      type: 'use_hint';
    };

export type SkinModifier =
  | {
      type: 'simultaneous_window_bonus_ms';
      value: number;
    }
  | {
      type: 'preview_hint_charges_bonus';
      value: number;
    }
  | {
      type: 'stage_entry_cost_reduction';
      value: number;
    }
  | {
      type: 'style_currency_bonus_rate';
      value: number;
    };

export interface SkinDefinition {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic';
  description: string;
  cost: number;
  visual: {
    accent: string;
    chip: string;
    boardGlow: string;
  };
  modifiers: SkinModifier[];
}

export interface StoryRewardBundle {
  progressCurrency: number;
  styleCurrency: number;
  skinUnlockIds: string[];
  stageUnlockIds: string[];
}

export interface StoryChapterDefinition {
  id: string;
  title: string;
  order: number;
  theme: StoryChapterTheme;
  summary: string;
  stageIds: string[];
}

export type StorySpawnRule =
  | {
      type: 'fixed_values';
      values: number[];
      tags?: string[];
    }
  | {
      type: 'duplicate_value';
      value: number;
      count: number;
      tags?: string[];
    }
  | {
      type: 'tagged_values';
      values: number[];
      tag: string;
      extraTags?: string[];
    }
  | {
      type: 'filler_values';
      count: number;
      values: number[];
      tags?: string[];
    };

export interface StoryBoardDefinition {
  rows: number;
  cols: number;
  layers: number;
  seed: string;
  layoutPreset: StoryLayoutPreset;
  spawnRules: StorySpawnRule[];
}

export type StoryObjectiveDefinition =
  | {
      id: string;
      type: 'tap_sequence';
      title: string;
      required: true;
      targetValues: number[];
    }
  | {
      id: string;
      type: 'tap_group_any_order';
      title: string;
      required: true;
      targetValue: number;
      requiredCount: number;
    }
  | {
      id: string;
      type: 'tap_simultaneous';
      title: string;
      required: true;
      targetValues: number[];
      windowMs: number;
    }
  | {
      id: string;
      type: 'clear_tagged_cells';
      title: string;
      required: true;
      tag: string;
      requiredCount: number;
    }
  | {
      id: string;
      type: 'survive_duration';
      title: string;
      required: true;
      durationMs: number;
    };

export type StoryFailCondition =
  | {
      id: string;
      type: 'mistake_limit';
      maxMistakes: number;
    }
  | {
      id: string;
      type: 'time_limit';
      limitMs: number;
    }
  | {
      id: string;
      type: 'miss_simultaneous_window';
      maxMisses: number;
    }
  | {
      id: string;
      type: 'resource_depleted';
      resourceKey: 'focus';
    };

export type StoryAccessCondition =
  | {
      id: string;
      type: 'chapter_complete';
      chapterId: string;
    }
  | {
      id: string;
      type: 'stage_complete';
      stageId: string;
    }
  | {
      id: string;
      type: 'resource_at_least';
      resourceKey: 'progressCurrency' | 'styleCurrency';
      amount: number;
    }
  | {
      id: string;
      type: 'skin_owned';
      skinId: string;
    };

export interface StoryStageRules {
  entryCost: number;
  baseHintCharges: number;
  focusPool?: number;
}

export interface StoryStageDefinition {
  id: string;
  chapterId: string;
  title: string;
  summary: string;
  board: StoryBoardDefinition;
  rules: StoryStageRules;
  objectives: StoryObjectiveDefinition[];
  failConditions: StoryFailCondition[];
  accessConditions: StoryAccessCondition[];
  rewards: StoryRewardBundle;
  presentation: {
    introDialogue: string;
    rivalDialogue: string;
    victoryDialogue: string;
    recommendedSkinId?: string;
  };
}

export interface StoryProfileStageState {
  completed: boolean;
  attempts: number;
  bestElapsedMs: number | null;
  rewardsClaimed: boolean;
}

export interface StoryProfile {
  progressCurrency: number;
  styleCurrency: number;
  ownedSkinIds: string[];
  equippedSkinId: string;
  completedChapterIds: string[];
  stageStates: Record<string, StoryProfileStageState>;
}

export interface StoryBoardCell {
  id: string;
  row: number;
  col: number;
  value: number;
  tags: string[];
  cleared: boolean;
}

export interface StoryObjectiveProgress {
  objectiveId: string;
  type: StoryObjectiveType;
  title: string;
  required: boolean;
  completed: boolean;
  currentCount: number;
  targetCount: number;
  currentLabel: string;
}

export interface StoryFailureRisk {
  mistakesLeft: number | null;
  timeLeftMs: number | null;
  simultaneousMissesLeft: number | null;
  focusLeft: number | null;
}

export interface StoryAppliedModifiers {
  simultaneousWindowBonusMs: number;
  previewHintChargesBonus: number;
  stageEntryCostReduction: number;
  styleCurrencyBonusRate: number;
}

export interface StoryPendingSimultaneous {
  objectiveId: string;
  targetValues: number[];
  selectedCellIds: string[];
  expiresAt: number;
}

export interface StoryRunState {
  stageId: string;
  phase: 'running' | 'success' | 'failed';
  elapsedMs: number;
  board: StoryBoardCell[][];
  boardFlat: StoryBoardCell[];
  objectives: StoryObjectiveProgress[];
  completedObjectiveIds: string[];
  failureRisk: StoryFailureRisk;
  mistakes: number;
  hintsRemaining: number;
  highlightedCellIds: string[];
  pendingSimultaneous: StoryPendingSimultaneous | null;
  lastEventText: string;
  appliedModifiers: StoryAppliedModifiers;
}

export interface StoryUnlockChange {
  type: 'stage' | 'chapter' | 'skin';
  id: string;
  title: string;
}

export interface StoryRunResult {
  success: boolean;
  stageId: string;
  completedObjectives: string[];
  failedCondition?: StoryFailCondition;
  rewardsGranted: StoryRewardBundle;
  unlockChanges: StoryUnlockChange[];
  elapsedMs: number;
  usedSkinId: string;
}

export interface StoryAccessStatus {
  unlocked: boolean;
  reasons: string[];
}

export interface RunEngine {
  start(): void;
  handleInput(payload: StoryInputAction): void;
  getState(): StoryRunState;
  subscribe(listener: (state: StoryRunState) => void): () => void;
  getResult(): StoryRunResult | null;
  dispose(): void;
}
