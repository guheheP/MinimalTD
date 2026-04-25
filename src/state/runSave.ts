import { z } from 'zod';
import type { MapKey, PlacedTower, RunInventory } from '../game/types';

export const RUN_SAVE_VERSION = 1;
const STORAGE_KEY = 'minimaltd:save';

const TowerIdEnum = z.enum(['basic', 'sniper', 'cannon', 'frost', 'multi', 'venom', 'shock', 'beacon']);
const MapKeyEnum = z.enum(['zigzag', 'spiral', 'fork', 'cross']);

const PlacedTowerSchema = z.object({
  id: z.string(),
  towerId: TowerIdEnum,
  x: z.number(),
  y: z.number(),
  level: z.number().int().min(1).max(5),
  spent: z.number().int().nonnegative().optional(),
  equippedItems: z.array(z.string()).optional(),
});

const OwnedItemSchema = z.object({
  uid: z.string(),
  itemId: z.string(),
  equippedTo: z.string().optional(),
});

const DraftEntrySchema = z.object({
  wave: z.number().int().nonnegative(),
  pickedItemId: z.string().nullable(),
});

const RunInventorySchema = z.object({
  items: z.array(OwnedItemSchema),
  draftHistory: z.array(DraftEntrySchema),
});

const RunSnapshotSchema = z.object({
  version: z.literal(RUN_SAVE_VERSION),
  mapKey: MapKeyEnum,
  wave: z.number().int().min(1),
  hp: z.number().int().nonnegative(),
  money: z.number().int().nonnegative(),
  score: z.number().int().nonnegative(),
  placed: z.array(PlacedTowerSchema),
  inventory: RunInventorySchema,
  startedAt: z.string(),
});

export type RunSnapshot = z.infer<typeof RunSnapshotSchema>;

export interface SaveRunInput {
  mapKey: MapKey;
  wave: number;
  hp: number;
  money: number;
  score: number;
  placed: readonly PlacedTower[];
  inventory: RunInventory;
  startedAt: string;
}

function stripPlaced(towers: readonly PlacedTower[]): PlacedTower[] {
  return towers.map(({ id, towerId, x, y, level, spent, equippedItems }) => ({
    id,
    towerId,
    x,
    y,
    level,
    ...(spent !== undefined ? { spent } : {}),
    ...(equippedItems ? { equippedItems } : {}),
  }));
}

export function saveRun(input: SaveRunInput, storage: Storage | null = safeLocalStorage()): void {
  if (!storage) return;
  const snap: RunSnapshot = {
    version: RUN_SAVE_VERSION,
    mapKey: input.mapKey,
    wave: input.wave,
    hp: input.hp,
    money: input.money,
    score: input.score,
    placed: stripPlaced(input.placed),
    inventory: input.inventory,
    startedAt: input.startedAt,
  };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // quota or serialization failure: ignore — Continue is a convenience.
  }
}

export function loadRun(storage: Storage | null = safeLocalStorage()): RunSnapshot | null {
  if (!storage) return null;
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = RunSnapshotSchema.safeParse(parsed);
  if (!result.success) {
    clearRun(storage);
    return null;
  }
  return result.data;
}

export function clearRun(storage: Storage | null = safeLocalStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasRun(storage: Storage | null = safeLocalStorage()): boolean {
  return loadRun(storage) != null;
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}
