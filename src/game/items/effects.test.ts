import { describe, expect, it } from 'vitest';
import { computeTowerEffect, computePassiveEffect, eligibleItemsForTower, emptyEffect } from './effects';
import type { OwnedItem, PlacedTower, RunInventory } from '../types';

function tower(id: string, towerId: PlacedTower['towerId']): PlacedTower {
  return { id, towerId, x: 0, y: 0, level: 1, spent: 0 };
}

function inv(items: OwnedItem[]): RunInventory {
  return { items, draftHistory: [] };
}

describe('effects.emptyEffect', () => {
  it('has neutral mul=1, add=0, flags=false', () => {
    const e = emptyEffect();
    expect(e.dmgMul).toBe(1);
    expect(e.dmgAdd).toBe(0);
    expect(e.ignoreArmor).toBe(false);
    expect(e.endlessPoison).toBe(false);
  });
});

describe('effects.computeTowerEffect', () => {
  it('returns empty when inventory is empty', () => {
    const e = computeTowerEffect(tower('t1', 'basic'), inv([]), { isBossWave: false });
    expect(e).toEqual(emptyEffect());
  });

  it('applies a tower-mod equipped to the tower', () => {
    const t = tower('t1', 'basic');
    const items: OwnedItem[] = [{ uid: 'u1', itemId: 'red-dot', equippedTo: 't1' }];
    const e = computeTowerEffect(t, inv(items), { isBossWave: false });
    expect(e.dmgMul).toBeCloseTo(1.25);
  });

  it('does not apply tower-mods that are not equipped', () => {
    const items: OwnedItem[] = [{ uid: 'u1', itemId: 'red-dot' }];
    const e = computeTowerEffect(tower('t1', 'basic'), inv(items), { isBossWave: false });
    expect(e.dmgMul).toBe(1);
  });

  it('applies passive relics globally even when not equipped', () => {
    const items: OwnedItem[] = [{ uid: 'u1', itemId: 'sharpened' }];
    const e = computeTowerEffect(tower('any', 'sniper'), inv(items), { isBossWave: false });
    expect(e.dmgMul).toBeCloseTo(1.05);
  });

  it('blocks tower-mods whose scope does not match the wearing tower', () => {
    const items: OwnedItem[] = [{ uid: 'u1', itemId: 'red-dot', equippedTo: 't1' }];
    // red-dot is scoped to 'basic'; equipping it to a sniper tower should yield no effect.
    const e = computeTowerEffect(tower('t1', 'sniper'), inv(items), { isBossWave: false });
    expect(e.dmgMul).toBe(1);
  });

  it('applies bossWaveDmgMul only when isBossWave is true', () => {
    const items: OwnedItem[] = [{ uid: 'u1', itemId: 'black-sun' }];
    const offBoss = computeTowerEffect(tower('t1', 'basic'), inv(items), { isBossWave: false });
    const onBoss = computeTowerEffect(tower('t1', 'basic'), inv(items), { isBossWave: true });
    expect(offBoss.dmgMul).toBe(1);
    expect(onBoss.dmgMul).toBeCloseTo(1.6);
  });

  it('multiplies multiple stat-mul items', () => {
    const items: OwnedItem[] = [
      { uid: 'u1', itemId: 'sharpened' },
      { uid: 'u2', itemId: 'red-dot', equippedTo: 't1' },
    ];
    const e = computeTowerEffect(tower('t1', 'basic'), inv(items), { isBossWave: false });
    expect(e.dmgMul).toBeCloseTo(1.05 * 1.25);
  });
});

describe('effects.computePassiveEffect', () => {
  it('only includes un-equipped non-tower-mod items', () => {
    const items: OwnedItem[] = [
      { uid: 'u1', itemId: 'sharpened' },
      { uid: 'u2', itemId: 'red-dot' },             // tower-mod, not passive
      { uid: 'u3', itemId: 'sharpened', equippedTo: 't1' }, // equipped, ignored
    ];
    const e = computePassiveEffect(inv(items), { isBossWave: false });
    expect(e.dmgMul).toBeCloseTo(1.05);
  });
});

describe('effects.eligibleItemsForTower', () => {
  it('lists un-equipped tower-mods whose scope matches', () => {
    const items: OwnedItem[] = [
      { uid: 'u1', itemId: 'red-dot' },          // scope: basic
      { uid: 'u2', itemId: 'long-lens' },        // scope: sniper
      { uid: 'u3', itemId: 'sharpened' },        // relic, not tower-mod
    ];
    const e = eligibleItemsForTower('basic', inv(items));
    expect(e).toEqual(['u1']);
  });
});
