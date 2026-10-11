import React, { useState, useEffect } from 'react';
import { Item } from '../types/game';
import { ALCHEMY_RECIPES, AlchemyRecipe, INITIAL_ITEMS } from '../data/constants';
import { soundManager } from '../utils/audio';
import { Flame, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  inventory: Record<string, Item>;
  onClose: () => void;
  onCraftPill: (targetItemId: string, count: number, consumedHerbs: { itemId: string; count: number }[]) => void;
}

export const AlchemyModal: React.FC<Props> = ({
  inventory,
  onClose,
  onCraftPill,
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<AlchemyRecipe>(ALCHEMY_RECIPES[0]);
  const [heat, setHeat] = useState<number>(50);
  const [isBrewing, setIsBrewing] = useState<boolean>(false);
  const [brewProgress, setBrewProgress] = useState<number>(0);
  const [brewMessage, setBrewMessage] = useState<string>('');

  const canCraft = selectedRecipe.requiredHerbs.every(
    (req) => (inventory[req.itemId]?.count || 0) >= req.count
  );

  // Heat stability simulation when brewing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBrewing) {
      interval = setInterval(() => {
        setBrewProgress((prev) => {
          if (prev >= 100) {
            // Finished!
            finishBrew();
            return 100;
          }
          return prev + 5;
        });

        // Heat fluctuates slightly
        setHeat((h) => {
          const delta = (Math.random() - 0.5) * 6;
          return Math.max(10, Math.min(95, h + delta));
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isBrewing, selectedRecipe, heat]);

  const startBrew = () => {
    if (!canCraft || isBrewing) return;
    setIsBrewing(true);
    setBrewProgress(0);
    setHeat(selectedRecipe.optimalHeat - 15);
    setBrewMessage('灵火初燃，药材融化为灵液...');
    soundManager.playPillCraft();
  };

  const finishBrew = () => {
    setIsBrewing(false);
    const diff = Math.abs(heat - selectedRecipe.optimalHeat);
    let successCount = 1;
    let msg = '';

    if (diff < 15) {
      successCount = 2;
      msg = '【上上品】火候掌握至臻化境！丹成二枚，药香扑鼻！';
      confetti({ particleCount: 50, spread: 60 });
    } else if (diff < 30) {
      successCount = 1;
      msg = '【中品】丹药凝结成功！晶莹剔透，纯度极高。';
    } else {
      successCount = 1;
      msg = '【下品】火候微有偏差，勉强成丹一枚。';
    }

    setBrewMessage(msg);
    soundManager.playBreakthroughSuccess();
    onCraftPill(selectedRecipe.targetItemId, successCount, selectedRecipe.requiredHerbs);
  };

  const adjustHeat = (delta: number) => {
    if (!isBrewing) return;
    setHeat((h) => Math.max(10, Math.min(95, h + delta)));
    soundManager.playSwordSlash();
  };

  const targetItem = INITIAL_ITEMS[selectedRecipe.targetItemId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-600/60 rounded-xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-wide text-amber-300 font-serif">药阁丹房 · 八卦灵鼎</h2>
              <p className="text-xs text-slate-400">采天地灵萃，控三昧真火，炼无上神丹</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Recipe Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {ALCHEMY_RECIPES.map((rec) => {
            const isSelected = rec.id === selectedRecipe.id;
            return (
              <button
                key={rec.id}
                onClick={() => {
                  if (!isBrewing) {
                    setSelectedRecipe(rec);
                    setBrewMessage('');
                  }
                }}
                disabled={isBrewing}
                className={`p-3 rounded-lg border text-left transition ${
                  isSelected
                    ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-md'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {rec.name}
                </div>
                <div className="text-xs text-slate-400 mt-1">难度: {rec.difficulty}</div>
              </button>
            );
          })}
        </div>

        {/* Recipe Details & Required Herbs */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="text-base font-bold text-amber-300">{selectedRecipe.name}</h3>
              <p className="text-xs text-slate-300 mt-1">{selectedRecipe.desc}</p>
            </div>
            {targetItem && (
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-amber-500/30">
                <span className="text-2xl">{targetItem.iconEmoji}</span>
                <div className="text-right">
                  <div className="text-xs text-slate-400">产出</div>
                  <div className="text-xs font-bold text-amber-300">{targetItem.name}</div>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-400 mb-2">所需灵草与材料：</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {selectedRecipe.requiredHerbs.map((req) => {
              const currentCount = inventory[req.itemId]?.count || 0;
              const hasEnough = currentCount >= req.count;
              const itemDef = INITIAL_ITEMS[req.itemId];
              return (
                <div
                  key={req.itemId}
                  className={`flex items-center justify-between p-2 rounded border text-xs ${
                    hasEnough
                      ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{itemDef?.iconEmoji || '🌱'}</span>
                    <span>{itemDef?.name || req.itemId}</span>
                  </span>
                  <span className="font-bold">
                    {currentCount} / {req.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cauldron Interactive Area */}
        <div className="bg-slate-950 border border-orange-900/50 rounded-lg p-5 mb-4 text-center relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">
            丹鼎火候控制 (最佳温区：{selectedRecipe.optimalHeat - 10}° ~ {selectedRecipe.optimalHeat + 10}°)
          </div>

          {/* Temperature Gauge */}
          <div className="relative w-full h-6 bg-slate-900 rounded-full overflow-hidden border border-slate-700 my-2">
            {/* Target zone */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-400"
              style={{
                left: `${selectedRecipe.optimalHeat - 10}%`,
                width: '20%',
              }}
            />
            {/* Current temperature bar */}
            <div
              className={`h-full transition-all duration-150 ${
                Math.abs(heat - selectedRecipe.optimalHeat) < 15
                  ? 'bg-gradient-to-r from-orange-500 to-emerald-400'
                  : 'bg-gradient-to-r from-blue-500 via-orange-500 to-rose-600'
              }`}
              style={{ width: `${heat}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
              style={{ left: `${heat}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 px-1">
            <span>❄️ 极寒 (10°)</span>
            <span className="text-amber-400 font-bold">当前温度：{Math.floor(heat)}°</span>
            <span>🔥 炽焰 (95°)</span>
          </div>

          {/* Progress bar during brewing */}
          {isBrewing && (
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs text-amber-300">
                <span>凝丹进度</span>
                <span>{brewProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-150"
                  style={{ width: `${brewProgress}%` }}
                />
              </div>

              {/* Fire Controls */}
              <div className="flex justify-center gap-3 pt-3">
                <button
                  onClick={() => adjustHeat(-8)}
                  className="py-1.5 px-4 rounded bg-sky-900/60 hover:bg-sky-800 border border-sky-600/50 text-xs font-bold text-sky-200"
                >
                  🌬️ 文火降温 (-8°)
                </button>
                <button
                  onClick={() => adjustHeat(8)}
                  className="py-1.5 px-4 rounded bg-orange-900/60 hover:bg-orange-800 border border-orange-600/50 text-xs font-bold text-orange-200"
                >
                  🔥 烈焰升温 (+8°)
                </button>
              </div>
            </div>
          )}

          {brewMessage && (
            <div className="mt-3 p-2 rounded bg-amber-950/40 border border-amber-600/40 text-xs text-amber-300 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{brewMessage}</span>
            </div>
          )}
        </div>

        {/* Start Button */}
        <div>
          {!isBrewing ? (
            <button
              onClick={startBrew}
              disabled={!canCraft}
              className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition border ${
                canCraft
                  ? 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 border-orange-300 shadow-lg shadow-orange-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              <Flame className="w-5 h-5" />
              {canCraft ? '点燃灵鼎 · 开炉炼丹' : '药材不足，无法起炉'}
            </button>
          ) : (
            <div className="text-center text-xs text-amber-300 animate-pulse font-serif py-2">
              灵液翻滚汇聚，请通过上方按键调节火候至绿色区域！
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
