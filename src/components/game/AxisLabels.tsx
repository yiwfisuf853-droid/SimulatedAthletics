'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useConfigStore } from '@/stores/configStore';

interface AxisLabelsProps {
  size: number;
}

interface KeyBindingPopup {
  type: 'col';
  index: number;
  x: number;
  y: number;
}

const AxisLabels: React.FC<AxisLabelsProps> = ({ size }) => {
  const { t } = useI18n();
  const { hideAxisLabels, keyBindings, setKeyBinding } = useConfigStore();
  const [popup, setPopup] = useState<KeyBindingPopup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getLabel = (type: 'row' | 'col', index: number) => {
    return keyBindings[`${type}_${index}`]?.toUpperCase() || String(index + 1);
  };

  const handleDblClick = (type: 'col', index: number, event: React.MouseEvent) => {
    event.preventDefault();
    setPopup({ type, index, x: event.clientX, y: event.clientY });
  };

  useEffect(() => {
    if (!popup) return;
    const handleKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        setPopup(null);
        return;
      }
      const key = event.key;
      if (key.length === 1 && /^[a-zA-Z0-9]$/.test(key)) {
        const nextKey = key.toLowerCase();
        setKeyBinding('col', popup.index, nextKey);
        setKeyBinding('row', popup.index, nextKey);
        setPopup(null);
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [popup, setKeyBinding]);

  if (hideAxisLabels) return null;

  return (
    <>
      <div ref={containerRef} className="flex">
        <div className="h-11 w-11 flex-shrink-0" />
        {Array.from({ length: size }).map((_, col) => (
          <div
            key={col}
            className="flex h-11 flex-1 cursor-pointer select-none items-center justify-center border-b-2 border-l border-[#dde5f0] bg-[#f2f6fc] font-semibold text-[#2c4b68] transition-colors hover:bg-[#e8f0f8] dark:border-[#444] dark:border-b-[#555] dark:bg-[#3a3a3a] dark:text-[#e0e0e0] dark:hover:bg-[#444]"
            onDoubleClick={(event) => handleDblClick('col', col, event)}
            title={t('keyBinding')}
          >
            {getLabel('col', col)}
          </div>
        ))}
      </div>

      {popup && (
        <div className="fixed inset-0 z-50" onClick={() => setPopup(null)}>
          <div
            className="absolute min-w-[240px] rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-[#3a3a3a]"
            style={{ left: Math.min(popup.x, window.innerWidth - 260), top: Math.min(popup.y, window.innerHeight - 160) }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 font-semibold text-[#1f3a5c] dark:text-[#e0e0e0]">
              {t('setHotkey')} {popup.index + 1}
            </div>
            <div className="mb-3 text-sm text-[#5c6f88] dark:text-[#b0b0b0]">
              {t('current')}: {(keyBindings[`${popup.type}_${popup.index}`] || String(popup.index + 1)).toUpperCase()}
            </div>
            <div className="text-xs text-[#8a9fb0] dark:text-[#808080]">
              {t('pressNewKey')}
              <br />
              {t('escCancel')}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AxisLabels;
