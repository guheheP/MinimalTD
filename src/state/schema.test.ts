import { describe, expect, it } from 'vitest';
import { migrate, parseMetaState } from './schema';

const validBlob = {
  version: 1,
  cores: 100,
  essence: 50,
  unlocks: { towers: ['basic', 'sniper'], maps: ['zigzag'], items: ['red-dot'] },
  mastery: { basic: 2 },
  foundry: { initialSlots: 1, rerollCount: 0, dropRateBoost: { rare: 1 } },
  bestRuns: { zigzag: { wave: 12, score: 6400, durationMs: 425000, date: '2026-04-25T17:35:22.123Z' } },
  totalRuns: 3,
  highestWave: 12,
  settings: { theme: 'default', language: 'en', sfxVolume: 0.7, bgmVolume: 0.5 },
};

describe('schema.parseMetaState', () => {
  it('accepts a well-formed v1 blob', () => {
    expect(parseMetaState(validBlob)).not.toBeNull();
  });

  it('rejects negative cores', () => {
    expect(parseMetaState({ ...validBlob, cores: -1 })).toBeNull();
  });

  it('rejects mastery > 5', () => {
    expect(parseMetaState({ ...validBlob, mastery: { basic: 6 } })).toBeNull();
  });

  it('rejects unknown tower id in unlocks', () => {
    expect(parseMetaState({ ...validBlob, unlocks: { ...validBlob.unlocks, towers: ['unknown'] } })).toBeNull();
  });
});

describe('schema.migrate', () => {
  it('returns null for null/undefined input', () => {
    expect(migrate(null, 1)).toBeNull();
    expect(migrate(undefined, 1)).toBeNull();
  });

  it('returns null for older schema version', () => {
    expect(migrate({ ...validBlob, version: 0 }, 0)).toBeNull();
  });

  it('parses current version', () => {
    expect(migrate(validBlob, 1)).not.toBeNull();
  });
});
