import type {
  SkinDefinition,
  StoryChapterDefinition,
  StoryProfile,
  StoryStageDefinition,
} from '@/types/story';

export const STORY_SKINS: SkinDefinition[] = [
  {
    id: 'cadet-default',
    name: 'Cadet Shell',
    rarity: 'common',
    description: 'The standard academy frame. Balanced visuals, no gameplay modifier.',
    cost: 0,
    visual: {
      accent: '#1f3a5c',
      chip: '#d8e8f5',
      boardGlow: 'rgba(31,58,92,0.18)',
    },
    modifiers: [],
  },
  {
    id: 'focus-weave',
    name: 'Focus Weave',
    rarity: 'rare',
    description: 'A disciplined weave that widens the sync window for simultaneous taps.',
    cost: 24,
    visual: {
      accent: '#c95f18',
      chip: '#ffe7d6',
      boardGlow: 'rgba(201,95,24,0.28)',
    },
    modifiers: [
      {
        type: 'simultaneous_window_bonus_ms',
        value: 220,
      },
      {
        type: 'stage_entry_cost_reduction',
        value: 1,
      },
    ],
  },
  {
    id: 'relay-scout',
    name: 'Relay Scout',
    rarity: 'epic',
    description: 'A scouting frame that carries extra hint charges and better fashion returns.',
    cost: 36,
    visual: {
      accent: '#1c7a66',
      chip: '#dcfff6',
      boardGlow: 'rgba(28,122,102,0.24)',
    },
    modifiers: [
      {
        type: 'preview_hint_charges_bonus',
        value: 1,
      },
      {
        type: 'style_currency_bonus_rate',
        value: 0.2,
      },
    ],
  },
];

export const STORY_CHAPTERS: StoryChapterDefinition[] = [
  {
    id: 'chapter-foundry',
    title: 'Foundry Line',
    order: 1,
    theme: 'bronze',
    summary: 'Rebuild rhythm, earn trust, and prove you can read unstable boards under pressure.',
    stageIds: ['stage-opening-rhythm', 'stage-echo-cluster', 'stage-sync-gate'],
  },
  {
    id: 'chapter-white-arc',
    title: 'White Arc',
    order: 2,
    theme: 'glacier',
    summary: 'Push past rehearsal rules and survive the cleaner, colder relay formats.',
    stageIds: ['stage-arc-relay'],
  },
];

