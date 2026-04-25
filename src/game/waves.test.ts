import { describe, expect, it } from 'vitest';
import { buildSpawnSchedule, getWave, totalEnemyCount } from './waves';

describe('waves.getWave', () => {
  it('returns a spec whose index matches the request for any positive wave', () => {
    for (const w of [1, 5, 10, 15, 30, 60, 100]) {
      const spec = getWave(w);
      expect(spec.index).toBe(w);
    }
  });

  it('flags W10/W20/W30 as boss waves', () => {
    expect(getWave(10).isBoss).toBe(true);
    expect(getWave(20).isBoss).toBe(true);
    expect(getWave(30).isBoss).toBe(true);
  });

  it('flags W5/W15/W25 as mini-boss waves (champion)', () => {
    expect(getWave(5).isMiniBoss).toBe(true);
    expect(getWave(15).isMiniBoss).toBe(true);
    expect(getWave(25).isMiniBoss).toBe(true);
  });

  it('non-boss waves have at least one enemy group', () => {
    for (const w of [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 21, 33]) {
      const spec = getWave(w);
      expect(spec.groups.length).toBeGreaterThan(0);
      expect(spec.isBoss).toBeFalsy();
    }
  });

  it('boss waves include at least one boss enemy', () => {
    const spec = getWave(10);
    const hasBoss = spec.groups.some((g) => g.kind === 'boss');
    expect(hasBoss).toBe(true);
  });

  it('clamps non-positive indices to wave 1', () => {
    expect(getWave(0).index).toBe(1);
    expect(getWave(-3).index).toBe(1);
  });
});

describe('waves.buildSpawnSchedule', () => {
  it('flattens groups into per-spawn ticks sorted by spawnAt', () => {
    const schedule = buildSpawnSchedule({
      index: 1,
      groups: [
        { kind: 'runner', count: 3, spacing: 1, delay: 0 },
        { kind: 'tank', count: 2, spacing: 2, delay: 5 },
      ],
    });
    expect(schedule).toHaveLength(5);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].spawnAt).toBeGreaterThanOrEqual(schedule[i - 1].spawnAt);
    }
  });

  it('produces an empty schedule for a wave with empty groups', () => {
    const schedule = buildSpawnSchedule({ index: 1, groups: [] });
    expect(schedule).toHaveLength(0);
  });
});

describe('waves.totalEnemyCount', () => {
  it('sums every group count', () => {
    const total = totalEnemyCount({
      index: 1,
      groups: [
        { kind: 'runner', count: 5, spacing: 0.5, delay: 0 },
        { kind: 'swarm', count: 12, spacing: 0.3, delay: 4 },
      ],
    });
    expect(total).toBe(17);
  });
});
