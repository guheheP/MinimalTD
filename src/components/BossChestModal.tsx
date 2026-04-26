import { useState } from 'react';
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

interface BossChestModalProps {
  wave: number;
  items: ItemDef[];
  onTake: () => void;
}

function ItemRow({ item, isMobile }: { item: ItemDef; isMobile: boolean }) {
  const color = RARITY_COLOR[item.rarity];
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'stretch',
        gap: isMobile ? 10 : 12,
        padding: isMobile ? 10 : 12,
        background: 'var(--paper)',
        border: `3px solid ${color}`,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: isMobile ? 56 : 64,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          background: 'var(--bg-2)',
          border: `1px solid ${color}`,
        }}
      >
        <div style={{ fontSize: isMobile ? 28 : 32, lineHeight: 1, color }}>{item.glyph ?? '◆'}</div>
        <div className="mono" style={{ fontSize: 8, letterSpacing: '0.14em', color }}>
          {RARITY_LABEL[item.rarity]}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
        <div className="h-display" style={{ fontSize: isMobile ? 16 : 18, lineHeight: 1.1 }}>{item.name}</div>
        <div style={{ fontSize: isMobile ? 11 : 12, color: 'var(--ink-2)', lineHeight: 1.35 }}>{item.desc}</div>
      </div>
    </div>
  );
}

export default function BossChestModal({ wave, items, onTake }: BossChestModalProps) {
  const t = useT();
  const { isMobile } = useViewport();
  const [opened, setOpened] = useState(false);

  return (
    <div
      style={{
        position: isMobile ? 'fixed' : 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: isMobile ? 12 : 0,
      }}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: '3px solid var(--line)',
          padding: isMobile ? 14 : 28,
          minWidth: isMobile ? 0 : 360,
          maxWidth: isMobile ? '100%' : 520,
          maxHeight: isMobile ? '100%' : 'none',
          overflow: 'auto',
          width: isMobile ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isMobile ? 12 : 16,
        }}
      >
        <div className="eyebrow">{t('chest.bossDefeated', { n: wave })}</div>

        {!opened ? (
          <>
            <button
              onClick={() => { setOpened(true); playSfx('chest-open'); }}
              style={{
                width: 120,
                height: 120,
                background: 'var(--paper)',
                border: '3px solid var(--line)',
                cursor: 'pointer',
                fontSize: 64,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Open chest"
            >
              ▣
            </button>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--muted)' }}>
              {t('chest.clickToOpen')}
            </div>
          </>
        ) : (
          <>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((it, i) => (
                <ItemRow key={`${it.id}-${i}`} item={it} isMobile={isMobile} />
              ))}
            </div>
            <button className="btn btn-primary" onClick={onTake} style={{ padding: '10px 22px', fontSize: 11, marginTop: 4 }}>
              {t('common.take')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
