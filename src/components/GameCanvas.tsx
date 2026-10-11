import React, { useEffect, useRef, useState } from 'react';
import {
  Direction,
  HerbNode,
  MapZone,
  Monster,
  NPC,
  PlayerStats,
  Projectile,
  DamageNumber,
  ChestNode,
  Spell,
} from '../types/game';
import { ASSET_PATHS, getOrLoadImage } from '../utils/sprites';
import { soundManager } from '../utils/audio';
import { ZoneConfig } from '../utils/worldData';

interface Props {
  stats: PlayerStats;
  currentZoneConfig: ZoneConfig;
  spells: Spell[];
  showColliders: boolean;
  showYSortLines: boolean;
  showChunkGrid: boolean;
  onPlayerPosChange: (pos: { x: number; y: number }) => void;
  onZoneChange: (zone: MapZone, targetX: number, targetY: number) => void;
  onInteractNPC: (npc: NPC) => void;
  onCollectHerb: (herb: HerbNode) => void;
  onOpenChest: (chest: ChestNode) => void;
  onDamagePlayer: (damage: number) => void;
  onAddQi: (amount: number) => void;
  onMonsterDefeated: (monster: Monster) => void;
  onCastSpellCost: (cost: number) => void;
}

export const GameCanvas: React.FC<Props> = ({
  stats,
  currentZoneConfig,
  spells,
  showColliders,
  showYSortLines,
  showChunkGrid,
  onPlayerPosChange,
  onZoneChange,
  onInteractNPC,
  onCollectHerb,
  onOpenChest,
  onDamagePlayer,
  onAddQi,
  onMonsterDefeated,
  onCastSpellCost,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player state
  const playerRef = useRef({
    x: 10 * 64,
    y: 9 * 64,
    direction: 'front' as Direction,
    isMoving: false,
    animFrame: 0,
    animTimer: 0,
    idleTimer: 0,
    isMeditating: false,
    speed: 190, // px/sec
  });

  // Entities & Projectiles state
  const monstersRef = useRef<Monster[]>([...currentZoneConfig.initialMonsters]);
  const herbsRef = useRef<HerbNode[]>([...currentZoneConfig.herbs]);
  const chestsRef = useRef<ChestNode[]>([...currentZoneConfig.chests]);
  const projectilesRef = useRef<Projectile[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);

  // Keys state
  const keysRef = useRef<Record<string, boolean>>({});

  // Sync monsters / herbs when zone changes
  useEffect(() => {
    monstersRef.current = [...currentZoneConfig.initialMonsters];
    herbsRef.current = [...currentZoneConfig.herbs];
    chestsRef.current = [...currentZoneConfig.chests];
    projectilesRef.current = [];
  }, [currentZoneConfig]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;

      // Spells triggered by hotkeys
      if (e.key === 'q' || e.key === '1') triggerSpell(0);
      if (e.key === 'w' || e.key === '2') triggerSpell(1);
      if (e.key === 'e' || e.key === '3') triggerSpell(2);
      if (e.key === 'r' || e.key === '4') triggerSpell(3);
      if (e.key === ' ') {
        // Space = primary attack
        triggerSpell(0);
      }
      if (e.key.toLowerCase() === 'f') {
        // Interact key
        checkInteractions();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spells, stats.currentQi]);

  const triggerSpell = (spellIdx: number) => {
    const spell = spells[spellIdx];
    if (!spell) return;
    if (stats.currentQi < spell.costQi) return;

    const p = playerRef.current;
    onCastSpellCost(spell.costQi);

    if (spell.type === 'attack') {
      soundManager.playSwordSlash();
      // Shoot flying sword projectile in player's facing direction
      let vx = 0;
      let vy = 0;
      const speed = 400;
      if (p.direction === 'front') vy = speed;
      else if (p.direction === 'behind') vy = -speed;
      else if (p.direction === 'left') vx = -speed;
      else if (p.direction === 'right') vx = speed;

      projectilesRef.current.push({
        id: Math.random().toString(),
        x: p.x,
        y: p.y,
        targetX: p.x + vx,
        targetY: p.y + vy,
        vx,
        vy,
        damage: Math.floor(stats.baseAtk * spell.damageMultiplier),
        type: 'sword',
        lifetime: 1.2,
        fromPlayer: true,
      });
    } else if (spell.type === 'thunder') {
      soundManager.playThunder();
      // Lightning strike on nearest monster or target
      const target = monstersRef.current.find((m) => !m.isDead);
      const tx = target ? target.x : p.x;
      const ty = target ? target.y : p.y - 100;

      projectilesRef.current.push({
        id: Math.random().toString(),
        x: tx,
        y: ty,
        targetX: tx,
        targetY: ty,
        vx: 0,
        vy: 0,
        damage: Math.floor(stats.baseAtk * spell.damageMultiplier),
        type: 'thunder',
        lifetime: 0.5,
        fromPlayer: true,
      });

      // Area damage
      monstersRef.current.forEach((m) => {
        if (!m.isDead) {
          const dist = Math.hypot(m.x - tx, m.y - ty);
          if (dist < 120) {
            applyDamageToMonster(m, Math.floor(stats.baseAtk * spell.damageMultiplier), true);
          }
        }
      });
    } else if (spell.type === 'shield') {
      soundManager.playShield();
      // Shield is managed via stats.activeShieldDuration
    } else if (spell.type === 'heal') {
      soundManager.playHeal();
      damageNumbersRef.current.push({
        id: Math.random().toString(),
        x: p.x,
        y: p.y - 20,
        text: '+120 生机',
        color: '#34d399',
        createdAt: Date.now(),
      });
    }
  };

  const applyDamageToMonster = (m: Monster, dmg: number, isCrit: boolean = false) => {
    m.hp -= dmg;
    soundManager.playHit();

    damageNumbersRef.current.push({
      id: Math.random().toString(),
      x: m.x + (Math.random() - 0.5) * 20,
      y: m.y - 15,
      text: `-${dmg}`,
      color: isCrit ? '#fbbf24' : '#f87171',
      isCrit,
      createdAt: Date.now(),
    });

    if (m.hp <= 0 && !m.isDead) {
      m.isDead = true;
      onMonsterDefeated(m);
      damageNumbersRef.current.push({
        id: Math.random().toString(),
        x: m.x,
        y: m.y - 35,
        text: `+${m.spiritStonesReward} 灵石`,
        color: '#67e8f9',
        createdAt: Date.now(),
      });
    }
  };

  const checkInteractions = () => {
    const p = playerRef.current;

    // Check NPCs
    for (const npc of currentZoneConfig.npcs) {
      if (Math.hypot(p.x - npc.x, p.y - npc.y) < 65) {
        onInteractNPC(npc);
        return;
      }
    }

    // Check Herbs
    for (const herb of herbsRef.current) {
      if (!herb.collected && Math.hypot(p.x - herb.x, p.y - herb.y) < 55) {
        herb.collected = true;
        soundManager.playGatherHerb();
        onCollectHerb(herb);
        damageNumbersRef.current.push({
          id: Math.random().toString(),
          x: herb.x,
          y: herb.y - 20,
          text: `采得 ${herb.name}`,
          color: '#86efac',
          createdAt: Date.now(),
        });
        return;
      }
    }

    // Check Chests
    for (const chest of chestsRef.current) {
      if (!chest.opened && Math.hypot(p.x - chest.x, p.y - chest.y) < 60) {
        chest.opened = true;
        soundManager.playBreakthroughSuccess();
        onOpenChest(chest);
        damageNumbersRef.current.push({
          id: Math.random().toString(),
          x: chest.x,
          y: chest.y - 25,
          text: `开启宝匣！+${chest.spiritStones} 灵石`,
          color: '#facc15',
          createdAt: Date.now(),
        });
        return;
      }
    }
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      update(dt);
      render(currentTime);

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [currentZoneConfig, showColliders, showYSortLines, showChunkGrid, stats]);

  const update = (dt: number) => {
    const p = playerRef.current;
    let dx = 0;
    let dy = 0;

    const keys = keysRef.current;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    const isMoving = dx !== 0 || dy !== 0;
    p.isMoving = isMoving;

    if (isMoving) {
      p.idleTimer = 0;
      p.isMeditating = false;

      // 8-way diagonal normalization
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      // Determine 4/8-way direction
      if (Math.abs(dx) > Math.abs(dy)) {
        p.direction = dx > 0 ? 'right' : 'left';
      } else {
        p.direction = dy > 0 ? 'front' : 'behind';
      }

      // Move player with wall boundary check
      const nextX = p.x + dx * p.speed * dt;
      const nextY = p.y + dy * p.speed * dt;

      const tileX = Math.floor(nextX / 64);
      const tileY = Math.floor(nextY / 64);

      const mapH = currentZoneConfig.tiles.length;
      const mapW = currentZoneConfig.tiles[0]?.length || 0;

      // Wall collision check (tile === 3 is wall)
      if (
        tileX >= 0 &&
        tileX < mapW &&
        tileY >= 0 &&
        tileY < mapH &&
        currentZoneConfig.tiles[tileY][tileX] !== 3
      ) {
        p.x = nextX;
        p.y = nextY;
      } else {
        // Slide on single axis
        const currTileY = Math.floor(p.y / 64);
        if (tileX >= 0 && tileX < mapW && currentZoneConfig.tiles[currTileY][tileX] !== 3) {
          p.x = nextX;
        }
        const currTileX = Math.floor(p.x / 64);
        if (tileY >= 0 && tileY < mapH && currentZoneConfig.tiles[tileY][currTileX] !== 3) {
          p.y = nextY;
        }
      }

      // Animation frame advancement
      p.animTimer += dt;
      if (p.animTimer > 0.12) {
        p.animTimer = 0;
        p.animFrame = (p.animFrame + 1) % 6;
      }

      onPlayerPosChange({ x: p.x, y: p.y });

      // Check portals
      for (const portal of currentZoneConfig.portals) {
        if (Math.hypot(p.x - portal.x, p.y - portal.y) < 48) {
          p.x = portal.targetX;
          p.y = portal.targetY;
          onZoneChange(portal.targetZone, portal.targetX, portal.targetY);
          return;
        }
      }

      // Check spirit spring in SECT (tile 2) -> regenerates Qi rapidly
      const curTX = Math.floor(p.x / 64);
      const curTY = Math.floor(p.y / 64);
      if (
        curTX >= 0 &&
        curTX < mapW &&
        curTY >= 0 &&
        curTY < mapH &&
        currentZoneConfig.tiles[curTY][curTX] === 2
      ) {
        onAddQi(20 * dt);
      }
    } else {
      // Behavior-driven meditation:停步 1.8 秒自动入定
      p.idleTimer += dt;
      if (p.idleTimer >= 1.8) {
        p.isMeditating = true;
        // Meditating in nature gathers environmental Qi!
        onAddQi(8 * dt);
      }

      p.animTimer += dt;
      if (p.animTimer > 0.25) {
        p.animTimer = 0;
        p.animFrame = (p.animFrame + 1) % 4;
      }
    }

    // Update monsters AI
    monstersRef.current.forEach((m) => {
      if (m.isDead) return;
      const dist = Math.hypot(p.x - m.x, p.y - m.y);

      // Aggro within 200px
      if (dist < 200 && dist > 35) {
        const mx = ((p.x - m.x) / dist) * m.speed * 60 * dt;
        const my = ((p.y - m.y) / dist) * m.speed * 60 * dt;
        m.x += mx;
        m.y += my;
        m.direction = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'right' : 'left') : my > 0 ? 'front' : 'behind';
      }

      // Monster attack player within 40px
      if (dist < 45 && Date.now() - m.lastAttack > 1200) {
        m.lastAttack = Date.now();
        const rawDamage = Math.max(5, m.atk - stats.baseDef * 0.3);
        const actualDamage = stats.activeShieldDuration > 0 ? Math.floor(rawDamage * 0.5) : Math.floor(rawDamage);
        soundManager.playHit();
        onDamagePlayer(actualDamage);

        damageNumbersRef.current.push({
          id: Math.random().toString(),
          x: p.x + (Math.random() - 0.5) * 15,
          y: p.y - 25,
          text: `-${actualDamage}`,
          color: '#f87171',
          createdAt: Date.now(),
        });
      }
    });

    // Update projectiles
    projectilesRef.current = projectilesRef.current.filter((proj) => {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.lifetime -= dt;

      if (proj.type === 'sword') {
        // Check collision against monsters
        for (const m of monstersRef.current) {
          if (!m.isDead && Math.hypot(m.x - proj.x, m.y - proj.y) < 35) {
            applyDamageToMonster(m, proj.damage, Math.random() > 0.7);
            return false;
          }
        }
      }
      return proj.lifetime > 0;
    });

    // Clean damage numbers older than 1.2s
    const now = Date.now();
    damageNumbersRef.current = damageNumbersRef.current.filter((dn) => now - dn.createdAt < 1200);
  };

  const render = (timeMs: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const p = playerRef.current;

    // Camera follow with smooth centering
    const camX = p.x - width / 2;
    const camY = p.y - height / 2;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Camera transform
    ctx.translate(-Math.floor(camX), -Math.floor(camY));

    // 1. Render Map Tiles (4-ccdi ground & 2-dclu paths)
    const tiles = currentZoneConfig.tiles;
    const grassImg = getOrLoadImage(ASSET_PATHS.tileGrass);
    const stoneImg = getOrLoadImage(ASSET_PATHS.tileCobblestone);
    const waterImg = getOrLoadImage(ASSET_PATHS.tileWater);
    const wallImg = getOrLoadImage(ASSET_PATHS.tileStoneWall);

    for (let ty = 0; ty < tiles.length; ty++) {
      for (let tx = 0; tx < tiles[ty].length; tx++) {
        const tileType = tiles[ty][tx];
        const px = tx * 64;
        const py = ty * 64;

        // Skip rendering tiles outside camera view
        if (px + 64 < camX || px > camX + width || py + 64 < camY || py > camY + height) {
          continue;
        }

        if (tileType === 0) {
          // Grass
          if (grassImg) ctx.drawImage(grassImg, px, py, 64, 64);
          else {
            ctx.fillStyle = '#166534';
            ctx.fillRect(px, py, 64, 64);
          }
        } else if (tileType === 1) {
          // Cobblestone path
          if (stoneImg) ctx.drawImage(stoneImg, px, py, 64, 64);
          else {
            ctx.fillStyle = '#475569';
            ctx.fillRect(px, py, 64, 64);
          }
        } else if (tileType === 2) {
          // Spirit Spring water pool
          if (waterImg) ctx.drawImage(waterImg, px, py, 64, 64);
          else {
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(px, py, 64, 64);
          }
        } else if (tileType === 3) {
          // Boundary wall
          if (wallImg) ctx.drawImage(wallImg, px, py, 64, 64);
          else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px, py, 64, 64);
          }
        } else {
          // Shrine floor
          ctx.fillStyle = '#334155';
          ctx.fillRect(px, py, 64, 64);
        }
      }
    }

    // 2. Render 16x16 Chunk Grid (if test tool enabled)
    if (showChunkGrid) {
      const chunkSpan = 16 * 64;
      const startCX = Math.floor(camX / chunkSpan);
      const endCX = Math.floor((camX + width) / chunkSpan);
      const startCY = Math.floor(camY / chunkSpan);
      const endCY = Math.floor((camY + height) / chunkSpan);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);

      for (let cx = startCX; cx <= endCX; cx++) {
        for (let cy = startCY; cy <= endCY; cy++) {
          const gx = cx * chunkSpan;
          const gy = cy * chunkSpan;
          ctx.strokeRect(gx, gy, chunkSpan, chunkSpan);

          ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
          ctx.font = '12px monospace';
          ctx.fillText(`Chunk (${cx}, ${cy}) [Active 9]`, gx + 10, gy + 20);
        }
      }
      ctx.setLineDash([]);
    }

    // 3. Render Portals
    currentZoneConfig.portals.forEach((portal) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#f3e8ff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(portal.label, portal.x, portal.y - 30);
      ctx.restore();
    });

    // 4. Render Herbs & Chests
    herbsRef.current.forEach((herb) => {
      if (herb.collected) return;
      ctx.save();
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌱', herb.x, herb.y + 8);

      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(herb.name, herb.x, herb.y - 16);
      ctx.restore();
    });

    chestsRef.current.forEach((chest) => {
      ctx.save();
      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      ctx.fillText(chest.opened ? '📦' : '🎁', chest.x, chest.y + 8);
      ctx.restore();
    });

    // 5. Gather all dynamic entities for Y-Sort Depth Sorting
    type Renderable = {
      y: number;
      footY: number;
      render: () => void;
    };

    const renderables: Renderable[] = [];

    // NPCs
    currentZoneConfig.npcs.forEach((npc) => {
      renderables.push({
        y: npc.y,
        footY: npc.y + 16,
        render: () => {
          const warriorImg = getOrLoadImage(ASSET_PATHS.warriorWalkFront);
          if (warriorImg) {
            // Draw NPC sprite
            ctx.drawImage(warriorImg, 0, 0, 22, 22, npc.x - 24, npc.y - 36, 48, 48);
          } else {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(npc.x - 16, npc.y - 32, 32, 40);
          }

          // Name and title
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`【${npc.title}】${npc.name}`, npc.x, npc.y - 42);

          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px sans-serif';
          ctx.fillText('按 [F] 论道', npc.x, npc.y + 24);

          if (showYSortLines) {
            ctx.strokeStyle = '#c084fc';
            ctx.beginPath();
            ctx.moveTo(npc.x - 20, npc.y + 16);
            ctx.lineTo(npc.x + 20, npc.y + 16);
            ctx.stroke();
          }
        },
      });
    });

    // Monsters
    monstersRef.current.forEach((m) => {
      if (m.isDead) return;
      renderables.push({
        y: m.y,
        footY: m.y + m.height * 0.4,
        render: () => {
          let spritePath = ASSET_PATHS.wargIdle;
          if (m.type === 'bat') spritePath = ASSET_PATHS.batFlyIdle;
          else if (m.type === 'troll') spritePath = ASSET_PATHS.monsterWalkFront;

          const img = getOrLoadImage(spritePath);
          if (img) {
            ctx.drawImage(img, 0, 0, 32, 32, m.x - m.width / 2, m.y - m.height / 2, m.width, m.height);
          } else {
            ctx.fillStyle = m.type === 'boss' ? '#dc2626' : '#ea580c';
            ctx.fillRect(m.x - m.width / 2, m.y - m.height / 2, m.width, m.height);
          }

          // HP bar
          const barW = m.width;
          const hpRatio = Math.max(0, m.hp / m.maxHp);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(m.x - barW / 2, m.y - m.height / 2 - 12, barW, 5);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(m.x - barW / 2, m.y - m.height / 2 - 12, barW * hpRatio, 5);

          // Name
          ctx.fillStyle = '#fecaca';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(m.name, m.x, m.y - m.height / 2 - 16);

          if (showColliders) {
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(m.x - m.width / 2, m.y - m.height / 2, m.width, m.height);
          }
        },
      });
    });

    // Player Cultivator
    renderables.push({
      y: p.y,
      footY: p.y + 16,
      render: () => {
        // Visual Qi Breathing Aura (Whitepaper: 去文字化，以呼吸光晕体现入定与灵气)
        const breathCycle = (Math.sin((timeMs / 1000) * (Math.PI * 2 / 3.2)) + 1) / 2;
        const auraAlpha = p.isMeditating ? 0.2 + breathCycle * 0.45 : 0.08;
        const auraRadius = 38 + breathCycle * 10;

        ctx.save();
        const grad = ctx.createRadialGradient(p.x, p.y - 8, 4, p.x, p.y - 8, auraRadius);
        grad.addColorStop(0, `rgba(251, 191, 36, ${auraAlpha * 1.5})`);
        grad.addColorStop(0.7, `rgba(56, 189, 248, ${auraAlpha})`);
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 8, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // Player Sprite
        let playerImgPath = ASSET_PATHS.playerIdle;
        if (p.isMoving) {
          if (p.direction === 'behind') playerImgPath = ASSET_PATHS.playerWalkBehind;
          else if (p.direction === 'left') playerImgPath = ASSET_PATHS.playerWalkLeft;
          else if (p.direction === 'right') playerImgPath = ASSET_PATHS.playerWalkRight;
          else playerImgPath = ASSET_PATHS.playerWalkFront;
        }

        const playerImg = getOrLoadImage(playerImgPath);
        if (playerImg) {
          const frameH = 17;
          const frameIndex = p.isMoving ? p.animFrame % 7 : p.animFrame % 5;
          ctx.drawImage(
            playerImg,
            0,
            frameIndex * frameH,
            17,
            frameH,
            p.x - 22,
            p.y - 34,
            44,
            44
          );
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(p.x - 16, p.y - 32, 32, 42);
        }

        // Active Shield Visual
        if (stats.activeShieldDuration > 0) {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y - 10, 28, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Meditating icon indicator
        if (p.isMeditating) {
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✨ 吐纳中...', p.x, p.y - 42);
        }

        // Y-Sort footline & collider debug
        if (showYSortLines) {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x - 16, p.y + 16);
          ctx.lineTo(p.x + 16, p.y + 16);
          ctx.stroke();
        }

        if (showColliders) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(p.x - 14, p.y + 6, 28, 14);
        }
        ctx.restore();
      },
    });

    // Execute Y-Sort: sort entities by footY ascending!
    renderables.sort((a, b) => a.footY - b.footY);
    renderables.forEach((r) => r.render());

    // 6. Render Projectiles (Sword aura & thunder)
    projectilesRef.current.forEach((proj) => {
      ctx.save();
      if (proj.type === 'sword') {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Sword blade trail
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(proj.x - proj.vx * 0.05, proj.y - proj.vy * 0.05);
        ctx.lineTo(proj.x, proj.y);
        ctx.stroke();
      } else if (proj.type === 'thunder') {
        // Heavenly Thunder lightning bolt
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y - 180);
        ctx.lineTo(proj.x + 10, proj.y - 100);
        ctx.lineTo(proj.x - 10, proj.y - 40);
        ctx.lineTo(proj.x, proj.y);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 7. Render Floating Damage / Text Numbers
    damageNumbersRef.current.forEach((dn) => {
      const age = (Date.now() - dn.createdAt) / 1000;
      const alpha = Math.max(0, 1 - age / 1.2);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dn.color;
      ctx.font = dn.isCrit ? 'bold 16px sans-serif' : 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dn.text, dn.x, dn.y - age * 30);
      ctx.restore();
    });

    // 8. Minimalist Fengshui Compass (Whitepaper: 罗盘实时渲染)
    ctx.restore(); // Restore camera offset to draw screen-space HUD element

    // Compass in top-right
    ctx.save();
    const compassX = width - 45;
    const compassY = 45;
    ctx.beginPath();
    ctx.arc(compassX, compassY, 26, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.stroke();

    // North needle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 18);
    ctx.lineTo(compassX - 5, compassY);
    ctx.lineTo(compassX + 5, compassY);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(compassX, compassY + 18);
    ctx.lineTo(compassX - 5, compassY);
    ctx.lineTo(compassX + 5, compassY);
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('北', compassX, compassY - 8);
    ctx.restore();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        width={window.innerWidth || 1280}
        height={window.innerHeight || 720}
        className="w-full h-full block pixelated"
      />

      {/* Mobile / Touch Action Controls (Virtual controls) */}
      <div className="absolute bottom-6 right-6 md:hidden flex gap-3 z-20 pointer-events-auto">
        <button
          onClick={() => triggerSpell(0)}
          className="w-14 h-14 rounded-full bg-amber-600/80 active:bg-amber-500 border-2 border-amber-300 text-white font-bold flex items-center justify-center text-xl shadow-lg"
        >
          🗡️
        </button>
        <button
          onClick={() => triggerSpell(1)}
          className="w-14 h-14 rounded-full bg-sky-600/80 active:bg-sky-500 border-2 border-sky-300 text-white font-bold flex items-center justify-center text-xl shadow-lg"
        >
          ⚡
        </button>
        <button
          onClick={checkInteractions}
          className="w-14 h-14 rounded-full bg-emerald-600/80 active:bg-emerald-500 border-2 border-emerald-300 text-white font-bold flex items-center justify-center text-sm shadow-lg"
        >
          交互
        </button>
      </div>
    </div>
  );
};
