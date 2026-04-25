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
  item: ItemDef;
  onTake: () => void;
}

export default function BossChestModal({ wave, item, onTake }: BossChestModalProps) {
  const t = useT();
  const { isMobile } = useViewport();
  const [opened, setOpened] = useState(false);
  const color = RARITY_COLOR[item.rarity];

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
        padding: isMobile ? 16 : 0,
      }}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: '3px solid var(--line)',
          padding: isMobile ? 18 : 28,
          minWidth: isMobile ? 0 : 360,
          maxWidth: isMobile ? '100%' : 460,
          width: isMobile ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
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
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color }}>
              {RARITY_LABEL[item.rarity]}
            </div>
            <div style={{ fontSize: 64, lineHeight: 1, color }}>{item.glyph ?? '◆'}</div>
            <div className="h-display" style={{ fontSize: 24 }}>{item.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', textAlign: 'center', lineHeight: 1.4 }}>
              {item.desc}
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
