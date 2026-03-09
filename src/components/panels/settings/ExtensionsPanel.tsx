'use client';
import React, { useState } from 'react';
import AchievementSettingsPanel from '@/components/achievement/AchievementSettingsPanel';
import MultiplayerPanel from '@/components/multiplayer/MultiplayerPanel';
import { cn, controlButtonClass, panelCardClass, panelEyebrowClass, panelTitleClass } from '@/components/ui/classes';
import { useAppStore } from '@/stores/appStore';
import { useConfigStore } from '@/stores/configStore';
import { useStoryStore } from '@/stores/storyStore';

interface ExtensionsPanelProps {
  onClose: () => void;
}

const ExtensionToggle: React.FC<{
  label: string;
  enabled: boolean;
  onToggle: () => void;
}> = ({ label, enabled, onToggle }) => (
  <button
    className={controlButtonClass({ active: enabled, compact: true, variant: enabled ? 'accent' : 'neutral' })}
    onClick={onToggle}
    type="button"
  >
    {enabled ? `${label} On` : `${label} Off`}
  </button>
);

const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ onClose }) => {
  const [expandedSection, setExpandedSection] = useState<'multiplayer' | 'achievements' | null>(null);
  const setMode = useAppStore((state) => state.setMode);
  const enterHome = useStoryStore((state) => state.enterHome);
  const modules = useConfigStore((state) => state.modules);
  const setModuleEnabled = useConfigStore((state) => state.setModuleEnabled);

  const launchStory = () => {
    enterHome();
    setMode('story');
    onClose();
  };

  return (
    <section className={panelCardClass({ tone: 'accent' })}>
      <div className={panelEyebrowClass}>Extensions</div>
      <div className={panelTitleClass}>Hidden entry points for future-facing systems</div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ExtensionToggle
          label="Story"
          enabled={modules.storyEntry}
          onToggle={() => setModuleEnabled('storyEntry', !modules.storyEntry)}
        />
        <ExtensionToggle
          label="Multiplayer"
          enabled={modules.multiplayer}
          onToggle={() => setModuleEnabled('multiplayer', !modules.multiplayer)}
        />
        <ExtensionToggle
          label="Achievements"
          enabled={modules.achievements}
          onToggle={() => setModuleEnabled('achievements', !modules.achievements)}
        />
      </div>

      <div className="mt-5 space-y-4">
        {modules.storyEntry && (
          <div className="rounded-[22px] border border-[#dbe5ef] bg-white/92 p-4 dark:border-[#4b5058] dark:bg-[#383d43]">
            <div className="text-sm font-semibold text-[#173251] dark:text-[#eef5fb]">Story Mode</div>
            <p className="mt-2 text-sm leading-6 text-[#61788f] dark:text-[#b8c2cb]">
              The campaign engine stays available, but only behind this secondary entry point.
            </p>
            <button className={cn(controlButtonClass({ variant: 'primary' }), 'mt-3')} onClick={launchStory} type="button">
              Open Story UI
            </button>
          </div>
        )}

        {modules.multiplayer && (
          <div className="rounded-[22px] border border-[#dbe5ef] bg-white/92 p-4 dark:border-[#4b5058] dark:bg-[#383d43]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#173251] dark:text-[#eef5fb]">Multiplayer Workspace</div>
                <p className="mt-2 text-sm leading-6 text-[#61788f] dark:text-[#b8c2cb]">
                  Kept out of the default arena, but still usable for ongoing iteration.
                </p>
              </div>
              <button
                className={controlButtonClass({ compact: true, variant: expandedSection === 'multiplayer' ? 'accent' : 'neutral' })}
                onClick={() => setExpandedSection((current) => (current === 'multiplayer' ? null : 'multiplayer'))}
                type="button"
              >
                {expandedSection === 'multiplayer' ? 'Hide' : 'Show'}
              </button>
            </div>
            {expandedSection === 'multiplayer' && <div className="mt-4"><MultiplayerPanel /></div>}
          </div>
        )}

        {modules.achievements && (
          <div className="rounded-[22px] border border-[#dbe5ef] bg-white/92 p-4 dark:border-[#4b5058] dark:bg-[#383d43]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#173251] dark:text-[#eef5fb]">Achievements</div>
                <p className="mt-2 text-sm leading-6 text-[#61788f] dark:text-[#b8c2cb]">
                  Retained as a hidden module so the core product can stay focused on play first.
                </p>
              </div>
              <button
                className={controlButtonClass({ compact: true, variant: expandedSection === 'achievements' ? 'accent' : 'neutral' })}
                onClick={() => setExpandedSection((current) => (current === 'achievements' ? null : 'achievements'))}
                type="button"
              >
                {expandedSection === 'achievements' ? 'Hide' : 'Show'}
              </button>
            </div>
            {expandedSection === 'achievements' && <div className="mt-4"><AchievementSettingsPanel /></div>}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExtensionsPanel;
