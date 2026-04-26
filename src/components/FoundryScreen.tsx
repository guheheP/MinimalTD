import { useMetaStore } from '../state/metaStore';
import { ITEM_LIST } from '../game/items/database';
import {
  FOUNDRY_DROP_BOOST_COSTS,
  FOUNDRY_DROP_BOOST_MAX,
  FOUNDRY_INITIAL_SLOTS_COSTS,
  FOUNDRY_INITIAL_SLOTS_MAX,
  FOUNDRY_REROLL_COSTS,
  FOUNDRY_REROLL_MAX,
  ITEM_UNLOCK_COSTS_BY_RARITY,
} from '../state/types';
import type { ItemRarity } from '../game/types';
import AnimatedNumber from './AnimatedNumber';
import { formatNumber } from '../util/format';
import { useT } from '../i18n';
import { useViewport } from '../util/useViewport';

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: 'var(--ink-2)',
  rare: 'var(--accent-2)',
  epic: 'var(--accent-5)',
  legendary: 'var(--accent-3)',
  mythic: 'var(--accent-1)',
};

const BOOSTABLE: ItemRarity[] = ['rare', 'epic', 'legendary', 'mythic'];

export default function FoundryScreen() {
  const t = useT();
  const { isMobile } = useViewport();
  const essence = useMetaStore((s) => s.essence);
  const itemsUnlocked = useMetaStore((s) => s.unlocks.items);
  const foundry = useMetaStore((s) => s.foundry);
  const buyInitialSlots = useMetaStore((s) => s.buyInitialSlots);
  const buyRerollCount = useMetaStore((s) => s.buyRerollCount);
  const buyDropBoost = useMetaStore((s) => s.buyDropBoost);
  const unlockItem = useMetaStore((s) => s.unlockItem);

  const lockedItems = ITEM_LIST.filter((i) => !itemsUnlocked.includes(i.id));

  return (
    <div style={{ padding: isMobile ? 14 : 24, color: 'var(--ink)', maxWidth: 920, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid var(--line)', paddingBottom: 12, marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{t('foundry.subtitle')}</div>
          <div className="h-display" style={{ fontSize: isMobile ? 22 : 32 }}>{t('foundry.title')}</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: 'var(--accent-1)' }}><AnimatedNumber value={essence} format={formatNumber} /></div>
          <div className="k">{t('hud.essence')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 18 }}>
        <div className="panel" style={{ padding: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t('foundry.upgrades')}</div>

          <FoundryRow
            label={t('foundry.initialSlots')}
            current={foundry.initialSlots}
            max={FOUNDRY_INITIAL_SLOTS_MAX}
            nextCost={foundry.initialSlots < FOUNDRY_INITIAL_SLOTS_MAX ? FOUNDRY_INITIAL_SLOTS_COSTS[foundry.initialSlots] : null}
            essence={essence}
            onBuy={buyInitialSlots}
            desc={t('foundry.initialSlotsDesc')}
            isMobile={isMobile}
          />
          <FoundryRow
            label={t('foundry.rerolls')}
            current={foundry.rerollCount}
            max={FOUNDRY_REROLL_MAX}
            nextCost={foundry.rerollCount < FOUNDRY_REROLL_MAX ? FOUNDRY_REROLL_COSTS[foundry.rerollCount] : null}
            essence={essence}
            onBuy={buyRerollCount}
            desc={t('foundry.rerollsDesc')}
            isMobile={isMobile}
          />

          <div className="eyebrow" style={{ marginTop: 14, marginBottom: 8 }}>{t('foundry.boosts')}</div>
          {BOOSTABLE.map((r) => {
            const cur = foundry.dropRateBoost[r] ?? 0;
            const cost = FOUNDRY_DROP_BOOST_COSTS[r];
            const atMax = cur >= FOUNDRY_DROP_BOOST_MAX;
            return (
              <FoundryRow
                key={r}
                label={r.toUpperCase()}
                color={RARITY_COLOR[r]}
                current={cur}
                max={FOUNDRY_DROP_BOOST_MAX}
                nextCost={atMax ? null : cost ?? null}
                essence={essence}
                onBuy={() => buyDropBoost(r)}
                isMobile={isMobile}
              />
            );
          })}
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t('foundry.unlockItems')}</div>
          {lockedItems.length === 0 ? (
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{t('foundry.allUnlocked')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: isMobile ? 'none' : 460, overflow: isMobile ? 'visible' : 'auto' }}>
              {lockedItems.map((item) => {
                const cost = ITEM_UNLOCK_COSTS_BY_RARITY[item.rarity];
                const can = essence >= cost;
                return (
                  <button
                    key={item.id}
                    onClick={() => unlockItem(item.id)}
                    disabled={!can}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: 8, background: 'var(--paper)',
                      border: `2px solid ${RARITY_COLOR[item.rarity]}`,
                      cursor: can ? 'pointer' : 'not-allowed', opacity: can ? 1 : 0.4,
                      textAlign: 'left',
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontSize: 18, color: RARITY_COLOR[item.rarity], flexShrink: 0 }}>{item.glyph ?? '◆'}</span>
                    <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--accent-1)', flexShrink: 0 }}>{cost}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  color?: string;
  current: number;
  max: number;
  nextCost: number | null;
  essence: number;
  onBuy: () => void;
  desc?: string;
  isMobile?: boolean;
}

function FoundryRow({ label, color, current, max, nextCost, essence, onBuy, desc, isMobile }: RowProps) {
  const can = nextCost != null && essence >= nextCost;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr auto' : '1fr auto auto',
        alignItems: 'center',
        columnGap: 10,
        rowGap: 6,
        padding: '8px 0',
        borderTop: '1px solid var(--line)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: color ?? 'inherit' }}>{label}</div>
        {desc && <div className="mono" style={{ fontSize: 9, color: 'var(--muted)' }}>{desc}</div>}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 10,
          gridColumn: isMobile ? '2 / 3' : 'auto',
          gridRow: isMobile ? '1 / 2' : 'auto',
          textAlign: 'right',
          whiteSpace: 'nowrap',
        }}
      >
        {current}/{max}
      </div>
      <button
        className="btn btn-primary"
        onClick={onBuy}
        disabled={!can}
        style={{
          padding: '6px 10px',
          fontSize: 10,
          minWidth: isMobile ? 0 : 100,
          width: isMobile ? '100%' : undefined,
          gridColumn: isMobile ? '1 / 3' : 'auto',
        }}
      >
        {nextCost == null ? 'MAX' : `BUY · ${nextCost}`}
      </button>
    </div>
  );
}
