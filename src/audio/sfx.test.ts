import { vi, beforeEach, describe, expect, it } from 'vitest';

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

import { _resetSfxDedupForTest, playSfx } from './sfx';
import { _resetAudioForTest } from './audioContext';
import { useMetaStore } from '../state/metaStore';

beforeEach(() => {
  _resetAudioForTest();
  _resetSfxDedupForTest();
  useMetaStore.getState().reset();
});

describe('playSfx (node env, no AudioContext)', () => {
  it('is a no-op when AudioContext is unavailable (does not throw)', () => {
    expect(() => playSfx('tower-fire')).not.toThrow();
  });

  it('short-circuits when sfxVolume is 0', () => {
    useMetaStore.getState().setSettings({ sfxVolume: 0 });
    expect(() => playSfx('tower-fire')).not.toThrow();
  });

  it('accepts every defined SfxName without throwing', () => {
    const names = [
      'tower-fire', 'tower-place', 'tower-upgrade', 'tower-sell',
      'enemy-die', 'enemy-boss-die',
      'wave-start', 'wave-cleared', 'breach',
      'draft-open', 'chest-open', 'loot-rarity-mythic',
    ] as const;
    for (const n of names) {
      expect(() => playSfx(n)).not.toThrow();
    }
  });
});
