import type { ItemDef } from '../types';

// 30 items for v1.0.
// Distribution: Common 12 / Rare 9 / Epic 6 / Legendary 2 / Mythic 1.
export const ITEMS: Record<string, ItemDef> = {
  // ===== Common (12) =====
  'red-dot': {
    id: 'red-dot', name: 'RED DOT', rarity: 'common', category: 'tower-mod', scope: 'basic',
    desc: 'POINT damage +25%.', effect: { dmgMul: 1.25 }, glyph: '●',
  },
  'long-lens': {
    id: 'long-lens', name: 'LONG LENS', rarity: 'common', category: 'tower-mod', scope: 'sniper',
    desc: 'PIERCE range +20%.', effect: { rngMul: 1.20 }, glyph: '▲',
  },
  'heavy-shell': {
    id: 'heavy-shell', name: 'HEAVY SHELL', rarity: 'common', category: 'tower-mod', scope: 'cannon',
    desc: 'BLAST splash +25%.', effect: { splashRangeMul: 1.25 }, glyph: '■',
  },
  'frostbite': {
    id: 'frostbite', name: 'FROSTBITE', rarity: 'common', category: 'tower-mod', scope: 'frost',
    desc: 'FREEZE slow +30%.', effect: { freezeStrengthAdd: 0.30 }, glyph: '◆',
  },
  'spread': {
    id: 'spread', name: 'SPREAD', rarity: 'common', category: 'tower-mod', scope: 'multi',
    desc: 'SCATTER targets +1.', effect: { scatterTargetsAdd: 1 }, glyph: '★',
  },
  'toxin': {
    id: 'toxin', name: 'TOXIN', rarity: 'common', category: 'tower-mod', scope: 'venom',
    desc: 'VENOM stack +25%.', effect: { poisonStackMul: 1.25 }, glyph: '⬢',
  },
  'conduit': {
    id: 'conduit', name: 'CONDUIT', rarity: 'common', category: 'tower-mod', scope: 'shock',
    desc: 'CHAIN bounces +1.', effect: { chainBouncesAdd: 1 }, glyph: '⚡',
  },
  'resonator': {
    id: 'resonator', name: 'RESONATOR', rarity: 'common', category: 'tower-mod', scope: 'beacon',
    desc: 'BEACON aura range +15%.', effect: { beaconRangeMul: 1.15 }, glyph: '⬡',
  },
  'steady-hands': {
    id: 'steady-hands', name: 'STEADY HANDS', rarity: 'common', category: 'relic', scope: 'any',
    desc: 'All towers fire-rate +5%.', effect: { rofMul: 1.05 }, glyph: '◐',
  },
  'sharpened': {
    id: 'sharpened', name: 'SHARPENED', rarity: 'common', category: 'relic', scope: 'any',
    desc: 'All towers damage +5%.', effect: { dmgMul: 1.05 }, glyph: '◑',
  },
  'quick-loader': {
    id: 'quick-loader', name: 'QUICK LOADER', rarity: 'common', category: 'tower-mod', scope: 'basic',
    desc: 'POINT fire-rate +25%.', effect: { rofMul: 1.25 }, glyph: '◓',
  },
  'ranged-sight': {
    id: 'ranged-sight', name: 'RANGED SIGHT', rarity: 'common', category: 'relic', scope: 'any',
    desc: 'All towers range +10%.', effect: { rngMul: 1.10 }, glyph: '◒',
  },

  // ===== Rare (9) =====
  'crimson-lens': {
    id: 'crimson-lens', name: 'CRIMSON LENS', rarity: 'rare', category: 'tower-mod', scope: 'basic',
    desc: 'POINT damage +60%.', effect: { dmgMul: 1.60 }, glyph: '●',
  },
  'ballistic-calc': {
    id: 'ballistic-calc', name: 'BALLISTIC CALC', rarity: 'rare', category: 'tower-mod', scope: 'sniper',
    desc: 'PIERCE damage +40%, fire-rate +25%.', effect: { dmgMul: 1.40, rofMul: 1.25 }, glyph: '▲',
  },
  'shrapnel': {
    id: 'shrapnel', name: 'SHRAPNEL', rarity: 'rare', category: 'tower-mod', scope: 'cannon',
    desc: 'BLAST splash +60%.', effect: { splashRangeMul: 1.60 }, glyph: '■',
  },
  'glacial': {
    id: 'glacial', name: 'GLACIAL', rarity: 'rare', category: 'tower-mod', scope: 'frost',
    desc: 'FREEZE damage +120%.', effect: { dmgMul: 2.20 }, glyph: '◆',
  },
  'blossom': {
    id: 'blossom', name: 'BLOSSOM', rarity: 'rare', category: 'tower-mod', scope: 'multi',
    desc: 'SCATTER targets +2.', effect: { scatterTargetsAdd: 2 }, glyph: '★',
  },
  'necrotic': {
    id: 'necrotic', name: 'NECROTIC', rarity: 'rare', category: 'tower-mod', scope: 'venom',
    desc: 'VENOM stack +50%.', effect: { poisonStackMul: 1.50 }, glyph: '⬢',
  },
  'storm-coil': {
    id: 'storm-coil', name: 'STORM COIL', rarity: 'rare', category: 'tower-mod', scope: 'shock',
    desc: 'CHAIN bounces +2.', effect: { chainBouncesAdd: 2 }, glyph: '⚡',
  },
  'beacon-core': {
    id: 'beacon-core', name: 'BEACON CORE', rarity: 'rare', category: 'tower-mod', scope: 'beacon',
    desc: 'BEACON aura buff +25pp.', effect: { beaconBuffAdd: 0.25 }, glyph: '⬡',
  },
  'profit-margin': {
    id: 'profit-margin', name: 'PROFIT MARGIN', rarity: 'rare', category: 'relic', scope: 'any',
    desc: '12% chance of $5 on kill.', effect: { killCashChance: 0.12, killCashAmount: 5 }, glyph: '$',
  },

  // ===== Epic (6) =====
  'hyperloop': {
    id: 'hyperloop', name: 'HYPERLOOP', rarity: 'epic', category: 'relic', scope: 'any',
    desc: 'All towers fire-rate +25%.', effect: { rofMul: 1.25 }, glyph: '⚙',
  },
  'ion-strike': {
    id: 'ion-strike', name: 'ION STRIKE', rarity: 'epic', category: 'tower-mod', scope: 'basic',
    desc: 'POINT damage +120%, fire-rate +30%.', effect: { dmgMul: 2.20, rofMul: 1.30 }, glyph: '●',
  },
  'quantum-lens': {
    id: 'quantum-lens', name: 'QUANTUM LENS', rarity: 'epic', category: 'unique', scope: 'sniper',
    desc: 'PIERCE ignores armor.', effect: { ignoreArmor: true }, glyph: '◇',
  },
  'mortar-pod': {
    id: 'mortar-pod', name: 'MORTAR POD', rarity: 'epic', category: 'tower-mod', scope: 'cannon',
    desc: 'BLAST splash +120%.', effect: { splashRangeMul: 2.20 }, glyph: '■',
  },
  'oversoul': {
    id: 'oversoul', name: 'OVERSOUL', rarity: 'epic', category: 'tower-mod', scope: 'beacon',
    desc: 'BEACON aura range +50%, buff +35pp.', effect: { beaconRangeMul: 1.50, beaconBuffAdd: 0.35 }, glyph: '⬡',
  },
  'endless-toxin': {
    id: 'endless-toxin', name: 'ENDLESS TOXIN', rarity: 'epic', category: 'unique', scope: 'venom',
    desc: 'VENOM DoT lasts until enemy dies.', effect: { endlessPoison: true }, glyph: '☣',
  },

  // ===== Legendary (2) =====
  'twin-stars': {
    id: 'twin-stars', name: 'TWIN STARS', rarity: 'legendary', category: 'tower-mod', scope: 'multi',
    desc: 'SCATTER targets +3, damage +60%.', effect: { scatterTargetsAdd: 3, dmgMul: 1.60 }, glyph: '★',
  },
  'black-sun': {
    id: 'black-sun', name: 'BLACK SUN', rarity: 'legendary', category: 'conditional', scope: 'any',
    desc: 'All towers damage +60% during boss waves.', effect: { bossWaveDmgMul: 1.60 }, glyph: '◉',
  },

  // ===== Mythic (1) =====
  'singularity': {
    id: 'singularity', name: 'SINGULARITY', rarity: 'mythic', category: 'relic', scope: 'any',
    desc: 'All towers damage +30%, range +20%, fire-rate +20%.', effect: { dmgMul: 1.30, rngMul: 1.20, rofMul: 1.20 }, glyph: '✸',
  },
};

export const ITEM_LIST: readonly ItemDef[] = Object.values(ITEMS);

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id];
}
