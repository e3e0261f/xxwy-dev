import React from 'react';
import { Quest } from '../types/game';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Scroll, X, Award, CheckCircle, Circle } from 'lucide-react';

interface Props {
  quests: Quest[];
  onClose: () => void;
  onClaimQuest: (questId: string) => void;
}

export const QuestModal: React.FC<Props> = ({ quests, onClose, onClaimQuest }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-600/60 rounded-xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300">
              <Scroll className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-wide text-amber-300 font-serif">宗门悬赏令 · 功勋榜</h2>
              <p className="text-xs text-slate-400">降妖除魔，采药炼丹，扬青城威名</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quests list */}
        <div className="space-y-3 overflow-y-auto pr-1">
          {quests.map((q) => {
            const isFinished = q.currentCount >= q.requiredCount;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition ${
                  q.claimed
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : isFinished
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800/50 border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {q.claimed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : isFinished ? (
                      <CheckCircle className="w-5 h-5 text-amber-400 animate-pulse" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                    <h4 className="font-bold text-sm text-amber-200">{q.title}</h4>
                  </div>
                  <div className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    进度: {Math.min(q.requiredCount, q.currentCount)} / {q.requiredCount}
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-3">{q.targetDesc}</p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700/40">
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Award className="w-4 h-4 text-emerald-400" />
                    奖励：{q.rewardStones} 下品灵石 + {q.rewardExp} 修为灵气
                  </span>

                  {!q.claimed ? (
                    <button
                      onClick={() => {
                        soundManager.playBreakthroughSuccess();
                        confetti({ particleCount: 40, spread: 50 });
                        onClaimQuest(q.id);
                      }}
                      disabled={!isFinished}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition ${
                        isFinished
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isFinished ? '领赏' : '进行中'}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-semibold">已领赏</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
