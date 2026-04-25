import type { ItemDef, ItemRarity } from '../types';
import { ITEM_LIST } from './database';

const BASE_RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  mythic: 1,
};

const RARITY_ORDER: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

export interface DropOptions {
  unlocked?: ReadonlySet<string>;
  boosts?: Partial<Record<ItemRarity, number>>;
}

function effectiveWeights(boosts?: Partial<Record<ItemRarity, number>>): Record<ItemRarity, number> {
  if (!boosts) return BASE_RARITY_WEIGHTS;
  return {
    common: BASE_RARITY_WEIGHTS.common + (boosts.common ?? 0),
    rare: BASE_RARITY_WEIGHTS.rare + (boosts.rare ?? 0),
    epic: BASE_RARITY_WEIGHTS.epic + (boosts.epic ?? 0),
    legendary: BASE_RARITY_WEIGHTS.legendary + (boosts.legendary ?? 0),
    mythic: BASE_RARITY_WEIGHTS.mythic + (boosts.mythic ?? 0),
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

function rollItem(
  rng: () => number,
  floor: ItemRarity = 'common',
  options?: DropOptions,
): ItemDef {
  const weights = effectiveWeights(options?.boosts);
  const rarity = weightedPickRarity(rng, floor, weights);
  let pool = ITEM_LIST.filter((i) => i.rarity === rarity);
  if (options?.unlocked) {
    pool = pool.filter((i) => options.unlocked!.has(i.id));
  }
  if (pool.length === 0) {
    // Fallback: any unlocked item, else any common item.
    const unlocked = options?.unlocked;
    const fallback = unlocked
      ? ITEM_LIST.filter((i) => unlocked.has(i.id))
      : ITEM_LIST.filter((i) => i.rarity === 'common');
    if (fallback.length === 0) return ITEM_LIST.find((i) => i.rarity === 'common')!;
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

// Exposed for tests.
export const _internals = { weightedPickRarity, rollItem, bossChestFloor, BASE_RARITY_WEIGHTS, effectiveWeights };
// Backward-compat: tests may import RARITY_WEIGHTS via _internals.
Object.defineProperty(_internals, 'RARITY_WEIGHTS', { value: BASE_RARITY_WEIGHTS });
