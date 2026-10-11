//! # 青城 (Qk) 修仙大世界 - 核心引擎入口
//!
//! ## 架构设计哲学
//! 严格依照《青城 (Qk) 修仙大世界 - 项目技术白皮书》规范构建：
//! - 核心引擎：Bevy 0.19.1 数据驱动 ECS
//! - Web 构建：Trunk 0.21.14 (Target: wasm32-unknown-unknown)
//! - 架构解耦：config, map, player, physics, ui 各司其职，模块化插件组装
//! - 铁律守则：零硬编码，物理图层严密契约，Y-Sort 2.5D 脚底接地线排序法则。
//!
//! “我们不是在写代码，我们是在塑造修仙界的地脉与规矩。请保持代码的整洁与逻辑的纯粹，因为这是一座要跑几十年的青城。”

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
        // 1. 基础视窗与 WebGL2 渲染管线配置
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
                .set(ImagePlugin::default_nearest()), // 保持像素点阵锐利无锯齿
        )
        // 2. 注入业务系统插件组
        .add_plugins(config::ConfigPlugin)
        .add_plugins(PhysicsPlugin)
        .add_plugins(QkMapPlugin)
        .add_plugins(PlayerPlugin)
        .add_plugins(QkUiPlugin)
        // 3. 核心开局初始化系统
        .add_systems(Startup, setup_camera_and_player)
        .add_systems(Update, camera_follow_system)
        .run();
}

/// 摄像机标记组件
#[derive(Component)]
struct MainCamera;

/// 场景开局：初始化 2D 摄像机与主角修士
fn setup_camera_and_player(mut commands: Commands) {
    // 1. 搭建正交 2D 摄像机
    let mut camera = Camera2dBundle::default();
    camera.projection.scale = CAMERA_ORTHO_SCALE;
    commands.spawn((camera, MainCamera));

    // 2. 召唤主角修士实体
    // 严格满足：Sprite + PlayerStateMachine + YSortEntity (接地线) + Collider (物理包围盒)
    commands.spawn((
        SpriteBundle {
            sprite: Sprite {
                color: Color::srgb(0.95, 0.95, 0.98),
                custom_size: Some(Vec2::new(34.0, 50.0)),
                ..default()
            },
            transform: Transform::from_xyz(0.0, 0.0, 10.0),
            ..default()
        },
        Player,
        PlayerStateMachine::default(),
        PlayerAnimationTimer::default(),
        YSortEntity { foot_offset_y: -22.0 },
        Collider::new(24.0, 14.0, -20.0),
        Name::new("Player_Cultivator"),
    ));
}

/// 摄像机平滑跟随系统
/// 采用 Lerp 插值跟随主角移动，带来道法自然的柔和运镜视感
fn camera_follow_system(
    time: Res<Time>,
    player_query: Query<&Transform, With<Player>>,
    mut camera_query: Query<&mut Transform, (With<MainCamera>, Without<Player>)>,
) {
    let Ok(player_tf) = player_query.get_single() else { return };
    let Ok(mut camera_tf) = camera_query.get_single_mut() else { return };

    let target_pos = player_tf.translation;
    let dt = time.delta_secs();
    camera_tf.translation.x += (target_pos.x - camera_tf.translation.x) * (CAMERA_LERP_FACTOR * 60.0 * dt).min(1.0);
    camera_tf.translation.y += (target_pos.y - camera_tf.translation.y) * (CAMERA_LERP_FACTOR * 60.0 * dt).min(1.0);
}