export const STORY_STAGES: StoryStageDefinition[] = [
  {
    id: 'stage-opening-rhythm',
    chapterId: 'chapter-foundry',
    title: 'Opening Rhythm',
    summary: 'A controlled warm-up. Follow the visible route and prove your hands still answer in order.',
    board: {
      rows: 4,
      cols: 4,
      layers: 1,
      seed: 'story-opening-rhythm',
      layoutPreset: 'training_lane',
      spawnRules: [
        {
          type: 'fixed_values',
          values: [1, 2, 3, 4],
          tags: ['route'],
        },
        {
          type: 'filler_values',
          count: 12,
          values: [5, 6, 7, 8, 9],
        },
      ],
    },
    rules: {
      entryCost: 0,
      baseHintCharges: 2,
    },
    objectives: [
      {
        id: 'obj-sequence-opening',
        type: 'tap_sequence',
        title: 'Tap 1, 2, 3, 4 in order',
        required: true,
        targetValues: [1, 2, 3, 4],
      },
    ],
    failConditions: [
      {
        id: 'fail-opening-mistakes',
        type: 'mistake_limit',
        maxMistakes: 4,
      },
      {
        id: 'fail-opening-time',
        type: 'time_limit',
        limitMs: 18000,
      },
    ],
    accessConditions: [],
    rewards: {
      progressCurrency: 8,
      styleCurrency: 12,
      skinUnlockIds: [],
      stageUnlockIds: ['stage-echo-cluster'],
    },
    presentation: {
      introDialogue: 'Coach: We start with discipline. Read the path before the path reads you.',
      rivalDialogue: 'Opponent: Everyone can warm up. Let us see if you can finish cleanly.',
      victoryDialogue: 'Coach: Good. Your tempo is back.',
      recommendedSkinId: 'cadet-default',
    },
  },
  {
    id: 'stage-echo-cluster',
    chapterId: 'chapter-foundry',
    title: 'Echo Cluster',
    summary: 'The board now repeats values. Clean a clustered signal without relying on strict sequence memory.',
    board: {
      rows: 4,
      cols: 4,
      layers: 1,
      seed: 'story-echo-cluster',
      layoutPreset: 'cluster_field',
      spawnRules: [
        {
          type: 'duplicate_value',
          value: 7,
          count: 3,
          tags: ['echo'],
        },
        {
          type: 'tagged_values',
          values: [4, 8],
          tag: 'signal',
        },
        {
          type: 'filler_values',
          count: 11,
          values: [2, 3, 5, 6, 9],
        },
      ],
    },
    rules: {
      entryCost: 3,
      baseHintCharges: 2,
      focusPool: 8,
    },
    objectives: [
      {
        id: 'obj-echo-group',
        type: 'tap_group_any_order',
        title: 'Clear three cells showing 7',
        required: true,
        targetValue: 7,
        requiredCount: 3,
      },
      {
        id: 'obj-signal-clear',
        type: 'clear_tagged_cells',
        title: 'Clean the two signal cells',
        required: true,
        tag: 'signal',
        requiredCount: 2,
      },
    ],
    failConditions: [
      {
        id: 'fail-echo-mistakes',
        type: 'mistake_limit',
        maxMistakes: 5,
      },
      {
        id: 'fail-echo-time',
        type: 'time_limit',
        limitMs: 22000,
      },
      {
        id: 'fail-echo-focus',
        type: 'resource_depleted',
        resourceKey: 'focus',
      },
    ],
    accessConditions: [
      {
        id: 'access-open-echo',
        type: 'stage_complete',
        stageId: 'stage-opening-rhythm',
      },
      {
        id: 'access-echo-ticket',
        type: 'resource_at_least',
        resourceKey: 'progressCurrency',
        amount: 3,
      },
    ],
    rewards: {
      progressCurrency: 10,
      styleCurrency: 18,
      skinUnlockIds: [],
      stageUnlockIds: ['stage-sync-gate'],
    },
    presentation: {
      introDialogue: 'Narrator: The lane folds back on itself. Numbers repeat. Intent matters now.',
      rivalDialogue: 'Opponent: Pick the wrong twin and the cluster will swallow your pace.',
      victoryDialogue: 'Narrator: You cut through the noise instead of chasing it.',
      recommendedSkinId: 'cadet-default',
    },
  },
  {
    id: 'stage-sync-gate',
    chapterId: 'chapter-foundry',
    title: 'Sync Gate',
    summary: 'A gate only opens when matching beats land together. Equip the right frame and move in a tight window.',
    board: {
      rows: 4,
      cols: 4,
      layers: 1,
      seed: 'story-sync-gate',
      layoutPreset: 'relay_arena',
      spawnRules: [
        {
          type: 'duplicate_value',
          value: 4,
          count: 2,
          tags: ['sync'],
        },
        {
          type: 'filler_values',
          count: 14,
          values: [2, 3, 5, 6, 7, 8, 9],
        },
      ],
    },
    rules: {
      entryCost: 5,
      baseHintCharges: 1,
      focusPool: 6,
    },
    objectives: [
      {
        id: 'obj-sync-pair',
        type: 'tap_simultaneous',
        title: 'Tap the two 4 cells within the sync window',
        required: true,
        targetValues: [4, 4],
        windowMs: 850,
      },
      {
        id: 'obj-sync-hold',
        type: 'survive_duration',
        title: 'Stay stable for 8 seconds',
        required: true,
        durationMs: 8000,
      },
    ],
    failConditions: [
      {
        id: 'fail-sync-mistakes',
        type: 'mistake_limit',
        maxMistakes: 4,
      },
      {
        id: 'fail-sync-time',
        type: 'time_limit',
        limitMs: 18000,
      },
      {
        id: 'fail-sync-window',
        type: 'miss_simultaneous_window',
        maxMisses: 0,
      },
    ],
    accessConditions: [
      {
        id: 'access-sync-echo',
        type: 'stage_complete',
        stageId: 'stage-echo-cluster',
      },
      {
        id: 'access-sync-ticket',
        type: 'resource_at_least',
        resourceKey: 'progressCurrency',
        amount: 5,
      },
      {
        id: 'access-sync-skin',
        type: 'skin_owned',
        skinId: 'focus-weave',
      },
    ],
    rewards: {
      progressCurrency: 12,
      styleCurrency: 24,
      skinUnlockIds: [],
      stageUnlockIds: ['stage-arc-relay'],
    },
    presentation: {
      introDialogue: 'Coach: The gate listens for one thought split across two hands.',
      rivalDialogue: 'Opponent: If your rhythm drifts, the door stays shut.',
      victoryDialogue: 'Coach: That is the first real lock opened.',
      recommendedSkinId: 'focus-weave',
    },
  },
  {
    id: 'stage-arc-relay',
    chapterId: 'chapter-white-arc',
    title: 'Arc Relay',
    summary: 'A colder relay, mixing ordered taps with marked cells that must be cleaned before the arc closes.',
    board: {
      rows: 5,
      cols: 5,
      layers: 1,
      seed: 'story-arc-relay',
      layoutPreset: 'relay_arena',
      spawnRules: [
        {
          type: 'fixed_values',
          values: [2, 4, 6],
          tags: ['route'],
        },
        {
          type: 'tagged_values',
          values: [9, 9],
          tag: 'arc',
        },
        {
          type: 'filler_values',
          count: 20,
          values: [1, 3, 5, 7, 8, 10, 11],
        },
      ],
    },
    rules: {
      entryCost: 7,
      baseHintCharges: 2,
      focusPool: 9,
    },
    objectives: [
      {
        id: 'obj-arc-sequence',
        type: 'tap_sequence',
        title: 'Tap 2, 4, 6 in order',
        required: true,
        targetValues: [2, 4, 6],
      },
      {
        id: 'obj-arc-tagged',
        type: 'clear_tagged_cells',
        title: 'Clear both Arc cells',
        required: true,
        tag: 'arc',
        requiredCount: 2,
      },
    ],
    failConditions: [
      {
        id: 'fail-arc-mistakes',
        type: 'mistake_limit',
        maxMistakes: 5,
      },
      {
        id: 'fail-arc-time',
        type: 'time_limit',
        limitMs: 24000,
      },
    ],
    accessConditions: [
      {
        id: 'access-arc-chapter',
        type: 'chapter_complete',
        chapterId: 'chapter-foundry',
      },
      {
        id: 'access-arc-ticket',
        type: 'resource_at_least',
        resourceKey: 'progressCurrency',
        amount: 7,
      },
    ],
    rewards: {
      progressCurrency: 14,
      styleCurrency: 30,
      skinUnlockIds: ['relay-scout'],
      stageUnlockIds: [],
    },
    presentation: {
      introDialogue: 'Narrator: The White Arc strips away comfort. Only clean intent survives here.',
      rivalDialogue: 'Opponent: Route first. Arc nodes second. Miss the order and you lose both.',
      victoryDialogue: 'Narrator: The relay accepts you. The colder chapter opens.',
      recommendedSkinId: 'relay-scout',
    },
  },
];

export const STORY_DEFAULT_PROFILE: StoryProfile = {
  progressCurrency: 6,
  styleCurrency: 0,
  ownedSkinIds: ['cadet-default'],
  equippedSkinId: 'cadet-default',
  completedChapterIds: [],
  stageStates: {},
};
