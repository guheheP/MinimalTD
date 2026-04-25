import { useEffect } from 'react';
import type { ItemDef, ItemRarity } from '../game/types';
import { useViewport } from '../util/useViewport';
import { playSfx } from '../audio/sfx';
import { useT } from '../i18n';

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: 'var(--ink-2)',
  rare: 'var(--accent-2)',
  epic: 'var(--accent-5)',
  legendary: 'var(--accent-3)',
  mythic: 'var(--accent-1)',
};

const RARITY_LABEL: Record<ItemRarity, string> = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
  mythic: 'MYTHIC',
};

interface DraftModalProps {
  wave: number;
  options: ItemDef[];
  rerollsLeft?: number;
  onPick: (item: ItemDef) => void;
  onSkip: () => void;
  onReroll?: () => void;
}

function ItemCard({ item, onPick }: { item: ItemDef; onPick: () => void }) {
  const color = RARITY_COLOR[item.rarity];
  return (
    <button
      onClick={onPick}
      style={{
        flex: 1,
        minWidth: 0,
        padding: 18,
        background: 'var(--paper)',
        border: `3px solid ${color}`,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color }}>
        {RARITY_LABEL[item.rarity]}
      </div>
      <div style={{ fontSize: 36, lineHeight: 1, color }}>{item.glyph ?? '◆'}</div>
      <div className="h-display" style={{ fontSize: 18 }}>{item.name}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4 }}>{item.desc}</div>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--muted)', marginTop: 'auto' }}>
        {item.scope === 'any' ? 'GLOBAL' : `TARGET: ${String(item.scope).toUpperCase()}`}
      </div>
    </button>
  );
}

export default function DraftModal({ wave, options, rerollsLeft = 0, onPick, onSkip, onReroll }: DraftModalProps) {
  const t = useT();
  const { isMobile } = useViewport();
  useEffect(() => { playSfx('draft-open'); }, []);
  return (
    <div
      style={{
        position: isMobile ? 'fixed' : 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: isMobile ? 12 : 0,
      }}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: '3px solid var(--line)',
          padding: isMobile ? 16 : 28,
          maxWidth: isMobile ? '100%' : 760,
          maxHeight: isMobile ? '100%' : 'none',
          overflow: 'auto',
          width: isMobile ? '100%' : '92%',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 12 : 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div className="eyebrow">{t('draft.subtitle', { n: wave })}</div>
            <div className="h-display" style={{ fontSize: 32 }}>
              {t('draft.title')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {onReroll && rerollsLeft > 0 && (
              <button className="btn" onClick={onReroll} style={{ padding: '8px 14px', fontSize: 11 }}>
                {t('draft.rerollLabel', { n: rerollsLeft })}
              </button>
            )}
            <button className="btn btn-ghost" onClick={onSkip} style={{ padding: '8px 14px', fontSize: 11 }}>
              {t('common.skip')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: isMobile ? 10 : 14, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          {options.map((it) => (
            <ItemCard key={it.id} item={it} onPick={() => onPick(it)} />
          ))}
        </div>
      </div>
    </div>
  );
}
