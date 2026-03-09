import type { StoryMatchStyle } from './config';
import type { GameConfig, GamePhase, GameRecord, PlayerActionType } from './game';

export type AchievementCategory = 'play' | 'performance' | 'mastery' | 'story' | 'social_future';

export type AchievementId =
  | 'first_session'
  | 'first_finish'
  | 'manual_finisher'
  | 'combo_10'
  | 'combo_25'
  | 'combo_50'
  | 'perfect_clear'
  | 'keyboard_only_clear'
  | 'lazy_clear'
  | 'standard_clear'
  | 'hidden_axis_clear'
  | 'hidden_final_layer_clear'
  | 'size_4_clear'
  | 'size_6_clear'
  | 'expanded_clear'
  | 'replay_opened'
  | 'replay_played'
  | 'story_apply'
  | 'story_training_clear'
  | 'story_duel_clear'
  | 'room_creator'
  | 'room_joiner'
  | 'chat_starter'
  | 'multiplayer_winner';

export type AchievementStatKey =
  | 'sessionsCreated'
  | 'gamesCompleted'
  | 'manualFinalClicks'
  | 'bestCombo'
  | 'perfectGames'
  | 'keyboardOnlyWins'
  | 'lazyWins'
  | 'standardWins'
  | 'winsWithHiddenAxis'
  | 'winsWithHiddenFinalLayer'
  | 'size4Wins'
  | 'size6Wins'
  | 'expandedWins'
  | 'replayOpenedCount'
  | 'replayPlayedCount'
  | 'storyLevelsApplied'
  | 'trainingStoryWins'
  | 'duelStoryWins'
  | 'roomsCreated'
  | 'roomsJoined'
  | 'messagesSent'
  | 'multiplayerWins';

export interface AchievementDefinition {
  id: AchievementId;
  category: AchievementCategory;
  titleKey: string;
  descriptionKey: string;
  statKey: AchievementStatKey;
  target: number;
  hidden?: boolean;
  futureOnly?: boolean;
}

export interface AchievementProgress {
  achievementId: AchievementId;
  currentValue: number;
  targetValue: number;
  unlocked: boolean;
  unlockedAt: number | null;
  lastProgressAt: number | null;
}

export interface AchievementUnlockRecord {
  achievementId: AchievementId;
  unlockedAt: number;
}

export interface AchievementStats {
  sessionsCreated: number;
  gamesStarted: number;
  gamesCompleted: number;
  manualFinalClicks: number;
  autoFinalClicks: number;
  perfectGames: number;
  keyboardOnlyWins: number;
  lazyWins: number;
  standardWins: number;
  winsWithHiddenAxis: number;
  winsWithHiddenFinalLayer: number;
  size4Wins: number;
  size6Wins: number;
  expandedWins: number;
  replayOpenedCount: number;
  replayPlayedCount: number;
  storyLevelsApplied: number;
  trainingStoryWins: number;
  duelStoryWins: number;
  bossStoryWins: number;
  roomsCreated: number;
  roomsJoined: number;
  messagesSent: number;
  multiplayerWins: number;
  bestCombo: number;
  settingsChanged: Record<string, number>;
}

export interface AchievementProfile {
  profileId: string;
  schemaVersion: number;
  syncState: 'local_only' | 'pending_sync' | 'synced';
  lastEventAt: number | null;
  stats: AchievementStats;
  progress: Record<AchievementId, AchievementProgress>;
  recentUnlocks: AchievementUnlockRecord[];
}

export interface AchievementConfigSnapshot {
  size: number;
  layers: number;
  lazy: boolean;
  autoFinalClick: boolean;
  hideAxisLabels: boolean;
  hideFinalLayer: boolean;
  theme: string;
  hasStoryContext: boolean;
  storyMatchStyle: StoryMatchStyle | null;
}

export type AchievementEventName =
  | 'session:created'
  | 'game:started'
  | 'game:first_input'
  | 'move:correct'
  | 'move:wrong'
  | 'combo:updated'
  | 'final_click:available'
  | 'final_click:claimed'
  | 'game:completed'
  | 'game:restarted'
  | 'replay:opened'
  | 'replay:played'
  | 'story:level_applied'
  | 'settings:changed'
  | 'leaderboard:record_saved'
  | 'multiplayer:room_created'
  | 'multiplayer:room_joined'
  | 'multiplayer:room_left'
  | 'multiplayer:message_sent'
  | 'multiplayer:match_finished';

export interface AchievementEventPayloadMap {
  'session:created': {
    trigger: 'manual_start' | 'restart' | 'story_apply' | 'unknown';
  };
  'game:started': {
    config: AchievementConfigSnapshot;
  };
  'game:first_input': {
    inputType: PlayerActionType;
    position: { row: number; col: number } | null;
  };
  'move:correct': {
    row: number;
    col: number;
    combo: number;
    scoreGain: number;
    inputType: PlayerActionType;
  };
  'move:wrong': {
    mistakeCount: number;
    inputType: PlayerActionType;
  };
  'combo:updated': {
    combo: number;
    multiplier: number;
  };
  'final_click:available': {
    predictedBonus: number | null;
  };
  'final_click:claimed': {
    bonus: number;
    finalClickType: PlayerActionType;
  };
  'game:completed': {
    record: GameRecord;
  };
  'game:restarted': {
    previousPhase: GamePhase;
  };
  'replay:opened': {
    recordId: string | null;
    totalSteps: number;
  };
  'replay:played': {
    step: number;
    totalSteps: number;
    mode: 'play' | 'step_forward' | 'step_backward' | 'seek';
  };
  'story:level_applied': {
    levelId: string;
    title: string;
    chapter: string;
    matchStyle: StoryMatchStyle;
    boardSize: number;
  };
  'settings:changed': {
    setting: string;
    value: string | number | boolean;
    group?: string;
  };
  'leaderboard:record_saved': {
    recordId: string;
    score: number;
  };
  'multiplayer:room_created': {
    roomId?: string;
  };
  'multiplayer:room_joined': {
    roomId?: string;
  };
  'multiplayer:room_left': {
    roomId?: string;
  };
  'multiplayer:message_sent': {
    roomId?: string;
    length: number;
  };
  'multiplayer:match_finished': {
    roomId?: string;
    result: 'win' | 'loss' | 'draw';
  };
}

export interface AchievementEvent<K extends AchievementEventName = AchievementEventName> {
  type: K;
  timestamp: number;
  source: 'engine' | 'store' | 'ui' | 'socket';
  sessionId?: string | null;
  phase?: GamePhase;
  config?: AchievementConfigSnapshot | null;
  payload: AchievementEventPayloadMap[K];
}

export interface AchievementSessionRecap {
  sessionId: string;
  unlockIds: AchievementId[];
  progressedIds: AchievementId[];
  lastEventAt: number | null;
}

export interface AchievementUpdateResult {
  profile: AchievementProfile;
  unlockedIds: AchievementId[];
  progressedIds: AchievementId[];
}

export const ACHIEVEMENT_PROFILE_SCHEMA_VERSION = 1;

export const toAchievementConfigSnapshot = (config: GameConfig): AchievementConfigSnapshot => ({
  size: config.size,
  layers: config.layers,
  lazy: config.lazy,
  autoFinalClick: config.autoFinalClick,
  hideAxisLabels: config.hideAxisLabels,
  hideFinalLayer: config.hideFinalLayer,
  theme: config.theme,
  hasStoryContext: Boolean(config.storyContext),
  storyMatchStyle: config.storyContext?.matchStyle ?? null,
});
