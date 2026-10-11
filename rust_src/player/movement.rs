//! # player/movement.rs - 八向移动与碰撞裁决系统
//!
//! ## 设计哲学
//! 1. 严格禁止在移动逻辑里写死数值，统一读取 config::*；
//! 2. 8 向输入通过 DIAGONAL_SPEED_FACTOR 归一化；
//! 3. 碰撞检测基于玩家脚底 Collider 与地图 3-wwql(围墙) & 1-jmvu(建筑) 的 AABB 重叠检测；
//! 4. 采用分轴碰撞检测 (X 轴独立、Y 轴独立)，避免因对角线轻微触碰而出现卡墙现象。

use bevy::prelude::*;
use crate::config::{DIAGONAL_SPEED_FACTOR, PLAYER_BASE_SPEED};
use crate::physics::Collider;
use crate::player::state::{FacingDirection, PlayerStateMachine};

/// 玩家核心标记组件
#[derive(Component, Debug, Clone, Default)]
pub struct Player;

/// 八向移动输入采集与物理位移结算系统
pub fn player_movement_system(
    time: Res<Time>,
    keyboard_input: Res<ButtonInput<KeyCode>>,
    collider_query: Query<(&Transform, &Collider), Without<Player>>,
    mut player_query: Query<(&mut Transform, &mut PlayerStateMachine, &Collider), With<Player>>,
) {
    let Ok((mut player_tf, mut state_machine, player_col)) = player_query.get_single_mut() else {
        return;
    };

    let dt = time.delta_secs();

    // 1. 采集输入矢量
    let mut move_dir = Vec2::ZERO;
    if keyboard_input.pressed(KeyCode::KeyW) || keyboard_input.pressed(KeyCode::ArrowUp) {
        move_dir.y += 1.0;
    }
    if keyboard_input.pressed(KeyCode::KeyS) || keyboard_input.pressed(KeyCode::ArrowDown) {
        move_dir.y -= 1.0;
    }
    if keyboard_input.pressed(KeyCode::KeyA) || keyboard_input.pressed(KeyCode::ArrowLeft) {
        move_dir.x -= 1.0;
    }
    if keyboard_input.pressed(KeyCode::KeyD) || keyboard_input.pressed(KeyCode::ArrowRight) {
        move_dir.x += 1.0;
    }

    let is_moving = move_dir.length_squared() > 0.001;

    // 2. 更新朝向与状态机
    if is_moving {
        // 斜向归一化
        if move_dir.x != 0.0 && move_dir.y != 0.0 {
            move_dir *= DIAGONAL_SPEED_FACTOR;
        }

        // 判定八向朝向
        state_machine.facing = match (move_dir.x > 0.0, move_dir.x < 0.0, move_dir.y > 0.0, move_dir.y < 0.0) {
            (true, false, true, false) => FacingDirection::NorthEast,
            (false, true, true, false) => FacingDirection::NorthWest,
            (true, false, false, true) => FacingDirection::SouthEast,
            (false, true, false, true) => FacingDirection::SouthWest,
            (true, false, false, false) => FacingDirection::East,
            (false, true, false, false) => FacingDirection::West,
            (false, false, true, false) => FacingDirection::North,
            _ => FacingDirection::South,
        };
    }

    state_machine.update_state(is_moving, dt);

    if !is_moving {
        return;
    }

    // 3. 计算预拟位移
    let step = move_dir * PLAYER_BASE_SPEED * dt;
    let current_pos = player_tf.translation.truncate();

    // 4. 分轴碰撞检测 (X 轴)
    let test_pos_x = Vec2::new(current_pos.x + step.x, current_pos.y);
    let mut allow_x = true;
    for (obj_tf, obj_col) in collider_query.iter() {
        let obj_pos = obj_tf.translation.truncate() + obj_col.offset;
        let p_box_min = test_pos_x + player_col.offset - player_col.half_size;
        let p_box_max = test_pos_x + player_col.offset + player_col.half_size;
        let o_box_min = obj_pos - obj_col.half_size;
        let o_box_max = obj_pos + obj_col.half_size;

        if p_box_max.x > o_box_min.x
            && p_box_min.x < o_box_max.x
            && p_box_max.y > o_box_min.y
            && p_box_min.y < o_box_max.y
        {
            allow_x = false;
            break;
        }
    }

    // 分轴碰撞检测 (Y 轴)
    let test_pos_y = Vec2::new(
        if allow_x { current_pos.x + step.x } else { current_pos.x },
        current_pos.y + step.y,
    );
    let mut allow_y = true;
    for (obj_tf, obj_col) in collider_query.iter() {
        let obj_pos = obj_tf.translation.truncate() + obj_col.offset;
        let p_box_min = test_pos_y + player_col.offset - player_col.half_size;
        let p_box_max = test_pos_y + player_col.offset + player_col.half_size;
        let o_box_min = obj_pos - obj_col.half_size;
        let o_box_max = obj_pos + obj_col.half_size;

        if p_box_max.x > o_box_min.x
            && p_box_min.x < o_box_max.x
            && p_box_max.y > o_box_min.y
            && p_box_min.y < o_box_max.y
        {
            allow_y = false;
            break;
        }
    }

    // 5. 应用合规位移
    if allow_x {
        player_tf.translation.x += step.x;
    }
    if allow_y {
        player_tf.translation.y += step.y;
    }
}
