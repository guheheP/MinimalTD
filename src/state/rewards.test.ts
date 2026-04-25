import { describe, expect, it } from 'vitest';
import { calcCoresEarned, calcEssenceEarned } from './rewards';

describe('rewards.calcCoresEarned', () => {
  it('returns 0 at wave 0 with score 0', () => {
    expect(calcCoresEarned(0, 0)).toBe(0);
  });

  it('floor(wave*2 + score/5000) below milestones', () => {
    expect(calcCoresEarned(10, 0)).toBe(20);
    expect(calcCoresEarned(0, 5000)).toBe(1);
    expect(calcCoresEarned(10, 25000)).toBe(25);
  });

  it('adds W25 milestone +50', () => {
    expect(calcCoresEarned(25, 0)).toBe(50 + 50);
  });

  it('stacks W25, W50, W100 milestones', () => {
    expect(calcCoresEarned(100, 0)).toBe(200 + 50 + 150 + 500);
  });
});

describe('rewards.calcEssenceEarned', () => {
  it('weighs each rarity per the official table', () => {
    expect(calcEssenceEarned({ common: 1, rare: 1, epic: 1, legendary: 1, mythic: 1 })).toBe(1 + 5 + 25 + 100 + 500);
  });

  it('returns 0 for empty inventory', () => {
    expect(calcEssenceEarned({ common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 })).toBe(0);
  });

  it('scales linearly with counts', () => {
    expect(calcEssenceEarned({ common: 10, rare: 0, epic: 0, legendary: 0, mythic: 0 })).toBe(10);
    expect(calcEssenceEarned({ common: 0, rare: 0, epic: 0, legendary: 0, mythic: 3 })).toBe(1500);
  });
});
