import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ItemRarity, MapKey, TowerId } from '../game/types';
import {
  DEFAULT_MAP_UNLOCKS,
  DEFAULT_SETTINGS,
  DEFAULT_TOWER_UNLOCKS,
  FOUNDRY_DROP_BOOST_COSTS,
  FOUNDRY_DROP_BOOST_MAX,
  FOUNDRY_INITIAL_SLOTS_COSTS,
  FOUNDRY_INITIAL_SLOTS_MAX,
  FOUNDRY_REROLL_COSTS,
  FOUNDRY_REROLL_MAX,
  ITEM_UNLOCK_COSTS_BY_RARITY,
  MAP_UNLOCK_RULES,
  MASTERY_COSTS,
  MASTERY_MAX,
  META_VERSION,
  TOWER_UNLOCK_COSTS,
} from './types';
import type { BestRun, MetaState, Settings } from './types';
import { migrate } from './schema';
import { ITEMS } from '../game/items/database';

const COMMON_AND_RARE_ITEM_IDS = Object.values(ITEMS)
  .filter((i) => i.rarity === 'common' || i.rarity === 'rare')
  .map((i) => i.id);

export function defaultMetaState(): MetaState {
  return {
    version: META_VERSION,
    cores: 0,
    essence: 0,
    unlocks: {
      towers: [...DEFAULT_TOWER_UNLOCKS],
      maps: [...DEFAULT_MAP_UNLOCKS],
      items: [...COMMON_AND_RARE_ITEM_IDS],
    },
    mastery: {},
    foundry: { initialSlots: 0, rerollCount: 0, dropRateBoost: {} },
    bestRuns: {},
    totalRuns: 0,
    highestWave: 0,
    settings: { ...DEFAULT_SETTINGS },
  };
}

export interface MetaActions {
  addCores: (n: number) => void;
  spendCores: (n: number) => boolean;
  addEssence: (n: number) => void;
  spendEssence: (n: number) => boolean;
  unlockTower: (id: TowerId) => boolean;
  unlockMap: (key: MapKey) => void;
  unlockItem: (id: string) => boolean;
  upgradeMastery: (id: TowerId) => boolean;
  buyInitialSlots: () => boolean;
  buyRerollCount: () => boolean;
  buyDropBoost: (rarity: ItemRarity) => boolean;
  recordRun: (mapKey: MapKey, run: { wave: number; score: number; durationMs: number }) => void;
  applyMapUnlocksAfterRun: () => void;
  setSettings: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const useMetaStore = create<MetaState & MetaActions>()(
  persist(
    (set, get) => ({
      ...defaultMetaState(),

      addCores: (n) => set((s) => ({ cores: s.cores + Math.max(0, Math.floor(n)) })),
      spendCores: (n) => {
        if (n <= 0) return true;
        const s = get();
        if (s.cores < n) return false;
        set({ cores: s.cores - n });
        return true;
      },

      addEssence: (n) => set((s) => ({ essence: s.essence + Math.max(0, Math.floor(n)) })),
      spendEssence: (n) => {
        if (n <= 0) return true;
        const s = get();
        if (s.essence < n) return false;
        set({ essence: s.essence - n });
        return true;
      },

      unlockTower: (id) => {
        const s = get();
        if (s.unlocks.towers.includes(id)) return false;
        const cost = TOWER_UNLOCK_COSTS[id];
        if (cost == null) return false;
        if (!get().spendCores(cost)) return false;
        set({ unlocks: { ...s.unlocks, towers: [...s.unlocks.towers, id] } });
        return true;
      },

      unlockMap: (key) => {
        const s = get();
        if (s.unlocks.maps.includes(key)) return;
        set({ unlocks: { ...s.unlocks, maps: [...s.unlocks.maps, key] } });
      },

      unlockItem: (id) => {
        const s = get();
        if (s.unlocks.items.includes(id)) return false;
        const def = ITEMS[id];
        if (!def) return false;
        const cost = ITEM_UNLOCK_COSTS_BY_RARITY[def.rarity];
        if (cost > 0 && !get().spendEssence(cost)) return false;
        set({ unlocks: { ...s.unlocks, items: [...s.unlocks.items, id] } });
        return true;
      },

      upgradeMastery: (id) => {
        const s = get();
        const cur = s.mastery[id] ?? 0;
        if (cur >= MASTERY_MAX) return false;
        const cost = MASTERY_COSTS[cur];
        if (!get().spendCores(cost)) return false;
        set({ mastery: { ...s.mastery, [id]: cur + 1 } });
        return true;
      },

      buyInitialSlots: () => {
        const s = get();
        if (s.foundry.initialSlots >= FOUNDRY_INITIAL_SLOTS_MAX) return false;
        const cost = FOUNDRY_INITIAL_SLOTS_COSTS[s.foundry.initialSlots];
        if (!get().spendEssence(cost)) return false;
        set({ foundry: { ...s.foundry, initialSlots: s.foundry.initialSlots + 1 } });
        return true;
      },

      buyRerollCount: () => {
        const s = get();
        if (s.foundry.rerollCount >= FOUNDRY_REROLL_MAX) return false;
        const cost = FOUNDRY_REROLL_COSTS[s.foundry.rerollCount];
        if (!get().spendEssence(cost)) return false;
        set({ foundry: { ...s.foundry, rerollCount: s.foundry.rerollCount + 1 } });
        return true;
      },

      buyDropBoost: (rarity) => {
        const s = get();
        const cur = s.foundry.dropRateBoost[rarity] ?? 0;
        if (cur >= FOUNDRY_DROP_BOOST_MAX) return false;
        const cost = FOUNDRY_DROP_BOOST_COSTS[rarity];
        if (cost == null) return false;
        if (!get().spendEssence(cost)) return false;
        set({
          foundry: {
            ...s.foundry,
            dropRateBoost: { ...s.foundry.dropRateBoost, [rarity]: cur + 1 },
          },
        });
        return true;
      },

      recordRun: (mapKey, run) => {
        const s = get();
        const prev = s.bestRuns[mapKey];
        const isBetter = !prev || run.wave > prev.wave || (run.wave === prev.wave && run.score > prev.score);
        const next: BestRun = {
          wave: run.wave,
          score: run.score,
          durationMs: run.durationMs,
          date: new Date().toISOString(),
        };
        set({
          bestRuns: isBetter ? { ...s.bestRuns, [mapKey]: next } : s.bestRuns,
          totalRuns: s.totalRuns + 1,
          highestWave: Math.max(s.highestWave, run.wave),
        });
        get().applyMapUnlocksAfterRun();
      },

      applyMapUnlocksAfterRun: () => {
        const s = get();
        const next = [...s.unlocks.maps];
        let changed = false;
        for (const [key, rule] of Object.entries(MAP_UNLOCK_RULES) as [MapKey, { afterRuns?: number; afterWave?: number }][]) {
          if (next.includes(key)) continue;
          if (rule.afterRuns != null && s.totalRuns >= rule.afterRuns) { next.push(key); changed = true; }
          else if (rule.afterWave != null && s.highestWave >= rule.afterWave) { next.push(key); changed = true; }
        }
        if (changed) set({ unlocks: { ...s.unlocks, maps: next } });
      },

      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      reset: () => set(defaultMetaState()),
    }),
    {
      name: 'minimaltd:meta',
      storage: createJSONStorage(() => localStorage),
      version: META_VERSION,
      migrate: (persisted, version) => {
        const migrated = migrate(persisted, version);
        return migrated ?? defaultMetaState();
      },
    },
  ),
);
