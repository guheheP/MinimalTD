import { useState } from 'react';
import { TOWER_LIST } from '../game/towers';
import { ENEMIES } from '../game/enemies';
import { ITEM_LIST } from '../game/items/database';
import type { EnemyKind, ItemRarity, TowerId } from '../game/types';
import { useMetaStore } from '../state/metaStore';
import { TowerGlyph, EnemyShape } from './Towers';
import { useT } from '../i18n';
import type { DictKey } from '../i18n/dict.en';
import { useViewport } from '../util/useViewport';

type Tab = 'towers' | 'enemies' | 'items';

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: 'var(--ink-2)',
  rare: 'var(--accent-2)',
  epic: 'var(--accent-5)',
  legendary: 'var(--accent-3)',
  mythic: 'var(--accent-1)',
};

const RARITY_ORDER: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

const ENEMY_KINDS: EnemyKind[] = ['runner', 'swarm', 'tank', 'shield', 'phase', 'boss'];

export default function CodexScreen() {
  const t = useT();
  const { isMobile } = useViewport();
  const [tab, setTab] = useState<Tab>('towers');

  return (
    <div style={{ padding: isMobile ? 14 : 24, color: 'var(--ink)', maxWidth: 920, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          borderBottom: '2px solid var(--line)',
          paddingBottom: 12,
          marginBottom: 18,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">META · CODEX</div>
          <div className="h-display" style={{ fontSize: isMobile ? 22 : 32 }}>{t('codex.title')}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <SubTab label={t('codex.tabTowers')} active={tab === 'towers'} onClick={() => setTab('towers')} />
        <SubTab label={t('codex.tabEnemies')} active={tab === 'enemies'} onClick={() => setTab('enemies')} />
        <SubTab label={t('codex.tabItems')} active={tab === 'items'} onClick={() => setTab('items')} />
      </div>

      {tab === 'towers' && <TowersTab isMobile={isMobile} />}
      {tab === 'enemies' && <EnemiesTab isMobile={isMobile} />}
      {tab === 'items' && <ItemsTab isMobile={isMobile} />}
    </div>
  );
}

function SubTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn"
      style={{
        padding: '6px 14px',
        fontSize: 11,
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink)',
      }}
    >
      {label}
    </button>
  );
}

function TowersTab({ isMobile }: { isMobile: boolean }) {
  const t = useT();
  const unlocked = useMetaStore((s) => s.unlocks.towers);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
      {TOWER_LIST.map((tw) => {
        const id = tw.id as TowerId;
        const isUnlocked = unlocked.includes(id);
        return (
          <div key={id} className="panel" style={{ padding: 12, opacity: isUnlocked ? 1 : 0.55 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TowerGlyph id={id} size={28} style="geometric" color={tw.color} />
              <div style={{ flex: 1 }}>
                <div className="h-display" style={{ fontSize: 16 }}>{tw.name}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{tw.type}</div>
              </div>
              {!isUnlocked && (
                <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{t('common.locked')}</div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 10 }}>
              <Stat k="DMG" v={tw.dmg || '—'} />
              <Stat k={tw.isAura ? 'AURA' : 'RNG'} v={tw.isAura ? (tw.auraRange ?? 100) : tw.rng} />
              <Stat k="RoF" v={tw.rof || '—'} />
              <Stat k="$" v={tw.cost} />
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>
              {t(`tower.${id}.desc` as DictKey)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EnemiesTab({ isMobile }: { isMobile: boolean }) {
  const t = useT();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
      {ENEMY_KINDS.map((kind) => {
        const def = ENEMIES[kind];
        return (
          <div key={kind} className="panel" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EnemyShape kind={kind} size={26} color="var(--ink)" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="h-display" style={{ fontSize: 16, textTransform: 'uppercase' }}>{kind}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10 }}>
              <Stat k="HP" v={def.hpBase} />
              <Stat k="SPD" v={def.speed} />
              <Stat k="$" v={def.reward} />
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>
              {t(`enemy.${kind}.desc` as DictKey)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ItemsTab({ isMobile }: { isMobile: boolean }) {
  const t = useT();
  const unlocked = useMetaStore((s) => s.unlocks.items);
  const unlockedSet = new Set(unlocked);
  const totalCount = ITEM_LIST.length;
  const unlockedCount = ITEM_LIST.filter((i) => unlockedSet.has(i.id)).length;

  return (
    <div>
      <div
        className="mono"
        style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--muted)', marginBottom: 8 }}
      >
        {unlockedCount} / {totalCount}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {RARITY_ORDER.map((rar) => {
          const items = ITEM_LIST.filter((i) => i.rarity === rar);
          if (items.length === 0) return null;
          return (
            <div key={rar}>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  color: RARITY_COLOR[rar],
                  marginBottom: 6,
                }}
              >
                {rar.toUpperCase()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 6 }}>
                {items.map((item) => {
                  const isUnlocked = unlockedSet.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="panel"
                      style={{
                        padding: 8,
                        opacity: isUnlocked ? 1 : 0.45,
                        borderColor: RARITY_COLOR[item.rarity],
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 18, color: RARITY_COLOR[item.rarity] }}>
                          {item.glyph ?? '◆'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="mono"
                            style={{
                              fontSize: 10,
                              letterSpacing: '0.1em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.name}
                          </div>
                          {!isUnlocked && (
                            <div className="mono" style={{ fontSize: 9, color: 'var(--muted)' }}>
                              {t('common.locked')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.4 }}>
                        {item.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="stat">
      <div className="v" style={{ fontSize: 14 }}>{v}</div>
      <div className="k">{k}</div>
    </div>
  );
}
