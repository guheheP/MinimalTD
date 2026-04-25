import type { ReactNode } from 'react';
import type { Route, RunResultStats } from '../app/route';
import { useT } from '../i18n';
import AnimatedNumber from './AnimatedNumber';
import { formatDuration, formatNumber } from '../util/format';
import { useViewport } from '../util/useViewport';

interface Props {
  stats: RunResultStats;
  navigate: (next: Route) => void;
}

const RARITY_COLOR = {
  common: 'var(--ink-2)',
  rare: 'var(--accent-2)',
  epic: 'var(--accent-5)',
  legendary: 'var(--accent-3)',
  mythic: 'var(--accent-1)',
} as const;

export default function ResultsScreen({ stats, navigate }: Props) {
  const t = useT();
  const { isMobile } = useViewport();
  const titleKey = stats.endReason === 'breach' ? 'results.titleBreach' : 'results.titleRetired';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: 32,
        gap: 24,
        color: 'var(--ink)',
      }}
    >
      <div className="eyebrow">{t('results.title')}</div>
      <div className="h-display" style={{ fontSize: isMobile ? 48 : 72, color: 'var(--accent-1)', letterSpacing: '0.06em' }}>
        {t(titleKey)}
      </div>

      <div className="panel-bold" style={{ padding: isMobile ? 14 : 20, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Row label={t('results.reachedWave')} value={formatNumber(stats.reachedWave)} accent="var(--accent-2)" />
        <Row label="SCORE" value={formatNumber(stats.score)} />
        <Row label={t('results.duration')} value={formatDuration(stats.durationMs)} />

        <Divider />

        <Row
          label={t('results.coresEarned')}
          value={<AnimatedNumber value={stats.coresEarned} format={formatNumber} duration={800} />}
          accent="var(--accent-3)"
        />
        <Row
          label={t('results.essenceEarned')}
          value={<AnimatedNumber value={stats.essenceEarned} format={formatNumber} duration={800} />}
          accent="var(--accent-1)"
        />

        <Divider />

        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t('game.lootCollected')}</div>
          <div className="mono" style={{ display: 'flex', gap: 14, fontSize: 12, letterSpacing: '0.16em' }}>
            <LootCount label="C" n={stats.lootCounts.common} color={RARITY_COLOR.common} />
            <LootCount label="R" n={stats.lootCounts.rare} color={RARITY_COLOR.rare} />
            <LootCount label="E" n={stats.lootCounts.epic} color={RARITY_COLOR.epic} />
            <LootCount label="L" n={stats.lootCounts.legendary} color={RARITY_COLOR.legendary} />
            <LootCount label="M" n={stats.lootCounts.mythic} color={RARITY_COLOR.mythic} />
          </div>
        </div>

        {stats.newlyUnlocked && stats.newlyUnlocked.length > 0 && (
          <>
            <Divider />
            <div>
              <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--accent-1)' }}>
                {t('results.unlocked')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {stats.newlyUnlocked.map((u, i) => (
                  <div
                    key={i}
                    className="mono"
                    style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--accent-1)' }}
                  >
                    ◆ {u.label}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className="btn"
          onClick={() => navigate({ name: 'menu' })}
          style={{ padding: '12px 22px', fontSize: 12, letterSpacing: '0.16em' }}
        >
          {t('results.backToMenu')}
        </button>
        <button
          className="btn btn-accent"
          onClick={() => navigate({ name: 'game', mapKey: stats.mapKey })}
          style={{ padding: '12px 22px', fontSize: 12, letterSpacing: '0.16em' }}
        >
          {t('common.playAgain')}
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--muted)' }}>
        {label}
      </div>
      <div className="h-display" style={{ fontSize: 22, color: accent ?? 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--line)', opacity: 0.4 }} />;
}

function LootCount({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <span style={{ color }}>
      {label}·{n}
    </span>
  );
}
