'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GridGenerator } from '@/core/game/GridGenerator';
import { useKeyboardContext } from '@/contexts/KeyboardContext';
import { useReplayContext } from '@/contexts/ReplayContext';
import { useI18n } from '@/hooks/useI18n';
import { useConfigStore } from '@/stores/configStore';
import { useGameStore } from '@/stores/gameStore';
import type { Cell } from '@/types/game';
import { cn, controlButtonClass, panelCardClass, panelEyebrowClass } from '@/components/ui/classes';

const DEFAULT_ROW_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const DEFAULT_COL_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

type ScoreItem = {
  order: number;
  row: number;
  col: number;
  keys: string[];
  orderInCell: number;
};

interface KeyboardScorePanelProps {
  className?: string;
}

const getKeyRank = (key: string) => {
  const numericValue = Number.parseInt(key, 10);
  if (!Number.isNaN(numericValue) && String(numericValue) === key) {
    return numericValue;
  }

  return 100 + key.charCodeAt(0);
};

const sortKeys = (keys: string[]) => {
  return [...keys].sort((left, right) => getKeyRank(left) - getKeyRank(right) || left.localeCompare(right));
};

const buildScoreItems = (
  sourceGrid: Cell[][],
  size: number,
  rowKeys: string[],
  colKeys: string[]
): ScoreItem[] => {
  const items: ScoreItem[] = [];
  const gridCopy = GridGenerator.clone(sourceGrid);
  const cellVisitCount = new Map<string, number>();
  let order = 1;

  while (true) {
    let minValue = Infinity;
    let minCell: { row: number; col: number } | null = null;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cell = gridCopy[row]?.[col];
        if (!cell || cell.numbers.length <= 1) continue;

        const cellMin = Math.min(...cell.numbers);
        if (cellMin < minValue) {
          minValue = cellMin;
          minCell = { row, col };
        }
      }
    }

    if (!minCell) break;

    const keys = sortKeys(Array.from(new Set([rowKeys[minCell.row] ?? String(minCell.row + 1), colKeys[minCell.col] ?? String.fromCharCode(65 + minCell.col)])));
    const cellKey = `${minCell.row}-${minCell.col}`;
    const orderInCell = (cellVisitCount.get(cellKey) ?? 0) + 1;
    cellVisitCount.set(cellKey, orderInCell);

    items.push({ order, row: minCell.row, col: minCell.col, keys, orderInCell });
    order += 1;

    gridCopy[minCell.row][minCell.col].numbers = gridCopy[minCell.row][minCell.col].numbers.filter(
      (num) => num !== minValue
    );
  }

  return items;
};

