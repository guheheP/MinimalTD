import { describe, expect, it } from 'vitest';
import { readViewport } from './useViewport';

describe('readViewport (SSR fallback path)', () => {
  it('returns synthetic desktop defaults when window is undefined', () => {
    // vite.config.ts uses environment: 'node' → window is undefined here.
    const v = readViewport();
    expect(v.w).toBe(1280);
    expect(v.h).toBe(800);
    expect(v.isPortrait).toBe(false);
    expect(v.isMobile).toBe(false);
    expect(v.isCoarse).toBe(false);
  });

  it('returned shape exposes the documented fields', () => {
    const v = readViewport();
    expect(typeof v.w).toBe('number');
    expect(typeof v.h).toBe('number');
    expect(typeof v.isPortrait).toBe('boolean');
    expect(typeof v.isMobile).toBe('boolean');
    expect(typeof v.isCoarse).toBe('boolean');
  });
});
