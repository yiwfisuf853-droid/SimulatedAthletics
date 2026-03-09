import React, { useEffect } from 'react';
import AppContainer from '@/components/layout/AppContainer';
import StoryModeShell from '@/components/story/StoryModeShell';
import { useAudio } from '@/hooks/useAudio';
import { useConfigStore } from '@/stores/configStore';
import { useAppStore } from '@/stores/appStore';
import { useKeyboard } from '@/hooks/useKeyboard';
import { KeyboardContext } from '@/contexts/KeyboardContext';
import { ReplayProvider } from '@/contexts/ReplayContext';
import { registerAchievementDefinitions } from '@/services/achievementService';

function App() {
  const theme = useConfigStore((state) => state.theme);
  const mode = useAppStore((state) => state.mode);
  const { simulateKeyPress, activeKey, previewKey, cancelSelection } = useKeyboard();
  useAudio();

  useEffect(() => {
    document.body.classList.remove('dark');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    registerAchievementDefinitions();
  }, []);

  return (
    <KeyboardContext.Provider value={{ simulateKeyPress, activeKey, previewKey, cancelSelection }}>
      <ReplayProvider>
        <div
          className={`flex h-screen flex-col items-center justify-center overflow-hidden p-4 transition-all duration-500 sm:p-5 ${
            mode === 'story'
              ? 'bg-[radial-gradient(circle_at_top_left,#ffe7cc,transparent_28%),radial-gradient(circle_at_bottom_right,#d7ebff,transparent_32%),linear-gradient(180deg,#f6f0e8,#e8edf3)]'
              : 'bg-[#eef2f6] dark:bg-[#1a1a1a]'
          }`}
        >
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            {mode === 'story' ? <StoryModeShell /> : <AppContainer />}
          </div>
        </div>
      </ReplayProvider>
    </KeyboardContext.Provider>
  );
}

export default App;
