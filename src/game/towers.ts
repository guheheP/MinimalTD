import type { TowerDef, TowerId, MapDef, MapKey } from './types';

export const TOWER_DEFS: Record<TowerId, TowerDef> = {
  basic: {
    id: 'basic',
    name: 'POINT',
    glyph: '●',
    cost: 50,
    dmg: 8,
    rng: 90,
    rof: 1.2,
    color: 'var(--accent-1)',
    type: 'BASIC',
    desc: 'Single-target. Cheap, reliable, fast fire-rate.',
  },
  sniper: {
    id: 'sniper',
    name: 'PIERCE',
    glyph: '▲',
    cost: 120,
    dmg: 36,
    rng: 200,
    rof: 0.5,
    color: 'var(--accent-2)',
    type: 'SNIPER',
    desc: 'Long range. High damage, slow reload.',
  },
  cannon: {
    id: 'cannon',
    name: 'BLAST',
    glyph: '■',
    cost: 160,
    dmg: 22,
    rng: 110,
    rof: 0.4,
    color: 'var(--accent-3)',
    type: 'SPLASH',
    desc: 'AoE damage on impact.',
  },
  frost: {
    id: 'frost',
    name: 'FREEZE',
    glyph: '◆',
    cost: 100,
    dmg: 4,
    rng: 100,
    rof: 1.0,
    color: 'var(--accent-4)',
    type: 'SLOW',
    desc: 'Slows targets in radius.',
  },
  multi: {
    id: 'multi',
    name: 'SCATTER',
    glyph: '★',
    cost: 180,
    dmg: 6,
    rng: 120,
    rof: 1.6,
    color: 'var(--accent-5)',
    type: 'MULTI',
    desc: 'Hits up to 4 targets at once.',
  },
  venom: {
    id: 'venom',
    name: 'VENOM',
    glyph: '⬢',
    cost: 140,
    dmg: 3,
    rng: 100,
    rof: 0.9,
    color: 'var(--accent-6)',
    type: 'POISON',
    desc: 'Damage-over-time. Stacks.',
  },
  shock: {
    id: 'shock',
    name: 'CHAIN',
    glyph: '⚡',
    cost: 220,
    dmg: 14,
    rng: 130,
    rof: 0.7,
    color: 'var(--accent-7)',
    type: 'SHOCK',
    desc: 'Chains lightning between 3 enemies.',
  },
  beacon: {
    id: 'beacon',
    name: 'BEACON',
    glyph: '⬡',
    cost: 160,
    dmg: 0,
    rng: 0,
    rof: 0,
    color: 'var(--accent-8)',
    type: 'SUPPORT',
    desc: '+15-55% damage to towers in radius (scales with level).',
    isAura: true,
    auraRange: 100,
    auraDmgBuff: 0.15,
  },
};

export const TOWER_LIST: readonly TowerDef[] = Object.values(TOWER_DEFS);

export const MAPS: Record<MapKey, MapDef> = {
  zigzag: {
    name: 'ZIGZAG',
    code: 'M-01',
    difficulty: 'EASY',
    paths: [[
      [0.0, 0.20], [0.30, 0.20], [0.30, 0.55], [0.65, 0.55],
      [0.65, 0.30], [0.90, 0.30], [0.90, 0.80], [1.0, 0.80],
    ]],
  },
  spiral: {
    name: 'SPIRAL',
    code: 'M-02',
    difficulty: 'MEDIUM',
    paths: [[
      [0.0, 0.10], [0.85, 0.10], [0.85, 0.85], [0.15, 0.85],
      [0.15, 0.30], [0.65, 0.30], [0.65, 0.65], [0.40, 0.65],
      [0.40, 0.50], [1.00, 0.50],
    ]],
  },
  fork: {
    name: 'FORK',
    code: 'M-03',
    difficulty: 'HARD',
    paths: [
      [[0.0, 0.30], [0.40, 0.30], [0.40, 0.55], [1.0, 0.55]],
      [[0.0, 0.80], [0.60, 0.80], [0.60, 0.55], [1.0, 0.55]],
    ],
  },
  cross: {
    name: 'CROSS',
    code: 'M-04',
    difficulty: 'EXPERT',
    paths: [[
      [0.0, 0.50], [0.30, 0.50], [0.30, 0.15], [0.55, 0.15],
      [0.55, 0.85], [0.80, 0.85], [0.80, 0.40], [1.0, 0.40],
    ]],
  },
};

// BEACON aura per-level helpers.
// Range: 100 → 180 (LV1 → LV5), step 20px per level.
// Damage buff: +15% → +55% (LV1 → LV5), step 10pp per level.
export function beaconAuraRange(level: number): number {
  return 100 + 20 * (level - 1);
}

export function beaconAuraBuff(level: number): number {
  return 0.15 + 0.10 * (level - 1);
}
