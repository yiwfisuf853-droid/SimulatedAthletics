import { create } from 'zustand';

export type AppMode = 'arena' | 'story';

interface AppStore {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

export const useAppStore = create<AppStore>()((set) => ({
  mode: 'arena',
  setMode: (mode) => set({ mode }),
  toggleMode: () =>
    set((state) => ({
      mode: state.mode === 'arena' ? 'story' : 'arena',
    })),
}));
