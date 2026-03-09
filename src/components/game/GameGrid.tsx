'use client';
import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useConfigStore } from '@/stores/configStore';
import GridCell from './GridCell';
import AxisLabels from './AxisLabels';

const GameGrid: React.FC = () => {
  const { grid, handleClick, highlightRow, highlightCol, currentMinCell } = useGameStore();
  const { hideAxisLabels, keyBindings, lazy, hideFinalLayer, backgroundImage } = useConfigStore();
  const size = grid.length;

  if (size === 0) return null;

  const getLabel = (type: 'row' | 'col', index: number) => {
    return keyBindings[`${type}_${index}`]?.toUpperCase() || String(index + 1);
  };

  const showBoardBackground = hideFinalLayer && Boolean(backgroundImage);
  const revealFinalLayer = showBoardBackground && grid.every((row) => row.every((cell) => cell.numbers.length <= 1));

  return (
    <div className="relative inline-flex w-full max-w-[min(800px,70vh)] flex-col">
      <AxisLabels size={size} />
      <div className="flex">
        {!hideAxisLabels && (
          <div className="flex w-11 flex-shrink-0 flex-col">
            {Array.from({ length: size }).map((_, row) => (
              <div
                key={row}
                className="flex flex-1 select-none items-center justify-center border-r-2 border-t border-[#dde5f0] bg-[#f2f6fc] font-semibold text-[#2c4b68] dark:border-[#444] dark:border-r-[#555] dark:bg-[#3a3a3a] dark:text-[#e0e0e0]"
              >
                {getLabel('row', row)}
              </div>
            ))}
          </div>
        )}
        {hideAxisLabels && <div className="w-0" />}

        <div
          className={`grid flex-1 gap-0 border-2 border-[#b8ccde] bg-[#b8ccde] dark:border-[#555] dark:bg-[#555] ${
            showBoardBackground ? 'board-background-layer' : ''
          }`}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            ...(showBoardBackground
              ? {
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }
              : {}),
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isMin = currentMinCell?.row === rowIndex && currentMinCell?.col === colIndex;
              return (
                <GridCell
                  key={`${rowIndex}-${colIndex}`}
                  cell={cell}
                  gridSize={size}
                  onClick={() => handleClick(rowIndex, colIndex, 'click')}
                  isHighlighted={highlightRow === rowIndex || highlightCol === colIndex}
                  isMinCell={isMin}
                  isLazy={lazy}
                  hideFinalLayerVisual={showBoardBackground}
                  revealFinalLayer={revealFinalLayer}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default GameGrid;
