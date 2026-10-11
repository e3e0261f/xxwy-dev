//! # player/animation.rs - 角色序列帧动画调度器
//!
//! ## 设计哲学
//! 根据 PlayerStateMachine 的状态 (Idle / Walking / Meditating) 以及 FacingDirection
//! 动态计算并更新 SpriteSheet 的 AtlasIndex，保证动作行云流水。

use bevy::prelude::*;
use crate::player::state::{FacingDirection, PlayerStateKind, PlayerStateMachine};

/// 角色动画定时器组件
#[derive(Component, Debug, Clone)]
pub struct PlayerAnimationTimer {
    pub timer: Timer,
    pub current_frame: usize,
    pub total_frames: usize,
}

impl Default for PlayerAnimationTimer {
    fn default() -> Self {
        Self {
            timer: Timer::from_seconds(0.12, TimerMode::Repeating),
            current_frame: 0,
            total_frames: 7,
        }
    }
}

/// 动画推进与朝向帧裁决系统
pub fn player_animation_system(
    time: Res<Time>,
    mut query: Query<(&mut Sprite, &mut PlayerAnimationTimer, &PlayerStateMachine)>,
) {
    let dt = time.delta();
    for (mut sprite, mut anim, state_machine) in query.iter_mut() {
        anim.timer.tick(dt);

        if anim.timer.just_finished() {
            match state_machine.current_state {
                PlayerStateKind::Walking => {
                    anim.current_frame = (anim.current_frame + 1) % anim.total_frames;
                }
                PlayerStateKind::Idle | PlayerStateKind::Meditating => {
                    // 站定或入定时放缓呼吸帧
                    anim.current_frame = (anim.current_frame + 1) % 4;
                }
                PlayerStateKind::Dashing => {
                    anim.current_frame = 2;
                }
            }
        }

        // 翻转朝向 (左右行进水平镜像)
        match state_machine.facing {
            FacingDirection::West | FacingDirection::NorthWest | FacingDirection::SouthWest => {
                sprite.flip_x = true;
            }
            FacingDirection::East | FacingDirection::NorthEast | FacingDirection::SouthEast => {
                sprite.flip_x = false;
            }
            _ => {}
        }
    }
}
