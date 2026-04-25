import type { EnemyDef, EnemyKind } from './types';

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  runner: {
    kind: 'runner',
    hpBase: 22,
    speed: 60,
    reward: 6,
    size: 14,
    color: 'var(--ink)',
  },
  swarm: {
    kind: 'swarm',
    hpBase: 14,
    speed: 78,
    reward: 4,
    size: 11,
    color: 'var(--ink)',
  },
  tank: {
    kind: 'tank',
    hpBase: 80,
    speed: 36,
    reward: 14,
    size: 18,
    color: 'var(--ink)',
    armor: 0.3,
  },
  shield: {
    kind: 'shield',
    hpBase: 50,
    speed: 50,
    reward: 12,
    size: 15,
    color: 'var(--ink)',
    shield: true,
  },
  phase: {
    kind: 'phase',
    hpBase: 30,
    speed: 70,
    reward: 10,
    size: 13,
    color: 'var(--ink)',
    phaseDuration: 0.4,
    phaseCycle: 1.0,
  },
  boss: {
    kind: 'boss',
    hpBase: 320,
    speed: 30,
    reward: 80,
    size: 26,
    color: 'var(--ink)',
    bossAura: 0.2,
  },
};

// Endless-mode HP scaling.
// W1-30: gentle exponential ramp.
// W31-60: steeper, the mid-game wall.
// W61+: aggressive, hack-and-slash style inflation.
export function scaleHp(base: number, wave: number): number {
  if (wave <= 1) return base;
  if (wave <= 30) {
    return base * Math.pow(1.12, wave - 1);
  }
  const w30 = Math.pow(1.12, 29);
  if (wave <= 60) {
    return base * w30 * Math.pow(1.18, wave - 30);
  }
  const w60 = w30 * Math.pow(1.18, 30);
  return base * w60 * Math.pow(1.25, wave - 60);
}

export function scaleReward(base: number, wave: number): number {
  return Math.max(base, Math.floor(base * Math.pow(1.05, wave - 1)));
}
