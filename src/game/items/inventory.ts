import type { ItemDef, OwnedItem, RunInventory } from '../types';

const MAX_SLOTS_PER_TOWER = 3;

export function emptyInventory(): RunInventory {
  return { items: [], draftHistory: [] };
}

let _uidCounter = 0;
function nextUid(): string {
  _uidCounter += 1;
  return `i${_uidCounter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function addItem(inv: RunInventory, item: ItemDef): RunInventory {
  const owned: OwnedItem = { uid: nextUid(), itemId: item.id };
  return { ...inv, items: [...inv.items, owned] };
}

export function recordDraft(inv: RunInventory, wave: number, pickedItemId: string | null): RunInventory {
  return { ...inv, draftHistory: [...inv.draftHistory, { wave, pickedItemId }] };
}

export function countEquipped(inv: RunInventory, towerId: string): number {
  return inv.items.filter((i) => i.equippedTo === towerId).length;
}

export function equipItem(inv: RunInventory, uid: string, towerId: string): RunInventory {
  const target = inv.items.find((i) => i.uid === uid);
  if (!target || target.equippedTo) return inv;
  if (countEquipped(inv, towerId) >= MAX_SLOTS_PER_TOWER) return inv;
  return {
    ...inv,
    items: inv.items.map((i) => (i.uid === uid ? { ...i, equippedTo: towerId } : i)),
  };
}

export function unequipItem(inv: RunInventory, uid: string): RunInventory {
  return {
    ...inv,
    items: inv.items.map((i) => {
      if (i.uid !== uid) return i;
      const { equippedTo: _drop, ...rest } = i;
      void _drop;
      return rest;
    }),
  };
}

// Remove all items currently equipped to a tower (used when the tower is sold).
export function unequipAllFromTower(inv: RunInventory, towerId: string): RunInventory {
  return {
    ...inv,
    items: inv.items.map((i) => {
      if (i.equippedTo !== towerId) return i;
      const { equippedTo: _drop, ...rest } = i;
      void _drop;
      return rest;
    }),
  };
}

export function removeItem(inv: RunInventory, uid: string): RunInventory {
  return { ...inv, items: inv.items.filter((i) => i.uid !== uid) };
}

export function rarityCounts(inv: RunInventory, getDef: (id: string) => ItemDef | undefined) {
  const counts = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
  for (const it of inv.items) {
    const def = getDef(it.itemId);
    if (!def) continue;
    counts[def.rarity] += 1;
  }
  return counts;
}

export const MAX_ITEM_SLOTS_PER_TOWER = MAX_SLOTS_PER_TOWER;
