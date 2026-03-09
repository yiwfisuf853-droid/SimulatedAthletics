'use client';
import React from 'react';
import GridCell from '@/components/game/GridCell';
import { cn, panelCardClass, panelEyebrowClass, panelTitleClass } from '@/components/ui/classes';
import { useConfigStore } from '@/stores/configStore';
import type { RoomLiveSnapshot } from '@/types/socket';

interface MultiplayerBoardProps {
  snapshot: RoomLiveSnapshot | null;
  title: string;
  subtitle: string;
  className?: string;
}

const formatElapsed = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const MultiplayerBoard: React.FC<MultiplayerBoardProps> = ({ snapshot, title, subtitle, className = '' }) => {
  const { hideAxisLabels, keyBindings, hideFinalLayer, backgroundImage } = useConfigStore();

  if (!snapshot) {
    return (
      <div className={cn(panelCardClass({ tone: 'accent' }), 'flex min-h-[320px] items-center justify-center text-center', className)}>
        <div>
          <div className={panelEyebrowClass}>{title}</div>
          <div className={cn(panelTitleClass, 'mt-2')}>{subtitle}</div>
        </div>
      </div>
    );
  }

  const size = snapshot.grid.length;
  const showBoardBackground = hideFinalLayer && Boolean(backgroundImage);
  const revealFinalLayer = showBoardBackground && snapshot.grid.every((row) => row.every((cell) => cell.numbers.length <= 1));
  const getLabel = (type: 'row' | 'col', index: number) =>
    keyBindings[`${type}_${index}`]?.toUpperCase() || String(index + 1);

  return (
    <div className={cn(panelCardClass({ tone: 'accent' }), 'space-y-4 p-4 sm:p-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={panelEyebrowClass}>{title}</div>
          <div className={cn(panelTitleClass, 'mt-1 text-base')}>{subtitle}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right text-xs text-[#5d7287] dark:text-[#b7c0c8] sm:text-sm">
          <div className="rounded-2xl bg-white/75 px-3 py-2 dark:bg-[#2f3338]/88">
            <div className="text-[10px] uppercase tracking-[0.12em]">Score</div>
            <div className="mt-1 text-base font-semibold text-[#173550] dark:text-[#f0f5fb]">{snapshot.score.toFixed(1)}</div>
          </div>
          <div className="rounded-2xl bg-white/75 px-3 py-2 dark:bg-[#2f3338]/88">
            <div className="text-[10px] uppercase tracking-[0.12em]">Combo</div>
            <div className="mt-1 text-base font-semibold text-[#173550] dark:text-[#f0f5fb]">x{snapshot.combo}</div>
          </div>
          <div className="rounded-2xl bg-white/75 px-3 py-2 dark:bg-[#2f3338]/88">
            <div className="text-[10px] uppercase tracking-[0.12em]">Progress</div>
            <div className="mt-1 text-base font-semibold text-[#173550] dark:text-[#f0f5fb]">
              {Math.round(snapshot.progress * 100)}%
            </div>
          </div>
          <div className="rounded-2xl bg-white/75 px-3 py-2 dark:bg-[#2f3338]/88">
            <div className="text-[10px] uppercase tracking-[0.12em]">Time</div>
            <div className="mt-1 font-mono text-base font-semibold text-[#173550] dark:text-[#f0f5fb]">
              {formatElapsed(snapshot.elapsedTime)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center overflow-hidden">
        <div className="inline-flex w-full max-w-[min(760px,60vh)] flex-col">
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
              {snapshot.grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <GridCell
                    key={`${rowIndex}-${colIndex}`}
                    cell={cell}
                    gridSize={size}
                    onClick={() => {}}
                    isHighlighted={false}
                    isReplay
                    hideFinalLayerVisual={showBoardBackground}
                    revealFinalLayer={revealFinalLayer}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerBoard;
