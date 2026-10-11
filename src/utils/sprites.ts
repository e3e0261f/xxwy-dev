export interface SpriteInfo {
  img: HTMLImageElement;
  loaded: boolean;
}

const imageCache = new Map<string, SpriteInfo>();

export function getOrLoadImage(src: string): HTMLImageElement | null {
  if (typeof window === 'undefined') return null;

  const cached = imageCache.get(src);
  if (cached) {
    return cached.loaded ? cached.img : null;
  }

  const img = new Image();
  const info: SpriteInfo = { img, loaded: false };
  imageCache.set(src, info);

  img.onload = () => {
    info.loaded = true;
  };
  img.onerror = () => {
    // Keep loaded false
  };
  img.src = src;

  return null;
}

export const ASSET_PATHS = {
  playerIdle: '/assets/Spritesheet/NPc/Dungeon assets pack/Characters/Player/Player_idle.png',
  playerWalkFront: '/assets/Spritesheet/NPc/Dungeon assets pack/Characters/Player/Player_walk_front.png',
  playerWalkBehind: '/assets/Spritesheet/NPc/Dungeon assets pack/Characters/Player/Player_walk_behind.png',
  playerWalkLeft: '/assets/Spritesheet/NPc/Dungeon assets pack/Characters/Player/Player_walk_left.png',
  playerWalkRight: '/assets/Spritesheet/NPc/Dungeon assets pack/Characters/Player/Player_walk_right.png',

  monsterWalkFront: '/assets/Spritesheet/NPc/Dungeon assets pack/Characters/Monster/Monster_walk_front.png',
  monsterWalkBack: '/assets/Spritesheet/NPc/Dungeon assets pack/Characters/Monster/Monster_walk_back.png',
  monsterWalkLeft: '/assets/Spritesheet/NPc/Dungeon assets pack/Characters/Monster/Monster_walk_left.png',
  monsterWalkRight: '/assets/Spritesheet/NPc/Dungeon assets pack/Characters/Monster/Monster_walk_right.png',

  warriorWalkFront: '/assets/Spritesheet/NPc/Dungeon assets pack/Characters/Warrior/warrior_walk_front.png',
  wargIdle: '/assets/Spritesheet/NPc/Minifantasy_Creatures_Assets/Beasts/Warg/WargIdle.png',
  batFlyIdle: '/assets/Spritesheet/NPc/Minifantasy_Creatures_Assets/Beasts/Bat/BatFlyIdle.png',
  humanIdle: '/assets/Spritesheet/NPc/Minifantasy_Creatures_Assets/Base_Humanoids/Human/Base_Human/HumanIdle.png',
  elfIdle: '/assets/Spritesheet/NPc/Minifantasy_Creatures_Assets/Base_Humanoids/Elf/ElfIdle.png',

  weapons: '/assets/Spritesheet/NPc/Dungeon assets pack/Others/Weapons.png',
  coin: '/assets/Spritesheet/NPc/Dungeon assets pack/Others/Coin.png',

  // World Tiles
  tileGrass: '/assets/PNG/rpgTile019.png',
  tileGrassFlower: '/assets/PNG/rpgTile020.png',
  tileGrassDark: '/assets/PNG/rpgTile021.png',
  tileCobblestone: '/assets/PNG/rpgTile001.png',
  tileWater: '/assets/PNG/rpgTile028.png',
  tileStoneWall: '/assets/PNG/rpgTile030.png',
  tileTree: '/assets/PNG/rpgTile218.png',
  tileShrine: '/assets/PNG/rpgTile151.png',
  tileChest: '/assets/PNG/rpgTile165.png',
  tilePortal: '/assets/PNG/rpgTile194.png',
};

// Preload common assets immediately
export function preloadCoreAssets() {
  Object.values(ASSET_PATHS).forEach((path) => {
    getOrLoadImage(path);
  });
}
