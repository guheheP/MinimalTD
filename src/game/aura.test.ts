import { describe, expect, it } from 'vitest';
import { computeAuras, getAuraDmgMul } from './aura';
import { beaconAuraBuff } from './towers';
import type { PlacedTower } from './types';

function tw(id: string, towerId: PlacedTower['towerId'], x: number, y: number, level = 1): PlacedTower {
  return { id, towerId, x, y, level, spent: 0 };
}

describe('aura.computeAuras', () => {
  it('returns an empty Map when no beacons are placed', () => {
    const result = computeAuras([tw('a', 'basic', 0, 0)]);
    expect(result.size).toBe(0);
  });

  it('does not buff beacons themselves', () => {
    const result = computeAuras([
      tw('b', 'beacon', 0, 0),
      tw('c', 'beacon', 30, 0),
    ]);
    expect(result.has('b')).toBe(false);
    expect(result.has('c')).toBe(false);
  });

  it('buffs a tower inside beacon range', () => {
    const result = computeAuras([
      tw('b', 'beacon', 0, 0, 1),
      tw('a', 'basic', 50, 0),
    ]);
    expect(result.get('a')?.dmgMul).toBeCloseTo(1 + beaconAuraBuff(1), 6);
  });

  it('does not buff a tower outside beacon range', () => {
    const result = computeAuras([
      tw('b', 'beacon', 0, 0, 1),
      tw('a', 'basic', 500, 500),
    ]);
    expect(result.has('a')).toBe(false);
  });

  it('stacks additively across multiple beacons', () => {
    const result = computeAuras([
      tw('b1', 'beacon', 0, 0, 1),
      tw('b2', 'beacon', 30, 0, 1),
      tw('a', 'basic', 50, 0),
    ]);
    expect(result.get('a')?.dmgMul).toBeCloseTo(1 + 2 * beaconAuraBuff(1), 6);
  });

  it('caps total bonus at +60%', () => {
    const beacons: PlacedTower[] = [];
    for (let i = 0; i < 10; i++) beacons.push(tw(`b${i}`, 'beacon', 0, 0, 5));
    beacons.push(tw('a', 'basic', 50, 0));
    const result = computeAuras(beacons);
    expect(result.get('a')?.dmgMul).toBeCloseTo(1.6, 6);
  });
});

describe('aura.getAuraDmgMul', () => {
  it('returns 1 when tower has no aura entry', () => {
    expect(getAuraDmgMul(new Map(), 'unknown')).toBe(1);
  });

  it('returns the stored dmgMul when present', () => {
    const m = new Map([['t1', { dmgMul: 1.42 }]]);
    expect(getAuraDmgMul(m, 't1')).toBe(1.42);
  });
});
