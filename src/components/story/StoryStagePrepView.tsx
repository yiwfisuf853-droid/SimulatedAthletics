'use client';
import React from 'react';
import { useStoryStore } from '@/stores/storyStore';
import { cn, controlButtonClass, panelCardClass, panelEyebrowClass, panelTitleClass } from '@/components/ui/classes';

const StoryStagePrepView: React.FC = () => {
  const selectedStageId = useStoryStore((state) => state.selectedStageId);
  const profile = useStoryStore((state) => state.profile);
  const enterHome = useStoryStore((state) => state.enterHome);
  const startStage = useStoryStore((state) => state.startStage);
  const getStage = useStoryStore((state) => state.getStage);
  const getSkin = useStoryStore((state) => state.getSkin);
  const getAccessStatus = useStoryStore((state) => state.getAccessStatus);
  const getEffectiveEntryCost = useStoryStore((state) => state.getEffectiveEntryCost);

  const stage = selectedStageId ? getStage(selectedStageId) : null;
  if (!stage) {
    return null;
  }

  const access = getAccessStatus(stage.id);
  const equippedSkin = getSkin(profile.equippedSkinId);
  const recommendedSkin = stage.presentation.recommendedSkinId ? getSkin(stage.presentation.recommendedSkinId) : null;

  return (
    <div className="grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-h-0 space-y-6 overflow-y-auto pr-1">
        <section className={cn(panelCardClass({ tone: 'accent' }), 'overflow-hidden')}>
          <div className="rounded-[26px] bg-[linear-gradient(145deg,rgba(255,245,223,0.86),rgba(235,246,255,0.84))] p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#72879e]">
                {stage.chapterId.replace('chapter-', '').replaceAll('-', ' ')}
              </span>
              <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#72879e]">
                entry {getEffectiveEntryCost(stage.id)}
              </span>
              <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#72879e]">
                {stage.board.rows}x{stage.board.cols}
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#163251]">{stage.title}</h1>
            <p className="mt-4 max-w-[760px] text-sm leading-7 text-[#53718d]">{stage.summary}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className={cn(panelCardClass({ tone: 'default' }), 'space-y-3')}>
            <div className={panelEyebrowClass}>Opening beat</div>
            <div className={panelTitleClass}>Briefing dialogue</div>
            <p className="text-sm leading-7 text-[#57728e]">{stage.presentation.introDialogue}</p>
            <p className="rounded-2xl bg-[#f7fbff] px-4 py-3 text-sm leading-7 text-[#5d748f]">{stage.presentation.rivalDialogue}</p>
          </article>

          <article className={cn(panelCardClass({ tone: 'default' }), 'space-y-3')}>
            <div className={panelEyebrowClass}>Loadout</div>
            <div className={panelTitleClass}>Equipped vs recommended</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#e1ebf5] bg-[#fbfdff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b90a6]">Equipped</div>
                <div className="mt-2 text-lg font-bold text-[#183452]">{equippedSkin?.name ?? 'None'}</div>
                <p className="mt-2 text-sm leading-6 text-[#5d748f]">{equippedSkin?.description}</p>
              </div>
              <div className="rounded-2xl border border-[#e1ebf5] bg-[#fbfdff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b90a6]">Recommended</div>
                <div className="mt-2 text-lg font-bold text-[#183452]">{recommendedSkin?.name ?? 'Any frame'}</div>
                <p className="mt-2 text-sm leading-6 text-[#5d748f]">{recommendedSkin?.description ?? 'This stage has no preferred frame.'}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className={cn(panelCardClass({ tone: 'muted' }), 'space-y-4')}>
            <div className={panelEyebrowClass}>Objectives</div>
            <div className={panelTitleClass}>What wins the stage</div>
            <div className="space-y-3">
              {stage.objectives.map((objective, index) => (
                <div key={objective.id} className="rounded-2xl bg-white/90 px-4 py-4 shadow-[0_10px_22px_rgba(8,18,28,0.06)]">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c91a7]">Task {index + 1}</div>
                  <div className="mt-2 text-base font-semibold text-[#173251]">{objective.title}</div>
                </div>
              ))}
            </div>
          </article>

          <article className={cn(panelCardClass({ tone: 'muted' }), 'space-y-4')}>
            <div className={panelEyebrowClass}>Failure checks</div>
            <div className={panelTitleClass}>What ends the run</div>
            <div className="space-y-3">
              {stage.failConditions.map((condition) => (
                <div key={condition.id} className="rounded-2xl bg-white/90 px-4 py-4 shadow-[0_10px_22px_rgba(8,18,28,0.06)]">
                  <div className="text-base font-semibold text-[#173251]">
                    {condition.type === 'mistake_limit' && `No more than ${condition.maxMistakes} mistakes`}
                    {condition.type === 'time_limit' && `Finish within ${Math.ceil(condition.limitMs / 1000)} seconds`}
                    {condition.type === 'miss_simultaneous_window' && `Do not miss the sync window`}
                    {condition.type === 'resource_depleted' && `Keep your ${condition.resourceKey} reserve alive`}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>

      <aside className="min-h-0 space-y-4 overflow-y-auto pr-1">
        <section className={cn(panelCardClass({ tone: 'accent' }), 'space-y-4')}>
          <div className={panelEyebrowClass}>Access</div>
          <div className={panelTitleClass}>{access.unlocked ? 'Stage ready to deploy' : 'Conditions still missing'}</div>
          <div className="rounded-2xl bg-white/90 px-4 py-4 shadow-[0_10px_22px_rgba(8,18,28,0.08)]">
            {access.unlocked ? (
              <div className="text-sm leading-7 text-[#5a748f]">All gate checks are satisfied. Entry cost will be paid when the mission starts.</div>
            ) : (
              <div className="space-y-2 text-sm leading-7 text-[#5a748f]">
                {access.reasons.map((reason) => (
                  <div key={reason}>{reason}</div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={cn(panelCardClass({ tone: 'default' }), 'space-y-4')}>
          <div className={panelEyebrowClass}>Reward bundle</div>
          <div className={panelTitleClass}>What this stage pays out</div>
          <div className="grid gap-3">
            <div className="rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#42627f]">
              +{stage.rewards.progressCurrency} progress credits
            </div>
            <div className="rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#42627f]">
              +{stage.rewards.styleCurrency} style credits
            </div>
            {stage.rewards.skinUnlockIds.length > 0 && (
              <div className="rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#42627f]">
                Unlocks: {stage.rewards.skinUnlockIds.map((skinId) => getSkin(skinId)?.name ?? skinId).join(', ')}
              </div>
            )}
          </div>
        </section>

        <section className={cn(panelCardClass({ tone: 'default' }), 'space-y-4')}>
          <div className={panelEyebrowClass}>Action</div>
          <div className="space-y-3">
            <button className={controlButtonClass({ variant: 'primary' })} disabled={!access.unlocked} onClick={() => startStage(stage.id)} type="button">
              Start Mission
            </button>
            <button className={controlButtonClass()} onClick={enterHome} type="button">
              Back To Story Home
            </button>
          </div>
          <div className="rounded-2xl border border-dashed border-[#d4dfeb] bg-[#fbfdff] px-4 py-3 text-sm leading-7 text-[#5f7791]">
            Finish objectives without crossing the fail checks. No score chase, no leaderboard, only mission completion.
          </div>
        </section>
      </aside>
    </div>
  );
};

export default StoryStagePrepView;
