import { useState } from 'react';
import type { ItemDef, ItemRarity, OwnedItem, RunInventory, TowerId } from '../game/types';
import { getItem } from '../game/items/database';
import { eligibleItemsForTower } from '../game/items/effects';
import { MAX_ITEM_SLOTS_PER_TOWER } from '../game/items/inventory';
import { useViewport } from '../util/useViewport';
import { useT } from '../i18n';

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: 'var(--ink-2)',
  rare: 'var(--accent-2)',
  epic: 'var(--accent-5)',
  legendary: 'var(--accent-3)',
  mythic: 'var(--accent-1)',
};

interface Props {
  towerId: string;
  towerDefId: TowerId;
  inventory: RunInventory;
  onEquip: (uid: string) => void;
  onUnequip: (uid: string) => void;
}

export default function ItemSlots({ towerId, towerDefId, inventory, onEquip, onUnequip }: Props) {
  const [picking, setPicking] = useState<number | null>(null);
  const { isMobile } = useViewport();
  const t = useT();
  const equipped: OwnedItem[] = inventory.items.filter((i) => i.equippedTo === towerId);
  const filled = equipped.length;
  const eligibleUids = eligibleItemsForTower(towerDefId, inventory);

  return (
    <div className="panel" style={{ padding: 10, position: 'relative', overflow: 'visible' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        ITEM SLOTS · {filled}/{MAX_ITEM_SLOTS_PER_TOWER}
      </div>
      <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
        {Array.from({ length: MAX_ITEM_SLOTS_PER_TOWER }).map((_, i) => {
          const owned = equipped[i];
          const def = owned ? getItem(owned.itemId) : null;
          const color = def ? RARITY_COLOR[def.rarity] : 'var(--line)';
          if (def && owned) {
            return (
              <button
                key={i}
                onClick={() => onUnequip(owned.uid)}
                title={`${def.name} — click to unequip`}
                style={{
                  width: 44, height: 44, background: 'var(--paper)',
                  border: `2px solid ${color}`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color, padding: 0,
                }}
              >
                {def.glyph ?? '◆'}
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => setPicking(picking === i ? null : i)}
              disabled={eligibleUids.length === 0}
              title={eligibleUids.length === 0 ? 'No eligible items' : 'Equip an item'}
              style={{
                width: 44, height: 44, background: 'transparent',
                border: '2px dashed var(--line)', cursor: eligibleUids.length ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: 'var(--muted)', padding: 0,
                opacity: eligibleUids.length ? 1 : 0.4,
              }}
            >
              +
            </button>
          );
        })}
      </div>

      {picking !== null && eligibleUids.length > 0 && (
        <>
          <div
            onClick={() => setPicking(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: isMobile ? 'rgba(0,0,0,0.4)' : 'transparent' }}
          />
          <div
            style={isMobile ? {
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              padding: 12,
              background: 'var(--paper)',
              borderTop: '3px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: '50vh',
              overflowY: 'auto',
              zIndex: 41,
            } : {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '100%',
              marginBottom: 8,
              padding: 8,
              background: 'var(--paper)',
              border: '2px solid var(--line)',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              maxHeight: 240,
              overflowY: 'auto',
              zIndex: 41,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '0.16em', color: 'var(--muted)' }}>SELECT</div>
              {isMobile && (
                <button
                  onClick={() => setPicking(null)}
                  className="btn"
                  style={{ padding: '4px 10px', fontSize: 10 }}
                >
                  {t('common.close')}
                </button>
              )}
            </div>
            {eligibleUids.map((uid) => {
              const owned = inventory.items.find((i) => i.uid === uid);
              if (!owned) return null;
              const def: ItemDef | undefined = getItem(owned.itemId);
              if (!def) return null;
              const color = RARITY_COLOR[def.rarity];
              return (
                <button
                  key={uid}
                  onClick={() => { onEquip(uid); setPicking(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: isMobile ? '10px 10px' : '6px 8px', background: 'var(--paper)',
                    border: `2px solid ${color}`, cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 16, color }}>{def.glyph ?? '◆'}</span>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em' }}>{def.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
