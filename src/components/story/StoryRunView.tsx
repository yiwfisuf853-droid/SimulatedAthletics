'use client';
import React from 'react';
import StoryBoard from './StoryBoard';
import { useStoryStore } from '@/stores/storyStore';
import { cn, controlButtonClass, panelCardClass, panelEyebrowClass, panelTitleClass } from '@/components/ui/classes';

const StoryRunView: React.FC = () => {
  const runState = useStoryStore((state) => state.runState);
  const profile = useStoryStore((state) => state.profile);
  const useHint = useStoryStore((state) => state.useHint);
  const leaveRun = useStoryStore((state) => state.leaveRun);
  const getStage = useStoryStore((state) => state.getStage);
  const getSkin = useStoryStore((state) => state.getSkin);

  if (!runState) {
    return null;
  }

  const stage = getStage(runState.stageId);
  const equippedSkin = getSkin(profile.equippedSkinId);
  if (!stage) {
    return null;
  }

  return (
    <div className="grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-h-0 overflow-y-auto pr-1">
        <div className={cn(panelCardClass({ tone: 'accent' }), 'mb-5')}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className={panelEyebrowClass}>Story Run</div>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#173251]">{stage.title}</h1>
              <p className="mt-2 text-sm leading-7 text-[#57728e]">{stage.presentation.rivalDialogue}</p>
            </div>
            <div className="rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-[#35526d] shadow-[0_10px_22px_rgba(8,18,28,0.08)]">
              {Math.ceil(runState.elapsedMs / 100) / 10}s elapsed
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <StoryBoard />
        </div>
      </div>

      <aside className="min-h-0 space-y-4 overflow-y-auto pr-1">
        <section className={cn(panelCardClass({ tone: 'default' }), 'space-y-4')}>
          <div className={panelEyebrowClass}>Current objective state</div>
          <div className={panelTitleClass}>Mission board</div>
          <div className="space-y-3">
            {runState.objectives.map((objective) => (
              <div key={objective.objectiveId} className="rounded-2xl bg-[#f7fbff] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-[#183452]">{objective.title}</div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${objective.completed ? 'bg-[#dff5e6] text-[#2f7b4b]' : 'bg-[#eef3f8] text-[#54718d]'}`}>
                    {objective.completed ? 'done' : objective.currentLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={cn(panelCardClass({ tone: 'default' }), 'space-y-4')}>
          <div className={panelEyebrowClass}>Failure risk</div>
          <div className={panelTitleClass}>Keep the run alive</div>
          <div className="grid gap-3">
            {runState.failureRisk.mistakesLeft !== null && (
              <div className="rounded-2xl bg-[#fff6ef] px-4 py-3 text-sm font-semibold text-[#9e5d1d]">
                Mistakes left: {runState.failureRisk.mistakesLeft}
              </div>
            )}
            {runState.failureRisk.timeLeftMs !== null && (
              <div className="rounded-2xl bg-[#f2f7ff] px-4 py-3 text-sm font-semibold text-[#3d5f90]">
                Time left: {Math.max(0, Math.ceil(runState.failureRisk.timeLeftMs / 100) / 10)}s
              </div>
            )}
            {runState.failureRisk.focusLeft !== null && (
              <div className="rounded-2xl bg-[#fff4f4] px-4 py-3 text-sm font-semibold text-[#9a4954]">
                Focus left: {runState.failureRisk.focusLeft}
              </div>
            )}
            {runState.failureRisk.simultaneousMissesLeft !== null && (
              <div className="rounded-2xl bg-[#f5f3ff] px-4 py-3 text-sm font-semibold text-[#6956b1]">
                Sync misses left: {runState.failureRisk.simultaneousMissesLeft}
              </div>
            )}
            {runState.pendingSimultaneous && (
              <div className="rounded-2xl bg-[#fff1d7] px-4 py-3 text-sm font-semibold text-[#9b6410]">
                Sync window active. Finish the full set before it closes.
              </div>
            )}
          </div>
        </section>

        <section className={cn(panelCardClass({ tone: 'accent' }), 'space-y-4')}>
          <div className={panelEyebrowClass}>Toolkit</div>
          <div className={panelTitleClass}>Skin, hints, and current status</div>
          <div className="rounded-2xl bg-white/90 px-4 py-4 text-sm leading-7 text-[#57728e]">
            <div className="font-semibold text-[#173251]">{equippedSkin?.name ?? 'No skin equipped'}</div>
            <div className="mt-2">{stage.presentation.introDialogue}</div>
            <div className="mt-3 rounded-2xl bg-[#f7fbff] px-4 py-3 text-sm leading-7 text-[#58728d]">{runState.lastEventText}</div>
          </div>
          <div className="grid gap-3">
            <button className={controlButtonClass({ variant: 'accent' })} disabled={runState.hintsRemaining <= 0} onClick={useHint} type="button">
              Use Hint ({runState.hintsRemaining})
            </button>
            <button className={controlButtonClass({ variant: 'danger' })} onClick={leaveRun} type="button">
              Abort Mission
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
};

export default StoryRunView;
