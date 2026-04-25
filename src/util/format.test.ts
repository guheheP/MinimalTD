import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDuration, formatNumber, formatScore } from './format';

describe('formatNumber', () => {
  it('renders integers below 1000 as plain', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(7)).toBe('7');
    expect(formatNumber(999)).toBe('999');
  });

  it('rounds sub-1000 floats', () => {
    expect(formatNumber(12.4)).toBe('12');
    expect(formatNumber(12.6)).toBe('13');
  });

  it('switches to K at 1000', () => {
    expect(formatNumber(1000)).toBe('1K');
    expect(formatNumber(1234)).toBe('1.2K');
    expect(formatNumber(999_999)).toBe('1000K');
  });

  it('switches to M at 1_000_000', () => {
    expect(formatNumber(1_000_000)).toBe('1M');
    expect(formatNumber(1_234_567)).toBe('1.2M');
  });

  it('switches to B at 1_000_000_000', () => {
    expect(formatNumber(1_000_000_000)).toBe('1B');
    expect(formatNumber(2_500_000_000)).toBe('2.5B');
  });

  it('switches to T at 1_000_000_000_000', () => {
    expect(formatNumber(1_000_000_000_000)).toBe('1T');
  });

  it('handles negatives', () => {
    expect(formatNumber(-5)).toBe('-5');
    expect(formatNumber(-1500)).toBe('-1.5K');
  });

  it('handles non-finite gracefully', () => {
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('∞');
    expect(formatNumber(Number.NaN)).toBe('∞');
  });
});

describe('formatCurrency', () => {
  it('prepends $', () => {
    expect(formatCurrency(220)).toBe('$220');
    expect(formatCurrency(1500)).toBe('$1.5K');
  });
});

describe('formatScore', () => {
  it('zero-pads to 5 digits below 100k', () => {
    expect(formatScore(0)).toBe('00000');
    expect(formatScore(42)).toBe('00042');
    expect(formatScore(99_999)).toBe('99999');
  });

  it('switches to compact above 100k', () => {
    expect(formatScore(100_000)).toBe('100K');
    expect(formatScore(1_500_000)).toBe('1.5M');
  });
});

describe('formatDuration', () => {
  it('formats sub-hour as MM:SS', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(45_000)).toBe('00:45');
    expect(formatDuration(125_000)).toBe('02:05');
  });

  it('formats over-hour as H:MM:SS', () => {
    expect(formatDuration(3_600_000)).toBe('1:00:00');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });

  it('handles negative as zero', () => {
    expect(formatDuration(-1000)).toBe('00:00');
  });
});
