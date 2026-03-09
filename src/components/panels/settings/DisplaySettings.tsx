'use client';
import React from 'react';
import {
  cn,
  controlButtonClass,
  controlGroupClass,
  controlInputClass,
  panelCardClass,
  panelEyebrowClass,
  panelTitleClass,
} from '@/components/ui/classes';
import { useI18n } from '@/hooks/useI18n';
import { useConfigStore } from '@/stores/configStore';
import type { UiPreset } from '@/types/config';

const ToggleChip: React.FC<{
  label: string;
  checked: boolean;
  onClick: () => void;
}> = ({ label, checked, onClick }) => (
  <button
    className={cn(
      'rounded-full px-3 py-2 text-sm font-medium transition-colors',
      checked
        ? 'bg-[#1e2b3a] text-white shadow-[0_10px_20px_rgba(30,43,58,0.14)] dark:bg-[#6a9aff] dark:text-[#10233d]'
        : 'bg-[#edf4fb] text-[#24405b] hover:bg-[#dce8f5] dark:bg-[#3a3e44] dark:text-[#eef5fb] dark:hover:bg-[#454a52]'
    )}
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
);

const PRESET_COPY: Record<UiPreset, { title: string; description: string }> = {
  pure: {
    title: 'Pure',
    description: 'Minimal arena page with only core play information visible.',
  },
  standard: {
    title: 'Standard',
    description: 'Turns common helper modules back on without exposing story as a top-level mode.',
  },
};

const DisplaySettings: React.FC = () => {
  const { t } = useI18n();
  const {
    uiPreset,
    setUiPreset,
    modules,
    setModuleEnabled,
    autoFinalClick,
    toggleAutoFinalClick,
    hideAxisLabels,
    toggleAxisLabels,
    hideFinalLayer,
    toggleHideFinalLayer,
    defaultLayers,
    setLayers,
    expandMode,
    toggleExpandMode,
    expandSize,
    setExpandSize,
    backgroundImage,
    setBackgroundImage,
  } = useConfigStore();

  return (
    <section className={panelCardClass({ tone: 'muted' })}>
      <div className={panelEyebrowClass}>Arena Surface</div>
      <div className={panelTitleClass}>Keep the default page simple and controllable</div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {(['pure', 'standard'] as UiPreset[]).map((preset) => (
          <button
            key={preset}
            className={cn(
              'rounded-[22px] border p-4 text-left transition-all',
              uiPreset === preset
                ? 'border-[#1f5b9e] bg-[#edf6ff] shadow-[0_12px_24px_rgba(31,91,158,0.12)] dark:border-[#84c4ff] dark:bg-[#27425b]'
                : 'border-[#dbe5ef] bg-white hover:bg-[#f7fbff] dark:border-[#4b5058] dark:bg-[#383d43] dark:hover:bg-[#424850]'
            )}
            onClick={() => setUiPreset(preset)}
            type="button"
          >
            <div className="text-sm font-semibold text-[#18334c] dark:text-[#eef5fb]">{PRESET_COPY[preset].title}</div>
            <div className="mt-2 text-sm leading-6 text-[#61788f] dark:text-[#b8c2cb]">{PRESET_COPY[preset].description}</div>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold text-[#26425b] dark:text-[#eef5fb]">Visible arena modules</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ToggleChip
            label={t('leaderboard')}
            checked={modules.leaderboard}
            onClick={() => setModuleEnabled('leaderboard', !modules.leaderboard)}
          />
          <ToggleChip
            label={t('virtualKeyboard')}
            checked={modules.virtualKeyboard}
            onClick={() => setModuleEnabled('virtualKeyboard', !modules.virtualKeyboard)}
          />
          <ToggleChip
            label={t('keyboardMap')}
            checked={modules.keyboardScore}
            onClick={() => setModuleEnabled('keyboardScore', !modules.keyboardScore)}
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold text-[#26425b] dark:text-[#eef5fb]">Gameplay modifiers</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ToggleChip label={t('axisLabels')} checked={!hideAxisLabels} onClick={toggleAxisLabels} />
          <ToggleChip label={t('autoFinalClick')} checked={autoFinalClick} onClick={toggleAutoFinalClick} />
          <ToggleChip label={t('hideFinalLayer')} checked={hideFinalLayer} onClick={toggleHideFinalLayer} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className={controlGroupClass}>
          <span className={panelEyebrowClass}>{t('fixedLayers')}</span>
          <input
            className={cn(controlInputClass, 'w-full')}
            disabled={expandMode}
            max={9}
            min={1}
            type="number"
            value={defaultLayers}
            onChange={(event) => setLayers(Math.max(1, Math.min(9, Number(event.target.value) || 1)))}
          />
        </label>
        <div className={controlGroupClass}>
          <span className={panelEyebrowClass}>{t('expandMode')}</span>
          <button className={controlButtonClass({ active: expandMode, compact: true })} onClick={toggleExpandMode} type="button">
            {expandMode ? t('expandMode') : t('expansion')}
          </button>
        </div>
        <label className={controlGroupClass}>
          <span className={panelEyebrowClass}>{t('boardSize')}</span>
          <input
            className={cn(controlInputClass, 'w-full')}
            disabled={!expandMode}
            max={20}
            min={6}
            type="number"
            value={expandSize}
            onChange={(event) => setExpandSize(Math.max(6, Math.min(20, Number(event.target.value) || 6)))}
          />
        </label>
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold text-[#26425b] dark:text-[#eef5fb]">{t('backgroundImage')}</div>
        <input
          className={cn(controlInputClass, 'mt-3 w-full text-left')}
          placeholder={t('imageUrl')}
          type="text"
          value={backgroundImage}
          onChange={(event) => setBackgroundImage(event.target.value)}
        />
      </div>
    </section>
  );
};

export default DisplaySettings;
