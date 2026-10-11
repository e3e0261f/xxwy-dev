import React, { useState } from 'react';
import { FileCode, Copy, Check, Terminal, Cpu } from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  desc: string;
  code: string;
}

const RUST_FILES: CodeFile[] = [
  {
    name: 'main.rs',
    path: 'rust_src/main.rs',
    desc: 'Bevy 0.19.1 ECS 核心应用组装与 WebGL2 视窗绑定',
    code: `//! # 青城 (Qk) 修仙大世界 - 核心引擎入口
pub mod config;
pub mod physics;
pub mod player;
pub mod map;
pub mod ui;

use bevy::prelude::*;
use config::{CAMERA_LERP_FACTOR, CAMERA_ORTHO_SCALE};
use physics::{Collider, PhysicsPlugin, YSortEntity};
use player::{Player, PlayerAnimationTimer, PlayerPlugin, PlayerStateMachine};
use map::QkMapPlugin;
use ui::QkUiPlugin;

fn main() {
    App::new()
        .add_plugins(
            DefaultPlugins
                .set(WindowPlugin {
                    primary_window: Some(Window {
                        title: "青城 (Qk) 修仙大世界".into(),
                        resolution: (1280.0, 720.0).into(),
                        canvas: Some("#bevy-canvas".into()),
                        fit_canvas_to_parent: true,
                        prevent_default_event_handling: true,
                        ..default()
                    }),
                    ..default()
                })
                .set(ImagePlugin::default_nearest()),
        )
        .add_plugins(config::ConfigPlugin)
        .add_plugins(PhysicsPlugin)
        .add_plugins(QkMapPlugin)
        .add_plugins(PlayerPlugin)
        .add_plugins(QkUiPlugin)
        .add_systems(Startup, setup_camera_and_player)
        .add_systems(Update, camera_follow_system)
        .run();
}`
  },
  {
    name: 'config.rs',
    path: 'rust_src/config.rs',
    desc: '参数控制中心（白皮书铁律：零硬编码集中管控）',
    code: `//! # config.rs - 青城 (Qk) 修仙大世界参数控制中心
pub const TILE_SIZE: f32 = 64.0;
pub const CHUNK_SIZE: i32 = 16;
pub const ACTIVE_CHUNK_RADIUS: i32 = 1; // 3x3 = 9 个区块恒定内存
pub const CAMERA_LERP_FACTOR: f32 = 0.08;
pub const PLAYER_BASE_SPEED: f32 = 190.0;
pub const DIAGONAL_SPEED_FACTOR: f32 = 0.70710678;
pub const MEDITATION_IDLE_THRESHOLD: f32 = 1.8; // 停步 1.8 秒自动入定
pub const QI_BREATH_PERIOD: f32 = 3.2; // 灵气脉动周期
pub const Y_SORT_FACTOR: f32 = 0.001; // 2.5D 脚底接地线深度因子
pub const Z_LAYER_GROUND: f32 = 0.0; // 4-ccdi
pub const Z_LAYER_ROAD: f32 = 1.0;   // 2-dclu
pub const Z_LAYER_OBJECT_BASE: f32 = 10.0;
pub const Z_LAYER_ROOF: f32 = 50.0;  // 1-jmvu 屋顶
pub const ROOF_FADE_ALPHA: f32 = 0.35; // 进屋后屋顶渐隐透明度`
  },
  {
    name: 'chunk.rs',
    path: 'rust_src/map/chunk.rs',
    desc: '16×16 瓦片无限流式区块调度与实时垃圾回收 (O(1) 恒定内存)',
    code: `//! # map/chunk.rs - 无限流式大世界区块系统
pub fn chunk_streaming_system(
    mut commands: Commands,
    mut chunk_mgr: ResMut<ChunkManager>,
    player_query: Query<&Transform, With<Player>>,
    chunk_root_query: Query<(Entity, &ChunkCoord), With<ChunkRoot>>,
) {
    let Ok(player_tf) = player_query.get_single() else { return };
    let current_chunk = ChunkCoord::from_world_pos(player_tf.translation.x, player_tf.translation.y);

    // 1. 计算视野内所需的 9 个九宫格区块
    let mut needed_chunks = HashSet::new();
    for dx in -ACTIVE_CHUNK_RADIUS..=ACTIVE_CHUNK_RADIUS {
        for dy in -ACTIVE_CHUNK_RADIUS..=ACTIVE_CHUNK_RADIUS {
            needed_chunks.insert(ChunkCoord::new(current_chunk.cx + dx, current_chunk.cy + dy));
        }
    }

    // 2. 垃圾回收：卸载所有超出视野的活跃区块 (Despawn)
    for (entity, coord) in chunk_root_query.iter() {
        if !needed_chunks.contains(coord) {
            commands.entity(entity).despawn_recursive();
            chunk_mgr.loaded_chunks.remove(coord);
        }
    }

    // 3. 增量生成：实例化新进入视野的区块
    for coord in needed_chunks.iter() {
        if !chunk_mgr.loaded_chunks.contains(coord) {
            spawn_single_chunk(&mut commands, *coord);
            chunk_mgr.loaded_chunks.insert(*coord);
        }
    }
}`
  },
  {
    name: 'physics/mod.rs',
    path: 'rust_src/physics/mod.rs',
    desc: 'Y-Sort 脚底接地线深度排序与建筑屋顶探测渐隐',
    code: `//! # physics/mod.rs - Y-Sort 与 RoofTriggerZone
pub fn y_sort_system(mut query: Query<(&mut Transform, &YSortEntity)>) {
    for (mut transform, y_sort) in query.iter_mut() {
        let foot_y = transform.translation.y + y_sort.foot_offset_y;
        transform.translation.z = Z_LAYER_OBJECT_BASE - foot_y * Y_SORT_FACTOR;
    }
}

pub fn roof_fade_system(
    time: Res<Time>,
    player_query: Query<&Transform, With<Player>>,
    mut trigger_query: Query<&RoofTriggerZone>,
    mut roof_query: Query<(Entity, &mut BuildingRoof, &mut Sprite)>,
) {
    // 玩家步入 RoofTriggerZone 探测区，屋顶平滑插值渐变至 35% 透明度
}`
  },
  {
    name: 'state.rs',
    path: 'rust_src/player/state.rs',
    desc: '行为驱动状态机：停步 1.8s 自动入定，御风八向行进',
    code: `//! # player/state.rs - 修士状态机
pub enum PlayerStateKind {
    Idle,       // 站定调息
    Walking,    // 行云步 (八向归一化移动)
    Meditating, // 气沉丹田 (浮现灵气呼吸光晕)
    Dashing,    // 疾风身法
}`
  }
];

export const RustCodeViewer: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const activeFile = RUST_FILES[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-amber-600/40 rounded-xl p-4 flex flex-col h-full text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-amber-300 text-sm">Rust 核心源码透视 (Bevy ECS 0.19)</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? '已复制' : '复制代码'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-thin">
        {RUST_FILES.map((f, idx) => (
          <button
            key={f.name}
            onClick={() => setSelectedIdx(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition border ${
              idx === selectedIdx
                ? 'bg-amber-950/70 border-amber-500/70 text-amber-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
        <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="font-mono text-sky-300">{activeFile.path}</span>
        <span className="text-slate-500">—</span>
        <span>{activeFile.desc}</span>
      </div>

      {/* Code window */}
      <div className="flex-1 overflow-auto bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
        <pre className="whitespace-pre">{activeFile.code}</pre>
      </div>
    </div>
  );
};
