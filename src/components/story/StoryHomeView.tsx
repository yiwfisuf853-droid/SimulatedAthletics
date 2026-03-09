'use client';
import React from 'react';
import { STORY_CHAPTERS, STORY_SKINS, STORY_STAGES } from '@/data/storyContent';
import { useStoryStore } from '@/stores/storyStore';
import { cn, controlButtonClass, panelCardClass, panelEyebrowClass, panelTitleClass } from '@/components/ui/classes';

const StoryHomeView: React.FC = () => {
  const profile = useStoryStore((state) => state.profile);
  const selectStage = useStoryStore((state) => state.selectStage);
  const buySkin = useStoryStore((state) => state.buySkin);
  const equipSkin = useStoryStore((state) => state.equipSkin);
  const getSkin = useStoryStore((state) => state.getSkin);
  const getAccessStatus = useStoryStore((state) => state.getAccessStatus);
  const getEffectiveEntryCost = useStoryStore((state) => state.getEffectiveEntryCost);

  const equippedSkin = getSkin(profile.equippedSkinId);

  return (
    <div className="grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-h-0 overflow-y-auto pr-1">
        <div className={cn(panelCardClass({ tone: 'accent' }), 'mb-6 overflow-hidden')}>
          <div className="rounded-[22px] bg-[radial-gradient(circle_at_top_left,rgba(255,213,150,0.35),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(88,161,255,0.2),transparent_38%)] p-6">
            <div className={panelEyebrowClass}>Story Campaign</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#173251]">Mission board, not leaderboard.</h1>
            <p className="mt-4 max-w-[720px] text-sm leading-7 text-[#56718d]">
              Story mode replaces score chasing with chapter progression, entry conditions, tactical objectives, skin choices, and reward loops.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {STORY_CHAPTERS.map((chapter) => {
            const chapterStages = STORY_STAGES.filter((stage) => stage.chapterId === chapter.id);
            const completedCount = chapterStages.filter((stage) => profile.stageStates[stage.id]?.completed).length;

            return (
              <section key={chapter.id} className={cn(panelCardClass({ tone: 'muted' }), 'space-y-4')}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className={panelEyebrowClass}>Chapter {chapter.order}</div>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#173251]">{chapter.title}</h2>
                    <p className="mt-2 max-w-[760px] text-sm leading-7 text-[#58718c]">{chapter.summary}</p>
                  </div>
                  <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#33516f] shadow-[0_10px_24px_rgba(10,20,35,0.08)]">
                    {completedCount} / {chapterStages.length} cleared
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {chapterStages.map((stage) => {
                    const access = getAccessStatus(stage.id);
                    const completed = profile.stageStates[stage.id]?.completed ?? false;
                    const statusLabel = completed ? 'Completed' : access.unlocked ? 'Ready' : 'Locked';

                    return (
                      <article key={stage.id} className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_16px_34px_rgba(8,18,28,0.08)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8ea3]">{statusLabel}</div>
                            <h3 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#183452]">{stage.title}</h3>
                          </div>
                          <div className="rounded-full bg-[#eef5fb] px-3 py-1 text-xs font-semibold text-[#4c6986]">
                            Cost {getEffectiveEntryCost(stage.id)}
                          </div>
                        </div>

                        <p className="mt-3 text-sm leading-7 text-[#5a748f]">{stage.summary}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#ecf3f9] px-3 py-1 text-xs font-semibold text-[#4f6781]">
                            {stage.board.rows}x{stage.board.cols}
                          </span>
                          <span className="rounded-full bg-[#ecf3f9] px-3 py-1 text-xs font-semibold text-[#4f6781]">
                            {stage.objectives.length} objectives
                          </span>
                          <span className="rounded-full bg-[#ecf3f9] px-3 py-1 text-xs font-semibold text-[#4f6781]">
                            {stage.failConditions.length} fail checks
                          </span>
                        </div>

                        {!access.unlocked && (
                          <div className="mt-4 rounded-2xl bg-[#f7fafc] px-4 py-3 text-sm leading-6 text-[#5c748d]">
                            {access.reasons.map((reason) => (
                              <div key={reason}>{reason}</div>
                            ))}
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-[#4e6a86]">
                            Rewards: +{stage.rewards.progressCurrency} progress / +{stage.rewards.styleCurrency} style
                          </div>
                          <button className={controlButtonClass({ variant: completed ? 'accent' : 'primary' })} onClick={() => selectStage(stage.id)} type="button">
                            {completed ? 'Replay Briefing' : 'Inspect Stage'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <aside className="min-h-0 space-y-4 overflow-y-auto pr-1">
        <section className={cn(panelCardClass({ tone: 'accent' }), 'space-y-4')}>
          <div className={panelEyebrowClass}>Profile</div>
          <div className={panelTitleClass}>Current campaign loadout</div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl bg-white/90 px-4 py-4 shadow-[0_12px_26px_rgba(8,18,28,0.08)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7990a7]">Progress Credits</div>
              <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#183452]">{profile.progressCurrency}</div>
            </div>
            <div className="rounded-2xl bg-white/90 px-4 py-4 shadow-[0_12px_26px_rgba(8,18,28,0.08)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7990a7]">Style Credits</div>
              <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#183452]">{profile.styleCurrency}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_12px_26px_rgba(8,18,28,0.08)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7990a7]">Equipped Skin</div>
            <div className="mt-2 text-lg font-bold text-[#173251]">{equippedSkin?.name ?? 'None'}</div>
            <p className="mt-2 text-sm leading-6 text-[#5d748f]">{equippedSkin?.description}</p>
          </div>
        </section>

        <section className={cn(panelCardClass({ tone: 'muted' }), 'space-y-4')}>
          <div className={panelEyebrowClass}>Skin Deck</div>
          <div className={panelTitleClass}>Cosmetic frames with light tactical perks</div>
          <div className="space-y-3">
            {STORY_SKINS.map((skin) => {
              const owned = profile.ownedSkinIds.includes(skin.id);
              const equipped = profile.equippedSkinId === skin.id;

              return (
                <article key={skin.id} className="rounded-[22px] border border-white/70 bg-white/90 p-4 shadow-[0_10px_22px_rgba(8,18,28,0.08)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c91a7]">{skin.rarity}</div>
                      <h3 className="mt-2 text-lg font-bold text-[#173251]">{skin.name}</h3>
                    </div>
                    <div
                      className="h-12 w-12 rounded-2xl border border-white/70"
                      style={{
                        background: `linear-gradient(135deg, ${skin.visual.chip}, ${skin.visual.accent}22)`,
                        boxShadow: `0 0 0 1px ${skin.visual.boardGlow}`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#5c748d]">{skin.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skin.modifiers.map((modifier) => (
                      <span key={`${skin.id}-${modifier.type}`} className="rounded-full bg-[#edf4fa] px-3 py-1 text-xs font-semibold text-[#4d6780]">
                        {modifier.type.replaceAll('_', ' ')}
                      </span>
                    ))}
                    {skin.modifiers.length === 0 && (
                      <span className="rounded-full bg-[#edf4fa] px-3 py-1 text-xs font-semibold text-[#4d6780]">no modifier</span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[#4d6780]">{owned ? 'Owned' : `Cost ${skin.cost}`}</div>
                    {equipped ? (
                      <button className={controlButtonClass({ active: true, variant: 'accent' })} disabled type="button">
                        Equipped
                      </button>
                    ) : owned ? (
                      <button className={controlButtonClass({ variant: 'primary' })} onClick={() => equipSkin(skin.id)} type="button">
                        Equip
                      </button>
                    ) : (
                      <button className={controlButtonClass({ variant: 'accent' })} onClick={() => buySkin(skin.id)} type="button">
                        Buy
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
};

export default StoryHomeView;
