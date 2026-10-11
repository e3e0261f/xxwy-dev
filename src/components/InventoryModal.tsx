import React from 'react';
import { Item, PlayerStats } from '../types/game';
import { soundManager } from '../utils/audio';
import { Briefcase, X, Swords, Shield, Sparkles } from 'lucide-react';

interface Props {
  inventory: Record<string, Item>;
  stats: PlayerStats;
  onClose: () => void;
  onUseItem: (item: Item) => void;
  onEquipItem: (item: Item) => void;
}

export const InventoryModal: React.FC<Props> = ({
  inventory,
  stats,
  onClose,
  onUseItem,
  onEquipItem,
}) => {
  const itemList = Object.values(inventory).filter((i) => i.count > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-600/60 rounded-xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-wide text-amber-300 font-serif">乾坤储物袋 · 法宝纳戒</h2>
              <p className="text-xs text-slate-400">须弥纳芥子，藏聚天地造化灵珍</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Equipped Gear Display */}
        <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
          <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded border border-amber-600/30">
            <span className="text-2xl">🗡️</span>
            <div>
              <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <Swords className="w-3 h-3" /> 本命飞剑
              </div>
              <div className="text-xs font-bold text-white">
                {stats.equippedWeapon ? stats.equippedWeapon.name : '无 (空手)'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded border border-sky-600/30">
            <span className="text-2xl">🥋</span>
            <div>
              <div className="text-[11px] text-sky-400 font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" /> 护身道袍
              </div>
              <div className="text-xs font-bold text-white">
                {stats.equippedArmor ? stats.equippedArmor.name : '青云道袍'}
              </div>
            </div>
          </div>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {itemList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              储物袋中空空如也，快去竹林采药或击败妖兽吧！
            </div>
          ) : (
            itemList.map((item) => {
              const isEquipped =
                stats.equippedWeapon?.id === item.id || stats.equippedArmor?.id === item.id;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/70 hover:border-amber-500/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                      {item.iconEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{item.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          x{item.count}
                        </span>
                        {isEquipped && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            已装备
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {item.type === 'pill' && (
                      <button
                        onClick={() => {
                          soundManager.playHeal();
                          onUseItem(item);
                        }}
                        className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white transition"
                      >
                        服用
                      </button>
                    )}
                    {(item.type === 'weapon' || item.type === 'armor') && (
                      <button
                        onClick={() => {
                          soundManager.playSwordSlash();
                          onEquipItem(item);
                        }}
                        disabled={isEquipped}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition ${
                          isEquipped
                            ? 'bg-slate-700 text-slate-400 cursor-default'
                            : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold'
                        }`}
                      >
                        {isEquipped ? '佩戴中' : '装备'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
