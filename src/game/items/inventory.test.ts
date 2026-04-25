import { describe, expect, it } from 'vitest';
import {
  emptyInventory, addItem, equipItem, unequipItem, unequipAllFromTower,
  removeItem, countEquipped, rarityCounts, MAX_ITEM_SLOTS_PER_TOWER,
} from './inventory';
import { ITEMS, getItem } from './database';

describe('inventory.emptyInventory', () => {
  it('has empty arrays', () => {
    const inv = emptyInventory();
    expect(inv.items).toEqual([]);
    expect(inv.draftHistory).toEqual([]);
  });
});

describe('inventory.addItem', () => {
  it('appends an OwnedItem with a fresh uid', () => {
    const inv = addItem(emptyInventory(), ITEMS['red-dot']);
    expect(inv.items).toHaveLength(1);
    expect(inv.items[0].itemId).toBe('red-dot');
    expect(inv.items[0].uid).toBeTruthy();
  });

  it('does not mutate the input', () => {
    const inv = emptyInventory();
    addItem(inv, ITEMS['red-dot']);
    expect(inv.items).toHaveLength(0);
  });
});

describe('inventory.equipItem', () => {
  it('attaches an item to a tower', () => {
    let inv = addItem(emptyInventory(), ITEMS['red-dot']);
    const uid = inv.items[0].uid;
    inv = equipItem(inv, uid, 'tower-1');
    expect(inv.items[0].equippedTo).toBe('tower-1');
  });

  it('respects the slot cap', () => {
    let inv = emptyInventory();
    for (let i = 0; i < MAX_ITEM_SLOTS_PER_TOWER + 1; i++) {
      inv = addItem(inv, ITEMS['red-dot']);
    }
    for (const it of inv.items) inv = equipItem(inv, it.uid, 'tower-1');
    expect(countEquipped(inv, 'tower-1')).toBe(MAX_ITEM_SLOTS_PER_TOWER);
  });

  it('refuses to equip an already-equipped item', () => {
    let inv = addItem(emptyInventory(), ITEMS['red-dot']);
    const uid = inv.items[0].uid;
    inv = equipItem(inv, uid, 'tower-1');
    inv = equipItem(inv, uid, 'tower-2');
    expect(inv.items[0].equippedTo).toBe('tower-1');
  });
});

describe('inventory.unequipItem', () => {
  it('clears equippedTo', () => {
    let inv = addItem(emptyInventory(), ITEMS['red-dot']);
    const uid = inv.items[0].uid;
    inv = equipItem(inv, uid, 'tower-1');
    inv = unequipItem(inv, uid);
    expect(inv.items[0].equippedTo).toBeUndefined();
  });
});

describe('inventory.unequipAllFromTower', () => {
  it('frees every slot on a tower', () => {
    let inv = emptyInventory();
    for (let i = 0; i < 3; i++) inv = addItem(inv, ITEMS['red-dot']);
    for (const it of inv.items) inv = equipItem(inv, it.uid, 'tower-1');
    inv = unequipAllFromTower(inv, 'tower-1');
    expect(countEquipped(inv, 'tower-1')).toBe(0);
    expect(inv.items.every((i) => !i.equippedTo)).toBe(true);
  });
});

describe('inventory.removeItem', () => {
  it('drops the item entirely', () => {
    let inv = addItem(emptyInventory(), ITEMS['red-dot']);
    const uid = inv.items[0].uid;
    inv = removeItem(inv, uid);
    expect(inv.items).toHaveLength(0);
  });
});

describe('inventory.rarityCounts', () => {
  it('tallies by rarity', () => {
    let inv = emptyInventory();
    inv = addItem(inv, ITEMS['red-dot']);          // common
    inv = addItem(inv, ITEMS['crimson-lens']);     // rare
    inv = addItem(inv, ITEMS['singularity']);      // mythic
    const counts = rarityCounts(inv, getItem);
    expect(counts.common).toBe(1);
    expect(counts.rare).toBe(1);
    expect(counts.mythic).toBe(1);
    expect(counts.epic).toBe(0);
    expect(counts.legendary).toBe(0);
  });
});
