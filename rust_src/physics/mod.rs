//! # physics/mod.rs - 2.5D 物理碰撞与深度排序系统
//!
//! ## 设计哲学
//! 严格遵循白皮书第 3.3 节《物理碰撞与视觉交互 (Y-Sort Law)》：
//! 1. 深度排序必须基于“脚底接地线”，而非精灵图片中心；
//! 2. 4-ccdi(地表) 与 2-dclu(道路) 仅渲染，无碰撞；
//! 3. 3-wwql(围墙) 与 1-jmvu(建筑) 进行严格 AABB 碰撞；
//! 4. RoofTriggerZone 实现进入建筑后的屋顶平滑渐隐。

use bevy::prelude::*;
use crate::config::{ROOF_FADE_ALPHA, ROOF_FADE_SPEED, Y_SORT_FACTOR, Z_LAYER_OBJECT_BASE};

/// 实体脚底接地线标记组件
/// 为什么需要单独定义 Footline 而非使用 Transform？
/// 2D 像素精灵的锚点通常在中心或左上角，但人物在 2.5D 世界里的真实触地位点是双足底端。
/// 通过 offset_y 记录双足相对于中心点的偏移量，实现极其精准的 Y-Sort 深度裁决。
#[derive(Component, Debug, Clone)]
pub struct YSortEntity {
    pub foot_offset_y: f32,
}

impl Default for YSortEntity {
    fn default() -> Self {
        Self { foot_offset_y: -24.0 }
    }
}

/// 轴对齐包围盒 (AABB) 碰撞体
/// 为什么选择 AABB 配合足底碰撞？
/// 2D 角色在地面穿行时，碰撞体应仅覆盖脚底椭圆/矩形区域（约 24x12 像素），
/// 头部与上半身可自然从树梢、屋檐下掠过，达到逼真的立体纵深感。
#[derive(Component, Debug, Clone)]
pub struct Collider {
    pub half_size: Vec2,
    pub offset: Vec2,
}

impl Collider {
    pub fn new(width: f32, height: f32, offset_y: f32) -> Self {
        Self {
            half_size: Vec2::new(width * 0.5, height * 0.5),
            offset: Vec2::new(0.0, offset_y),
        }
    }
}

/// 建筑屋顶遮蔽渐隐探测区域
/// 当修士涉足此区域时，对应的建筑屋顶 Sprite 会平滑淡出至 ROOF_FADE_ALPHA
#[derive(Component, Debug, Clone)]
pub struct RoofTriggerZone {
    pub area_min: Vec2,
    pub area_max: Vec2,
    pub target_roof_entity: Entity,
}

/// 建筑屋顶组件，控制其渲染材质的透明度
#[derive(Component, Debug, Clone)]
pub struct BuildingRoof {
    pub current_alpha: f32,
    pub is_player_inside: bool,
}

impl Default for BuildingRoof {
    fn default() -> Self {
        Self {
            current_alpha: 1.0,
            is_player_inside: false,
        }
    }
}

/// Y-Sort 深度重排系统
/// 每帧根据所有实体的实际脚底世界坐标 Y 值，更新其 Transform.translation.z
pub fn y_sort_system(mut query: Query<(&mut Transform, &YSortEntity)>) {
    for (mut transform, y_sort) in query.iter_mut() {
        let foot_y = transform.translation.y + y_sort.foot_offset_y;
        // Y 轴越小 (越靠屏幕下方)，Z 值越大 (越优先渲染在最前端)
        transform.translation.z = Z_LAYER_OBJECT_BASE - foot_y * Y_SORT_FACTOR;
    }
}

/// 屋顶半透明过渡系统
/// 实时检测玩家与 RoofTriggerZone 的包围检测，平滑插值 Sprite Alpha 通道
pub fn roof_fade_system(
    time: Res<Time>,
    player_query: Query<&Transform, With<crate::player::Player>>,
    mut trigger_query: Query<&RoofTriggerZone>,
    mut roof_query: Query<(Entity, &mut BuildingRoof, &mut Sprite)>,
) {
    let Ok(player_tf) = player_query.get_single() else { return };
    let player_pos = player_tf.translation.truncate();

    // 1. 扫描所有触发区，标记屋顶是否应半透明
    for (roof_entity, mut roof, _) in roof_query.iter_mut() {
        roof.is_player_inside = false;
        for trigger in trigger_query.iter() {
            if trigger.target_roof_entity == roof_entity {
                if player_pos.x >= trigger.area_min.x
                    && player_pos.x <= trigger.area_max.x
                    && player_pos.y >= trigger.area_min.y
                    && player_pos.y <= trigger.area_max.y
                {
                    roof.is_player_inside = true;
                    break;
                }
            }
        }
    }

    // 2. 平滑插值计算 Alpha 并应用至 Sprite.color
    let dt = time.delta_secs();
    for (_, mut roof, mut sprite) in roof_query.iter_mut() {
        let target_alpha = if roof.is_player_inside {
            ROOF_FADE_ALPHA
        } else {
            1.0
        };

        roof.current_alpha += (target_alpha - roof.current_alpha) * (ROOF_FADE_SPEED * dt).min(1.0);
        sprite.color = sprite.color.with_alpha(roof.current_alpha);
    }
}

pub struct PhysicsPlugin;

impl Plugin for PhysicsPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Update, (y_sort_system, roof_fade_system));
    }
}
