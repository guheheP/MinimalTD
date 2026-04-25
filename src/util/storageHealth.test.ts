import { beforeEach, describe, expect, it } from 'vitest';
import { _resetStorageHealthCache, canPersist } from './storageHealth';

class MemStorage implements Storage {
  private s = new Map<string, string>();
  get length() { return this.s.size; }
  clear(): void { this.s.clear(); }
  getItem(k: string): string | null { return this.s.get(k) ?? null; }
  setItem(k: string, v: string): void { this.s.set(k, v); }
  removeItem(k: string): void { this.s.delete(k); }
  key(i: number): string | null { return [...this.s.keys()][i] ?? null; }
}

class ThrowingStorage implements Storage {
  get length() { return 0; }
  clear(): void {}
  getItem(): null { return null; }
  setItem(): never { throw new Error('quota'); }
  removeItem(): void {}
  key(): null { return null; }
}

beforeEach(() => {
  _resetStorageHealthCache();
});

describe('canPersist', () => {
  it('returns true when storage accepts setItem/removeItem', () => {
    const s = new MemStorage();
    expect(canPersist(s)).toBe(true);
  });

  it('returns false when storage throws on setItem (e.g., quota or private mode)', () => {
    const s = new ThrowingStorage();
    expect(canPersist(s)).toBe(false);
  });

  it('returns false when storage is null (SSR)', () => {
    expect(canPersist(null)).toBe(false);
  });

  it('removes the probe key after a successful probe', () => {
    const s = new MemStorage();
    canPersist(s);
    expect(s.length).toBe(0);
  });

  it('caches the result after first probe', () => {
    const good = new MemStorage();
    expect(canPersist(good)).toBe(true);
    expect(canPersist(new ThrowingStorage())).toBe(true);
  });
});
