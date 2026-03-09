'use client';
import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useGameStore } from '@/stores/gameStore';
import { useReplayContext } from '@/contexts/ReplayContext';
import { cn, panelCardClass } from '@/components/ui/classes';

function calcBonus(intervalMs: number): number {
  if (intervalMs <= 0) return 1.0;
  const cps = 1000 / intervalMs;
  if (cps >= 20) return 3.0;
  if (cps >= 2) return 1 + (cps - 2) * 2 / 18;
  return 1.0;
}

interface ScoreDisplayProps {
  compact?: boolean;
  className?: string;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ compact = false, className = '' }) => {
  const { t } = useI18n();
  const {
    score: gameScore,
    combo: gameCombo,
    multiplier: gameMultiplier,
    phase,
    restartGame,
    exitReplay,
    config,
  } = useGameStore();
  const { state } = useReplayContext();
  const isReplay = phase === 'replay';

  const score = isReplay ? state.score : gameScore;
  const combo = isReplay ? state.combo : gameCombo;
  const multiplier = isReplay ? state.multiplier : gameMultiplier;

  const now = Date.now();
  const lastClickTime = useGameStore.getState().engine?.getState().lastClickTime ?? null;
  const intervalMs = lastClickTime ? now - lastClickTime : 0;
  const freqBonus = calcBonus(intervalMs);
  const lazyCoeff = config?.lazy ? Math.pow(2, (config?.size ?? 4) - 2) : 1;
  const nextScore = multiplier * freqBonus / lazyCoeff;

  const canRestart = phase === 'final_clicked' || (isReplay && state.step === state.totalSteps);
  const isPlaying = phase === 'playing';

  const handleRestart = () => {
    if (!canRestart) return;
    if (isReplay) {
      exitReplay();
      setTimeout(() => {
        restartGame();
      }, 100);
      return;
    }
    restartGame();
  };

  if (compact) {
    return (
      <button
        className={cn(
          panelCardClass({
            compact: true,
            align: 'right',
            interactive: canRestart,
            tone: 'default',
          }),
          'flex min-w-[120px] flex-col items-end',
          className
        )}
        onClick={handleRestart}
        type="button"
      >
        <div className="flex items-baseline gap-2 text-[#1e3b5c] dark:text-[#e0e0e0]">
          <span className="text-xl font-semibold leading-none">{score.toFixed(3)}</span>
          {combo > 0 && <span className="text-sm font-semibold text-[#d48b1f] dark:text-[#ffaa6a]">x{combo}</span>}
        </div>
        {isPlaying && <div className="mt-1 text-xs font-medium text-[#5c6f88] dark:text-[#b0b0b0]">+{nextScore.toFixed(3)}</div>}
        {canRestart && <div className="mt-1 text-xs font-semibold text-[#2d7a4b] dark:text-[#6aff6a]">{t('restart')}</div>}
      </button>
    );
  }

  return (
    <button
      className={cn(
        panelCardClass({
          align: 'right',
          interactive: canRestart,
          tone: 'default',
        }),
        'w-full',
        className
      )}
      onClick={handleRestart}
      type="button"
    >
      <div className="flex items-baseline justify-end gap-2">
        <div className="score-pop score-pop-target text-2xl font-semibold leading-tight text-[#1e3b5c] dark:text-[#e0e0e0]">
          {score.toFixed(3)}
        </div>
        {combo > 0 && (
          <div className="score-pop text-base font-bold text-[#d48b1f] transition-all dark:text-[#ffaa6a]">
            x{combo}
          </div>
        )}
      </div>
      {isPlaying && <div className="mt-2 text-sm font-medium text-[#3a618d] dark:text-[#6a9aff]">+{nextScore.toFixed(3)}</div>}
      {canRestart && <div className="mt-2 text-sm font-semibold text-[#2d7a4b] transition-all dark:text-[#6aff6a]">{t('restart')}</div>}
    </button>
  );
};

export default ScoreDisplay;
