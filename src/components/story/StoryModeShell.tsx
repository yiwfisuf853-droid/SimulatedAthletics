'use client';
import React from 'react';
import StoryHomeView from './StoryHomeView';
import StoryResultView from './StoryResultView';
import StoryRunView from './StoryRunView';
import StoryStagePrepView from './StoryStagePrepView';
import { useStoryStore } from '@/stores/storyStore';
import { useAppStore } from '@/stores/appStore';

const StoryModeShell: React.FC = () => {
  const view = useStoryStore((state) => state.view);
  const selectedStageId = useStoryStore((state) => state.selectedStageId);
  const enterHome = useStoryStore((state) => state.enterHome);
  const getStage = useStoryStore((state) => state.getStage);
  const setMode = useAppStore((state) => state.setMode);

  const stage = selectedStageId ? getStage(selectedStageId) : null;

  return (
    <div className="flex h-full w-[96vw] max-w-[1580px] flex-col overflow-hidden rounded-[36px] border border-white/35 bg-[linear-gradient(180deg,rgba(242,247,251,0.96),rgba(228,237,245,0.94))] p-4 shadow-[0_30px_80px_rgba(6,18,30,0.22)] backdrop-blur-2xl sm:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4 rounded-[28px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(245,250,255,0.78))] px-5 py-4 shadow-[0_18px_40px_rgba(8,18,28,0.08)]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d8399]">Story Campaign</div>
          <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#163251]">
            {view === 'home' ? 'Chapter command deck' : stage?.title ?? 'Story mode'}
          </div>
          <div className="mt-2 text-sm leading-6 text-[#5e7690]">
            {view === 'home'
              ? 'Shift into a progression-first mode: objectives, entry conditions, skins, and rewards.'
              : 'This shell removes arena scoring and pivots the run around mission logic and campaign progression.'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {view !== 'home' && (
            <button
              className="rounded-full bg-[#eef4fb] px-4 py-2 text-sm font-semibold text-[#1f3b5a] transition-colors hover:bg-[#dfeaf5]"
              onClick={enterHome}
              type="button"
            >
              Story Home
            </button>
          )}
          <button
            className="rounded-full bg-[#173251] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#22446c]"
            onClick={() => setMode('arena')}
            type="button"
          >
            Back To Arena
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'home' && <StoryHomeView />}
        {view === 'prep' && <StoryStagePrepView />}
        {view === 'run' && <StoryRunView />}
        {view === 'result' && <StoryResultView />}
      </div>
    </div>
  );
};

export default StoryModeShell;
