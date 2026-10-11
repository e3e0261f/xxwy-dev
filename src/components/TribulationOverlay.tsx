import React, { useState, useEffect } from 'react';
import { RealmInfo } from '../types/game';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Zap, Shield, Heart, Award } from 'lucide-react';

interface Props {
  currentRealmName: string;
  nextRealm: RealmInfo;
  playerHp: number;
  playerDef: number;
  onSuccess: () => void;
  onFailed: (damageTaken: number) => void;
}

export const TribulationOverlay: React.FC<Props> = ({
  currentRealmName,
  nextRealm,
  playerHp,
  playerDef,
  onSuccess,
  onFailed,
}) => {
  const [strikeIndex, setStrikeIndex] = useState(0);
  const [hp, setHp] = useState(playerHp);
  const [shieldActive, setShieldActive] = useState(false);
  const [flashScreen, setFlashScreen] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const totalStrikes = nextRealm.tribulationStrikes || 3;

  useEffect(() => {
    let currentStrike = 0;
    let currentRemainingHp = playerHp;

    const interval = setInterval(() => {
      if (currentStrike >= totalStrikes) {
        clearInterval(interval);
        setIsDone(true);
        soundManager.playBreakthroughSuccess();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#fbbf24', '#38bdf8', '#c084fc'],
        });
        setTimeout(() => {
          onSuccess();
        }, 1800);
        return;
      }

      currentStrike++;
      setStrikeIndex(currentStrike);

      // Thunder strike!
      soundManager.playThunder();
      setFlashScreen(true);
      setTimeout(() => setFlashScreen(false), 200);

      // Calculate damage
      const rawDamage = nextRealm.strikeDamage * (1 + currentStrike * 0.15);
      const reducedDamage = Math.max(15, Math.floor(rawDamage - playerDef * 0.4));
      const actualDamage = shieldActive ? Math.floor(reducedDamage * 0.4) : reducedDamage;

      currentRemainingHp -= actualDamage;
      setHp(Math.max(0, currentRemainingHp));

      if (currentRemainingHp <= 0) {
        clearInterval(interval);
        setHasFailed(true);
        setTimeout(() => {
          onFailed(playerHp - currentRemainingHp);
        }, 2000);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const activateShield = () => {
    if (shieldActive) return;
    setShieldActive(true);
    soundManager.playShield();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-150 ${
        flashScreen
          ? 'bg-amber-100/90'
          : 'bg-slate-950/90 backdrop-blur-md'
      }`}
    >
      <div className="relative w-full max-w-xl bg-slate-900/90 border-2 border-amber-500/70 rounded-2xl shadow-2xl p-6 text-center text-slate-100 overflow-hidden">
        {/* Sky lightning animation overlay */}
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold mb-4">
          <Zap className="w-4 h-4 animate-bounce" />
          九天雷劫 · 天道问心
        </div>

        <h2 className="text-3xl font-extrabold text-amber-300 font-serif mb-2 tracking-wide">
          {currentRealmName} ➔ {nextRealm.name}
        </h2>
        <p className="text-xs text-slate-300 mb-6">
          九霄神雷降临，请凝神聚气！可祭起【护身灵盾】抵消天道雷威！
        </p>

        {/* Strikes progress */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: totalStrikes }).map((_, idx) => (
            <div
              key={idx}
              className={`w-9 h-9 rounded-lg flex items-center justify-center border font-bold text-sm transition-all ${
                idx < strikeIndex
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/50 scale-105'
                  : idx === strikeIndex
                  ? 'bg-amber-950 border-amber-400 text-amber-300 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>
          ))}
        </div>

        <div className="text-sm font-semibold text-amber-400 mb-4">
          当前承受雷劫：第 {strikeIndex} / {totalStrikes} 道
        </div>

        {/* Current HP during tribulation */}
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-700 mb-6">
          <div className="flex justify-between text-xs mb-1 font-semibold">
            <span className="text-rose-400 flex items-center gap-1">
              <Heart className="w-4 h-4" /> 气血真元
            </span>
            <span className="text-slate-300">{hp} / {playerHp}</span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-rose-900/60 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, (hp / playerHp) * 100)}%` }}
            />
          </div>
        </div>

        {/* Defensive action */}
        {!isDone && !hasFailed && (
          <div className="flex justify-center">
            <button
              onClick={activateShield}
              disabled={shieldActive}
              className={`py-3 px-6 rounded-xl font-bold text-sm flex items-center gap-2 border transition shadow-lg ${
                !shieldActive
                  ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-300 shadow-sky-600/30 cursor-pointer animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
              }`}
            >
              <Shield className="w-5 h-5 text-sky-200" />
              {shieldActive ? '护身真罡已开启 (抵御60%伤害)' : '祭起【太虚护体盾】'}
            </button>
          </div>
        )}

        {isDone && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/60 text-amber-300 font-bold text-lg animate-bounce flex items-center justify-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            劫散云收！脱胎换骨，成功晋阶 {nextRealm.name}！
          </div>
        )}

        {hasFailed && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/60 text-rose-300 font-bold text-base">
            雷威过甚，经脉受损！此番渡劫暂告失利，退回静养...
          </div>
        )}
      </div>
    </div>
  );
};
