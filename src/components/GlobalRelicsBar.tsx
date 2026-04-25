import type { ItemRarity, RunInventory } from '../game/types';
import { getItem } from '../game/items/database';

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: 'var(--ink-2)',
  rare: 'var(--accent-2)',
  epic: 'var(--accent-5)',
  legendary: 'var(--accent-3)',
  mythic: 'var(--accent-1)',
};

export default function GlobalRelicsBar({ inventory }: { inventory: RunInventory }) {
  const passive = inventory.items.filter((i) => {
    if (i.equippedTo) return false;
    const def = getItem(i.itemId);
    return def && def.category !== 'tower-mod';
  });

  if (passive.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
      {passive.map((owned) => {
        const def = getItem(owned.itemId);
        if (!def) return null;
        const color = RARITY_COLOR[def.rarity];
        return (
          <div
            key={owned.uid}
            title={`${def.name} — ${def.desc}`}
            style={{
              width: 26, height: 26,
              background: 'var(--paper)',
              border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color,
            }}
          >
            {def.glyph ?? '◆'}
          </div>
        );
      })}
    </div>
  );
}
