//! # map/qk.rs - 青城手绘图层解析与数据装载器
//!
//! ## 图层物理契约 (白皮书第 4 节开发铁律)
//! - `4-ccdi` (地表) & `2-dclu` (道路) = 仅渲染，无碰撞；
//! - `3-wwql` (围墙) & `1-jmvu` (建筑) = 物理阻挡 + 精确碰撞；
//! - 建筑顶层挂载 `RoofTriggerZone`，实现进入后自动半透明渐隐。

use bevy::prelude::*;
use crate::config::{Z_LAYER_GROUND, Z_LAYER_OBJECT_BASE, Z_LAYER_ROAD, Z_LAYER_ROOF};
use crate::physics::{BuildingRoof, Collider, RoofTriggerZone, YSortEntity};

/// 青城地脉图层枚举定义
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QkLayerType {
    /// 4-ccdi: 地表泥土与草皮 (无碰撞)
    Ground4,
    /// 2-dclu: 石板路与青石甬道 (无碰撞)
    Road2,
    /// 3-wwql: 围墙、篱笆与山岩 (有阻挡)
    Wall3,
    /// 1-jmvu: 宗门道观建筑 (有阻挡 + 屋顶进入渐隐)
    Building1,
}

/// 青城宗门预制件建筑生成工厂函数
/// 生成包含青石台基、实木立柱 (带碰撞)、以及悬挑飞檐屋顶 (带渐隐) 的标准道家殿堂
pub fn spawn_qk_dao_temple(commands: &mut Commands, origin: Vec2) {
    // 1. 生成 2-dclu: 青石铺地台基 (仅渲染，无碰撞)
    commands.spawn((
        SpriteBundle {
            sprite: Sprite {
                color: Color::srgb(0.55, 0.58, 0.62),
                custom_size: Some(Vec2::new(384.0, 256.0)),
                ..default()
            },
            transform: Transform::from_xyz(origin.x, origin.y, Z_LAYER_ROAD),
            ..default()
        },
        Name::new("Qk_2-dclu_StonePlinth"),
    ));

    // 2. 生成 1-jmvu: 殿堂主墙体与隔断 (物理碰撞阻挡)
    commands.spawn((
        SpriteBundle {
            sprite: Sprite {
                color: Color::srgb(0.42, 0.28, 0.22),
                custom_size: Some(Vec2::new(320.0, 160.0)),
                ..default()
            },
            transform: Transform::from_xyz(origin.x, origin.y - 20.0, Z_LAYER_OBJECT_BASE),
            ..default()
        },
        YSortEntity { foot_offset_y: -60.0 },
        Collider::new(300.0, 80.0, -40.0),
        Name::new("Qk_1-jmvu_TempleWall"),
    ));

    // 3. 生成 1-jmvu 屋顶飞檐 (挂载 BuildingRoof 与 RoofTriggerZone)
    let roof_entity = commands
        .spawn((
            SpriteBundle {
                sprite: Sprite {
                    color: Color::srgb(0.28, 0.35, 0.45),
                    custom_size: Some(Vec2::new(360.0, 180.0)),
                    ..default()
                },
                transform: Transform::from_xyz(origin.x, origin.y + 60.0, Z_LAYER_ROOF),
                ..default()
            },
            BuildingRoof::default(),
            Name::new("Qk_1-jmvu_TempleRoof"),
        ))
        .id();

    // 4. 注册建筑内殿探测区：进入后屋顶自动淡化至 35%
    commands.spawn((
        RoofTriggerZone {
            area_min: Vec2::new(origin.x - 140.0, origin.y - 80.0),
            area_max: Vec2::new(origin.x + 140.0, origin.y + 40.0),
            target_roof_entity: roof_entity,
        },
        Name::new("Qk_RoofTriggerZone"),
    ));
}
