import type { TowerId, MapKey, ItemRarity } from '../game/types';

export type ThemeId = 'default' | 'dark' | 'mono' | 'pastel' | 'neon';
export type LanguageId = 'en' | 'ja';

export interface Settings {
  theme: ThemeId;
  language: LanguageId;
  sfxVolume: number;  // 0..1
  bgmVolume: number;  // 0..1
}

export interface BestRun {
  wave: number;
  score: number;
  durationMs: number;
  date: string; // ISO 8601
}

export interface FoundryConfig {
  initialSlots: number;
  rerollCount: number;
  dropRateBoost: Partial<Record<ItemRarity, number>>;
}

export interface MetaState {
  version: number;
  cores: number;
  essence: number;
  unlocks: {
    towers: TowerId[];
    maps: MapKey[];
    items: string[];
  };
  mastery: Partial<Record<TowerId, number>>;
  foundry: FoundryConfig;
  bestRuns: Partial<Record<MapKey, BestRun>>;
  totalRuns: number;
  highestWave: number;
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'default',
  language: detectInitialLanguage(),
  sfxVolume: 0.7,
  bgmVolume: 0.5,
};

function detectInitialLanguage(): LanguageId {
  if (typeof navigator === 'undefined') return 'en';
  const lang = (navigator.language || 'en').toLowerCase();
  return lang.startsWith('ja') ? 'ja' : 'en';
}

export const META_VERSION = 1;

export const DEFAULT_TOWER_UNLOCKS: TowerId[] = ['basic', 'sniper', 'cannon', 'frost'];
export const DEFAULT_MAP_UNLOCKS: MapKey[] = ['zigzag'];

// Cost tables
export const MASTERY_COSTS = [100, 300, 800, 2000, 5000] as const; // LV1..LV5
export const MASTERY_MAX = 5;

export const TOWER_UNLOCK_COSTS: Partial<Record<TowerId, number>> = {
  multi: 800,
  venom: 800,
  shock: 2000,
  beacon: 2000,
};

export const MAP_UNLOCK_RULES: Partial<Record<MapKey, { afterRuns?: number; afterWave?: number }>> = {
  spiral: { afterRuns: 5 },
  fork: { afterWave: 30 },
  cross: { afterWave: 50 },
};

export const FOUNDRY_INITIAL_SLOTS_COSTS = [200, 600] as const; // LV1, LV2
export const FOUNDRY_REROLL_COSTS = [150, 400, 1000] as const;  // LV1, LV2, LV3
export const FOUNDRY_INITIAL_SLOTS_MAX = 2;
export const FOUNDRY_REROLL_MAX = 3;
export const FOUNDRY_DROP_BOOST_MAX = 5;

export const FOUNDRY_DROP_BOOST_COSTS: Partial<Record<ItemRarity, number>> = {
  rare: 100, epic: 300, legendary: 800, mythic: 2000,
};

// Per-step rarity weight added to base RARITY_WEIGHTS when a boost is purchased.
export const FOUNDRY_DROP_BOOST_AMOUNT: Partial<Record<ItemRarity, number>> = {
  rare: 4, epic: 3, legendary: 2, mythic: 1,
};

export const ITEM_UNLOCK_COSTS_BY_RARITY: Record<ItemRarity, number> = {
  common: 0,
  rare: 0,
  epic: 200,
  legendary: 800,
  mythic: 2500,
};
