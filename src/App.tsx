import React, { useState, useEffect } from 'react';
import {
  MapZone,
  PlayerStats,
  Item,
  NPC,
  HerbNode,
  ChestNode,
  Monster,
} from './types/game';
import {
  REALMS,
  INITIAL_ITEMS,
  INITIAL_SPELLS,
  INITIAL_QUESTS,
} from './data/constants';
import { generateZones } from './utils/worldData';
import { preloadCoreAssets } from './utils/sprites';
import { soundManager } from './utils/audio';

import { GameCanvas } from './components/GameCanvas';
import { TopNav } from './components/TopNav';
import { BottomSpellBar } from './components/BottomSpellBar';
import { CultivationModal } from './components/CultivationModal';
import { InventoryModal } from './components/InventoryModal';
import { AlchemyModal } from './components/AlchemyModal';
import { QuestModal } from './components/QuestModal';
import { DialogueModal } from './components/DialogueModal';
import { TribulationOverlay } from './components/TribulationOverlay';
import { DevToolsPanel } from './components/DevToolsPanel';
import { RustCodeViewer } from './components/RustCodeViewer';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Initial State Setup
  const [zones] = useState(() => generateZones());
  const [currentZoneId, setCurrentZoneId] = useState<MapZone>('SECT');

  const [stats, setStats] = useState<PlayerStats>({
    name: '青城剑修',
    realmIndex: 2, // Start at 炼气期六层
    currentQi: 320,
    maxQi: 500,
    currentHp: 280,
    maxHp: 280,
    baseAtk: 45,
    baseDef: 22,
    spiritStones: 260,
    spiritualRoot: '变异风雷天灵根',
    equippedWeapon: INITIAL_ITEMS['weapon_iron_sword'] || null,
    equippedArmor: INITIAL_ITEMS['armor_taoist_robe'] || null,
    activeShieldDuration: 0,
  });

  const [inventory, setInventory] = useState<Record<string, Item>>(() => ({
    ...INITIAL_ITEMS,
  }));

  const [quests, setQuests] = useState(() => [...INITIAL_QUESTS]);
  const [spells, setSpells] = useState(() => [...INITIAL_SPELLS]);

  const [playerPos, setPlayerPos] = useState({ x: 10 * 64, y: 9 * 64 });

  // 2. Modals & DevTools State
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [showCultivation, setShowCultivation] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showAlchemy, setShowAlchemy] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showTribulation, setShowTribulation] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showRustViewer, setShowRustViewer] = useState(false);

  // 3. Debug Overlays (Whitepaper ECS verification)
  const [showColliders, setShowColliders] = useState(false);
  const [showYSortLines, setShowYSortLines] = useState(false);
  const [showChunkGrid, setShowChunkGrid] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Preload assets on mount
  useEffect(() => {
    preloadCoreAssets();
  }, []);

  const currentZoneConfig = zones[currentZoneId];

  // Shield duration countdown
  useEffect(() => {
    if (stats.activeShieldDuration > 0) {
      const timer = setTimeout(() => {
        setStats((prev) => ({
          ...prev,
          activeShieldDuration: Math.max(0, prev.activeShieldDuration - 500),
        }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stats.activeShieldDuration]);

  // Handle Zone Change
  const handleZoneChange = (zone: MapZone, targetX: number, targetY: number) => {
    setCurrentZoneId(zone);
    setPlayerPos({ x: targetX, y: targetY });
    soundManager.playSwordSlash();
  };

  // Add Qi
  const handleAddQi = (amount: number) => {
    setStats((prev) => ({
      ...prev,
      currentQi: Math.min(prev.maxQi, prev.currentQi + amount),
    }));
  };

  // Breakthrough without tribulation
  const handleBreakthrough = () => {
    setStats((prev) => {
      const nextIdx = prev.realmIndex + 1;
      const nextRealm = REALMS[nextIdx];
      if (!nextRealm) return prev;
      return {
        ...prev,
        realmIndex: nextIdx,
        currentQi: 0,
        maxQi: nextRealm.maxQi,
        maxHp: prev.maxHp + nextRealm.bonusHp,
        currentHp: prev.maxHp + nextRealm.bonusHp,
        baseAtk: prev.baseAtk + nextRealm.bonusAtk,
        baseDef: prev.baseDef + nextRealm.bonusDef,
      };
    });

    // Check quest 4
    updateQuestProgress('q4', 1);
  };

  // Tribulation success
  const handleTribulationSuccess = () => {
    setShowTribulation(false);
    handleBreakthrough();
  };

  const handleTribulationFailed = (damageTaken: number) => {
    setShowTribulation(false);
    setStats((prev) => ({
      ...prev,
      currentHp: Math.max(1, prev.currentHp - damageTaken),
    }));
  };

  // Craft Pill
  const handleCraftPill = (
    targetItemId: string,
    count: number,
    consumedHerbs: { itemId: string; count: number }[]
  ) => {
    setInventory((prev) => {
      const updated = { ...prev };
      // Consume herbs
      consumedHerbs.forEach((req) => {
        if (updated[req.itemId]) {
          updated[req.itemId] = {
            ...updated[req.itemId],
            count: Math.max(0, updated[req.itemId].count - req.count),
          };
        }
      });
      // Add pill
      if (updated[targetItemId]) {
        updated[targetItemId] = {
          ...updated[targetItemId],
          count: updated[targetItemId].count + count,
        };
      } else if (INITIAL_ITEMS[targetItemId]) {
        updated[targetItemId] = {
          ...INITIAL_ITEMS[targetItemId],
          count,
        };
      }
      return updated;
    });

    updateQuestProgress('q3', count);
  };

  // Use Item
  const handleUseItem = (item: Item) => {
    if (item.count <= 0) return;

    setInventory((prev) => ({
      ...prev,
      [item.id]: {
        ...prev[item.id],
        count: prev[item.id].count - 1,
      },
    }));

    setStats((prev) => {
      const hp = item.effect?.hpRestore ? Math.min(prev.maxHp, prev.currentHp + item.effect.hpRestore) : prev.currentHp;
      const qi = item.effect?.qiRestore ? Math.min(prev.maxQi, prev.currentQi + item.effect.qiRestore) : prev.currentQi;
      return {
        ...prev,
        currentHp: hp,
        currentQi: qi,
      };
    });
  };

  // Equip Item
  const handleEquipItem = (item: Item) => {
    setStats((prev) => {
      if (item.type === 'weapon') {
        const diff = (item.effect?.atkBonus || 0) - (prev.equippedWeapon?.effect?.atkBonus || 0);
        return {
          ...prev,
          equippedWeapon: item,
          baseAtk: prev.baseAtk + diff,
        };
      }
      if (item.type === 'armor') {
        const diff = (item.effect?.defBonus || 0) - (prev.equippedArmor?.effect?.defBonus || 0);
        return {
          ...prev,
          equippedArmor: item,
          baseDef: prev.baseDef + diff,
        };
      }
      return prev;
    });
  };

  // Collect Herb
  const handleCollectHerb = (herb: HerbNode) => {
    setInventory((prev) => {
      const cur = prev[herb.itemId] || INITIAL_ITEMS[herb.itemId];
      if (!cur) return prev;
      return {
        ...prev,
        [herb.itemId]: {
          ...cur,
          count: (cur.count || 0) + 1,
        },
      };
    });

    updateQuestProgress('q1', 1);
  };

  // Open Chest
  const handleOpenChest = (chest: ChestNode) => {
    setStats((prev) => ({
      ...prev,
      spiritStones: prev.spiritStones + chest.spiritStones,
    }));

    setInventory((prev) => {
      const updated = { ...prev };
      chest.items.forEach(({ itemId, count }) => {
        const itemDef = INITIAL_ITEMS[itemId];
        if (itemDef) {
          updated[itemId] = {
            ...itemDef,
            count: (updated[itemId]?.count || 0) + count,
          };
        }
      });
      return updated;
    });
  };

  // Monster Defeated
  const handleMonsterDefeated = (monster: Monster) => {
    setStats((prev) => ({
      ...prev,
      spiritStones: prev.spiritStones + monster.spiritStonesReward,
      currentQi: Math.min(prev.maxQi, prev.currentQi + monster.expReward),
    }));

    // Drops
    monster.lootTable.forEach((drop) => {
      if (Math.random() <= drop.dropRate) {
        setInventory((prev) => {
          const itemDef = INITIAL_ITEMS[drop.itemId];
          if (!itemDef) return prev;
          return {
            ...prev,
            [drop.itemId]: {
              ...itemDef,
              count: (prev[drop.itemId]?.count || 0) + 1,
            },
          };
        });
      }
    });

    if (monster.type === 'warg') {
      updateQuestProgress('q2', 1);
    }
  };

  // Update Quest
  const updateQuestProgress = (questId: string, addAmount: number) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && !q.completed) {
          const newCount = q.currentCount + addAmount;
          return {
            ...q,
            currentCount: newCount,
            completed: newCount >= q.requiredCount,
          };
        }
        return q;
      })
    );
  };

  // Claim Quest Reward
  const handleClaimQuest = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && !q.claimed) {
          setStats((s) => ({
            ...s,
            spiritStones: s.spiritStones + q.rewardStones,
            currentQi: Math.min(s.maxQi, s.currentQi + q.rewardExp),
          }));
          return { ...q, claimed: true };
        }
        return q;
      })
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top HUD */}
      <TopNav
        stats={stats}
        zoneName={currentZoneConfig.name}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          soundManager.enabled = !soundEnabled;
          setSoundEnabled(!soundEnabled);
        }}
        onOpenCultivation={() => setShowCultivation(true)}
        onOpenInventory={() => setShowInventory(true)}
        onOpenAlchemy={() => setShowAlchemy(true)}
        onOpenQuests={() => setShowQuests(true)}
        onToggleDevTools={() => setShowDevTools(!showDevTools)}
        showDevTools={showDevTools}
      />

      {/* Main 2D Canvas Game World */}
      <GameCanvas
        stats={stats}
        currentZoneConfig={currentZoneConfig}
        spells={spells}
        showColliders={showColliders}
        showYSortLines={showYSortLines}
        showChunkGrid={showChunkGrid}
        onPlayerPosChange={setPlayerPos}
        onZoneChange={handleZoneChange}
        onInteractNPC={(npc) => setActiveNPC(npc)}
        onCollectHerb={handleCollectHerb}
        onOpenChest={handleOpenChest}
        onDamagePlayer={(dmg) =>
          setStats((prev) => ({
            ...prev,
            currentHp: Math.max(0, prev.currentHp - dmg),
          }))
        }
        onAddQi={handleAddQi}
        onMonsterDefeated={handleMonsterDefeated}
        onCastSpellCost={(cost) =>
          setStats((prev) => ({
            ...prev,
            currentQi: Math.max(0, prev.currentQi - cost),
          }))
        }
      />

      {/* Bottom Spell & Control Bar */}
      <BottomSpellBar spells={spells} currentQi={stats.currentQi} />

      {/* Floating DevTools Panel (ECS Test Tool Mode) */}
      {showDevTools && (
        <div className="absolute top-20 right-4 z-40">
          <DevToolsPanel
            stats={stats}
            currentZone={currentZoneId}
            playerPos={playerPos}
            showColliders={showColliders}
            showYSortLines={showYSortLines}
            showChunkGrid={showChunkGrid}
            onToggleColliders={() => setShowColliders(!showColliders)}
            onToggleYSortLines={() => setShowYSortLines(!showYSortLines)}
            onToggleChunkGrid={() => setShowChunkGrid(!showChunkGrid)}
            onTeleport={(zone) => {
              const def = zones[zone];
              handleZoneChange(zone, Math.floor(def.width / 2) * 64, Math.floor(def.height / 2) * 64);
            }}
            onAddQi={(amt) => handleAddQi(amt)}
            onAddStones={(amt) =>
              setStats((s) => ({ ...s, spiritStones: s.spiritStones + amt }))
            }
            onResetHp={() =>
              setStats((s) => ({ ...s, currentHp: s.maxHp }))
            }
            onOpenRustCode={() => setShowRustViewer(true)}
          />
        </div>
      )}

      {/* Rust Source Code Viewer Modal */}
      {showRustViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl h-[85vh] flex flex-col">
            <button
              onClick={() => setShowRustViewer(false)}
              className="absolute -top-3 -right-3 z-50 p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <RustCodeViewer />
          </div>
        </div>
      )}

      {/* Cultivation Modal */}
      {showCultivation && (
        <CultivationModal
          stats={stats}
          onClose={() => setShowCultivation(false)}
          onMeditate={(amt) => handleAddQi(amt)}
          onBreakthrough={handleBreakthrough}
          onStartTribulation={() => setShowTribulation(true)}
        />
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <InventoryModal
          inventory={inventory}
          stats={stats}
          onClose={() => setShowInventory(false)}
          onUseItem={handleUseItem}
          onEquipItem={handleEquipItem}
        />
      )}

      {/* Alchemy Cauldron Modal */}
      {showAlchemy && (
        <AlchemyModal
          inventory={inventory}
          onClose={() => setShowAlchemy(false)}
          onCraftPill={handleCraftPill}
        />
      )}

      {/* Quests Modal */}
      {showQuests && (
        <QuestModal
          quests={quests}
          onClose={() => setShowQuests(false)}
          onClaimQuest={handleClaimQuest}
        />
      )}

      {/* NPC Dialogue Modal */}
      {activeNPC && (
        <DialogueModal
          npc={activeNPC}
          onClose={() => setActiveNPC(null)}
          onOpenAlchemy={() => setShowAlchemy(true)}
          onOpenQuests={() => setShowQuests(true)}
        />
      )}

      {/* Heavenly Lightning Tribulation Overlay */}
      {showTribulation && (
        <TribulationOverlay
          currentRealmName={REALMS[stats.realmIndex]?.name || '炼气期'}
          nextRealm={REALMS[stats.realmIndex + 1] || REALMS[stats.realmIndex]}
          playerHp={stats.currentHp}
          playerDef={stats.baseDef}
          onSuccess={handleTribulationSuccess}
          onFailed={handleTribulationFailed}
        />
      )}
    </div>
  );
};

export default App;
