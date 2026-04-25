import { describe, expect, it } from 'vitest';
import { ENEMIES, scaleHp, scaleReward } from './enemies';

describe('enemies.ENEMIES', () => {
  it('contains all six kinds', () => {
    expect(Object.keys(ENEMIES).sort()).toEqual(['boss', 'phase', 'runner', 'shield', 'swarm', 'tank']);
  });

  it('tank has armor', () => {
    expect(ENEMIES.tank.armor).toBeGreaterThan(0);
    expect(ENEMIES.tank.armor).toBeLessThan(1);
  });

  it('shield carries shield flag', () => {
    expect(ENEMIES.shield.shield).toBe(true);
  });

  it('phase has duration shorter than its cycle', () => {
    expect(ENEMIES.phase.phaseDuration).toBeLessThan(ENEMIES.phase.phaseCycle ?? 0);
  });

  it('boss has aura damage reduction', () => {
    expect(ENEMIES.boss.bossAura).toBeGreaterThan(0);
  });
});

describe('enemies.scaleHp', () => {
  it('returns base at wave 1', () => {
    expect(scaleHp(100, 1)).toBe(100);
  });

  it('is monotonically increasing across W1-W100', () => {
    let prev = scaleHp(100, 1);
    for (let w = 2; w <= 100; w++) {
      const next = scaleHp(100, w);
      expect(next).toBeGreaterThan(prev);
      prev = next;
    }
  });

  it('uses 1.12 ramp through W30', () => {
    const ratio = scaleHp(100, 30) / scaleHp(100, 1);
    expect(ratio).toBeCloseTo(Math.pow(1.12, 29), 5);
  });

  it('switches to a steeper curve at W31+', () => {
    const r30 = scaleHp(100, 30) / scaleHp(100, 29);
    const r31 = scaleHp(100, 31) / scaleHp(100, 30);
    expect(r31).toBeGreaterThan(r30);
  });

  it('switches to the steepest curve at W61+', () => {
    const r60 = scaleHp(100, 60) / scaleHp(100, 59);
    const r61 = scaleHp(100, 61) / scaleHp(100, 60);
    expect(r61).toBeGreaterThan(r60);
  });
});

describe('enemies.scaleReward', () => {
  it('returns at least the base value', () => {
    for (let w = 1; w <= 50; w++) {
      expect(scaleReward(10, w)).toBeGreaterThanOrEqual(10);
    }
  });

  it('grows monotonically with wave', () => {
    let prev = scaleReward(10, 1);
    for (let w = 2; w <= 30; w++) {
      const next = scaleReward(10, w);
      expect(next).toBeGreaterThanOrEqual(prev);
      prev = next;
    }
  });
});
