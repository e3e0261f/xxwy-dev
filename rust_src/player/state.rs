//! # player/state.rs - 修士状态机系统
//!
//! ## 设计哲学
//! 践行白皮书“去文字化、行为驱动”核心设计哲学：
//! - 当玩家停步超过 MEDITATION_IDLE_THRESHOLD 时，修士本能引气入体，自动进入 Meditating (吐纳入定)；
//! - 任何按键移动立即唤醒，进入 Walking (行云步)；
//! - 冲刺技能触发 Dashing (御风疾行)。

use bevy::prelude::*;
use crate::config::MEDITATION_IDLE_THRESHOLD;

/// 修士身心当前处于的运行态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum PlayerStateKind {
    /// 站定调息：刚停下脚步，尚未入定
    #[default]
    Idle,
    /// 行云步：八向挪移穿梭
    Walking,
    /// 气沉丹田：入定深思，体表泛起呼吸光晕，加速聚敛天地灵气
    Meditating,
    /// 疾风身法：灵气灌注足底，短距离瞬间冲刺
    Dashing,
}

/// 玩家八向朝向枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum FacingDirection {
    #[default]
    South,
    North,
    West,
    East,
    NorthEast,
    NorthWest,
    SouthEast,
    SouthWest,
}

/// 挂载在玩家实体上的状态机组件
#[derive(Component, Debug, Clone)]
pub struct PlayerStateMachine {
    pub current_state: PlayerStateKind,
    pub facing: FacingDirection,
    /// 停步累计静止时长 (秒)，用于判断是否触发自动入定
    pub idle_timer: f32,
    /// 冲刺剩余冷却时间
    pub dash_cooldown: f32,
    /// 冲刺持续时间
    pub dash_duration: f32,
}

impl Default for PlayerStateMachine {
    fn default() -> Self {
        Self {
            current_state: PlayerStateKind::Idle,
            facing: FacingDirection::South,
            idle_timer: 0.0,
            dash_cooldown: 0.0,
            dash_duration: 0.0,
        }
    }
}

impl PlayerStateMachine {
    /// 状态机轮转更新：处理静止与移动的自然过渡
    pub fn update_state(&mut self, is_moving: bool, dt: f32) {
        if is_moving {
            self.idle_timer = 0.0;
            self.current_state = PlayerStateKind::Walking;
        } else {
            self.idle_timer += dt;
            if self.idle_timer >= MEDITATION_IDLE_THRESHOLD {
                // 停步已久，自然入定
                self.current_state = PlayerStateKind::Meditating;
            } else {
                self.current_state = PlayerStateKind::Idle;
            }
        }
    }
}
