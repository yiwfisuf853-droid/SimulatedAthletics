'use client';
import React from 'react';
import { controlButtonClass, panelCardClass, panelEyebrowClass, panelTitleClass } from '@/components/ui/classes';
import { useI18n } from '@/hooks/useI18n';
import { useConfigStore } from '@/stores/configStore';

const AudioSettings: React.FC = () => {
  const { t } = useI18n();
  const { muted, toggleMuted, masterVolume, setMasterVolume, sfxVolume, setSfxVolume, musicVolume, setMusicVolume } =
    useConfigStore();

  return (
    <section className={panelCardClass({ tone: 'muted' })}>
      <div className={panelEyebrowClass}>Audio</div>
      <div className={panelTitleClass}>Optional sound controls</div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#26425b] dark:text-[#eef5fb]">{t('mute')}</span>
        <button
          className={controlButtonClass({ active: muted, compact: true, variant: muted ? 'danger' : 'neutral' })}
          onClick={toggleMuted}
          type="button"
        >
          {muted ? t('mute') : t('audio')}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {[
          { label: t('masterVolume'), value: masterVolume, setValue: setMasterVolume },
          { label: t('sfxVolume'), value: sfxVolume, setValue: setSfxVolume },
          { label: t('musicVolume'), value: musicVolume, setValue: setMusicVolume },
        ].map((item) => (
          <label key={item.label} className="block">
            <div className="mb-2 flex items-center justify-between text-sm text-[#5f7488] dark:text-[#b8c2cb]">
              <span>{item.label}</span>
              <span>{Math.round(item.value * 100)}%</span>
            </div>
            <input
              className="w-full accent-[#1f5b9e] dark:accent-[#8dc9ff]"
              max={1}
              min={0}
              step={0.05}
              type="range"
              value={item.value}
              onChange={(event) => item.setValue(Number(event.target.value))}
            />
          </label>
        ))}
      </div>
    </section>
  );
};

export default AudioSettings;
