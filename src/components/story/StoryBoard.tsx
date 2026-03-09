'use client';
import React from 'react';
import { useStoryStore } from '@/stores/storyStore';

const StoryBoard: React.FC = () => {
  const runState = useStoryStore((state) => state.runState);
  const profile = useStoryStore((state) => state.profile);
  const getSkin = useStoryStore((state) => state.getSkin);
  const submitCellTap = useStoryStore((state) => state.submitCellTap);

  if (!runState) {
    return null;
  }

  const equippedSkin = getSkin(profile.equippedSkinId);
  const accent = equippedSkin?.visual.accent ?? '#1f3a5c';
  const chip = equippedSkin?.visual.chip ?? '#e0eef8';
  const glow = equippedSkin?.visual.boardGlow ?? 'rgba(31,58,92,0.18)';
  const cols = runState.board[0]?.length ?? 0;

  return (
    <div className="relative mx-auto w-full max-w-[min(76vw,820px)]">
      <div
        className="grid rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.7)] p-3 shadow-[0_24px_60px_rgba(7,20,35,0.18)] backdrop-blur-xl"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: '10px',
          boxShadow: `0 24px 60px rgba(7,20,35,0.18), 0 0 0 1px ${glow}`,
        }}
      >
        {runState.board.map((row) =>
          row.map((cell) => {
            const isHighlighted =
              runState.highlightedCellIds.includes(cell.id) ||
              runState.pendingSimultaneous?.selectedCellIds.includes(cell.id);

            return (
              <button
                key={cell.id}
                className={`group relative aspect-square rounded-[22px] border text-left transition-all duration-200 ${
                  cell.cleared
                    ? 'cursor-default border-white/30 bg-[rgba(210,226,238,0.4)] opacity-45'
                    : 'cursor-pointer border-white/70 bg-white/96 hover:-translate-y-[2px] hover:shadow-[0_12px_28px_rgba(7,20,35,0.16)]'
                } ${isHighlighted ? 'ring-4 ring-[#ffd68d]' : ''}`}
                disabled={cell.cleared}
                onClick={() => submitCellTap(cell.id)}
                type="button"
              >
                <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                  {cell.tags
                    .filter((tag) => !tag.startsWith('rule:') && tag !== 'filler')
                    .map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                        style={{
                          backgroundColor: chip,
                          color: accent,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                <div className="flex h-full items-center justify-center">
                  <span
                    className={`text-[clamp(1.3rem,2.2vw,2.4rem)] font-black tracking-[-0.04em] ${
                      cell.cleared ? 'text-[#8aa0b5]' : 'text-[#102842]'
                    }`}
                    style={!cell.cleared ? { color: accent } : undefined}
                  >
                    {cell.value}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8aa0b5] opacity-0 transition-opacity group-hover:opacity-100">
                  {cell.row + 1},{cell.col + 1}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-3 grid gap-2 text-xs text-[#54708e] sm:grid-cols-3">
        <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-[0_10px_22px_rgba(7,20,35,0.08)]">
          Objective cells clear as you satisfy tasks.
        </div>
        <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-[0_10px_22px_rgba(7,20,35,0.08)]">
          Repeated values are intentional. Read the task, not just the number.
        </div>
        <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-[0_10px_22px_rgba(7,20,35,0.08)]">
          For sync tasks, click the full set before the window expires.
        </div>
      </div>
    </div>
  );
};

export default StoryBoard;
