'use client';
import React, { useCallback, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useConfigStore } from '@/stores/configStore';
import { useKeyboardContext } from '@/contexts/KeyboardContext';
import type { Cell } from '@/types/game';

interface GridCellProps {
  cell: Cell;
  gridSize: number;
  onClick: () => void;
  isHighlighted: boolean;
  isMinCell?: boolean;
  isLazy?: boolean;
  isReplay?: boolean;
  hideFinalLayerVisual?: boolean;
  revealFinalLayer?: boolean;
}

const GridCell: React.FC<GridCellProps> = ({
  cell,
  gridSize,
  onClick,
  isHighlighted,
  isMinCell,
  isLazy,
  isReplay,
  hideFinalLayerVisual = false,
  revealFinalLayer = false,
}) => {
  const { handleClick, phase, highlightRow, highlightCol } = useGameStore();
  const { lazy } = useConfigStore();
  const { cancelSelection } = useKeyboardContext();
  const { row, col, numbers } = cell;
  const remainingNumbers = numbers.length;
  const mainNumber = remainingNumbers > 0 ? Math.min(...numbers) : 0;
  const subNumbers = remainingNumbers > 0 ? numbers.filter((num) => num !== mainNumber) : [];
  const [isWrong, setIsWrong] = useState(false);

  const effectiveLazy = isLazy !== undefined ? isLazy : lazy;
  const effectiveIsMin = isMinCell !== undefined
    ? isMinCell
    : useGameStore.getState().currentMinCell?.row === row && useGameStore.getState().currentMinCell?.col === col;
  const shouldHideFinalLayer = hideFinalLayerVisual && remainingNumbers === 1;
  const finalLayerClass = shouldHideFinalLayer
    ? revealFinalLayer
      ? 'final-layer-reveal'
      : 'final-layer-cover'
    : '';

  const getNumberLevel = (num: number) => {
    return Math.min(3, Math.floor((num - 1) / (gridSize * gridSize)));
  };

  const getNumberClass = (level: number) => `num-lv${level + 1}`;

  const handleClickInternal = useCallback(() => {
    if (isReplay) return;

    if (highlightRow !== null || highlightCol !== null) {
      cancelSelection();
    }

    if (phase === 'finished') {
      onClick();
      return;
    }
    if (phase !== 'playing') {
      onClick();
      return;
    }
    const success = handleClick(row, col, 'click');
    if (!success) {
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 400);
    }
  }, [isReplay, highlightRow, highlightCol, cancelSelection, phase, onClick, handleClick, row, col]);

  if (remainingNumbers === 0) {
    return (
      <div
        className={`grid-empty-cell aspect-square border border-[#dde5f0] transition-[background-color,border-color,box-shadow] duration-[1400ms] dark:border-[#444] ${
          revealFinalLayer ? 'final-layer-reveal' : 'bg-[#f9fcff] dark:bg-[#2a2a2a]'
        }`}
      />
    );
  }

  return (
    <div
      className={`relative flex aspect-square cursor-pointer items-center justify-center border border-[#dde5f0] font-semibold transition-[background-color,border-color,box-shadow,opacity] duration-[1400ms] dark:border-[#444]
        ${isHighlighted ? 'cross-highlight' : ''}
        ${effectiveIsMin && effectiveLazy ? 'lazy-blink' : ''}
        ${isWrong ? 'wrong-flash' : ''}
        ${remainingNumbers === 1 ? 'rem-1' : ''}
        ${remainingNumbers === 2 ? 'rem-2' : ''}
        ${remainingNumbers === 3 ? 'rem-3' : ''}
        ${remainingNumbers >= 4 ? 'rem-4' : ''}
        ${finalLayerClass}
      `}
      onClick={handleClickInternal}
    >
      {!shouldHideFinalLayer && (
        <>
          <div
            className={`main-number ${getNumberClass(getNumberLevel(mainNumber))} ${remainingNumbers === 1 ? 'final-layer' : ''}`}
            style={{ fontSize: 'min(32px, 5vw)', fontWeight: 700, lineHeight: 1 }}
          >
            {mainNumber}
          </div>
          {subNumbers.length > 0 && (
            <div className="sub-numbers">
              {subNumbers.map((num, index) => (
                <span
                  key={index}
                  className={`${getNumberClass(getNumberLevel(num))} ${index >= 2 ? 'third-layer' : ''}`}
                >
                  {num}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GridCell;
