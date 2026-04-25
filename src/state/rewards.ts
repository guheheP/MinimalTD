import type { ItemRarity } from '../game/types';

export function calcCoresEarned(reachedWave: number, score: number): number {
  let cores = Math.floor(reachedWave * 2 + score / 5000);
  if (reachedWave >= 25) cores += 50;
  if (reachedWave >= 50) cores += 150;
  if (reachedWave >= 100) cores += 500;
  return Math.max(0, cores);
}

const RARITY_ESSENCE: Record<ItemRarity, number> = {
  common: 1,
  rare: 5,
  epic: 25,
  legendary: 100,
  mythic: 500,
};

export function calcEssenceEarned(rarityCounts: Record<ItemRarity, number>): number {
  return (Object.entries(rarityCounts) as [ItemRarity, number][]).reduce(
    (sum, [r, c]) => sum + RARITY_ESSENCE[r] * c,
    0,
  );
}

export const RARITY_ESSENCE_VALUES = RARITY_ESSENCE;
