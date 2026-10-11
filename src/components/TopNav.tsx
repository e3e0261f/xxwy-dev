import React from 'react';
import { PlayerStats } from '../types/game';
import { REALMS } from '../data/constants';
import {
  Sparkles,
  Heart,
  Zap,
  Briefcase,
  Flame,
  Scroll,
  Wrench,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface Props {
  stats: PlayerStats;
  zoneName: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenCultivation: () => void;
  onOpenInventory: () => void;
  onOpenAlchemy: () => void;
  onOpenQuests: () => void;
  onToggleDevTools: () => void;
  showDevTools: boolean;
}

export const TopNav: React.FC<Props> = ({
  stats,
  zoneName,
  soundEnabled,
  onToggleSound,
  onOpenCultivation,
  onOpenInventory,
  onOpenAlchemy,
  onOpenQuests,
  onToggleDevTools,
  showDevTools,
}) => {
  const currentRealm = REALMS[stats.realmIndex] || REALMS[0];

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent">
      {/* Left: Player Realm & Status Bars */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Realm Badge */}
        <button
          onClick={onOpenCultivation}
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-850 border border-amber-500/50 rounded-xl px-3 py-1.5 shadow-lg transition group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
            <Sparkles className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </div>
          <div className="text-left">
            <div className="text-[11px] text-amber-400/90 font-medium">
              {stats.name} · {currentRealm.title}
            </div>
            <div className="text-sm font-bold text-amber-200 font-serif leading-none">
              {currentRealm.name}
            </div>
          </div>
        </button>

        {/* HP & Qi Status Bars */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-lg space-y-1 min-w-[140px] sm:min-w-[170px]">
          {/* HP */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-rose-950">
              <div
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, (stats.currentHp / stats.maxHp) * 100))}%` }}
              />
            </div>
            <span className="font-mono text-slate-300 text-[10px]">
              {Math.floor(stats.currentHp)}/{stats.maxHp}
            </span>
          </div>

          {/* Qi */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-sky-950">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-amber-300 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, (stats.currentQi / stats.maxQi) * 100))}%` }}
              />
            </div>
            <span className="font-mono text-slate-300 text-[10px]">
              {Math.floor(stats.currentQi)}/{stats.maxQi}
            </span>
          </div>
        </div>
      </div>

      {/* Center Zone Title */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 px-4 py-1.5 rounded-full border border-amber-600/30 text-xs font-serif text-amber-300 shadow">
        <span>📍 当前地脉：</span>
        <span className="font-bold text-amber-200">{zoneName}</span>
      </div>

      {/* Right: Quick Action Buttons & Modals */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Spirit Stones */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/40 rounded-xl px-3 py-1.5 shadow text-xs">
          <span className="text-base">💎</span>
          <span className="font-bold text-emerald-300 font-mono">{stats.spiritStones}</span>
          <span className="text-[10px] text-slate-400">下品灵石</span>
        </div>

        {/* Buttons */}
        <button
          onClick={onOpenInventory}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-amber-200 transition shadow"
          title="储物袋 (背包与装备)"
        >
          <Briefcase className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenAlchemy}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-orange-300 transition shadow"
          title="八卦灵鼎 (炼丹)"
        >
          <Flame className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenQuests}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-amber-300 transition shadow"
          title="宗门悬赏榜"
        >
          <Scroll className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleDevTools}
          className={`p-2 rounded-xl border transition shadow ${
            showDevTools
              ? 'bg-amber-500 text-slate-950 border-amber-300'
              : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-sky-300'
          }`}
          title="ECS 架构调试工具箱"
        >
          <Wrench className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleSound}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 transition shadow"
          title={soundEnabled ? '静音' : '开启音效'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
      </div>
    </header>
  );
};
