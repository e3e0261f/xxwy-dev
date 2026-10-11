import React, { useState } from 'react';
import { NPC } from '../types/game';
import { MessageSquare, X, ChevronRight } from 'lucide-react';

interface Props {
  npc: NPC;
  onClose: () => void;
  onOpenAlchemy?: () => void;
  onOpenQuests?: () => void;
}

export const DialogueModal: React.FC<Props> = ({
  npc,
  onClose,
  onOpenAlchemy,
  onOpenQuests,
}) => {
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const currentLine = npc.dialogue[dialogueIdx] || npc.dialogue[0];
  const hasMore = dialogueIdx < npc.dialogue.length - 1;

  const nextLine = () => {
    if (hasMore) {
      setDialogueIdx((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-600/70 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col">
        {/* NPC Avatar & Info */}
        <div className="flex items-center justify-between border-b border-amber-800/40 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-amber-500/60 flex items-center justify-center text-2xl shadow-inner">
              {npc.role === 'alchemist' ? '🧙‍♂️' : npc.role === 'elder' ? '🧔‍♂️' : '⚔️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-amber-300 font-serif">{npc.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {npc.title}
                </span>
              </div>
              <p className="text-xs text-slate-400">青城仙门道长</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dialogue text box */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-sm leading-relaxed text-slate-200 mb-4 min-h-[70px] flex items-center">
          <p className="font-serif tracking-wide">{currentLine}</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {npc.role === 'alchemist' && onOpenAlchemy && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAlchemy();
                }}
                className="px-3 py-1.5 rounded-lg bg-orange-900/60 hover:bg-orange-800 border border-orange-500/50 text-xs font-bold text-orange-200 transition"
              >
                🔥 前往八卦灵鼎炼丹
              </button>
            )}
            {npc.role === 'martial' && onOpenQuests && (
              <button
                onClick={() => {
                  onClose();
                  onOpenQuests();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 border border-amber-500/50 text-xs font-bold text-amber-200 transition"
              >
                📜 查看宗门悬赏榜
              </button>
            )}
          </div>

          <button
            onClick={nextLine}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1 transition shadow ml-auto"
          >
            <span>{hasMore ? '下文' : '领受法旨'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
