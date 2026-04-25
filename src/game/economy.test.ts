import { describe, expect, it } from 'vitest';
import {
  MAX_LEVEL,
  getBaseCost,
  getSellValue,
  getTotalSpent,
  getUpgradeCost,
  getWaveBonus,
} from './economy';
import { TOWER_DEFS } from './towers';
import type { TowerId } from './types';

const ALL_TOWERS = Object.keys(TOWER_DEFS) as TowerId[];

describe('economy.getBaseCost', () => {
  it('matches TOWER_DEFS.cost for every tower', () => {
    for (const id of ALL_TOWERS) {
      expect(getBaseCost(id)).toBe(TOWER_DEFS[id].cost);
    }
  });
});

describe('economy.getUpgradeCost', () => {
  it('returns Infinity at MAX_LEVEL', () => {
    expect(getUpgradeCost('basic', MAX_LEVEL)).toBe(Infinity);
  });

  it('is monotonically non-decreasing per tower', () => {
    for (const id of ALL_TOWERS) {
      let prev = -1;
      for (let lv = 1; lv < MAX_LEVEL; lv++) {
        const cost = getUpgradeCost(id, lv);
        expect(cost).toBeGreaterThanOrEqual(prev);
        prev = cost;
      }
    }
  });
});

describe('economy.getTotalSpent', () => {
  it('returns 0 at level 0', () => {
    expect(getTotalSpent('basic', 0)).toBe(0);
  });

  it('LV1 spent equals base cost', () => {
    for (const id of ALL_TOWERS) {
      expect(getTotalSpent(id, 1)).toBe(TOWER_DEFS[id].cost);
    }
  });

  it('grows monotonically with level', () => {
    for (const id of ALL_TOWERS) {
      for (let lv = 1; lv <= MAX_LEVEL; lv++) {
        expect(getTotalSpent(id, lv)).toBeGreaterThan(getTotalSpent(id, lv - 1));
      }
    }
  });
});

describe('economy.getSellValue', () => {
  it('is 70% of total spent (floored)', () => {
    for (const id of ALL_TOWERS) {
      for (let lv = 1; lv <= MAX_LEVEL; lv++) {
        const expected = Math.floor(getTotalSpent(id, lv) * 0.7);
        expect(getSellValue(id, lv)).toBe(expected);
      }
    }
  });

  it('is strictly less than total spent for any positive level', () => {
    for (const id of ALL_TOWERS) {
      for (let lv = 1; lv <= MAX_LEVEL; lv++) {
        expect(getSellValue(id, lv)).toBeLessThan(getTotalSpent(id, lv));
      }
    }
  });
});

describe('economy.getWaveBonus', () => {
  it('matches the formula 40 + wave*8', () => {
    expect(getWaveBonus(1)).toBe(48);
    expect(getWaveBonus(10)).toBe(120);
    expect(getWaveBonus(30)).toBe(280);
  });
});
