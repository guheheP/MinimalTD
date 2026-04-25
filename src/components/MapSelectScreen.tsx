import type { Route } from '../app/route';
import type { MapKey } from '../game/types';
import { MAPS } from '../game/towers';
import { useMetaStore } from '../state/metaStore';
import { MAP_UNLOCK_RULES } from '../state/types';
import { useT } from '../i18n';
import { formatDuration, formatNumber } from '../util/format';
import { useViewport } from '../util/useViewport';
import type { DictKey } from '../i18n/dict.en';

interface Props {
  navigate: (next: Route) => void;
}

const MAP_KEYS: MapKey[] = ['zigzag', 'spiral', 'fork', 'cross'];

const DIFF_KEY: Record<string, DictKey> = {
  EASY: 'map.diff.easy',
  MEDIUM: 'map.diff.medium',
  HARD: 'map.diff.hard',
  EXPERT: 'map.diff.expert',
};

export default function MapSelectScreen({ navigate }: Props) {
  const t = useT();
  const { isMobile } = useViewport();
  const unlocked = useMetaStore((s) => s.unlocks.maps);
  const bestRuns = useMetaStore((s) => s.bestRuns);
  const totalRuns = useMetaStore((s) => s.totalRuns);
  const highestWave = useMetaStore((s) => s.highestWave);

  return (
    <div style={{ padding: 24, color: 'var(--ink)', maxWidth: 920, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          borderBottom: '2px solid var(--line)',
          paddingBottom: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <div className="eyebrow">SELECT</div>
          <div className="h-display" style={{ fontSize: 32 }}>{t('map.title')}</div>
        </div>
        <button
          className="btn"
          onClick={() => navigate({ name: 'menu' })}
          style={{ padding: '8px 14px', fontSize: 11 }}
        >
          {t('common.back')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
        {MAP_KEYS.map((key) => {
          const map = MAPS[key];
          const isUnlocked = unlocked.includes(key);
          const best = bestRuns[key];
          const rule = MAP_UNLOCK_RULES[key];
          const hint = !isUnlocked && rule
            ? rule.afterRuns != null
              ? t(`map.unlockHint.${key}` as DictKey, { n: rule.afterRuns })
              : rule.afterWave != null
                ? t(`map.unlockHint.${key}` as DictKey, { n: rule.afterWave })
                : ''
            : '';
          const progress = !isUnlocked && rule
            ? rule.afterRuns != null
              ? `${totalRuns} / ${rule.afterRuns}`
              : rule.afterWave != null
                ? `${highestWave} / ${rule.afterWave}`
                : ''
            : '';

          return (
            <button
              key={key}
              onClick={() => isUnlocked && navigate({ name: 'game', mapKey: key })}
              disabled={!isUnlocked}
              className="panel-bold"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                padding: 14,
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                opacity: isUnlocked ? 1 : 0.55,
                background: 'var(--paper)',
                color: 'var(--ink)',
                gap: 10,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="h-display" style={{ fontSize: 22 }}>
                  {map.code} <span style={{ color: 'var(--muted)' }}>/</span> {map.name}
                </div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--muted)' }}>
                  {t(DIFF_KEY[map.difficulty] ?? 'map.diff.easy')}
                </div>
              </div>

              <MapPreview mapKey={key} />

              {isUnlocked ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span className="mono" style={{ color: 'var(--muted)', letterSpacing: '0.14em' }}>
                    {t('map.best')}
                  </span>
                  {best ? (
                    <span className="mono" style={{ letterSpacing: '0.12em' }}>
                      W{formatNumber(best.wave)} · {formatNumber(best.score)} · {formatDuration(best.durationMs)}
                    </span>
                  ) : (
                    <span className="mono" style={{ color: 'var(--muted)' }}>—</span>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--muted)' }}>
                    {hint}
                  </div>
                  {progress && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--accent-1)', letterSpacing: '0.12em' }}>
                      {progress}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MapPreview({ mapKey }: { mapKey: MapKey }) {
  const map = MAPS[mapKey];
  const W = 320;
  const H = 140;
  const paths = map.paths.map((wp) => wp.map(([x, y]) => [x * W, y * H] as const));
  const d = paths
    .map((pts) => 'M ' + pts.map((p) => `${p[0]},${p[1]}`).join(' L '))
    .join(' ');
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}
    >
      <path d={d} stroke="var(--line)" strokeWidth={20} fill="none" opacity={0.12} />
      <path d={d} stroke="var(--line)" strokeWidth={2} fill="none" strokeDasharray="4 6" />
      {paths.map((pts, i) => {
        const start = pts[0];
        const end = pts[pts.length - 1];
        return (
          <g key={i}>
            <circle cx={start[0]} cy={start[1]} r={6} fill="var(--accent-2)" stroke="var(--line)" strokeWidth={1.5} />
            <polygon
              points={`${end[0] - 5},${end[1] - 5} ${end[0] + 5},${end[1]} ${end[0] - 5},${end[1] + 5}`}
              fill="var(--accent-1)"
              stroke="var(--line)"
              strokeWidth={1.5}
            />
          </g>
        );
      })}
    </svg>
  );
}
