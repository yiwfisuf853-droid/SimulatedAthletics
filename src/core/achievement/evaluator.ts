import { ACHIEVEMENT_PROFILE_SCHEMA_VERSION } from '@/types/achievement';
import type {
  AchievementDefinition,
  AchievementEvent,
  AchievementEventName,
  AchievementProfile,
  AchievementProgress,
  AchievementSessionRecap,
  AchievementStats,
  AchievementUpdateResult,
} from '@/types/achievement';

const RECENT_UNLOCK_LIMIT = 10;

type AnyAchievementEvent = {
  [K in AchievementEventName]: AchievementEvent<K>;
}[AchievementEventName];

const createEmptyStats = (): AchievementStats => ({
  sessionsCreated: 0,
  gamesStarted: 0,
  gamesCompleted: 0,
  manualFinalClicks: 0,
  autoFinalClicks: 0,
  perfectGames: 0,
  keyboardOnlyWins: 0,
  lazyWins: 0,
  standardWins: 0,
  winsWithHiddenAxis: 0,
  winsWithHiddenFinalLayer: 0,
  size4Wins: 0,
  size6Wins: 0,
  expandedWins: 0,
  replayOpenedCount: 0,
  replayPlayedCount: 0,
  storyLevelsApplied: 0,
  trainingStoryWins: 0,
  duelStoryWins: 0,
  bossStoryWins: 0,
  roomsCreated: 0,
  roomsJoined: 0,
  messagesSent: 0,
  multiplayerWins: 0,
  bestCombo: 0,
  settingsChanged: {},
});

const createProgressMap = (definitions: AchievementDefinition[]) => {
  return definitions.reduce<Record<string, AchievementProgress>>((accumulator, definition) => {
    accumulator[definition.id] = {
      achievementId: definition.id,
      currentValue: 0,
      targetValue: definition.target,
      unlocked: false,
      unlockedAt: null,
      lastProgressAt: null,
    };
    return accumulator;
  }, {}) as Record<AchievementDefinition['id'], AchievementProgress>;
};

