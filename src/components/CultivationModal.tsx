import React, { useState } from 'react';
import { PlayerStats } from '../types/game';
import { REALMS } from '../data/constants';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Shield, Sparkles, Zap, Flame, Award, Heart, Swords, X } from 'lucide-react';

interface Props {
  stats: PlayerStats;
  onClose: () => void;
  onMeditate: (amount: number) => void;
  onBreakthrough: () => void;
  onStartTribulation: () => void;
}

export const CultivationModal: React.FC<Props> = ({
  stats,
  onClose,
  onMeditate,
  onBreakthrough,
  onStartTribulation,
}) => {
  const [isMeditating, setIsMeditating] = useState(false);
  const currentRealm = REALMS[stats.realmIndex] || REALMS[0];
  const nextRealm = REALMS[stats.realmIndex + 1] || null;
  const isQiFull = stats.currentQi >= stats.maxQi;

  const handleMeditateClick = () => {
    setIsMeditating(true);
    soundManager.playHeal();
    let count = 0;
    const interval = setInterval(() => {
      count++;
      onMeditate(15);
      if (count >= 5) {
        clearInterval(interval);
        setIsMeditating(false);
      }
    }, 200);
  };

  const handleBreakthroughClick = () => {
    if (!isQiFull) return;

    if (nextRealm && nextRealm.tribulationStrikes > 0) {
      // Needs Heavenly Tribulation!
      onStartTribulation();
      onClose();
    } else {
      // Normal direct breakthrough
      soundManager.playBreakthroughSuccess();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#a855f7'],
      });
      onBreakthrough();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-600/60 rounded-xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/40 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-wide text-amber-300 font-serif">修真问道 · 乾坤内府</h2>
              <p className="text-xs text-slate-400">凝神内视，炼气化神，参悟天地长生大道</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Realm & Progress */}
        <div className="bg-slate-800/60 border border-amber-500/30 rounded-lg p-5 mb-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-400/80">当前修真境界</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-amber-300 font-serif tracking-wide">
                  {currentRealm.name}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentRealm.title}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">灵根资质</span>
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1 mt-1 justify-end">
                <Flame className="w-4 h-4 text-emerald-400" />
                {stats.spiritualRoot}
              </div>
            </div>
          </div>

          {/* Qi Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-sky-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> 丹田真元灵力
              </span>
              <span className="text-slate-300">
                {Math.floor(stats.currentQi)} / {stats.maxQi} (
                {Math.min(100, Math.floor((stats.currentQi / stats.maxQi) * 100))}%)
              </span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-sky-900/60 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (stats.currentQi / stats.maxQi) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs mb-1">
              <Heart className="w-4 h-4" /> 气血上限
            </div>
            <div className="text-lg font-bold text-white">{stats.maxHp}</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs mb-1">
              <Swords className="w-4 h-4" /> 功力道行
            </div>
            <div className="text-lg font-bold text-white">{stats.baseAtk}</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-400 text-xs mb-1">
              <Shield className="w-4 h-4" /> 护体真罡
            </div>
            <div className="text-lg font-bold text-white">{stats.baseDef}</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs mb-1">
              <Award className="w-4 h-4" /> 灵石财富
            </div>
            <div className="text-lg font-bold text-emerald-300">{stats.spiritStones}</div>
          </div>
        </div>

        {/* Breakthrough Preview */}
        {nextRealm && (
          <div className="bg-amber-950/20 border border-amber-600/40 rounded-lg p-4 mb-5 text-sm">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
              <Award className="w-4 h-4" />
              下一境界：{nextRealm.name} ({nextRealm.title})
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <p>• 破境属性加成：气血 +{nextRealm.bonusHp}，功力 +{nextRealm.bonusAtk}，防御 +{nextRealm.bonusDef}</p>
              {nextRealm.tribulationStrikes > 0 ? (
                <p className="text-amber-300 font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  大境界天道阻隔：需承受 {nextRealm.tribulationStrikes} 道九天神雷劫（每道雷劫约造成 {nextRealm.strikeDamage} 伤害）！
                </p>
              ) : (
                <p className="text-emerald-400">• 平顺突破：当前处于小阶突破，无需承受天道雷劫。</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleMeditateClick}
            disabled={isMeditating}
            className="flex-1 py-3 px-4 rounded-lg bg-sky-900/60 hover:bg-sky-800 border border-sky-500/40 font-bold text-sky-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Sparkles className={`w-5 h-5 ${isMeditating ? 'animate-spin' : ''}`} />
            {isMeditating ? '气沉丹田·运功中...' : '静坐吐纳 (吸纳天地灵气)'}
          </button>

          <button
            onClick={handleBreakthroughClick}
            disabled={!isQiFull}
            className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition border ${
              isQiFull
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/20 cursor-pointer animate-pulse'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            <Zap className="w-5 h-5" />
            {isQiFull
              ? nextRealm && nextRealm.tribulationStrikes > 0
                ? '引动雷劫 · 渡劫破关！'
                : '真元圆满 · 突破境界！'
              : `灵气尚未盈满 (差 ${Math.max(0, stats.maxQi - Math.floor(stats.currentQi))})`}
          </button>
        </div>
      </div>
    </div>
  );
};
