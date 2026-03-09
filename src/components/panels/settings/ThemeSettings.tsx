'use client';
import React from 'react';
import { cn, panelCardClass, panelEyebrowClass, panelTitleClass } from '@/components/ui/classes';
import { useConfigStore } from '@/stores/configStore';

const THEME_OPTIONS = [
  { id: 'classic', color: '#eef2f6' },
  { id: 'dark', color: '#1a1a1a' },
  { id: 'ocean', color: '#d9f1ff' },
  { id: 'forest', color: '#e6f5e7' },
  { id: 'ember', color: '#fff0e3' },
  { id: 'chalk', color: '#ffffff' },
];

const ThemeSettings: React.FC = () => {
  const { theme, setTheme } = useConfigStore();

  return (
    <section className={panelCardClass({ tone: 'muted' })}>
      <div className={panelEyebrowClass}>Theme</div>
      <div className={panelTitleClass}>Visual palette for the shell</div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.id}
            className={cn(
              'rounded-[22px] border p-3 text-left transition-transform hover:-translate-y-[1px]',
              theme === option.id
                ? 'border-[#1f5b9e] shadow-[0_12px_24px_rgba(31,91,158,0.14)] dark:border-[#84c4ff]'
                : 'border-[#dbe5ef] dark:border-[#4b5058]'
            )}
            onClick={() => setTheme(option.id)}
            type="button"
          >
            <div className="h-20 rounded-[18px]" style={{ background: option.color }} />
            <div className="mt-3 text-sm font-semibold capitalize text-[#173550] dark:text-[#eef5fb]">{option.id}</div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ThemeSettings;
