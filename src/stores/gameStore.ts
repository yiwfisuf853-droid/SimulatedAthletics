import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { REPLAY_RECORD_EVENT } from '@/contexts/replayEvents';
import { GameEngine } from '@/core/game/GameEngine';
import { trackAchievementEvent } from '@/services/achievementService';
import { useLeaderboardStore } from '@/stores/leaderboardStore';
import { toAchievementConfigSnapshot } from '@/types/achievement';
import type { Cell, GameConfig, GamePhase, GameRecord, GameState } from '@/types/game';

interface GameStore {
  phase: GamePhase;
  grid: Cell[][];
  score: number;
  combo: number;
  multiplier: number;
  elapsedTime: number;
  currentMinNumber: number | null;
  currentMinCell: { row: number; col: number } | null;
  highlightRow: number | null;
  highlightCol: number | null;
  predictedFinalBonus: number | null;
  config: GameConfig | null;
  engine: GameEngine | null;
  sessionId: string | null;
  initGame: (config: GameConfig) => void;
  startGame: () => void;
  handleClick: (row: number, col: number, type: 'click' | 'keyboard') => boolean;
  forceWrongClick: () => void;
  setHighlight: (row: number | null, col: number | null) => void;
  clearHighlight: () => void;
  finalClick: () => void;
  resetGame: () => void;
  restartGame: () => void;
  updateTime: (elapsed: number) => void;
  startReplay: (record: GameRecord) => void;
  exitReplay: () => void;
  getState: () => GameState | null;
  getRecord: () => ReturnType<GameEngine['getRecord']>;
}

const initialStoreState = {
  phase: 'idle' as GamePhase,
  grid: [] as Cell[][],
  score: 0,
  combo: 0,
  multiplier: 1,
  elapsedTime: 0,
  currentMinNumber: null as number | null,
  currentMinCell: null as { row: number; col: number } | null,
  highlightRow: null as number | null,
  highlightCol: null as number | null,
  predictedFinalBonus: null as number | null,
  config: null as GameConfig | null,
  engine: null as GameEngine | null,
  sessionId: null as string | null,
};

