import { vi, beforeEach, describe, expect, it } from 'vitest';

// Shim localStorage in Node BEFORE importing the store (Zustand persist needs it).
vi.hoisted(() => {
  class MemStorage {
    private s = new Map<string, string>();
    get length() { return this.s.size; }
    clear() { this.s.clear(); }
    getItem(k: string) { return this.s.get(k) ?? null; }
    setItem(k: string, v: string) { this.s.set(k, v); }
    removeItem(k: string) { this.s.delete(k); }
    key(i: number) { return [...this.s.keys()][i] ?? null; }
  }
  (globalThis as unknown as { localStorage: Storage }).localStorage = new MemStorage() as unknown as Storage;
});

import { useMetaStore } from './metaStore';

beforeEach(() => {
  useMetaStore.getState().reset();
});

describe('metaStore.cores', () => {
  it('addCores increases the balance', () => {
    useMetaStore.getState().addCores(50);
    expect(useMetaStore.getState().cores).toBe(50);
  });

  it('spendCores rejects when insufficient', () => {
    useMetaStore.getState().addCores(10);
    expect(useMetaStore.getState().spendCores(20)).toBe(false);
    expect(useMetaStore.getState().cores).toBe(10);
  });

  it('spendCores deducts when sufficient', () => {
    useMetaStore.getState().addCores(100);
    expect(useMetaStore.getState().spendCores(40)).toBe(true);
    expect(useMetaStore.getState().cores).toBe(60);
  });
});

describe('metaStore.unlockTower', () => {
  it('unlocks an inventory tower for cores', () => {
    useMetaStore.getState().addCores(800);
    expect(useMetaStore.getState().unlockTower('multi')).toBe(true);
    expect(useMetaStore.getState().unlocks.towers).toContain('multi');
    expect(useMetaStore.getState().cores).toBe(0);
  });

  it('refuses if already unlocked', () => {
    expect(useMetaStore.getState().unlockTower('basic')).toBe(false);
  });

  it('refuses if cores insufficient', () => {
    expect(useMetaStore.getState().unlockTower('multi')).toBe(false);
  });
});

describe('metaStore.upgradeMastery', () => {
  it('caps at MASTERY_MAX', () => {
    useMetaStore.getState().addCores(100000);
    for (let i = 0; i < 5; i++) {
      expect(useMetaStore.getState().upgradeMastery('basic')).toBe(true);
    }
    expect(useMetaStore.getState().upgradeMastery('basic')).toBe(false);
    expect(useMetaStore.getState().mastery.basic).toBe(5);
  });
});

describe('metaStore.foundry', () => {
  it('buyInitialSlots increments and deducts essence', () => {
    useMetaStore.getState().addEssence(200);
    expect(useMetaStore.getState().buyInitialSlots()).toBe(true);
    expect(useMetaStore.getState().foundry.initialSlots).toBe(1);
  });

  it('buyDropBoost caps and persists value', () => {
    useMetaStore.getState().addEssence(10000);
    for (let i = 0; i < 5; i++) {
      expect(useMetaStore.getState().buyDropBoost('rare')).toBe(true);
    }
    expect(useMetaStore.getState().buyDropBoost('rare')).toBe(false);
    expect(useMetaStore.getState().foundry.dropRateBoost.rare).toBe(5);
  });
});

describe('metaStore.recordRun', () => {
  it('records a best run and increments totals', () => {
    useMetaStore.getState().recordRun('zigzag', { wave: 12, score: 6400, durationMs: 425000 });
    const s = useMetaStore.getState();
    expect(s.bestRuns.zigzag?.wave).toBe(12);
    expect(s.totalRuns).toBe(1);
    expect(s.highestWave).toBe(12);
  });

  it('only updates bestRuns when the new run is better', () => {
    useMetaStore.getState().recordRun('zigzag', { wave: 12, score: 6400, durationMs: 425000 });
    useMetaStore.getState().recordRun('zigzag', { wave: 5, score: 100, durationMs: 60000 });
    expect(useMetaStore.getState().bestRuns.zigzag?.wave).toBe(12);
  });

  it('unlocks spiral after 5 runs', () => {
    for (let i = 0; i < 5; i++) {
      useMetaStore.getState().recordRun('zigzag', { wave: 1, score: 0, durationMs: 1 });
    }
    expect(useMetaStore.getState().unlocks.maps).toContain('spiral');
  });

  it('unlocks fork at highest wave 30', () => {
    useMetaStore.getState().recordRun('zigzag', { wave: 30, score: 0, durationMs: 1 });
    expect(useMetaStore.getState().unlocks.maps).toContain('fork');
  });
});

describe('metaStore.settings', () => {
  it('updates language and theme via setSettings', () => {
    useMetaStore.getState().setSettings({ language: 'ja', theme: 'dark' });
    const s = useMetaStore.getState().settings;
    expect(s.language).toBe('ja');
    expect(s.theme).toBe('dark');
  });

  it('preserves untouched settings fields when patching', () => {
    const before = useMetaStore.getState().settings;
    useMetaStore.getState().setSettings({ language: 'ja' });
    const after = useMetaStore.getState().settings;
    expect(after.language).toBe('ja');
    expect(after.theme).toBe(before.theme);
    expect(after.sfxVolume).toBe(before.sfxVolume);
    expect(after.bgmVolume).toBe(before.bgmVolume);
  });

  it('persists settings into localStorage under minimaltd:meta', () => {
    useMetaStore.getState().setSettings({ theme: 'neon', language: 'en' });
    const raw = localStorage.getItem('minimaltd:meta');
    expect(raw).toBeTruthy();
    const parsed = raw ? JSON.parse(raw) : null;
    expect(parsed?.state?.settings?.theme).toBe('neon');
    expect(parsed?.state?.settings?.language).toBe('en');
  });

  it('reset restores default settings', () => {
    useMetaStore.getState().setSettings({ theme: 'neon', language: 'ja' });
    useMetaStore.getState().reset();
    const s = useMetaStore.getState().settings;
    expect(s.theme).toBe('default');
    expect(['en', 'ja']).toContain(s.language);
  });
});
