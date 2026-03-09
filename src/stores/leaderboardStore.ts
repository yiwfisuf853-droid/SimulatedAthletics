import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeaderboardEntry } from '@/types/api';
import type { GameRecord } from '@/types/game';

interface LeaderboardStore {
  // 状态。
  records: LeaderboardEntry[];
  gameRecords: Record<string, GameRecord>;
  isLoading: boolean;
  error: string | null;

  // 操作。
  addRecord: (record: GameRecord, playerName?: string) => void;
  getTopRecords: (limit?: number) => LeaderboardEntry[];
  getRecordsBySize: (size: number, limit?: number) => LeaderboardEntry[];
  getGameRecord: (id: string) => GameRecord | null;
  clearRecords: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLeaderboardStore = create<LeaderboardStore>()(
  persist(
    (set, get) => ({
      records: [],
      gameRecords: {},
      isLoading: false,
      error: null,

      addRecord: (record, playerName = 'Player') => {
        const recordId = record.id || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
        const newEntry: LeaderboardEntry = {
          id: recordId,
          rank: 0,
          playerName,
          score: record.finalScore,
          size: record.config.size,
          duration: record.duration,
          lazy: record.config.lazy,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          // 先维护排行榜展示条目。
          const updatedRecords = [...state.records, newEntry]
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({
              ...entry,
              rank: index + 1,
            }));

          // 再保存完整复盘记录，最多保留 50 条。
          const updatedGameRecords = { ...state.gameRecords };
          updatedGameRecords[recordId] = { ...record, id: recordId };

          const gameRecordIds = Object.keys(updatedGameRecords);
          if (gameRecordIds.length > 50) {
            const sortedIds = gameRecordIds
              .map((id) => ({ id, createdAt: updatedGameRecords[id].createdAt }))
              .sort((a, b) => a.createdAt - b.createdAt);

            const toDelete = sortedIds.slice(0, sortedIds.length - 50);
            toDelete.forEach(({ id }) => {
              delete updatedGameRecords[id];
            });
          }

          return {
            records: updatedRecords,
            gameRecords: updatedGameRecords,
          };
        });
      },

      getTopRecords: (limit = 10) => {
        return get().records.slice(0, limit);
      },

      getRecordsBySize: (size, limit = 10) => {
        return get().records
          .filter((record) => record.size === size)
          .slice(0, limit);
      },

      getGameRecord: (id) => {
        const gameRecords = get().gameRecords;
        return gameRecords[id] || null;
      },

      clearRecords: () => {
        set({ records: [], gameRecords: {} });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: 'simulated-athletics-leaderboard',
    }
  )
);
