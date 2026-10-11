//! # map/mod.rs - 大世界地图模块插件统一导出

pub mod chunk;
pub mod nature;
pub mod qk;

use bevy::prelude::*;
use chunk::{chunk_streaming_system, ChunkManager};

pub struct QkMapPlugin;

impl Plugin for QkMapPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<ChunkManager>()
            .add_systems(Startup, setup_initial_qk_world)
            .add_systems(Update, chunk_streaming_system);
    }
}

/// 开天辟地：初始化青城核心道观与第一批地脉
fn setup_initial_qk_world(mut commands: Commands) {
    qk::spawn_qk_dao_temple(&mut commands, Vec2::new(0.0, 100.0));
}
