import type { MapKey } from '../game/types';
import type { RunSnapshot } from '../state/runSave';

export interface RunResultStats {
  mapKey: MapKey;
  reachedWave: number;
  score: number;
  durationMs: number;
  endReason: 'breach' | 'retired';
  coresEarned: number;
  essenceEarned: number;
  lootCounts: { common: number; rare: number; epic: number; legendary: number; mythic: number };
  newlyUnlocked?: { kind: 'map' | 'item'; label: string }[];
}

export type Route =
  | { name: 'menu' }
  | { name: 'map-select' }
  | { name: 'game'; mapKey: MapKey; resume?: RunSnapshot }
  | { name: 'results'; stats: RunResultStats }
  | { name: 'research' }
  | { name: 'foundry' }
  | { name: 'codex' }
  | { name: 'settings' };

export type RouteName = Route['name'];

const FULLSCREEN_ROUTES: ReadonlySet<RouteName> = new Set(['game', 'map-select', 'results']);

export function isNavHidden(route: Route): boolean {
  return FULLSCREEN_ROUTES.has(route.name);
}

export const TAB_ROUTES: readonly RouteName[] = ['menu', 'research', 'foundry', 'codex', 'settings'];
