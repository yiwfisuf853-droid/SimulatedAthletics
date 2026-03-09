import { createContext, useContext } from 'react';

interface KeyboardContextType {
  simulateKeyPress: (key: string) => void;
  activeKey: string | null;
  previewKey: (key: string) => void;
  cancelSelection: () => void;
}

export const KeyboardContext = createContext<KeyboardContextType | null>(null);

export const useKeyboardContext = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboardContext must be used within KeyboardContext.Provider');
  }
  return context;
};
