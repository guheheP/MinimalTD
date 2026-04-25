import type { TowerId } from './types';
import { TOWER_DEFS } from './towers';

// Per-tower cumulative costs at each level (LV1..LV5).
// Index 0 = base cost (matches TOWER_DEFS[id].cost).
// Index 1..4 = upgrade cost from LV1→LV2, LV2→LV3, etc.
const UPGRADE_COSTS: Record<TowerId, readonly [number, number, number, number, number]> = {
  basic:  [50,  60,  100, 160, 250],
  sniper: [120, 140, 220, 350, 550],
  cannon: [160, 180, 280, 450, 700],
  frost:  [100, 120, 200, 300, 480],
  multi:  [180, 220, 340, 540, 850],
  venom:  [140, 160, 260, 400, 640],
  shock:  [220, 260, 400, 640, 1000],
  beacon: [160, 180, 280, 450, 700],
};

export const MAX_LEVEL = 5;

// Sell rate: 70% of total spent (PLAN.md §1.3).
const SELL_RATE = 0.7;

export function getBaseCost(towerId: TowerId): number {
  return UPGRADE_COSTS[towerId][0];
}

// Cost to upgrade from currentLevel → currentLevel+1.
// Returns Infinity if already at MAX_LEVEL.
export function getUpgradeCost(towerId: TowerId, currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return Infinity;
  return UPGRADE_COSTS[towerId][currentLevel];
}

// Total spent on a tower at a given level (base + all upgrades to date).
export function getTotalSpent(towerId: TowerId, level: number): number {
  const costs = UPGRADE_COSTS[towerId];
  let sum = 0;
  for (let i = 0; i < level && i < costs.length; i++) sum += costs[i];
  return sum;
}

// Sell value: 70% of total spent, floored.
export function getSellValue(towerId: TowerId, level: number): number {
  return Math.floor(getTotalSpent(towerId, level) * SELL_RATE);
}

// Wave-clear cash bonus (40 + wave * 8).
export function getWaveBonus(wave: number): number {
  return 40 + wave * 8;
}

// Sanity check: TOWER_DEFS.cost must match UPGRADE_COSTS[id][0]. Dev-only.
if (import.meta.env?.DEV) {
  for (const id in TOWER_DEFS) {
    const tid = id as TowerId;
    if (TOWER_DEFS[tid].cost !== UPGRADE_COSTS[tid][0]) {
      console.warn(
        `[economy] Cost desync for ${tid}: TOWER_DEFS=${TOWER_DEFS[tid].cost}, UPGRADE_COSTS=${UPGRADE_COSTS[tid][0]}`,
      );
    }
  }
}
