'use client';
import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useReplayContext } from '@/contexts/ReplayContext';
import { useConfigStore } from '@/stores/configStore';
import GridCell from './GridCell';

const ReplayGrid: React.FC = () => {
  const { t } = useI18n();
  const { state } = useReplayContext();
  const { hideAxisLabels, keyBindings, hideFinalLayer, backgroundImage, lazy } = useConfigStore();
  const grid = state.grid;
  const size = grid.length;
  const currentMinCell = state.currentMinCell;

  if (size === 0) {
    return (
      <div className="py-8 text-center text-[#8a9fb0] dark:text-[#b0b0b0]">
        {t('replayLoading')}
      </div>
    );
  }

  const getLabel = (type: 'row' | 'col', index: number) => {
    return keyBindings[`${type}_${index}`]?.toUpperCase() || String(index + 1);
  };

  const showBoardBackground = hideFinalLayer && Boolean(backgroundImage);
  const revealFinalLayer = showBoardBackground && grid.every((row) => row.every((cell) => cell.numbers.length <= 1));

  return (
    <div className="inline-flex w-full max-w-[min(800px,70vh)] flex-col">
      {!hideAxisLabels && (
        <div className="flex">
          <div className="h-11 w-11 flex-shrink-0" />
          {Array.from({ length: size }).map((_, col) => (
            <div
              key={col}
              className="flex h-11 flex-1 items-center justify-center border-b-2 border-l border-[#dde5f0] bg-[#f2f6fc] font-semibold text-[#2c4b68] dark:border-[#444] dark:border-b-[#555] dark:bg-[#3a3a3a] dark:text-[#e0e0e0]"
            >
              {getLabel('col', col)}
            </div>
          ))}
        </div>
      )}

      <div className="flex">
        {!hideAxisLabels && (
          <div className="flex w-11 flex-shrink-0 flex-col">
            {Array.from({ length: size }).map((_, row) => (
              <div
                key={row}
                className="flex flex-1 items-center justify-center border-r-2 border-t border-[#dde5f0] bg-[#f2f6fc] font-semibold text-[#2c4b68] dark:border-[#444] dark:border-r-[#555] dark:bg-[#3a3a3a] dark:text-[#e0e0e0]"
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
                  onClick={() => {}}
                  isHighlighted={false}
                  isMinCell={isMin}
                  isLazy={lazy}
                  isReplay={true}
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

export default ReplayGrid;
