import type { ComputedTowerEffect, ItemEffect, PlacedTower, RunInventory, TowerId } from '../types';
import { getItem } from './database';

// Cumulative dmg bonus per Tower Mastery LV0..LV5 (Phase 4 meta progression).
const MASTERY_BONUS = [0, 0.05, 0.15, 0.30, 0.55, 0.95] as const;

export function masteryDmgMul(level: number): number {
  return 1 + (MASTERY_BONUS[level] ?? 0);
}

export function emptyEffect(): ComputedTowerEffect {
  return {
    dmgMul: 1, dmgAdd: 0,
    rngMul: 1, rngAdd: 0,
    rofMul: 1, rofAdd: 0,
    splashRangeMul: 1,
    scatterTargetsAdd: 0,
    chainBouncesAdd: 0,
    poisonStackMul: 1,
    freezeStrengthAdd: 0,
    beaconRangeMul: 1,
    beaconBuffAdd: 0,
    ignoreArmor: false,
    endlessPoison: false,
    killCashChance: 0,
    killCashAmount: 0,
  };
}

function fold(target: ComputedTowerEffect, e: ItemEffect, isBossWave: boolean): void {
  if (e.dmgMul) target.dmgMul *= e.dmgMul;
  if (e.dmgAdd) target.dmgAdd += e.dmgAdd;
  if (e.rngMul) target.rngMul *= e.rngMul;
  if (e.rngAdd) target.rngAdd += e.rngAdd;
  if (e.rofMul) target.rofMul *= e.rofMul;
  if (e.rofAdd) target.rofAdd += e.rofAdd;
  if (e.splashRangeMul) target.splashRangeMul *= e.splashRangeMul;
  if (e.scatterTargetsAdd) target.scatterTargetsAdd += e.scatterTargetsAdd;
  if (e.chainBouncesAdd) target.chainBouncesAdd += e.chainBouncesAdd;
  if (e.poisonStackMul) target.poisonStackMul *= e.poisonStackMul;
  if (e.freezeStrengthAdd) target.freezeStrengthAdd += e.freezeStrengthAdd;
  if (e.beaconRangeMul) target.beaconRangeMul *= e.beaconRangeMul;
  if (e.beaconBuffAdd) target.beaconBuffAdd += e.beaconBuffAdd;
  if (e.ignoreArmor) target.ignoreArmor = true;
  if (e.endlessPoison) target.endlessPoison = true;
  if (e.killCashChance && e.killCashChance > target.killCashChance) {
    target.killCashChance = e.killCashChance;
    target.killCashAmount = Math.max(target.killCashAmount, e.killCashAmount ?? 0);
  }
  if (isBossWave && e.bossWaveDmgMul) {
    target.dmgMul *= e.bossWaveDmgMul;
  }
}

// Aggregate a tower's effect state from the run inventory.
// - Items equipped to this specific tower are applied (must match scope = towerId or 'any').
// - Passive items (relic/unique/conditional that aren't equipped) apply globally to every tower.
//   tower-mod items only apply when explicitly equipped.
export function computeTowerEffect(
  tower: PlacedTower,
  inventory: RunInventory,
  ctx: { isBossWave: boolean },
): ComputedTowerEffect {
  const out = emptyEffect();
  for (const owned of inventory.items) {
    const item = getItem(owned.itemId);
    if (!item) continue;
    const isEquippedHere = owned.equippedTo === tower.id;
    const isPassive = !owned.equippedTo && item.category !== 'tower-mod';
    if (!isEquippedHere && !isPassive) continue;
    if (item.scope !== 'any' && item.scope !== tower.towerId) continue;
    fold(out, item.effect, ctx.isBossWave);
  }
  return out;
}

export function computeAllTowerEffects(
  towers: readonly PlacedTower[],
  inventory: RunInventory,
  ctx: { isBossWave: boolean },
): Map<string, ComputedTowerEffect> {
  const map = new Map<string, ComputedTowerEffect>();
  for (const t of towers) map.set(t.id, computeTowerEffect(t, inventory, ctx));
  return map;
}

// Aggregate only passive (relic/unique/conditional) effects from un-equipped items.
// These apply globally regardless of any tower's existence.
export function computePassiveEffect(
  inventory: RunInventory,
  ctx: { isBossWave: boolean },
): ComputedTowerEffect {
  const out = emptyEffect();
  for (const owned of inventory.items) {
    if (owned.equippedTo) continue;
    const item = getItem(owned.itemId);
    if (!item || item.category === 'tower-mod') continue;
    fold(out, item.effect, ctx.isBossWave);
  }
  return out;
}

// Un-equipped tower-mod items whose scope matches this tower.
export function eligibleItemsForTower(towerId: TowerId, inventory: RunInventory): string[] {
  const out: string[] = [];
  for (const owned of inventory.items) {
    if (owned.equippedTo) continue;
    const item = getItem(owned.itemId);
    if (!item || item.category !== 'tower-mod') continue;
    if (item.scope === 'any' || item.scope === towerId) out.push(owned.uid);
  }
  return out;
}
