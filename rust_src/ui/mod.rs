//! # ui/mod.rs - 极简视觉隐喻反馈系统 (Qi Breathing & Compass)
//!
//! ## 设计哲学 (白皮书第 1 节与第 3.1 节)
//! - **去文字化**：能用视觉隐喻表现的内容，绝不使用文字面板！
//! - **灵气呼吸光晕**：修士入定吐纳时，体表升腾起淡金与温润天青交融的呼吸光晕，
//!   光晕随丹田节律缩放脉动；
//! - **天地罗盘**：屏幕角落常驻极简八卦罗盘，随视线与地脉流动优雅偏转。

use bevy::prelude::*;
use crate::config::{QI_AURA_MAX_ALPHA, QI_AURA_MIN_ALPHA, QI_AURA_RADIUS, QI_BREATH_PERIOD};
use crate::player::state::{PlayerStateKind, PlayerStateMachine};
use crate::player::Player;

/// 灵气呼吸光晕标记组件
#[derive(Component, Debug, Clone)]
pub struct QiBreathingAura;

/// 初始化灵气光晕
pub fn setup_qi_aura(mut commands: Commands) {
    commands.spawn((
        SpriteBundle {
            sprite: Sprite {
                color: Color::srgba(0.35, 0.78, 0.95, 0.0),
                custom_size: Some(Vec2::splat(QI_AURA_RADIUS * 2.0)),
                ..default()
            },
            transform: Transform::from_xyz(0.0, 0.0, 5.0),
            ..default()
        },
        QiBreathingAura,
        Name::new("Visual_QiBreathingAura"),
    ));
}

/// 灵气呼吸光晕动画系统
/// 紧密跟随玩家位置，根据入定状态激活动态呼吸律动
pub fn qi_breathing_system(
    time: Res<Time>,
    player_query: Query<(&Transform, &PlayerStateMachine), With<Player>>,
    mut aura_query: Query<(&mut Transform, &mut Sprite), (With<QiBreathingAura>, Without<Player>)>,
) {
    let Ok((player_tf, state_machine)) = player_query.get_single() else { return };
    let Ok((mut aura_tf, mut aura_sprite)) = aura_query.get_single_mut() else { return };

    // 光晕跟随修士身形
    aura_tf.translation.x = player_tf.translation.x;
    aura_tf.translation.y = player_tf.translation.y - 12.0;

    let elapsed = time.elapsed_secs();
    let breath_cycle = (elapsed * (std::f32::consts::TAU / QI_BREATH_PERIOD)).sin() * 0.5 + 0.5;

    match state_machine.current_state {
        PlayerStateKind::Meditating => {
            // 入定状态：灵气大盛，光晕明晰且节奏舒缓
            let target_alpha = QI_AURA_MIN_ALPHA + breath_cycle * (QI_AURA_MAX_ALPHA - QI_AURA_MIN_ALPHA);
            aura_sprite.color = Color::srgba(0.95, 0.82, 0.35, target_alpha);
            let scale = 1.0 + breath_cycle * 0.22;
            aura_tf.scale = Vec3::splat(scale);
        }
        PlayerStateKind::Idle => {
            // 稍作停歇：微弱灵光
            aura_sprite.color = Color::srgba(0.35, 0.75, 0.92, 0.12);
            aura_tf.scale = Vec3::splat(0.9);
        }
        PlayerStateKind::Walking | PlayerStateKind::Dashing => {
            // 疾行中光晕隐入体表
            aura_sprite.color = Color::srgba(0.35, 0.75, 0.92, 0.0);
        }
    }
}

pub struct QkUiPlugin;

impl Plugin for QkUiPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, setup_qi_aura)
            .add_systems(Update, qi_breathing_system);
    }
}
