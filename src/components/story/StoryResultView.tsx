'use client';
import React from 'react';
import { useStoryStore } from '@/stores/storyStore';
import { cn, controlButtonClass, panelCardClass, panelEyebrowClass, panelTitleClass } from '@/components/ui/classes';

const StoryResultView: React.FC = () => {
  const runResult = useStoryStore((state) => state.runResult);
  const retryStage = useStoryStore((state) => state.retryStage);
  const continueFromResult = useStoryStore((state) => state.continueFromResult);
  const enterHome = useStoryStore((state) => state.enterHome);
  const getStage = useStoryStore((state) => state.getStage);
  const getSkin = useStoryStore((state) => state.getSkin);

  if (!runResult) {
    return null;
  }

  const stage = getStage(runResult.stageId);
  const usedSkin = getSkin(runResult.usedSkinId);
  const succeeded = runResult.success;

  return (
    <div className="grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-h-0 space-y-6 overflow-y-auto pr-1">
        <article className={cn(panelCardClass({ tone: 'accent' }), 'overflow-hidden')}>
          <div className={`rounded-[26px] p-6 ${succeeded ? 'bg-[linear-gradient(145deg,rgba(226,255,238,0.9),rgba(241,249,255,0.86))]' : 'bg-[linear-gradient(145deg,rgba(255,241,239,0.92),rgba(249,247,255,0.9))]'}`}>
            <div className={panelEyebrowClass}>{succeeded ? 'Mission Complete' : 'Mission Failed'}</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#173251]">
              {succeeded ? stage?.presentation.victoryDialogue ?? 'Stage cleared.' : 'The mission broke before the board did.'}
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#58728d]">
              {succeeded
                ? `All required objectives were completed in ${Math.ceil(runResult.elapsedMs / 100) / 10}s.`
                : runResult.failedCondition
                  ? `Failure trigger: ${runResult.failedCondition.type.replaceAll('_', ' ')}.`
                  : 'The stage ended before completion.'}
            </p>
          </div>
        </article>

        <article className="grid gap-6 lg:grid-cols-2">
          <section className={cn(panelCardClass({ tone: 'default' }), 'space-y-4')}>
            <div className={panelEyebrowClass}>Run summary</div>
            <div className={panelTitleClass}>What the board recorded</div>
            <div className="space-y-3 text-sm text-[#59728d]">
              <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">Elapsed: {Math.ceil(runResult.elapsedMs / 100) / 10}s</div>
              <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">Completed objectives: {runResult.completedObjectives.length}</div>
              <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">Skin used: {usedSkin?.name ?? 'None'}</div>
            </div>
          </section>

          <section className={cn(panelCardClass({ tone: 'default' }), 'space-y-4')}>
            <div className={panelEyebrowClass}>Reward bundle</div>
            <div className={panelTitleClass}>What changed after this run</div>
            <div className="space-y-3 text-sm text-[#59728d]">
              <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">Progress credits: +{runResult.rewardsGranted.progressCurrency}</div>
              <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">Style credits: +{runResult.rewardsGranted.styleCurrency}</div>
              <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                Unlock changes: {runResult.unlockChanges.length > 0 ? runResult.unlockChanges.map((change) => change.title).join(', ') : 'none'}
              </div>
            </div>
          </section>
        </article>
      </section>

      <aside className="min-h-0 space-y-4 overflow-y-auto pr-1">
        <section className={cn(panelCardClass({ tone: 'accent' }), 'space-y-4')}>
          <div className={panelEyebrowClass}>Next move</div>
          <div className={panelTitleClass}>{succeeded ? 'Advance or review' : 'Reset and try again'}</div>
          <div className="grid gap-3">
            <button className={controlButtonClass({ variant: 'primary' })} onClick={continueFromResult} type="button">
              {succeeded ? 'Continue Campaign' : 'Back To Briefing'}
            </button>
            <button className={controlButtonClass({ variant: 'accent' })} onClick={() => retryStage()} type="button">
              Retry Stage
            </button>
            <button className={controlButtonClass()} onClick={enterHome} type="button">
              Story Home
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
};

export default StoryResultView;
