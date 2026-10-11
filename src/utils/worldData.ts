import { MapZone, NPC, Monster, HerbNode, ChestNode } from '../types/game';

export interface ZoneConfig {
  id: MapZone;
  name: string;
  theme: string;
  width: number; // in tiles (each tile 64px)
  height: number;
  tiles: number[][]; // 0: grass, 1: cobblestone, 2: water, 3: stoneWall, 4: shrine/floor
  npcs: NPC[];
  initialMonsters: Monster[];
  herbs: HerbNode[];
  chests: ChestNode[];
  portals: {
    x: number;
    y: number;
    targetZone: MapZone;
    targetX: number;
    targetY: number;
    label: string;
  }[];
  ambientColor: string;
}

export function generateZones(): Record<MapZone, ZoneConfig> {
  // 1. Lingyun Sect (20x15 tiles)
  const sectTiles: number[][] = [];
  for (let y = 0; y < 16; y++) {
    const row: number[] = [];
    for (let x = 0; x < 22; x++) {
      if (x === 0 || x === 21 || y === 0 || y === 15) {
        row.push(3); // boundary stone wall
      } else if (x >= 9 && x <= 12 && y >= 3 && y <= 6) {
        row.push(2); // Spirit Spring water pool in center!
      } else if ((x >= 2 && x <= 19 && (y === 8 || y === 9)) || (y >= 2 && y <= 14 && (x === 10 || x === 11))) {
        row.push(1); // stone pathway
      } else if (x >= 3 && x <= 7 && y >= 2 && y <= 5) {
        row.push(4); // courtyard
      } else {
        row.push(0); // lush grass
      }
    }
    sectTiles.push(row);
  }

  // 2. Bamboo Forest (24x18 tiles)
  const forestTiles: number[][] = [];
  for (let y = 0; y < 18; y++) {
    const row: number[] = [];
    for (let x = 0; x < 24; x++) {
      if (x === 0 || x === 23 || y === 0 || y === 17) {
        row.push(3);
      } else if (y >= 8 && y <= 9 && (x < 10 || x > 13)) {
        row.push(2); // stream
      } else if ((x >= 10 && x <= 13 && y >= 7 && y <= 10) || (x === 11 && y >= 2 && y <= 15)) {
        row.push(1); // trail
      } else {
        row.push(0); // bamboo grass
      }
    }
    forestTiles.push(row);
  }

  // 3. Demon Cave (22x16 tiles)
  const caveTiles: number[][] = [];
  for (let y = 0; y < 16; y++) {
    const row: number[] = [];
    for (let x = 0; x < 22; x++) {
      if (x === 0 || x === 21 || y === 0 || y === 15) {
        row.push(3);
      } else if ((x === 6 || x === 15) && y >= 3 && y <= 12) {
        row.push(3); // pillars
      } else {
        row.push(1); // dungeon cobblestone
      }
    }
    caveTiles.push(row);
  }

  // 4. Tribulation Platform (18x14 tiles)
  const tribTiles: number[][] = [];
  for (let y = 0; y < 14; y++) {
    const row: number[] = [];
    for (let x = 0; x < 18; x++) {
      if (x === 0 || x === 17 || y === 0 || y === 13) {
        row.push(3); // edge barrier
      } else if (x >= 6 && x <= 11 && y >= 4 && y <= 9) {
        row.push(4); // sacred center dais
      } else {
        row.push(1); // stone platform
      }
    }
    tribTiles.push(row);
  }

  return {
    SECT: {
      id: 'SECT',
      name: '灵云宗·主峰道场',
      theme: '仙家福地，灵气氤氲。中央乃聚灵灵泉，可静坐吐纳恢复灵力。',
      width: 22,
      height: 16,
      tiles: sectTiles,
      ambientColor: 'rgba(230, 245, 255, 0.08)',
      npcs: [
        {
          id: 'npc_elder',
          name: '玄阳真人',
          title: '灵云宗掌门',
          x: 5 * 64,
          y: 4 * 64,
          direction: 'front',
          role: 'elder',
          dialogue: [
            '徒儿，修真乃逆天之举，需戒骄戒躁，步步为营。',
            '若灵力充沛，可前往问天仙台引动九天雷劫，破境筑基！',
            '山门下迷雾竹林生有诸多灵草，更有凶兽出没，可去历练一番。',
          ],
        },
        {
          id: 'npc_alchemist',
          name: '丹辰子',
          title: '药阁首席长老',
          x: 16 * 64,
          y: 4 * 64,
          direction: 'front',
          role: 'alchemist',
          dialogue: [
            '天地灵物皆可入药。若采集到龙血草与九叶灵芝，老夫可传你炼丹之道。',
            '聚气丹能助长修为，九转筑基丹更是突破生死关隘的护脉奇药！',
          ],
        },
        {
          id: 'npc_martial',
          name: '铁剑师兄',
          title: '执法堂剑侍',
          x: 5 * 64,
          y: 11 * 64,
          direction: 'front',
          role: 'martial',
          dialogue: [
            '师弟，你手中飞剑尚需多加温养。按【Q】可御剑疾刺，按【W】引九天神雷！',
            '宗门悬赏榜有诸多降妖任务，完成后奖赏丰厚下品灵石！',
          ],
        },
      ],
      initialMonsters: [],
      herbs: [
        { id: 'sh1', name: '九叶灵芝', x: 3 * 64, y: 12 * 64, itemId: 'herb_lingzhi', collected: false, respawnTime: 0 },
        { id: 'sh2', name: '天星草', x: 18 * 64, y: 12 * 64, itemId: 'herb_star_flower', collected: false, respawnTime: 0 },
      ],
      chests: [
        { id: 'sc1', x: 18 * 64, y: 3 * 64, opened: false, items: [{ itemId: 'pill_juqi', count: 3 }], spiritStones: 100 },
      ],
      portals: [
        { x: 10 * 64, y: 14 * 64, targetZone: 'BAMBOO_FOREST', targetX: 11 * 64, targetY: 2 * 64, label: '前往【迷雾竹林】' },
        { x: 10 * 64, y: 1 * 64, targetZone: 'TRIBULATION_PLATFORM', targetX: 9 * 64, targetY: 11 * 64, label: '登临【问天仙台】渡劫' },
      ],
    },

    BAMBOO_FOREST: {
      id: 'BAMBOO_FOREST',
      name: '迷雾竹林·后山灵脉',
      theme: '竹影婆娑，多生奇花异草，偶有嗜血灵兽与飞蝠出没。',
      width: 24,
      height: 18,
      tiles: forestTiles,
      ambientColor: 'rgba(50, 160, 90, 0.1)',
      npcs: [
        {
          id: 'npc_gatherer',
          name: '月儿师妹',
          title: '百草堂弟子',
          x: 13 * 64,
          y: 4 * 64,
          direction: 'left',
          role: 'elder',
          dialogue: [
            '师兄小心！竹林深处的血狼凶残嗜血，还会突袭！',
            '我刚刚在溪边采到了稀有的龙血草呢，师兄快去瞧瞧！',
          ],
        },
      ],
      initialMonsters: [
        {
          id: 'warg_1',
          name: '嗜血狂狼',
          type: 'warg',
          x: 4 * 64,
          y: 5 * 64,
          width: 48,
          height: 48,
          hp: 140,
          maxHp: 140,
          atk: 22,
          def: 8,
          speed: 1.6,
          direction: 'front',
          animFrame: 0,
          lastAttack: 0,
          isDead: false,
          expReward: 60,
          spiritStonesReward: 35,
          lootTable: [
            { itemId: 'monster_core', dropRate: 0.8 },
            { itemId: 'herb_dragon_blood', dropRate: 0.4 },
          ],
        },
        {
          id: 'warg_2',
          name: '嗜血狂狼',
          type: 'warg',
          x: 18 * 64,
          y: 6 * 64,
          width: 48,
          height: 48,
          hp: 140,
          maxHp: 140,
          atk: 22,
          def: 8,
          speed: 1.6,
          direction: 'front',
          animFrame: 0,
          lastAttack: 0,
          isDead: false,
          expReward: 60,
          spiritStonesReward: 35,
          lootTable: [
            { itemId: 'monster_core', dropRate: 0.8 },
          ],
        },
        {
          id: 'bat_1',
          name: '幽暗血蝠',
          type: 'bat',
          x: 6 * 64,
          y: 12 * 64,
          width: 40,
          height: 40,
          hp: 90,
          maxHp: 90,
          atk: 18,
          def: 5,
          speed: 2.2,
          direction: 'front',
          animFrame: 0,
          lastAttack: 0,
          isDead: false,
          expReward: 45,
          spiritStonesReward: 25,
          lootTable: [
            { itemId: 'monster_core', dropRate: 0.6 },
            { itemId: 'herb_lingzhi', dropRate: 0.5 },
          ],
        },
        {
          id: 'bat_2',
          name: '幽暗血蝠',
          type: 'bat',
          x: 16 * 64,
          y: 13 * 64,
          width: 40,
          height: 40,
          hp: 90,
          maxHp: 90,
          atk: 18,
          def: 5,
          speed: 2.2,
          direction: 'front',
          animFrame: 0,
          lastAttack: 0,
          isDead: false,
          expReward: 45,
          spiritStonesReward: 25,
          lootTable: [
            { itemId: 'monster_core', dropRate: 0.6 },
          ],
        },
      ],
      herbs: [
        { id: 'fh1', name: '九叶灵芝', x: 3 * 64, y: 3 * 64, itemId: 'herb_lingzhi', collected: false, respawnTime: 0 },
        { id: 'fh2', name: '龙血草', x: 5 * 64, y: 10 * 64, itemId: 'herb_dragon_blood', collected: false, respawnTime: 0 },
        { id: 'fh3', name: '龙血草', x: 19 * 64, y: 10 * 64, itemId: 'herb_dragon_blood', collected: false, respawnTime: 0 },
        { id: 'fh4', name: '天星草', x: 21 * 64, y: 3 * 64, itemId: 'herb_star_flower', collected: false, respawnTime: 0 },
        { id: 'fh5', name: '九叶灵芝', x: 8 * 64, y: 14 * 64, itemId: 'herb_lingzhi', collected: false, respawnTime: 0 },
      ],
      chests: [
        { id: 'fc1', x: 20 * 64, y: 14 * 64, opened: false, items: [{ itemId: 'pill_peiyuan', count: 2 }], spiritStones: 150 },
      ],
      portals: [
        { x: 11 * 64, y: 1 * 64, targetZone: 'SECT', targetX: 10 * 64, targetY: 13 * 64, label: '返回【灵云宗】' },
        { x: 11 * 64, y: 16 * 64, targetZone: 'DEMON_CAVE', targetX: 10 * 64, targetY: 2 * 64, label: '深入【万妖窟】' },
      ],
    },

    DEMON_CAVE: {
      id: 'DEMON_CAVE',
      name: '万妖窟·地底渊薮',
      theme: '妖气滔天，群魔盘踞。深处封印着赤炎妖王，斩之可获罕世奇宝！',
      width: 22,
      height: 16,
      tiles: caveTiles,
      ambientColor: 'rgba(180, 40, 20, 0.15)',
      npcs: [],
      initialMonsters: [
        {
          id: 'troll_1',
          name: '狂暴巨魔',
          type: 'troll',
          x: 4 * 64,
          y: 7 * 64,
          width: 52,
          height: 52,
          hp: 280,
          maxHp: 280,
          atk: 38,
          def: 18,
          speed: 1.2,
          direction: 'front',
          animFrame: 0,
          lastAttack: 0,
          isDead: false,
          expReward: 120,
          spiritStonesReward: 80,
          lootTable: [
            { itemId: 'monster_core', dropRate: 1.0 },
            { itemId: 'pill_peiyuan', dropRate: 0.5 },
          ],
        },
        {
          id: 'troll_2',
          name: '狂暴巨魔',
          type: 'troll',
          x: 17 * 64,
          y: 7 * 64,
          width: 52,
          height: 52,
          hp: 280,
          maxHp: 280,
          atk: 38,
          def: 18,
          speed: 1.2,
          direction: 'front',
          animFrame: 0,
          lastAttack: 0,
          isDead: false,
          expReward: 120,
          spiritStonesReward: 80,
          lootTable: [
            { itemId: 'monster_core', dropRate: 1.0 },
          ],
        },
        {
          id: 'boss_flame',
          name: '赤炎妖皇 (领主)',
          type: 'boss',
          x: 10 * 64,
          y: 11 * 64,
          width: 64,
          height: 64,
          hp: 850,
          maxHp: 850,
          atk: 65,
          def: 30,
          speed: 1.4,
          direction: 'front',
          animFrame: 0,
          lastAttack: 0,
          isDead: false,
          expReward: 500,
          spiritStonesReward: 500,
          lootTable: [
            { itemId: 'weapon_thunder_sword', dropRate: 1.0 },
            { itemId: 'pill_zhuji', dropRate: 1.0 },
          ],
        },
      ],
      herbs: [
        { id: 'ch1', name: '龙血草', x: 2 * 64, y: 13 * 64, itemId: 'herb_dragon_blood', collected: false, respawnTime: 0 },
        { id: 'ch2', name: '天星草', x: 19 * 64, y: 13 * 64, itemId: 'herb_star_flower', collected: false, respawnTime: 0 },
      ],
      chests: [
        { id: 'cc1', x: 10 * 64, y: 13 * 64, opened: false, items: [{ itemId: 'pill_zhuji', count: 1 }], spiritStones: 300 },
      ],
      portals: [
        { x: 10 * 64, y: 1 * 64, targetZone: 'BAMBOO_FOREST', targetX: 11 * 64, targetY: 15 * 64, label: '逃离【万妖窟】' },
      ],
    },

    TRIBULATION_PLATFORM: {
      id: 'TRIBULATION_PLATFORM',
      name: '问天仙台·九霄雷劫坛',
      theme: '直指苍穹的万丈玉台，九天劫云翻滚。唯有心志坚定者方能在此脱胎换骨！',
      width: 18,
      height: 14,
      tiles: tribTiles,
      ambientColor: 'rgba(120, 100, 255, 0.15)',
      npcs: [],
      initialMonsters: [],
      herbs: [],
      chests: [],
      portals: [
        { x: 9 * 64, y: 12 * 64, targetZone: 'SECT', targetX: 10 * 64, targetY: 3 * 64, label: '返回【灵云宗】' },
      ],
    },
  };
}
