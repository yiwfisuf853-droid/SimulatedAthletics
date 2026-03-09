import { useEffect, useCallback, useRef, useState } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { useGameStore } from '@/stores/gameStore';
import type { KeyBindings } from '@/types/config';

function getKeyIndex(key: string, keyBindings: KeyBindings, gridSize: number): number {
  const normalizedKey = key.toLowerCase();

  for (let index = 0; index < gridSize; index++) {
    const rowKey = keyBindings[`row_${index}`];
    const colKey = keyBindings[`col_${index}`];
    if (
      (rowKey && rowKey.toLowerCase() === normalizedKey) ||
      (colKey && colKey.toLowerCase() === normalizedKey)
    ) {
      return index;
    }
  }

  const digit = parseInt(key, 10);
  if (!Number.isNaN(digit) && digit >= 1 && digit <= 9) {
    const mappedIndex = digit - 1;
    return mappedIndex < gridSize ? mappedIndex : -1;
  }

  if (key === '0') {
    return 9 < gridSize ? 9 : -1;
  }

  return -1;
}

export const useKeyboard = () => {
  const { keyBindings } = useConfigStore();
  const {
    phase,
    grid,
    handleClick,
    setHighlight,
    clearHighlight,
    finalClick,
    resetGame,
    currentMinCell,
  } = useGameStore();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const firstKeyIndex = useRef<number | null>(null);
  const previewTimerRef = useRef<number | null>(null);

  const clearPreviewTimer = useCallback(() => {
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  const previewKey = useCallback(
    (key: string) => {
      const normalizedKey = key.toLowerCase();
      clearPreviewTimer();
      setActiveKey(normalizedKey);
      previewTimerRef.current = window.setTimeout(() => {
        setActiveKey((currentKey) => (currentKey === normalizedKey ? null : currentKey));
        previewTimerRef.current = null;
      }, 220);
    },
    [clearPreviewTimer]
  );

  const cancelSelection = useCallback(() => {
    firstKeyIndex.current = null;
    clearHighlight();
    clearPreviewTimer();
    setActiveKey(null);
  }, [clearHighlight, clearPreviewTimer]);

  useEffect(() => {
    if (phase === 'idle' || phase === 'replay') {
      const timer = window.setTimeout(() => {
        cancelSelection();
      }, 0);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [phase, cancelSelection]);

  useEffect(() => () => clearPreviewTimer(), [clearPreviewTimer]);

  const hasGlobalMin = useCallback(
    (row: number, col: number): boolean => {
      const cell = grid[row]?.[col];
      if (!cell || cell.numbers.length <= 1) return false;
      return currentMinCell?.row === row && currentMinCell?.col === col;
    },
    [grid, currentMinCell]
  );

  const simulateKeyPress = useCallback(
    (key: string) => {
      const normalizedKey = key.toLowerCase();

      if (phase === 'replay') {
        return;
      }

      if (normalizedKey === 'escape') {
        if (phase === 'playing' || phase === 'finished' || phase === 'final_clicked') {
          cancelSelection();
          resetGame();
        }
        return;
      }

      if (phase === 'finished') {
        cancelSelection();
        finalClick();
        return;
      }

      if (normalizedKey === 'enter') {
        if (phase === 'final_clicked') {
          resetGame();
        }
        return;
      }

      if (phase !== 'playing') return;

      const index = getKeyIndex(key, keyBindings, grid.length);
      if (index === -1) return;

      if (firstKeyIndex.current === null) {
        if (hasGlobalMin(index, index)) {
          handleClick(index, index, 'keyboard');
          return;
        }

        firstKeyIndex.current = index;
        setHighlight(index, index);
        return;
      }

      if (firstKeyIndex.current === index) {
        cancelSelection();
        return;
      }

      const firstIndex = firstKeyIndex.current;
      const nextIndex = index;
      const candidates = [
        { row: nextIndex, col: nextIndex },
        { row: nextIndex, col: firstIndex },
        { row: firstIndex, col: nextIndex },
      ];

      for (const candidate of candidates) {
        if (hasGlobalMin(candidate.row, candidate.col)) {
          cancelSelection();
          handleClick(candidate.row, candidate.col, 'keyboard');
          return;
        }
      }

      handleClick(-1, -1, 'keyboard');
      cancelSelection();
    },
    [
      phase,
      keyBindings,
      grid.length,
      handleClick,
      setHighlight,
      finalClick,
      resetGame,
      cancelSelection,
      hasGlobalMin,
    ]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const key = event.key;
      const normalizedKey = key.toLowerCase();

      if (phase === 'replay') {
        return;
      }

      if (phase === 'idle') return;

      if (/^[0-9a-z]$/i.test(key)) {
        clearPreviewTimer();
        setActiveKey(normalizedKey);
      }

      if (
        phase === 'finished' ||
        ['escape', 'enter', 'arrowleft', 'arrowright', ' '].includes(normalizedKey) ||
        /^[0-9a-z]$/i.test(key)
      ) {
        event.preventDefault();
      }

      simulateKeyPress(key === ' ' ? 'enter' : key);
    },
    [phase, simulateKeyPress, clearPreviewTimer]
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const normalizedKey = event.key.toLowerCase();
    if (/^[0-9a-z]$/i.test(event.key)) {
      setActiveKey((currentKey) => (currentKey === normalizedKey ? null : currentKey));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return { simulateKeyPress, activeKey, previewKey, cancelSelection };
};
