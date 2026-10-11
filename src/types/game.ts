export type Direction = 'front' | 'behind' | 'left' | 'right';

export type RealmTier = 
  | '炼气期一层'
  | '炼气期三层'
  | '炼气期六层'
  | '炼气期九层'
  | '炼气期大圆满'
  | '筑基期初期'
  | '筑基期中期'
  | '筑基期后期'
  | '筑基期大圆满'
  | '金丹期初期'
  | '金丹期中期'
  | '金丹期圆满'
  | '元婴老祖';

export interface RealmInfo {
  name: RealmTier;
  level: number;
  maxQi: number;
  tribulationStrikes: number; // lightning count needed
  strikeDamage: number;
  bonusHp: number;
  bonusAtk: number;
  bonusDef: number;
  title: string;
}

export type MapZone = 'SECT' | 'BAMBOO_FOREST' | 'DEMON_CAVE' | 'TRIBULATION_PLATFORM';

export interface Item {
  id: string;
  name: string;
  type: 'herb' | 'pill' | 'weapon' | 'armor' | 'material' | 'manual';
  desc: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: number; // spirit stones
  count: number;
  effect?: {
    hpRestore?: number;
    qiRestore?: number;
    expGain?: number;
    atkBonus?: number;
    defBonus?: number;
    maxHpBonus?: number;
  };
  iconEmoji: string;
}

export interface Spell {
  id: string;
  name: string;
  costQi: number;
  cooldown: number; // ms
  lastCast: number;
  damageMultiplier: number;
  description: string;
  type: 'attack' | 'thunder' | 'shield' | 'heal';
  icon: string;
  keyLabel: string;
}

export interface Monster {
  id: string;
  name: string;
  type: 'bat' | 'warg' | 'troll' | 'boss';
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  direction: Direction;
  animFrame: number;
  lastAttack: number;
  isDead: boolean;
  expReward: number;
  spiritStonesReward: number;
  lootTable: { itemId: string; dropRate: number }[];
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  x: number;
  y: number;
  direction: Direction;
  dialogue: string[];
  role: 'elder' | 'alchemist' | 'pet' | 'martial';
}

export interface HerbNode {
  id: string;
  name: string;
  x: number;
  y: number;
  itemId: string;
  collected: boolean;
  respawnTime: number;
}

export interface ChestNode {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  items: { itemId: string; count: number }[];
  spiritStones: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  damage: number;
  type: 'sword' | 'thunder';
  lifetime: number;
  fromPlayer: boolean;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  isCrit?: boolean;
  createdAt: number;
}

export interface Quest {
  id: string;
  title: string;
  targetDesc: string;
  currentCount: number;
  requiredCount: number;
  rewardStones: number;
  rewardExp: number;
  completed: boolean;
  claimed: boolean;
}

export interface PlayerStats {
  name: string;
  realmIndex: number;
  currentQi: number;
  maxQi: number;
  currentHp: number;
  maxHp: number;
  baseAtk: number;
  baseDef: number;
  spiritStones: number;
  spiritualRoot: string;
  equippedWeapon: Item | null;
  equippedArmor: Item | null;
  activeShieldDuration: number; // ms remaining
}
