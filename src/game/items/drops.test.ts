import { describe, expect, it } from 'vitest';
import { rollDraft, rollBossChest, rollBossLoot, rollEnemyDrop, _internals } from './drops';
import type { ItemRarity } from '../types';

// Deterministic-ish RNG cycling through a fixed sequence in [0, 1).
function makeSeq(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('drops.rollDraft', () => {
  it('returns 3 distinct items by default', () => {
    const draft = rollDraft();
    expect(draft).toHaveLength(3);
    const ids = new Set(draft.map((d) => d.id));
    expect(ids.size).toBe(3);
  });

  it('respects approximate rarity weights over many trials', () => {
    const counts: Record<ItemRarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
    const N = 5000;
    for (let i = 0; i < N; i++) {
      const item = rollDraft(Math.random, 1)[0];
      counts[item.rarity] += 1;
    }
    expect(counts.common / N).toBeGreaterThan(0.50);
    expect(counts.common / N).toBeLessThan(0.70);
    expect(counts.rare / N).toBeGreaterThan(0.18);
    expect(counts.rare / N).toBeLessThan(0.32);
  });
});

describe('drops.rollBossChest', () => {
  it('never returns common (floor is rare at low waves)', () => {
    for (let i = 0; i < 200; i++) {
      const item = rollBossChest(Math.random, 10);
      expect(item.rarity).not.toBe('common');
    }
  });

  it('floor is mythic at W100', () => {
    for (let i = 0; i < 50; i++) {
      const item = rollBossChest(Math.random, 100);
      expect(item.rarity).toBe('mythic');
    }
  });

  it('floor is legendary or above at W50', () => {
    for (let i = 0; i < 100; i++) {
      const item = rollBossChest(Math.random, 50);
      expect(['legendary', 'mythic']).toContain(item.rarity);
    }
  });
});

describe('drops._internals.bossChestFloor', () => {
  const f = _internals.bossChestFloor;
  it('matches the expected milestones', () => {
    expect(f(1)).toBe('rare');
    expect(f(29)).toBe('rare');
    expect(f(30)).toBe('epic');
    expect(f(49)).toBe('epic');
    expect(f(50)).toBe('legendary');
    expect(f(99)).toBe('legendary');
    expect(f(100)).toBe('mythic');
  });
});

describe('drops.rollEnemyDrop', () => {
  it('never returns a relic', () => {
    for (let i = 0; i < 200; i++) {
      const item = rollEnemyDrop();
      expect(item.category).not.toBe('relic');
    }
  });
});

describe('drops.rollBossLoot', () => {
  it('returns the requested count', () => {
    expect(rollBossLoot(Math.random, 10, 2)).toHaveLength(2);
    expect(rollBossLoot(Math.random, 50, 3)).toHaveLength(3);
  });

  it('respects the wave rarity floor', () => {
    for (let i = 0; i < 50; i++) {
      const items = rollBossLoot(Math.random, 100, 2);
      for (const it of items) expect(it.rarity).toBe('mythic');
    }
  });

  it('is consistent with rollBossChest at count=1', () => {
    const single = rollBossLoot(Math.random, 30, 1);
    expect(single).toHaveLength(1);
    // W30 floor is epic.
    expect(['epic', 'legendary', 'mythic']).toContain(single[0].rarity);
  });
});

describe('drops.rollDraft category filter', () => {
  it('relic-only draft returns only relics', () => {
    const draft = rollDraft(Math.random, 3, { category: 'relic' });
    expect(draft).toHaveLength(3);
    for (const it of draft) expect(it.category).toBe('relic');
  });

  it('accepts an array of categories', () => {
    for (let i = 0; i < 50; i++) {
      const item = rollDraft(Math.random, 1, { category: ['unique', 'conditional'] })[0];
      expect(['unique', 'conditional']).toContain(item.category);
    }
  });
});

describe('drops._internals.weightedPickRarity', () => {
  it('returns floor when rng yields the lowest band', () => {
    const rng = makeSeq([0]);
    expect(_internals.weightedPickRarity(rng)).toBe('common');
  });

  it('respects the floor argument', () => {
    const rng = makeSeq([0]);
    expect(_internals.weightedPickRarity(rng, 'epic')).toBe('epic');
  });
});
