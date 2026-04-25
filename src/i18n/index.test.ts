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

import { translate } from './index';
import { useMetaStore } from '../state/metaStore';

beforeEach(() => {
  useMetaStore.getState().reset();
});

describe('translate (i18n)', () => {
  it('returns English by default', () => {
    useMetaStore.getState().setSettings({ language: 'en' });
    expect(translate('common.confirm')).toBe('Confirm');
  });

  it('returns Japanese when language is ja and key has translation', () => {
    useMetaStore.getState().setSettings({ language: 'ja' });
    expect(translate('common.confirm')).toBe('確定');
  });

  it('falls back to English when ja translation is missing', () => {
    useMetaStore.getState().setSettings({ language: 'ja' });
    const v = translate('results.title');
    expect(v).toBeTruthy();
  });

  it('honors explicit language argument over store', () => {
    useMetaStore.getState().setSettings({ language: 'ja' });
    expect(translate('common.confirm', undefined, 'en')).toBe('Confirm');
  });

  it('interpolates positional parameters', () => {
    useMetaStore.getState().setSettings({ language: 'en' });
    expect(translate('game.startWave', { n: 7 })).toBe('START WAVE 7');
  });

  it('interpolates multiple parameters', () => {
    useMetaStore.getState().setSettings({ language: 'en' });
    expect(translate('game.remaining', { spawned: 3, alive: 12 })).toBe('3 / 12 REMAINING');
  });

  it('leaves unknown placeholders intact', () => {
    useMetaStore.getState().setSettings({ language: 'en' });
    expect(translate('game.startWave', { other: 1 })).toBe('START WAVE {n}');
  });
});
