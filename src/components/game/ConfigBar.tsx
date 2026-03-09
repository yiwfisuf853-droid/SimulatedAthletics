'use client';
import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useGameStore } from '@/stores/gameStore';
import { useConfigStore } from '@/stores/configStore';
import {
  cn,
  controlButtonClass,
  controlGroupClass,
  controlInputClass,
  panelEyebrowClass,
  panelShellClass,
} from '@/components/ui/classes';

const DEFAULT_SIZE_OPTIONS = [2, 3, 4, 5, 6];
const EXPAND_SIZE_OPTIONS = [6, 8, 10, 12, 16, 20];

interface ConfigBarProps {
  onMoreSettings?: () => void;
}

const ConfigBar: React.FC<ConfigBarProps> = ({ onMoreSettings }) => {
  const { t } = useI18n();
  const { initGame, startGame } = useGameStore();
  const {
    defaultSize,
    setSize,
    defaultLayers,
    lazy,
    toggleLazy,
    autoFinalClick,
    hideAxisLabels,
    expandMode,
    expandSize,
    setExpandSize,
    seed,
    setSeed,
    hideFinalLayer,
    theme,
  } = useConfigStore();

  const handleStartGame = () => {
    const actualSize = expandMode ? expandSize : defaultSize;
    const actualLayers = expandMode ? 1 : defaultLayers;
    const gameConfig = {
      size: actualSize,
      layers: actualLayers,
      lazy,
      seed: seed || Date.now().toString(),
      autoFinalClick,
      hideAxisLabels,
      hideFinalLayer,
      theme,
    };

    initGame(gameConfig);
    startGame();
  };

  const sizeOptions = expandMode ? EXPAND_SIZE_OPTIONS : DEFAULT_SIZE_OPTIONS;
  const activeSize = expandMode ? expandSize : defaultSize;

  return (
    <div className={panelShellClass({ variant: 'toolbar' })}>
      <div className={cn(controlGroupClass, 'max-w-full')}>
        <span className={panelEyebrowClass}>{t('boardSize')}</span>
        <div className="flex flex-wrap gap-1.5">
          {sizeOptions.map((size) => (
            <button
              key={size}
              className={cn(controlButtonClass({ active: size === activeSize, compact: true }), 'min-w-[34px] px-0')}
              onClick={() => (expandMode ? setExpandSize(size) : setSize(size))}
              type="button"
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <button className={controlButtonClass({ active: lazy })} onClick={toggleLazy} type="button">
        {t('lazyMode')}
      </button>

      <div className={controlGroupClass}>
        <span className={panelEyebrowClass}>{t('seed')}</span>
        <input
          type="text"
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
          placeholder={t('seed')}
          maxLength={16}
          className={cn(controlInputClass, 'w-32 sm:w-40')}
        />
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button className={controlButtonClass()} onClick={onMoreSettings} type="button">
          {t('more')}
        </button>
        <button className={controlButtonClass({ variant: 'primary' })} onClick={handleStartGame} type="button">
          {t('startGame')}
        </button>
      </div>
    </div>
  );
};

export default ConfigBar;
