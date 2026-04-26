// Core game types for Minimal TD.
// All gameplay logic in src/game/* references these.

export type TowerId =
  | 'basic'
  | 'sniper'
  | 'cannon'
  | 'frost'
  | 'multi'
  | 'venom'
  | 'shock'
  | 'beacon';

export type EnemyKind =
  | 'runner'
  | 'swarm'
  | 'tank'
  | 'shield'
  | 'phase'
  | 'boss';

export type MapKey = 'zigzag' | 'spiral' | 'fork' | 'cross';

export type DamageSource = 'projectile' | 'splash' | 'dot' | 'chain';

export interface TowerDef {
  id: TowerId;
  name: string;
  glyph: string;
  cost: number;
  dmg: number;
  rng: number;
  rof: number;
  color: string;
  type: string;
  desc: string;
  isAura?: boolean;
  auraRange?: number;
  auraDmgBuff?: number;
}

export interface EnemyDef {
  kind: EnemyKind;
  hpBase: number;
  speed: number;
  reward: number;
  size: number;
  color: string;
  armor?: number;
  shield?: boolean;
  phaseDuration?: number;
  phaseCycle?: number;
  bossAura?: number;
}

export type Waypoint = readonly [number, number];

export interface MapDef {
  name: string;
  code: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  paths: readonly (readonly Waypoint[])[];
}

export interface WaveGroup {
  kind: EnemyKind;
  count: number;
  spacing: number;
  delay: number;
}

export interface WaveModifier {
  id: string;
  label: string;
  speedMul?: number;
  rewardMul?: number;
  hpMul?: number;
}

export interface WaveSpec {
  index: number;
  groups: WaveGroup[];
  isBoss?: boolean;
  isMiniBoss?: boolean;
  modifier?: WaveModifier;
}

export interface PlacedTower {
  id: string;
  towerId: TowerId;
  x: number;
  y: number;
  level: number;
  spent?: number;
  equippedItems?: string[]; // OwnedItem.uid[], max 3
}

// ---- Loot system ----

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemCategory = 'tower-mod' | 'relic' | 'unique' | 'conditional';
export type ItemScope = TowerId | 'any';

export interface ItemEffect {
  // Tower-stat mul/add
  dmgMul?: number;
  dmgAdd?: number;
  rngMul?: number;
  rngAdd?: number;
  rofMul?: number;
  rofAdd?: number;
  // Per-tower specials
  splashRangeMul?: number;
  scatterTargetsAdd?: number;
  chainBouncesAdd?: number;
  poisonStackMul?: number;
  freezeStrengthAdd?: number;
  beaconRangeMul?: number;
  beaconBuffAdd?: number;
  // Global / conditional
  killCashChance?: number;
  killCashAmount?: number;
  bossWaveDmgMul?: number;
  // Uniques
  ignoreArmor?: boolean;
  endlessPoison?: boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  rarity: ItemRarity;
  category: ItemCategory;
  scope: ItemScope;
  desc: string;
  effect: ItemEffect;
  glyph?: string;
}

export interface OwnedItem {
  uid: string;
  itemId: string;
  equippedTo?: string; // PlacedTower.id
}

export interface RunInventory {
  items: OwnedItem[];
  draftHistory: { wave: number; pickedItemId: string | null }[];
}

export interface ComputedTowerEffect {
  dmgMul: number;
  dmgAdd: number;
  rngMul: number;
  rngAdd: number;
  rofMul: number;
  rofAdd: number;
  splashRangeMul: number;
  scatterTargetsAdd: number;
  chainBouncesAdd: number;
  poisonStackMul: number;
  freezeStrengthAdd: number;
  beaconRangeMul: number;
  beaconBuffAdd: number;
  ignoreArmor: boolean;
  endlessPoison: boolean;
  killCashChance: number;
  killCashAmount: number;
}

export interface ActiveEnemy {
  id: string;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  t: number;
  speed: number;
  reward: number;
  size: number;
  pathIdx: number;
  slowUntil: number;
  poison: number;
  poisonUntil: number;
  shielded?: boolean;
  phaseInvuln?: number;
  phaseTimer?: number;
}

export interface AuraEffect {
  dmgMul: number;
}
