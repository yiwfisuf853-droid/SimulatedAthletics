'use client';
import React, { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useLeaderboardStore } from '@/stores/leaderboardStore';

const IntroMessage: React.FC = () => {
  const { messages, t } = useI18n();
  const [click, setClick] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const { clearRecords } = useLeaderboardStore();
  const tips = messages.introTips;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTipIndex(Math.floor(Math.random() * tips.length));
    }, 15000);

    return () => window.clearInterval(interval);
  }, [tips.length]);

  const handleTipClick = () => {
    setCurrentTipIndex(Math.floor(Math.random() * tips.length));
  };

  const handleTitleClick = () => {
    const nextClick = click + 1;
    setClick(nextClick);
    if (nextClick >= 5) {
      clearRecords();
      setClick(0);
      alert(t('leaderboardCleared'));
    }
  };

  return (
    <div className="max-w-[520px] text-center text-[#3b5777]">
      <h2
        id="gameTitle"
        className="mb-4 cursor-pointer text-3xl font-semibold text-[#1f3a5c]"
        onClick={handleTitleClick}
      >
        {t('title')}
      </h2>
      <p className="text-base leading-7 text-[#4f6b8a]">
        {t('introLine1')}<br />
        {t('introLine2')}<br />
        {t('introLine3')}<br />
        {t('introLine4')}<br />
        {t('introLine5')}<br />
        {t('introLine6')}
      </p>
      <p
        className="mt-3 cursor-pointer text-sm text-[#4f6b8a] transition-colors hover:text-[#1f3a5c] dark:text-[#b0b0b0] dark:hover:text-[#e0e0e0]"
        onClick={handleTipClick}
      >
        {t('tipsLabel')}{tips[currentTipIndex]}
      </p>
    </div>
  );
};

export default IntroMessage;
