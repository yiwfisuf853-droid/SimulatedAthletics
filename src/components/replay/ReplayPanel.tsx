'use client';
import React, { useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useGameStore } from '@/stores/gameStore';
import { useReplayContext } from '@/contexts/ReplayContext';
import { cn, controlButtonClass, panelCardClass } from '@/components/ui/classes';

const SPEEDS = [0.01, 0.1, 0.5, 1, 2, 10];

interface ReplayPanelProps {
  compact?: boolean;
  className?: string;
}

const ReplayPanel: React.FC<ReplayPanelProps> = ({ compact = false, className = '' }) => {
  const { t } = useI18n();
  const { phase, exitReplay } = useGameStore();
  const isReplay = phase === 'replay';
  const { state, toggle, stepForward, stepBackward, setSpeed, seekTo, currentSpeed } = useReplayContext();

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(parseInt(event.target.value, 10));
  };

  useEffect(() => {
    if (!isReplay) return;

    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (event.key === 'Escape') {
        event.preventDefault();
        exitReplay();
      } else if (event.key === ' ') {
        event.preventDefault();
        toggle();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepBackward();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepForward();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isReplay, toggle, stepForward, stepBackward, exitReplay]);

  if (!isReplay) {
    return null;
  }

  const totalSteps = state.totalSteps || 1;
  const progress = totalSteps > 0 ? (state.step / totalSteps) * 100 : 0;

  if (!state.grid.length && state.totalSteps === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn(panelCardClass({ compact: true, tone: 'muted' }), 'flex w-full flex-col gap-3', className)}>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              className={cn(
                controlButtonClass({
                  active: currentSpeed === speed,
                  compact: true,
                  variant: currentSpeed === speed ? 'accent' : 'neutral',
                }),
                'rounded-lg px-2.5 py-1'
              )}
              onClick={() => setSpeed(speed)}
              type="button"
            >
              {speed}x
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-2">
          <button className={cn(controlButtonClass(), 'rounded-lg')} onClick={stepBackward} type="button">{t('previous')}</button>
          <button className={cn(controlButtonClass(), 'rounded-lg')} onClick={toggle} type="button">{state.isPlaying ? t('pause') : t('play')}</button>
          <button className={cn(controlButtonClass(), 'rounded-lg')} onClick={stepForward} type="button">{t('next')}</button>
          <button className={cn(controlButtonClass({ variant: 'danger' }), 'rounded-lg')} onClick={exitReplay} type="button">{t('exit')}</button>
        </div>
        <div>
          <input
            type="range"
            min="0"
            max={state.totalSteps}
            value={state.step}
            onChange={handleSeek}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg"
            style={{
              background: `linear-gradient(to right, #d48b1f 0%, #d48b1f ${progress}%, #e8f0f8 ${progress}%, #e8f0f8 100%)`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(panelCardClass({ tone: 'muted' }), 'flex flex-col gap-3', className)}>
      <div className="flex flex-wrap justify-center gap-1.5">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            className={cn(
              controlButtonClass({
                active: currentSpeed === speed,
                compact: true,
                variant: currentSpeed === speed ? 'accent' : 'neutral',
              }),
              'rounded-lg px-2.5 py-1.5'
            )}
            onClick={() => setSpeed(speed)}
            type="button"
          >
            {speed}x
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        <button className={cn(controlButtonClass(), 'rounded-lg')} onClick={stepBackward} type="button">{t('previous')}</button>
        <button className={cn(controlButtonClass(), 'rounded-lg')} onClick={toggle} type="button">{state.isPlaying ? t('pause') : t('play')}</button>
        <button className={cn(controlButtonClass(), 'rounded-lg')} onClick={stepForward} type="button">{t('next')}</button>
      </div>

      <div>
        <input
          type="range"
          min="0"
          max={state.totalSteps}
          value={state.step}
          onChange={handleSeek}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg"
          style={{
            background: `linear-gradient(to right, #d48b1f 0%, #d48b1f ${progress}%, #e8f0f8 ${progress}%, #e8f0f8 100%)`,
          }}
        />
        <div className="mt-1 text-center text-xs text-[#8a9fb0] dark:text-[#b0b0b0]">
          {state.step} / {state.totalSteps}
        </div>
      </div>

      <button
        className={cn(controlButtonClass({ variant: 'danger' }), 'w-full rounded-xl py-2')}
        onClick={exitReplay}
        type="button"
      >
        {t('exitReplay')}
      </button>
    </div>
  );
};

export default ReplayPanel;
