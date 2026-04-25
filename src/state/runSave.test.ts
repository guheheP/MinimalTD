import { beforeEach, describe, expect, it } from 'vitest';
import type { PlacedTower, RunInventory } from '../game/types';
import { clearRun, hasRun, loadRun, RUN_SAVE_VERSION, saveRun } from './runSave';

class MemStorage implements Storage {
  private s = new Map<string, string>();
  get length() { return this.s.size; }
  clear(): void { this.s.clear(); }
  getItem(k: string): string | null { return this.s.get(k) ?? null; }
  setItem(k: string, v: string): void { this.s.set(k, v); }
  removeItem(k: string): void { this.s.delete(k); }
  key(i: number): string | null { return [...this.s.keys()][i] ?? null; }
}

const STORAGE_KEY = 'minimaltd:save';

let storage: MemStorage;

beforeEach(() => {
  storage = new MemStorage();
});

const samplePlaced: PlacedTower[] = [
  { id: 't1', towerId: 'basic', x: 100, y: 200, level: 2, spent: 110 },
  { id: 't2', towerId: 'frost', x: 250, y: 180, level: 1, spent: 100 },
];

const sampleInventory: RunInventory = {
  items: [{ uid: 'i1', itemId: 'point-rof-1' }],
  draftHistory: [{ wave: 5, pickedItemId: 'point-rof-1' }],
};

const sampleSnapshot = {
  mapKey: 'zigzag' as const,
  wave: 11,
  hp: 17,
  money: 540,
  score: 6400,
  placed: samplePlaced,
  inventory: sampleInventory,
  startedAt: '2026-04-25T20:39:00.000Z',
};

describe('saveRun / loadRun', () => {
  it('round-trips a snapshot', () => {
    saveRun(sampleSnapshot, storage);
    const loaded = loadRun(storage);
    expect(loaded).not.toBeNull();
    expect(loaded?.version).toBe(RUN_SAVE_VERSION);
    expect(loaded?.mapKey).toBe('zigzag');
    expect(loaded?.wave).toBe(11);
    expect(loaded?.placed).toHaveLength(2);
    expect(loaded?.placed[0].towerId).toBe('basic');
    expect(loaded?.inventory.items[0].itemId).toBe('point-rof-1');
    expect(loaded?.startedAt).toBe('2026-04-25T20:39:00.000Z');
  });

  it('strips transient _cd from placed towers', () => {
    const withCd = [{ ...samplePlaced[0], _cd: 0.42 } as PlacedTower & { _cd: number }];
    saveRun({ ...sampleSnapshot, placed: withCd }, storage);
    const raw = storage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('_cd');
  });

  it('returns null when nothing is stored', () => {
    expect(loadRun(storage)).toBeNull();
    expect(hasRun(storage)).toBe(false);
  });

  it('returns null and clears on version mismatch', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...sampleSnapshot, version: 999 }));
    expect(loadRun(storage)).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('returns null on schema rejection (missing field)', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: RUN_SAVE_VERSION }));
    expect(loadRun(storage)).toBeNull();
  });

  it('returns null on garbage JSON', () => {
    storage.setItem(STORAGE_KEY, 'not-json');
    expect(loadRun(storage)).toBeNull();
  });

  it('hasRun reports true after save', () => {
    saveRun(sampleSnapshot, storage);
    expect(hasRun(storage)).toBe(true);
  });

  it('clearRun removes the saved snapshot', () => {
    saveRun(sampleSnapshot, storage);
    clearRun(storage);
    expect(loadRun(storage)).toBeNull();
    expect(hasRun(storage)).toBe(false);
  });
});
