import React from 'react';
import { Spell } from '../types/game';

interface Props {
  spells: Spell[];
  currentQi: number;
}

export const BottomSpellBar: React.FC<Props> = ({ spells, currentQi }) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-2 rounded-2xl border border-amber-600/40 shadow-2xl">
      {spells.map((spell, idx) => {
        const canCast = currentQi >= spell.costQi;

        return (
          <div
            key={spell.id}
            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl border transition ${
              canCast
                ? 'bg-slate-900/90 border-slate-700/80 hover:border-amber-400'
                : 'bg-slate-950/60 border-slate-800 opacity-50'
            }`}
          >
            {/* Key badge */}
            <span className="absolute -top-2 -left-1 px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[10px] font-mono font-bold shadow">
              {spell.keyLabel}
            </span>

            <span className="text-xl">{spell.icon}</span>

            <div className="text-left">
              <div className="text-xs font-bold text-slate-200">{spell.name}</div>
              <div className="text-[10px] text-sky-400 font-mono">耗蓝: {spell.costQi} 灵力</div>
            </div>
          </div>
        );
      })}

      <div className="px-2 text-[11px] text-slate-400 font-serif border-l border-slate-800 hidden lg:block">
        [WASD] 挪移 · [F] 交互 · 停步 1.8s 自动入定
      </div>
    </div>
  );
};