const KeyboardScorePanel: React.FC<KeyboardScorePanelProps> = ({ className = '' }) => {
  const { t } = useI18n();
  const [singleMode, setSingleMode] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const { keyBindings } = useConfigStore();
  const {
    phase,
    grid: gameGrid,
    config,
    currentMinCell: gameCurrentMinCell,
    highlightRow,
    highlightCol,
  } = useGameStore();
  const { activeKey } = useKeyboardContext();
  const { record, state: replayState } = useReplayContext();

  const grid = phase === 'replay' ? replayState.grid : gameGrid;
  const currentMinCell = phase === 'replay' ? replayState.currentMinCell : gameCurrentMinCell;
  const size = grid.length || config?.size || 4;

  const initialGrid = useMemo(() => {
    if (phase === 'replay') {
      return record?.initialGrid ?? null;
    }
    if (!config) return null;
    return GridGenerator.generate(config.size, config.seed, config.layers);
  }, [phase, record, config]);

  const rowKeys = useMemo(
    () =>
      Array.from(
        { length: size },
        (_, index) => (keyBindings[`row_${index}`] || DEFAULT_ROW_KEYS[index] || String(index + 1)).toUpperCase()
      ),
    [keyBindings, size]
  );

  const colKeys = useMemo(
    () =>
      Array.from(
        { length: size },
        (_, index) =>
          (keyBindings[`col_${index}`] || DEFAULT_COL_KEYS[index] || String.fromCharCode(65 + index)).toUpperCase()
      ),
    [keyBindings, size]
  );

  const completedCount = useMemo(() => {
    if (!initialGrid) return 0;

    let count = 0;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const originalCell = initialGrid[row]?.[col];
        const currentCell = grid[row]?.[col];
        if (!originalCell || !currentCell) continue;
        count += originalCell.numbers.length - currentCell.numbers.length;
      }
    }

    return count;
  }, [grid, initialGrid, size]);

  const scoreItems = useMemo(() => {
    if (!initialGrid) return [];
    return buildScoreItems(initialGrid, size, rowKeys, colKeys);
  }, [colKeys, initialGrid, rowKeys, size]);

  const currentItemIndex = useMemo(() => {
    if (!initialGrid || !currentMinCell) return -1;

    const currentCell = grid[currentMinCell.row]?.[currentMinCell.col];
    const originalCell = initialGrid[currentMinCell.row]?.[currentMinCell.col];
    if (!currentCell || !originalCell) return -1;

    const removedCount = originalCell.numbers.length - currentCell.numbers.length;
    return scoreItems.findIndex(
      (item) =>
        item.row === currentMinCell.row &&
        item.col === currentMinCell.col &&
        item.orderInCell === removedCount + 1
    );
  }, [grid, initialGrid, currentMinCell, scoreItems]);

  const selectedLineIndex =
    highlightRow !== null && highlightCol !== null && highlightRow === highlightCol ? highlightRow : null;

  const selectedKeyLabels = useMemo(() => {
    if (selectedLineIndex === null) return new Set<string>();
    return new Set([rowKeys[selectedLineIndex], colKeys[selectedLineIndex]]);
  }, [colKeys, rowKeys, selectedLineIndex]);

  const activeKeyLabel = activeKey ? activeKey.toUpperCase() : null;

  useEffect(() => {
    if (currentItemIndex < 0) return;

    const container = containerRef.current;
    const item = itemRefs.current[currentItemIndex];
    if (!container || !item) return;

    const targetTop = item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    container.scrollTo({
      top: Math.min(Math.max(targetTop, 0), maxScrollTop),
      behavior: 'smooth',
    });
  }, [currentItemIndex]);

  if (!grid.length || !scoreItems.length) return null;

  return (
    <div
      className={cn(
        panelCardClass({ compact: true, tone: 'accent' }),
        'keyboard-score-container flex min-h-0 max-h-full flex-col gap-3 overflow-hidden rounded-[24px] p-3.5',
        className
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={panelEyebrowClass}>{t('keyboardMap')}</div>
          <div className="mt-1 text-[12px] font-medium text-[#617a92] dark:text-[#b8c3cd]">
            {singleMode ? t('keyboardModeSingle') : t('keyboardModeDual')}
          </div>
        </div>
        <button
          className={cn(
            controlButtonClass({
              compact: true,
              variant: singleMode ? 'accent' : 'neutral',
            }),
            'shrink-0'
          )}
          onClick={() => setSingleMode((current) => !current)}
          type="button"
        >
          {singleMode ? t('keyboardModeSingle') : t('keyboardModeDual')}
        </button>
      </div>

      <div ref={containerRef} className="grid grid-cols-3 auto-rows-max gap-2 overflow-y-auto pr-1">
        {scoreItems.map((item, index) => {
          const isCompleted = index < completedCount;
          const isCurrent = index === currentItemIndex;
          const requiresDualKey = item.keys.length > 1;
          const hideDualKeys = singleMode && requiresDualKey;
          const hasLineFocus =
            isCurrent && selectedLineIndex !== null && (item.row === selectedLineIndex || item.col === selectedLineIndex);
          const orderLabel = item.order.toString().padStart(2, '0');

          return (
            <div
              key={`${item.row}-${item.col}-${item.order}`}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'rounded-[18px] border transition-all duration-200',
                isCurrent &&
                  (hasLineFocus
                    ? 'col-span-3 border-[#124d87] bg-[linear-gradient(135deg,#eef7ff_0%,#d7e9f9_100%)] px-3.5 py-3 shadow-[0_16px_28px_rgba(31,91,158,0.16)] dark:border-[#8fcfff] dark:bg-[linear-gradient(135deg,#355d80_0%,#274765_100%)]'
                    : 'col-span-3 border-[#1f5b9e] bg-[linear-gradient(135deg,#f3f8fe_0%,#dbe9f7_100%)] px-3.5 py-3 shadow-[0_14px_26px_rgba(31,91,158,0.14)] dark:border-[#6ab0ff] dark:bg-[linear-gradient(135deg,#335875_0%,#284764_100%)]'),
                !isCurrent &&
                  (hideDualKeys
                    ? 'min-h-[54px] border-[#dfe5ec] bg-[#f4f7fa] px-2.5 py-2 dark:border-[#505864] dark:bg-[#2c3138]'
                    : isCompleted
                      ? 'min-h-[54px] border-[#d7e2ee] bg-[#eef4fa] px-2.5 py-2 opacity-70 dark:border-[#4a5563] dark:bg-[#2b3540]'
                      : 'min-h-[54px] border-[#e6edf5] bg-[#f8fbfe] px-2.5 py-2 dark:border-[#4a5563] dark:bg-[#313131]')
              )}
              title={item.keys.join(' / ')}
            >
              <div className={cn('flex items-center gap-2.5', hideDualKeys ? 'justify-center' : 'justify-between')}>
                <span
                  className={cn(
                    'rounded-xl px-2 py-1 font-semibold tracking-[0.08em]',
                    isCurrent
                      ? 'bg-white text-[12px] text-[#1f5b9e] shadow-[0_8px_18px_rgba(255,255,255,0.32)] dark:bg-[#1e344a] dark:text-[#e3f3ff]'
                      : 'bg-white text-[11px] text-[#6d8297] dark:bg-[#3a3f45] dark:text-[#c4d0dc]'
                  )}
                >
                  {orderLabel}
                </span>
                {!hideDualKeys && (
                  <div className={cn('flex flex-wrap items-center justify-end', isCurrent ? 'gap-2.5' : 'gap-1.5')}>
                    {item.keys.map((key) => {
                      const isSelectedKey = isCurrent && selectedKeyLabels.has(key);
                      const isActiveKey = isCurrent && activeKeyLabel === key;
                      const emphasizeKey = isSelectedKey || isActiveKey;

                      return (
                        <span
                          key={`${item.order}-${key}`}
                          className={cn(
                            'rounded-xl font-bold tracking-[0.08em] transition-all',
                            emphasizeKey
                              ? isCurrent
                                ? 'min-w-[38px] bg-[#1f5b9e] px-2.5 py-1 text-[14px] text-white shadow-[0_0_0_1px_rgba(31,91,158,0.14)] dark:bg-[#9fd7ff] dark:text-[#10233d]'
                                : 'min-w-[34px] bg-[#1f5b9e] px-2 py-1 text-[13px] text-white shadow-[0_0_0_1px_rgba(31,91,158,0.14)] dark:bg-[#7cc0ff] dark:text-[#10233d]'
                              : isCurrent
                                ? 'min-w-[38px] bg-white/96 px-2.5 py-1 text-[14px] text-[#1f5b9e] shadow-[inset_0_0_0_1px_rgba(31,91,158,0.08)] dark:bg-[#3f4d5b] dark:text-[#c5e4ff]'
                                : 'min-w-[34px] bg-white px-2 py-1 text-[13px] text-[#1f5b9e] dark:bg-[#454545] dark:text-[#6ab0ff]'
                          )}
                        >
                          {key}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KeyboardScorePanel;
