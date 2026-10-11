//! # map/nature.rs - 程序化自然地貌与竹林生态生成器
//!
//! ## 设计哲学
//! 采用确定性伪随机算子 (Deterministic Pseudo-Random) 生成山水竹林：
//! 1. 相同区块网格坐标 (cx, cy) 无论加载卸载多少次，生成的山峦草木分毫不差；
//! 2. 宏观由噪声决定地表类别 (绿草、幽竹、溪涧)，微观散布灵草与奇石；
//! 3. 遵从图层物理契约：草木具有脚底 Collider，地表仅供渲染。

use bevy::prelude::*;
use crate::config::{CHUNK_SIZE, TILE_SIZE, Z_LAYER_GROUND};
use crate::map::chunk::ChunkCoord;
use crate::physics::{Collider, YSortEntity};

/// 确定性轻量级哈希算子，避免引入庞大的外部随机数依赖
fn deterministic_hash(x: i32, y: i32, seed: u32) -> u32 {
    let mut h = (x as u32).wrapping_mul(0x9E3779B9) ^ (y as u32).wrapping_mul(0x85EBCA6B) ^ seed;
    h = (h ^ (h >> 16)).wrapping_mul(0x85ebca6b);
    h = (h ^ (h >> 13)).wrapping_mul(0xc2b2ae35);
    h ^ (h >> 16)
}

/// 区块自然景观实例化生成主逻辑
pub fn generate_chunk_nature(parent: &mut ChildBuilder, coord: ChunkCoord) {
    for local_x in 0..CHUNK_SIZE {
        for local_y in 0..CHUNK_SIZE {
            let world_tile_x = coord.cx * CHUNK_SIZE + local_x;
            let world_tile_y = coord.cy * CHUNK_SIZE + local_y;

            let tile_pos_x = local_x as f32 * TILE_SIZE;
            let tile_pos_y = local_y as f32 * TILE_SIZE;

            // 1. 生成地表层 (4-ccdi: 仅渲染，无碰撞)
            let hash_ground = deterministic_hash(world_tile_x, world_tile_y, 101);
            let ground_color = if hash_ground % 7 == 0 {
                // 灵草繁茂处，青翠欲滴
                Color::srgb(0.18, 0.42, 0.22)
            } else {
                Color::srgb(0.15, 0.36, 0.18)
            };

            parent.spawn((
                SpriteBundle {
                    sprite: Sprite {
                        color: ground_color,
                        custom_size: Some(Vec2::splat(TILE_SIZE)),
                        ..default()
                    },
                    transform: Transform::from_xyz(tile_pos_x, tile_pos_y, Z_LAYER_GROUND),
                    ..default()
                },
                Name::new("Tile_4-ccdi_Ground"),
            ));

            // 2. 概率散布自然物件：幽篁墨竹 (含 Y-Sort 与脚底碰撞)
            let hash_object = deterministic_hash(world_tile_x, world_tile_y, 202);
            if hash_object % 19 == 0 {
                // 生成修竹
                parent.spawn((
                    SpriteBundle {
                        sprite: Sprite {
                            color: Color::srgb(0.25, 0.65, 0.35),
                            custom_size: Some(Vec2::new(32.0, 96.0)),
                            ..default()
                        },
                        transform: Transform::from_xyz(tile_pos_x, tile_pos_y + 24.0, 0.0),
                        ..default()
                    },
                    YSortEntity { foot_offset_y: -40.0 },
                    Collider::new(20.0, 14.0, -40.0),
                    Name::new("Nature_Bamboo"),
                ));
            }
        }
    }
}
