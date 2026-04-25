import { useEffect, useState } from 'react';
import type { Route } from '../app/route';
import { useMetaStore } from '../state/metaStore';
import { hasRun, loadRun } from '../state/runSave';
import { ITEMS } from '../game/items/database';
import { useT } from '../i18n';
import AnimatedNumber from './AnimatedNumber';
import { formatNumber } from '../util/format';
import { useViewport } from '../util/useViewport';

interface Props {
  navigate: (next: Route) => void;
}

export default function MenuScreen({ navigate }: Props) {
  const t = useT();
  const { isMobile } = useViewport();
  const totalRuns = useMetaStore((s) => s.totalRuns);
  const highestWave = useMetaStore((s) => s.highestWave);
  const itemsUnlocked = useMetaStore((s) => s.unlocks.items);

  const [continueAvailable, setContinueAvailable] = useState(false);
  useEffect(() => {
    setContinueAvailable(hasRun());
  }, []);

  const mythicCount = itemsUnlocked.filter((id) => ITEMS[id]?.rarity === 'mythic').length;

  const onNewRun = () => navigate({ name: 'map-select' });
  const onContinue = () => {
    const snap = loadRun();
    if (!snap) return;
    navigate({ name: 'game', mapKey: snap.mapKey, resume: snap });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: 32,
        gap: 32,
        color: 'var(--ink)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div className="h-display" style={{ fontSize: isMobile ? 56 : 96, letterSpacing: '0.04em', lineHeight: 1 }}>
          MINIMAL<span style={{ color: 'var(--accent-1)' }}>TD</span>
        </div>
        <div className="mono" style={{ fontSize: isMobile ? 10 : 12, letterSpacing: '0.18em', color: 'var(--muted)', marginTop: 8, padding: '0 12px' }}>
          {t('menu.tagline')}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className="btn btn-accent"
          onClick={onNewRun}
          style={{ padding: '14px 28px', fontSize: 14, letterSpacing: '0.18em' }}
        >
          {t('common.newRun')}
        </button>
        <button
          className="btn btn-primary"
          onClick={onContinue}
          disabled={!continueAvailable}
          style={{
            padding: '14px 28px',
            fontSize: 14,
            letterSpacing: '0.18em',
            opacity: continueAvailable ? 1 : 0.4,
            cursor: continueAvailable ? 'pointer' : 'not-allowed',
          }}
        >
          {t('common.continue')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: isMobile ? 18 : 32, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Stat label={t('menu.statsRuns')} value={totalRuns} />
        <Stat label={t('menu.statsBestWave')} value={highestWave} accent="var(--accent-2)" />
        <Stat label={t('menu.statsMythic')} value={mythicCount} accent="var(--accent-1)" />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="stat" style={{ textAlign: 'center' }}>
      <div className="v" style={{ fontSize: 28, color: accent ?? 'var(--ink)' }}>
        <AnimatedNumber value={value} format={formatNumber} />
      </div>
      <div className="k" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}
