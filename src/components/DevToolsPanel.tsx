import React from 'react';
import { MapZone, PlayerStats } from '../types/game';
import { Wrench, Eye, Zap, Shield, Compass, Navigation, RefreshCw, Cpu } from 'lucide-react';

interface Props {
  stats: PlayerStats;
  currentZone: MapZone;
  playerPos: { x: number; y: number };
  showColliders: boolean;
  showYSortLines: boolean;
  showChunkGrid: boolean;
  onToggleColliders: () => void;
  onToggleYSortLines: () => void;
  onToggleChunkGrid: () => void;
  onTeleport: (zone: MapZone) => void;
  onAddQi: (amount: number) => void;
  onAddStones: (amount: number) => void;
  onResetHp: () => void;
  onOpenRustCode: () => void;
}

export const DevToolsPanel: React.FC<Props> = ({
  stats,
  currentZone,
  playerPos,
  showColliders,
  showYSortLines,
  showChunkGrid,
  onToggleColliders,
  onToggleYSortLines,
  onToggleChunkGrid,
  onTeleport,
  onAddQi,
  onAddStones,
  onResetHp,
  onOpenRustCode,
}) => {
  // Current 16x16 chunk coords (1024px per chunk)
  const chunkSpan = 16 * 64;
  const cx = Math.floor(playerPos.x / chunkSpan);
  const cy = Math.floor(playerPos.y / chunkSpan);

  return (
    <div className="bg-slate-900/95 border-2 border-amber-600/60 rounded-xl p-4 text-slate-100 shadow-2xl backdrop-blur-md max-w-sm w-full">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm text-amber-300">Rust ECS 引擎测试工具箱</h3>
        </div>
        <button
          onClick={onOpenRustCode}
          className="flex items-center gap-1 px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-500/50 text-[11px] font-semibold text-amber-300 transition"
        >
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          查看 Rust 源码
        </button>
      </div>

      {/* Real-time ECS Inspector */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono mb-3 space-y-1 text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-500">World Pos:</span>
          <span className="text-amber-400">X:{Math.floor(playerPos.x)} Y:{Math.floor(playerPos.y)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Active ChunkCoord:</span>
          <span className="text-sky-400 font-bold">({cx}, {cy}) [16x16 瓦片]</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Streaming Window:</span>
          <span className="text-emerald-400 font-bold">9 Chunks 恒定 (3x3)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Y-Sort Footline:</span>
          <span className="text-purple-400">z = 10 - y * 0.001</span>
        </div>
      </div>

      {/* Visualizer Toggles */}
      <div className="space-y-2 mb-3">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          调试渲染开关
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={onToggleColliders}
            className={`py-1.5 px-2 rounded text-xs font-medium border text-center transition ${
              showColliders
                ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            碰撞体红框
          </button>
          <button
            onClick={onToggleYSortLines}
            className={`py-1.5 px-2 rounded text-xs font-medium border text-center transition ${
              showYSortLines
                ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Y-Sort接地线
          </button>
          <button
            onClick={onToggleChunkGrid}
            className={`py-1.5 px-2 rounded text-xs font-medium border text-center transition ${
              showChunkGrid
                ? 'bg-sky-950/80 border-sky-500 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            九宫格网格
          </button>
        </div>
      </div>

      {/* Quick Fast-Travel / Teleport */}
      <div className="space-y-1.5 mb-3">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          大世界瞬息传送
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onTeleport('SECT')}
            className={`py-1.5 px-2 rounded text-xs font-medium border text-left transition ${
              currentZone === 'SECT'
                ? 'bg-amber-950 border-amber-500 text-amber-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            🏯 灵云宗道场
          </button>
          <button
            onClick={() => onTeleport('BAMBOO_FOREST')}
            className={`py-1.5 px-2 rounded text-xs font-medium border text-left transition ${
              currentZone === 'BAMBOO_FOREST'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            🎋 迷雾竹林
          </button>
          <button
            onClick={() => onTeleport('DEMON_CAVE')}
            className={`py-1.5 px-2 rounded text-xs font-medium border text-left transition ${
              currentZone === 'DEMON_CAVE'
                ? 'bg-rose-950 border-rose-500 text-rose-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            🦇 万妖窟
          </button>
          <button
            onClick={() => onTeleport('TRIBULATION_PLATFORM')}
            className={`py-1.5 px-2 rounded text-xs font-medium border text-left transition ${
              currentZone === 'TRIBULATION_PLATFORM'
                ? 'bg-purple-950 border-purple-500 text-purple-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            ⚡ 问天仙台
          </button>
        </div>
      </div>

      {/* Quick Test Injections */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800 text-xs">
        <button
          onClick={() => onAddQi(500)}
          className="py-1 px-2 rounded bg-sky-900/60 hover:bg-sky-800 border border-sky-600/50 text-sky-200 text-center font-semibold"
        >
          +500 灵气
        </button>
        <button
          onClick={() => onAddStones(300)}
          className="py-1 px-2 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-200 text-center font-semibold"
        >
          +300 灵石
        </button>
        <button
          onClick={onResetHp}
          className="py-1 px-2 rounded bg-rose-900/60 hover:bg-rose-800 border border-rose-600/50 text-rose-200 text-center font-semibold"
        >
          气血回满
        </button>
      </div>
    </div>
  );
};
