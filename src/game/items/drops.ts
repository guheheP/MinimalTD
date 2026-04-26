import type { ItemCategory, ItemDef, ItemRarity } from '../types';
import { ITEM_LIST } from './database';

const BASE_RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  mythic: 1,
};

// Per-step weight added to BASE_RARITY_WEIGHTS for each Foundry boost purchased.
// Higher rarities get smaller per-step deltas, so a single rare boost has a
// larger effect on the rare slice than a single mythic boost has on mythic.
const BOOST_WEIGHT_PER_STEP: Record<ItemRarity, number> = {
  common: 0,
  rare: 4,
  epic: 3,
  legendary: 2,
  mythic: 1,
};

const RARITY_ORDER: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

const NON_RELIC_CATEGORIES: readonly ItemCategory[] = ['tower-mod', 'unique', 'conditional'];

export interface DropOptions {
  unlocked?: ReadonlySet<string>;
  boosts?: Partial<Record<ItemRarity, number>>;
  // Constrain the pool to one or more categories. Used by the relic-only draft
  // (category: 'relic') and per-enemy drops (category: NON_RELIC_CATEGORIES).
  category?: ItemCategory | readonly ItemCategory[];
}

function effectiveWeights(boosts?: Partial<Record<ItemRarity, number>>): Record<ItemRarity, number> {
  if (!boosts) return BASE_RARITY_WEIGHTS;
  return {
    common: BASE_RARITY_WEIGHTS.common + (boosts.common ?? 0) * BOOST_WEIGHT_PER_STEP.common,
    rare: BASE_RARITY_WEIGHTS.rare + (boosts.rare ?? 0) * BOOST_WEIGHT_PER_STEP.rare,
    epic: BASE_RARITY_WEIGHTS.epic + (boosts.epic ?? 0) * BOOST_WEIGHT_PER_STEP.epic,
    legendary: BASE_RARITY_WEIGHTS.legendary + (boosts.legendary ?? 0) * BOOST_WEIGHT_PER_STEP.legendary,
    mythic: BASE_RARITY_WEIGHTS.mythic + (boosts.mythic ?? 0) * BOOST_WEIGHT_PER_STEP.mythic,
  };
}

function weightedPickRarity(
  rng: () => number,
  floor: ItemRarity = 'common',
  weights: Record<ItemRarity, number> = BASE_RARITY_WEIGHTS,
): ItemRarity {
  const startIdx = RARITY_ORDER.indexOf(floor);
  const eligible = RARITY_ORDER.slice(startIdx);
  const total = eligible.reduce((s, r) => s + weights[r], 0);
  let roll = rng() * total;
  for (const r of eligible) {
    roll -= weights[r];
    if (roll < 0) return r;
  }
  return eligible[eligible.length - 1];
}

function categoryMatcher(
  category: ItemCategory | readonly ItemCategory[] | undefined,
): (item: ItemDef) => boolean {
  if (!category) return () => true;
  const allowed = Array.isArray(category) ? category : [category as ItemCategory];
  return (item) => allowed.includes(item.category);
}

function rollItem(
  rng: () => number,
  floor: ItemRarity = 'common',
  options?: DropOptions,
): ItemDef {
  const weights = effectiveWeights(options?.boosts);
  const rarity = weightedPickRarity(rng, floor, weights);
  const matchesCategory = categoryMatcher(options?.category);
  let pool = ITEM_LIST.filter((i) => i.rarity === rarity && matchesCategory(i));
  if (options?.unlocked) {
    pool = pool.filter((i) => options.unlocked!.has(i.id));
  }
  if (pool.length === 0) {
    // Fallback: any unlocked item that still matches the category, else any
    // common item that matches the category. Category constraint takes
    // priority over rarity floor — a relic-only draft must never silently
    // hand back a tower-mod.
    const unlocked = options?.unlocked;
    const fallback = (unlocked
      ? ITEM_LIST.filter((i) => unlocked.has(i.id))
      : ITEM_LIST.filter((i) => i.rarity === 'common')
    ).filter(matchesCategory);
    if (fallback.length === 0) {
      const last = ITEM_LIST.filter(matchesCategory);
      if (last.length === 0) return ITEM_LIST.find((i) => i.rarity === 'common')!;
      return last[Math.floor(rng() * last.length)];
    }
    return fallback[Math.floor(rng() * fallback.length)];
  }
  return pool[Math.floor(rng() * pool.length)];
}

// 5-wave draft: `count` distinct items.
export function rollDraft(
  rng: () => number = Math.random,
  count = 3,
  options?: DropOptions,
): ItemDef[] {
  const out: ItemDef[] = [];
  const seenIds = new Set<string>();
  let safety = 0;
  while (out.length < count && safety++ < 50) {
    const item = rollItem(rng, 'common', options);
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    out.push(item);
  }
  return out;
}

// Boss-chest rarity floor scales with wave milestone.
function bossChestFloor(wave: number): ItemRarity {
  if (wave >= 100) return 'mythic';
  if (wave >= 50) return 'legendary';
  if (wave >= 30) return 'epic';
  return 'rare';
}

export function rollBossChest(
  rng: () => number = Math.random,
  wave: number,
  options?: DropOptions,
): ItemDef {
  return rollItem(rng, bossChestFloor(wave), options);
}

// Boss kills now grant a fixed number of items (typically 2). Each is rolled
// independently against the wave's rarity floor — duplicates are allowed,
// which feels fine for a single-modal reveal.
export function rollBossLoot(
  rng: () => number = Math.random,
  wave: number,
  count = 2,
  options?: DropOptions,
): ItemDef[] {
  const out: ItemDef[] = [];
  for (let i = 0; i < count; i++) {
    out.push(rollItem(rng, bossChestFloor(wave), options));
  }
  return out;
}

// Per-enemy drop: low-probability single item from the non-relic pool.
// Relics stay exclusive to the 5-wave draft.
export function rollEnemyDrop(
  rng: () => number = Math.random,
  options?: DropOptions,
): ItemDef {
  return rollItem(rng, 'common', { ...options, category: NON_RELIC_CATEGORIES });
}

// Exposed for tests.
export const _internals = { weightedPickRarity, rollItem, bossChestFloor, BASE_RARITY_WEIGHTS, effectiveWeights };
// Backward-compat: tests may import RARITY_WEIGHTS via _internals.
Object.defineProperty(_internals, 'RARITY_WEIGHTS', { value: BASE_RARITY_WEIGHTS });