const createStoredRecord = (record: NonNullable<ReturnType<GameEngine['getRecord']>>): GameRecord => ({
  ...record,
  id: record.id || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`,
  createdAt: record.createdAt || Date.now(),
});

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => {
    const bindEngine = (engine: GameEngine) => {
      engine.on('game:started', (event, data) => {
        trackAchievementEvent(engine.createAchievementEvent(event, data));
      });
      engine.on('game:first_input', (event, data) => {
        trackAchievementEvent(engine.createAchievementEvent(event, data));
      });
      engine.on('move:correct', (event, data) => {
        trackAchievementEvent(engine.createAchievementEvent(event, data));
      });
      engine.on('move:wrong', (event, data) => {
        trackAchievementEvent(engine.createAchievementEvent(event, data));
      });
      engine.on('combo:updated', (event, data) => {
        trackAchievementEvent(engine.createAchievementEvent(event, data));
      });
      engine.on('final_click:available', (event, data) => {
        trackAchievementEvent(engine.createAchievementEvent(event, data));
      });
      engine.on('final_click:claimed', (event, data) => {
        trackAchievementEvent(engine.createAchievementEvent(event, data));
      });
      engine.on('game:completed', (event, data) => {
        trackAchievementEvent(engine.createAchievementEvent(event, data));
      });

      engine.subscribe((state) => {
        const previousPhase = get().phase;

        set({
          phase: state.phase,
          grid: state.grid,
          score: state.score,
          combo: state.combo,
          multiplier: state.multiplier,
          elapsedTime: state.elapsedTime,
          currentMinNumber: state.currentMinNumber,
          currentMinCell: state.currentMinCell,
          highlightRow: state.highlightRow,
          highlightCol: state.highlightCol,
          predictedFinalBonus: state.predictedFinalBonus,
        });

        if (state.phase === 'final_clicked' && previousPhase !== 'final_clicked') {
          const record = engine.getRecord();
          if (record) {
            const storedRecord = createStoredRecord(record);
            useLeaderboardStore.getState().addRecord(storedRecord);
            trackAchievementEvent({
              type: 'leaderboard:record_saved',
              timestamp: Date.now(),
              source: 'store',
              sessionId: engine.getSessionId(),
              phase: state.phase,
              config: toAchievementConfigSnapshot(storedRecord.config),
              payload: {
                recordId: storedRecord.id,
                score: storedRecord.finalScore,
              },
            });
          }
        }
      });
    };

    return {
      ...initialStoreState,

      initGame: (config) => {
        const engine = new GameEngine(config);
        bindEngine(engine);
        set({ engine, config, sessionId: engine.getSessionId() });
        trackAchievementEvent({
          type: 'session:created',
          timestamp: Date.now(),
          source: 'store',
          sessionId: engine.getSessionId(),
          phase: 'idle',
          config: toAchievementConfigSnapshot(config),
          payload: {
            trigger: config.storyContext ? 'story_apply' : 'manual_start',
          },
        });
      },

      startGame: () => {
        get().engine?.start();
      },

      handleClick: (row, col, type) => {
        const { engine } = get();
        if (!engine) return false;
        return engine.handleClick(row, col, type);
      },

      forceWrongClick: () => {
        get().engine?.handleClick(-1, -1, 'keyboard');
      },

      setHighlight: (row, col) => {
        get().engine?.setHighlight(row, col);
      },

      clearHighlight: () => {
        get().engine?.clearHighlight();
      },

      finalClick: () => {
        get().engine?.finalClick('click');
      },

      resetGame: () => {
        const { engine, phase, config, sessionId } = get();
        if (engine && config) {
          trackAchievementEvent({
            type: 'game:restarted',
            timestamp: Date.now(),
            source: 'store',
            sessionId,
            phase,
            config: toAchievementConfigSnapshot(config),
            payload: {
              previousPhase: phase,
            },
          });
        }
        engine?.reset();
        set({ ...initialStoreState });
      },

      restartGame: () => {
        const { config, phase, sessionId } = get();
        if (!config) return;

        trackAchievementEvent({
          type: 'game:restarted',
          timestamp: Date.now(),
          source: 'store',
          sessionId,
          phase,
          config: toAchievementConfigSnapshot(config),
          payload: {
            previousPhase: phase,
          },
        });

        const engine = new GameEngine(config);
        bindEngine(engine);
        set({ ...initialStoreState, config, engine, sessionId: engine.getSessionId() });
        trackAchievementEvent({
          type: 'session:created',
          timestamp: Date.now(),
          source: 'store',
          sessionId: engine.getSessionId(),
          phase: 'idle',
          config: toAchievementConfigSnapshot(config),
          payload: {
            trigger: 'restart',
          },
        });
        engine.start();
      },

      updateTime: (elapsed) => {
        set({ elapsedTime: elapsed });
      },

      getState: () => {
        return get().engine?.getState() || null;
      },

      getRecord: () => {
        return get().engine?.getRecord() || null;
      },

      startReplay: (record) => {
        set({ ...initialStoreState, phase: 'replay', config: record.config, sessionId: record.id || null });
        trackAchievementEvent({
          type: 'replay:opened',
          timestamp: Date.now(),
          source: 'store',
          sessionId: record.id || null,
          phase: 'replay',
          config: toAchievementConfigSnapshot(record.config),
          payload: {
            recordId: record.id || null,
            totalSteps: record.actions.length,
          },
        });
        window.dispatchEvent(new CustomEvent(REPLAY_RECORD_EVENT, { detail: record }));
      },

      exitReplay: () => {
        window.dispatchEvent(new CustomEvent(REPLAY_RECORD_EVENT, { detail: null }));
        get().resetGame();
      },
    };
  })
);

export const useGamePhase = () => useGameStore((state) => state.phase);
export const useGameScore = () => useGameStore((state) => state.score);
export const useGameCombo = () => useGameStore((state) => state.combo);
export const useGameGrid = () => useGameStore((state) => state.grid);
export const useGameConfig = () => useGameStore((state) => state.config);
