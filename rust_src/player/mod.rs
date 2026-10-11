//! # player/mod.rs - 角色模块统一导出与插件注册

pub mod state;
pub mod movement;
pub mod animation;

use bevy::prelude::*;
pub use movement::Player;
pub use state::PlayerStateMachine;

pub struct PlayerPlugin;

impl Plugin for PlayerPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(
            Update,
            (
                movement::player_movement_system,
                animation::player_animation_system,
            ),
        );
    }
}
