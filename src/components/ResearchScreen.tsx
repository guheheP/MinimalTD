import { useMetaStore } from '../state/metaStore';
import { TOWER_LIST } from '../game/towers';
import {
  MASTERY_COSTS,
  MASTERY_MAX,
  TOWER_UNLOCK_COSTS,
} from '../state/types';
import type { TowerId } from '../game/types';
import { TowerGlyph } from './Towers';
import { masteryDmgMul } from '../game/items/effects';
import AnimatedNumber from './AnimatedNumber';
import { formatNumber } from '../util/format';
import { useT } from '../i18n';

export default function ResearchScreen() {
  const t = useT();
  const cores = useMetaStore((s) => s.cores);
  const towersUnlocked = useMetaStore((s) => s.unlocks.towers);
  const mastery = useMetaStore((s) => s.mastery);
  const upgradeMastery = useMetaStore((s) => s.upgradeMastery);
  const unlockTower = useMetaStore((s) => s.unlockTower);

  return (
    <div style={{ padding: 24, color: 'var(--ink)', maxWidth: 920, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid var(--line)', paddingBottom: 12, marginBottom: 18 }}>
        <div>
          <div className="eyebrow">{t('research.subtitle')}</div>
          <div className="h-display" style={{ fontSize: 32 }}>{t('research.title')}</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: 'var(--accent-3)' }}><AnimatedNumber value={cores} format={formatNumber} /></div>
          <div className="k">{t('hud.cores')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {TOWER_LIST.map((tw) => {
          const id = tw.id as TowerId;
          const unlocked = towersUnlocked.includes(id);
          const lv = mastery[id] ?? 0;
          const atMax = lv >= MASTERY_MAX;
          const upCost = atMax ? Infinity : MASTERY_COSTS[lv];
          const unlockCost = TOWER_UNLOCK_COSTS[id];
          const canBuyMastery = unlocked && !atMax && cores >= upCost;
          const canUnlock = !unlocked && unlockCost != null && cores >= unlockCost;

          return (
            <div key={id} className="panel" style={{ padding: 12, opacity: unlocked ? 1 : 0.75 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TowerGlyph id={id} size={26} style="geometric" color={tw.color} />
                <div style={{ flex: 1 }}>
                  <div className="h-display" style={{ fontSize: 16 }}>{tw.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{tw.type}</div>
                </div>
                {unlocked ? (
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em' }}>
                    LV {lv}/{MASTERY_MAX}
                  </div>
                ) : (
                  <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{t('common.locked')}</div>
                )}
              </div>

              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-2)', marginTop: 6 }}>
                {t('research.dmgBonus')}: +{Math.round((masteryDmgMul(lv) - 1) * 100)}%
              </div>

              <div style={{ marginTop: 10 }}>
                {unlocked ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => upgradeMastery(id)}
                    disabled={!canBuyMastery}
                    style={{ padding: '8px 12px', fontSize: 10, width: '100%' }}
                  >
                    {atMax ? t('common.max') : `${t('common.upgrade')} · ${upCost} ${t('hud.cores')}`}
                  </button>
                ) : unlockCost != null ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => unlockTower(id)}
                    disabled={!canUnlock}
                    style={{ padding: '8px 12px', fontSize: 10, width: '100%' }}
                  >
                    {t('common.unlock')} · {unlockCost} {t('hud.cores')}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
