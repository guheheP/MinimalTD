import type { EnemyKind, WaveGroup, WaveSpec } from './types';

// W1-10 fixed scripts (tutorial-grade ramp, introducing enemy types one at a time).
const SCRIPTED_WAVES: WaveSpec[] = [
  {
    index: 1,
    groups: [{ kind: 'runner', count: 10, spacing: 0.6, delay: 0 }],
  },
  {
    index: 2,
    groups: [{ kind: 'runner', count: 12, spacing: 0.55, delay: 0 }],
  },
  {
    index: 3,
    groups: [
      { kind: 'runner', count: 8, spacing: 0.5, delay: 0 },
      { kind: 'tank', count: 2, spacing: 1.2, delay: 6 },
    ],
  },
  {
    index: 4,
    groups: [{ kind: 'swarm', count: 16, spacing: 0.35, delay: 0 }],
  },
  {
    index: 5,
    isMiniBoss: true,
    groups: [
      { kind: 'tank', count: 4, spacing: 1.0, delay: 0 },
      { kind: 'runner', count: 6, spacing: 0.5, delay: 5 },
    ],
  },
  {
    index: 6,
    groups: [
      { kind: 'runner', count: 10, spacing: 0.5, delay: 0 },
      { kind: 'shield', count: 4, spacing: 1.0, delay: 4 },
    ],
  },
  {
    index: 7,
    groups: [
      { kind: 'swarm', count: 14, spacing: 0.35, delay: 0 },
      { kind: 'phase', count: 4, spacing: 0.9, delay: 5 },
    ],
  },
  {
    index: 8,
    groups: [
      { kind: 'tank', count: 4, spacing: 1.0, delay: 0 },
      { kind: 'shield', count: 4, spacing: 1.0, delay: 5 },
    ],
  },
  {
    index: 9,
    groups: [
      { kind: 'runner', count: 10, spacing: 0.45, delay: 0 },
      { kind: 'phase', count: 6, spacing: 0.8, delay: 4 },
      { kind: 'swarm', count: 12, spacing: 0.3, delay: 9 },
    ],
  },
  {
    index: 10,
    isBoss: true,
    groups: [
      { kind: 'boss', count: 1, spacing: 1.0, delay: 0 },
      { kind: 'swarm', count: 10, spacing: 0.4, delay: 3 },
    ],
  },
];

function generateProceduralWave(index: number): WaveSpec {
  const isBoss = index % 10 === 0;
  const isMini = !isBoss && index % 5 === 0;
  const groups: WaveGroup[] = [];

  if (isBoss) {
    const bossCount = 1 + Math.floor((index - 10) / 20);
    groups.push({ kind: 'boss', count: bossCount, spacing: 1.4, delay: 0 });
    groups.push({ kind: 'swarm', count: 12 + Math.floor(index / 4), spacing: 0.35, delay: 4 });
    groups.push({ kind: 'shield', count: 6 + Math.floor(index / 10), spacing: 0.9, delay: 10 });
    return { index, isBoss: true, groups };
  }

  if (isMini) {
    groups.push({ kind: 'tank', count: 4 + Math.floor(index / 5), spacing: 0.9, delay: 0 });
    groups.push({ kind: 'shield', count: 3 + Math.floor(index / 8), spacing: 1.0, delay: 5 });
    groups.push({ kind: 'runner', count: 10 + Math.floor(index / 2), spacing: 0.45, delay: 10 });
    return { index, isMiniBoss: true, groups };
  }

  const kinds: EnemyKind[][] = [
    ['runner', 'swarm'],
    ['runner', 'tank'],
    ['runner', 'shield'],
    ['swarm', 'phase'],
    ['runner', 'phase'],
    ['tank', 'phase'],
    ['shield', 'swarm'],
  ];
  const choice = kinds[index % kinds.length];
  const baseCount = 8 + Math.floor(index * 0.6);
  for (let i = 0; i < choice.length; i++) {
    const k = choice[i];
    const isFast = k === 'swarm' || k === 'phase';
    groups.push({
      kind: k,
      count: isFast ? Math.floor(baseCount * 1.2) : Math.max(3, Math.floor(baseCount * 0.7)),
      spacing: isFast ? 0.35 : 0.6,
      delay: i === 0 ? 0 : 4 + i * 2,
    });
  }
  return { index, groups };
}

export function getWave(index: number): WaveSpec {
  if (index < 1) return SCRIPTED_WAVES[0];
  if (index <= SCRIPTED_WAVES.length) return SCRIPTED_WAVES[index - 1];
  return generateProceduralWave(index);
}

export interface SpawnTick {
  kind: EnemyKind;
  spawnAt: number;
}

export function buildSpawnSchedule(spec: WaveSpec): SpawnTick[] {
  const out: SpawnTick[] = [];
  for (const g of spec.groups) {
    for (let i = 0; i < g.count; i++) {
      out.push({ kind: g.kind, spawnAt: g.delay + i * g.spacing });
    }
  }
  out.sort((a, b) => a.spawnAt - b.spawnAt);
  return out;
}

export function totalEnemyCount(spec: WaveSpec): number {
  return spec.groups.reduce((sum, g) => sum + g.count, 0);
}
