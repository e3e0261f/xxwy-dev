//! # map/chunk.rs - 无限流式大世界区块系统 (Chunking System)
//!
//! ## 设计哲学 (白皮书第 3.2 节)
//! 1. **内存恒定**：世界切分为 16 × 16 瓦片的区块 (Chunk)，仅渲染视野内的 9 个区块 (3x3 九宫格)。
//! 2. **实时垃圾回收**：离开视野的区块，自动执行 despawn_recursive() 清理显存与实体，
//!    彻底消灭内存泄漏，确保在大世界无缝漫游数小时乃至数天仍保持极致流畅。

use bevy::prelude::*;
use std::collections::HashSet;
use crate::config::{ACTIVE_CHUNK_RADIUS, CHUNK_SIZE, TILE_SIZE};

/// 区块网格坐标组件 (以 Chunk 为单位，例如 (0, 0), (1, -1))
#[derive(Component, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ChunkCoord {
    pub cx: i32,
    pub cy: i32,
}

impl ChunkCoord {
    pub fn new(cx: i32, cy: i32) -> Self {
        Self { cx, cy }
    }

    /// 由世界物理坐标计算所属的 Chunk 网格坐标
    pub fn from_world_pos(world_x: f32, world_y: f32) -> Self {
        let chunk_pixel_span = CHUNK_SIZE as f32 * TILE_SIZE;
        let cx = (world_x / chunk_pixel_span).floor() as i32;
        let cy = (world_y / chunk_pixel_span).floor() as i32;
        Self { cx, cy }
    }
}

/// 区块根实体标记，所有属于该区块的瓦片与物件皆作为其子实体挂载
#[derive(Component, Debug, Clone)]
pub struct ChunkRoot;

/// 全局流式区块调度资源管理器
#[derive(Resource, Debug, Default)]
pub struct ChunkManager {
    /// 当前已加载并处于活跃状态的区块集合
    pub loaded_chunks: HashSet<ChunkCoord>,
    /// 上一帧玩家所在的区块，用于减少不必要的九宫格比对开销
    pub last_player_chunk: Option<ChunkCoord>,
}

/// 流式区块更新系统
/// 监听玩家位移，当玩家跨越区块边界时触发增量生成与过期卸载
pub fn chunk_streaming_system(
    mut commands: Commands,
    mut chunk_mgr: ResMut<ChunkManager>,
    player_query: Query<&Transform, With<crate::player::Player>>,
    chunk_root_query: Query<(Entity, &ChunkCoord), With<ChunkRoot>>,
) {
    let Ok(player_tf) = player_query.get_single() else { return };
    let current_chunk = ChunkCoord::from_world_pos(player_tf.translation.x, player_tf.translation.y);

    // 如果玩家仍停留在原区块，则无需重复调度
    if let Some(last) = chunk_mgr.last_player_chunk {
        if last == current_chunk {
            return;
        }
    }
    chunk_mgr.last_player_chunk = Some(current_chunk);

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
}

/// 单个 16x16 区块的实例化工厂函数
fn spawn_single_chunk(commands: &mut Commands, coord: ChunkCoord) {
    let chunk_pixel_span = CHUNK_SIZE as f32 * TILE_SIZE;
    let base_x = coord.cx as f32 * chunk_pixel_span;
    let base_y = coord.cy as f32 * chunk_pixel_span;

    commands
        .spawn((
            SpatialBundle {
                transform: Transform::from_xyz(base_x, base_y, 0.0),
                ..default()
            },
            ChunkRoot,
            coord,
        ))
        .with_children(|parent| {
            // 在此调用自然与青城预制件生成函数，将 16x16 瓦片绑定为其子节点
            crate::map::nature::generate_chunk_nature(parent, coord);
        });
}
