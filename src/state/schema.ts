import { z } from 'zod';
import type { MetaState } from './types';
import { META_VERSION } from './types';

const TowerIdEnum = z.enum(['basic', 'sniper', 'cannon', 'frost', 'multi', 'venom', 'shock', 'beacon']);
const MapKeyEnum = z.enum(['zigzag', 'spiral', 'fork', 'cross']);
const RarityEnum = z.enum(['common', 'rare', 'epic', 'legendary', 'mythic']);
const ThemeEnum = z.enum(['default', 'dark', 'mono', 'pastel', 'neon']);
const LanguageEnum = z.enum(['en', 'ja']);

const SettingsSchema = z.object({
  theme: ThemeEnum,
  language: LanguageEnum,
  sfxVolume: z.number().min(0).max(1),
  bgmVolume: z.number().min(0).max(1),
});

const BestRunSchema = z.object({
  wave: z.number().int().nonnegative(),
  score: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
  date: z.string(),
});

const FoundrySchema = z.object({
  initialSlots: z.number().int().min(0).max(2),
  rerollCount: z.number().int().min(0).max(3),
  dropRateBoost: z.partialRecord(RarityEnum, z.number().int().min(0).max(5)),
});

const MetaStateV1Schema = z.object({
  version: z.literal(1),
  cores: z.number().int().nonnegative(),
  essence: z.number().int().nonnegative(),
  unlocks: z.object({
    towers: z.array(TowerIdEnum),
    maps: z.array(MapKeyEnum),
    items: z.array(z.string()),
  }),
  mastery: z.partialRecord(TowerIdEnum, z.number().int().min(0).max(5)),
  foundry: FoundrySchema,
  bestRuns: z.partialRecord(MapKeyEnum, BestRunSchema),
  totalRuns: z.number().int().nonnegative(),
  highestWave: z.number().int().nonnegative(),
  settings: SettingsSchema,
});

export function parseMetaState(raw: unknown): MetaState | null {
  const result = MetaStateV1Schema.safeParse(raw);
  if (!result.success) return null;
  return result.data as MetaState;
}

// Convert any persisted blob to MetaState | null (= reset to defaults).
// Add per-version branches as schema evolves.
export function migrate(raw: unknown, _persistedVersion: number): MetaState | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = (raw as { version?: unknown }).version;
  if (v === META_VERSION) return parseMetaState(raw);
  return null;
}