const createProfileId = () => `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

export const createAchievementProfile = (
  definitions: AchievementDefinition[],
  previousProfile?: Partial<AchievementProfile>
): AchievementProfile => {
  const progress = createProgressMap(definitions);
  const previousProgress =
    (previousProfile?.progress ?? {}) as Partial<Record<AchievementDefinition['id'], AchievementProgress>>;

  for (const definition of definitions) {
    const savedProgress = previousProgress[definition.id];
    if (!savedProgress) continue;

    progress[definition.id] = {
      ...progress[definition.id],
      ...savedProgress,
      targetValue: definition.target,
    };
  }

  return {
    profileId: previousProfile?.profileId ?? createProfileId(),
    schemaVersion: ACHIEVEMENT_PROFILE_SCHEMA_VERSION,
    syncState: previousProfile?.syncState ?? 'local_only',
    lastEventAt: previousProfile?.lastEventAt ?? null,
    stats: {
      ...createEmptyStats(),
      ...(previousProfile?.stats ?? {}),
      settingsChanged: {
        ...createEmptyStats().settingsChanged,
        ...(previousProfile?.stats?.settingsChanged ?? {}),
      },
    },
    progress,
    recentUnlocks: previousProfile?.recentUnlocks?.slice(0, RECENT_UNLOCK_LIMIT) ?? [],
  };
};

const cloneProfile = (profile: AchievementProfile): AchievementProfile => ({
  ...profile,
  stats: {
    ...profile.stats,
    settingsChanged: { ...profile.stats.settingsChanged },
  },
  progress: Object.fromEntries(
    Object.entries(profile.progress).map(([achievementId, entry]) => [achievementId, { ...entry }])
  ) as AchievementProfile['progress'],
  recentUnlocks: [...profile.recentUnlocks],
});

const applyStatEvent = (profile: AchievementProfile, event: AchievementEvent) => {
  const { stats } = profile;
  const typedEvent = event as AnyAchievementEvent;

  switch (typedEvent.type) {
    case 'session:created':
      stats.sessionsCreated += 1;
      return;
    case 'game:started':
      stats.gamesStarted += 1;
      return;
    case 'combo:updated':
      stats.bestCombo = Math.max(stats.bestCombo, typedEvent.payload.combo);
      return;
    case 'final_click:claimed':
      if (typedEvent.payload.finalClickType === 'auto') {
        stats.autoFinalClicks += 1;
      } else {
        stats.manualFinalClicks += 1;
      }
      return;
    case 'game:completed': {
      const { record } = typedEvent.payload;
      stats.gamesCompleted += 1;
      stats.bestCombo = Math.max(stats.bestCombo, record.maxCombo);

      if (record.mistakeCount === 0) {
        stats.perfectGames += 1;
      }
      if (record.inputStats.clickActions === 0 && record.inputStats.keyboardActions > 0) {
        stats.keyboardOnlyWins += 1;
      }
      if (record.config.lazy) {
        stats.lazyWins += 1;
      } else {
        stats.standardWins += 1;
      }
      if (record.config.hideAxisLabels) {
        stats.winsWithHiddenAxis += 1;
      }
      if (record.config.hideFinalLayer) {
        stats.winsWithHiddenFinalLayer += 1;
      }
      if (record.config.size === 4) {
        stats.size4Wins += 1;
      }
      if (record.config.size === 6) {
        stats.size6Wins += 1;
      }
      if (record.config.size > 6) {
        stats.expandedWins += 1;
      }
      switch (record.storyContext?.matchStyle) {
        case 'training':
          stats.trainingStoryWins += 1;
          break;
        case 'duel':
          stats.duelStoryWins += 1;
          break;
        case 'boss':
          stats.bossStoryWins += 1;
          break;
        default:
          break;
      }
      return;
    }
    case 'replay:opened':
      stats.replayOpenedCount += 1;
      return;
    case 'replay:played':
      stats.replayPlayedCount += 1;
      return;
    case 'story:level_applied':
      stats.storyLevelsApplied += 1;
      return;
    case 'settings:changed':
      stats.settingsChanged[typedEvent.payload.setting] = (stats.settingsChanged[typedEvent.payload.setting] ?? 0) + 1;
      return;
    case 'multiplayer:room_created':
      stats.roomsCreated += 1;
      return;
    case 'multiplayer:room_joined':
      stats.roomsJoined += 1;
      return;
    case 'multiplayer:message_sent':
      stats.messagesSent += 1;
      return;
    case 'multiplayer:match_finished':
      if (typedEvent.payload.result === 'win') {
        stats.multiplayerWins += 1;
      }
      return;
    default:
      return;
  }
};

export const evaluateAchievementEvent = (
  profile: AchievementProfile,
  definitions: AchievementDefinition[],
  event: AchievementEvent
): AchievementUpdateResult => {
  const nextProfile = cloneProfile(profile);
  nextProfile.lastEventAt = event.timestamp;

  applyStatEvent(nextProfile, event);

  const unlockedIds: AchievementDefinition['id'][] = [];
  const progressedIds: AchievementDefinition['id'][] = [];

  for (const definition of definitions) {
    const progress = nextProfile.progress[definition.id];
    const currentValue = nextProfile.stats[definition.statKey] ?? 0;
    const didProgress = currentValue > progress.currentValue;
    const shouldUnlock = currentValue >= definition.target;

    progress.currentValue = currentValue;

    if (didProgress) {
      progress.lastProgressAt = event.timestamp;
      progressedIds.push(definition.id);
    }

    if (!progress.unlocked && shouldUnlock) {
      progress.unlocked = true;
      progress.unlockedAt = event.timestamp;
      unlockedIds.push(definition.id);
      nextProfile.recentUnlocks.unshift({
        achievementId: definition.id,
        unlockedAt: event.timestamp,
      });
    }
  }

  nextProfile.recentUnlocks = nextProfile.recentUnlocks.slice(0, RECENT_UNLOCK_LIMIT);

  return {
    profile: nextProfile,
    unlockedIds,
    progressedIds,
  };
};

export const mergeSessionRecap = (
  current: AchievementSessionRecap | undefined,
  sessionId: string,
  eventTimestamp: number,
  unlockedIds: AchievementDefinition['id'][],
  progressedIds: AchievementDefinition['id'][]
): AchievementSessionRecap => ({
  sessionId,
  unlockIds: Array.from(new Set([...(current?.unlockIds ?? []), ...unlockedIds])),
  progressedIds: Array.from(new Set([...(current?.progressedIds ?? []), ...progressedIds])),
  lastEventAt: eventTimestamp,
});
