import type { AuraEffect, PlacedTower } from './types';
import { beaconAuraBuff, beaconAuraRange } from './towers';

const MAX_AURA_BONUS = 0.6;

export interface BeaconModifier {
  rangeMul: number;
  buffAdd: number;
}

// Compute the per-tower damage multiplier from all BEACON towers in range.
// Stacking is additive across multiple beacons, capped at +60%.
// Returns a Map keyed by PlacedTower.id; missing entries should be treated as { dmgMul: 1 }.
// Optional `modifiers` map keyed by beacon PlacedTower.id; values come from item effects
// (e.g., resonator/oversoul/beacon-core).
export function computeAuras(
  towers: readonly PlacedTower[],
  modifiers?: Map<string, BeaconModifier>,
): Map<string, AuraEffect> {
  const beacons = towers.filter((t) => t.towerId === 'beacon');
  const out = new Map<string, AuraEffect>();
  if (beacons.length === 0) return out;

  for (const t of towers) {
    if (t.towerId === 'beacon') continue;
    let bonus = 0;
    for (const b of beacons) {
      const mod = modifiers?.get(b.id);
      const range = beaconAuraRange(b.level) * (mod?.rangeMul ?? 1);
      const buff = beaconAuraBuff(b.level) + (mod?.buffAdd ?? 0);
      const dist = Math.hypot(b.x - t.x, b.y - t.y);
      if (dist <= range) {
        bonus += buff;
      }
    }
    if (bonus > 0) {
      out.set(t.id, { dmgMul: 1 + Math.min(bonus, MAX_AURA_BONUS) });
    }
  }
  return out;
}

export function getAuraDmgMul(auras: Map<string, AuraEffect>, towerId: string): number {
  return auras.get(towerId)?.dmgMul ?? 1;
}
