import { describe, expect, it } from 'vitest';
import { ITEMS, ITEM_LIST, getItem } from './database';
import type { ItemRarity } from '../types';
import { TOWER_DEFS } from '../towers';

const VALID_TOWER_IDS = new Set(Object.keys(TOWER_DEFS));

describe('items.database', () => {
  it('has 30 items at v1.0', () => {
    expect(ITEM_LIST).toHaveLength(30);
  });

  it('has unique ids matching keys', () => {
    const ids = new Set(ITEM_LIST.map((i) => i.id));
    expect(ids.size).toBe(30);
    for (const i of ITEM_LIST) {
      expect(ITEMS[i.id]).toBe(i);
    }
  });

  it('has the planned rarity distribution', () => {
    const counts: Record<ItemRarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
    for (const i of ITEM_LIST) counts[i.rarity] += 1;
    expect(counts).toEqual({ common: 12, rare: 9, epic: 6, legendary: 2, mythic: 1 });
  });

  it('all tower-mod scopes reference a valid tower id', () => {
    for (const i of ITEM_LIST) {
      if (i.scope === 'any') continue;
      expect(VALID_TOWER_IDS.has(i.scope)).toBe(true);
    }
  });

  it('tower-mod items have a tower-id scope (not "any")', () => {
    for (const i of ITEM_LIST) {
      if (i.category !== 'tower-mod') continue;
      expect(i.scope).not.toBe('any');
    }
  });

  it('relics scope to "any"', () => {
    for (const i of ITEM_LIST) {
      if (i.category !== 'relic') continue;
      expect(i.scope).toBe('any');
    }
  });

  it('getItem returns undefined for unknown ids', () => {
    expect(getItem('nope')).toBeUndefined();
  });
});
