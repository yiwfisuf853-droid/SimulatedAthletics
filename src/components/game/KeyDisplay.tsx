'use client';
import React from 'react';
import { useConfigStore } from '@/stores/configStore';
import { useGameStore } from '@/stores/gameStore';
import { useKeyboardContext } from '@/contexts/KeyboardContext';
import { useReplayContext } from '@/contexts/ReplayContext';

const DEFAULT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const KeyDisplay: React.FC = () => {
  const { modules, keyBindings } = useConfigStore();
  const { phase, grid: gameGrid, highlightRow, highlightCol } = useGameStore();
  const { state: replayState } = useReplayContext();
  const { simulateKeyPress, activeKey, previewKey } = useKeyboardContext();
  const isReplay = phase === 'replay';
  const grid = isReplay ? replayState.grid : gameGrid;

  if (!modules.virtualKeyboard || !grid.length) return null;

  const getDefaultKey = (index: number) => DEFAULT_KEYS[index] || String(index + 1);
  const keyCount = Math.min(grid.length, 10);
  const keySize = Math.max(22, Math.min(54, Math.round((460 / keyCount) * 0.62)));
  const fontSize = Math.max(10, Math.min(18, Math.round(keySize * 0.33)));

  return (
    <div className="mt-6 flex w-full justify-center pb-1 sm:mt-7">
      <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-[20px] bg-white/78 px-3 py-2 shadow-[0_10px_22px_rgba(0,20,40,0.08)] backdrop-blur dark:bg-[#353535]/80">
        {Array.from({ length: keyCount }, (_, index) => {
          const rowKey = keyBindings[`row_${index}`];
          const colKey = keyBindings[`col_${index}`];
          const inputKey = rowKey || colKey || getDefaultKey(index);
          const displayLabel = rowKey && colKey && rowKey !== colKey
            ? `${rowKey.toUpperCase()}/${colKey.toUpperCase()}`
            : inputKey.toUpperCase();
          const isPressed = inputKey.toLowerCase() === activeKey;
          const isPositioned = highlightRow === index || highlightCol === index;

          return (
            <button
              key={index}
              className={`flex select-none items-center justify-center rounded-lg border font-semibold transition-all ${
                isPressed
                  ? 'scale-[0.96] border-[#1f5b9e] bg-[#d1e0f0] text-[#1f5b9e] shadow-[inset_0_2px_4px_rgba(0,20,40,0.12)] dark:border-[#6ab0ff] dark:bg-[#3a5a7a] dark:text-[#6ab0ff]'
                  : isPositioned
                    ? 'border-[#6c9ed0] bg-[#edf4fb] text-[#1f4a7a] shadow-[0_0_0_1px_rgba(108,158,208,0.14)] dark:border-[#7cc0ff] dark:bg-[#32485d] dark:text-[#d6efff]'
                    : 'border-[#b8ccde] bg-[#e8eef5] text-[#4a6078] hover:bg-[#d0dbe8] dark:border-[#555] dark:bg-[#3a3a3a] dark:text-[#e0e0e0] dark:hover:bg-[#4a4a4a]'
              }`}
              onMouseDown={() => previewKey(inputKey)}
              onTouchStart={() => previewKey(inputKey)}
              onClick={() => simulateKeyPress(inputKey)}
              style={{ width: `${keySize}px`, height: `${keySize}px`, fontSize: `${fontSize}px` }}
              type="button"
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default KeyDisplay;
