'use client';
import React from 'react';
import { controlButtonClass } from '@/components/ui/classes';
import AudioSettings from '@/components/panels/settings/AudioSettings';
import DisplaySettings from '@/components/panels/settings/DisplaySettings';
import ExtensionsPanel from '@/components/panels/settings/ExtensionsPanel';
import ThemeSettings from '@/components/panels/settings/ThemeSettings';
import { useConfigStore } from '@/stores/configStore';
import type { GamePhase } from '@/types/game';

interface MoreSettingsPanelProps {
  onClose: () => void;
  phase: GamePhase;
}

const MoreSettingsPanel: React.FC<MoreSettingsPanelProps> = ({ onClose, phase }) => {
  const modules = useConfigStore((state) => state.modules);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[28px] border border-[#d9e1ec] bg-white p-4 shadow-[0_18px_36px_rgba(0,20,40,0.16)] outline-none dark:border-[#555] dark:bg-[#4a4a4a]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#e6edf5] px-2 pb-4 dark:border-[#555]">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-[#1e2b3a] dark:text-[#f4f4f4]">More Settings</div>
          <p className="text-xs leading-5 text-[#7a8da3] dark:text-[#b0b0b0]">
            Arena-first by default. Optional modules and extension systems live here instead of the main surface.
          </p>
        </div>
        <button className={controlButtonClass({ compact: true })} onClick={onClose} type="button">
          Close
        </button>
      </div>

      {phase !== 'idle' && (
        <div className="mt-3 rounded-2xl border border-[#e3ebf5] bg-[#f7fbff] px-4 py-3 text-xs leading-5 text-[#5c6f88] dark:border-[#555] dark:bg-[#3a3a3a] dark:text-[#c6c6c6]">
          The current run is live. Arena layout choices take effect immediately, while some start-of-round values apply on the next game.
        </div>
      )}

      <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
        <DisplaySettings />
        {modules.audio && <AudioSettings />}
        {modules.theme && <ThemeSettings />}
        <ExtensionsPanel onClose={onClose} />
      </div>
    </div>
  );
};

export default MoreSettingsPanel;
