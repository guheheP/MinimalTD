import { useMemo } from 'react';
import type { RunInventory } from '../game/types';
import { computePassiveEffect } from '../game/items/effects';
import { useT } from '../i18n';

interface Props {
  inventory: RunInventory;
  isBossWave: boolean;
}

export default function TotalEffectsPanel({ inventory, isBossWave }: Props) {
  const t = useT();

  const base = useMemo(
    () => computePassiveEffect(inventory, { isBossWave: false }),
    [inventory],
  );
  const boss = useMemo(
    () => computePassiveEffect(inventory, { isBossWave: true }),
    [inventory],
  );

  const rows: Array<{ label: string; value: string; color?: string }> = [];

  const dmgPct = Math.round((base.dmgMul - 1) * 100);
  if (dmgPct !== 0 || base.dmgAdd !== 0) {
    const parts: string[] = [];
    if (dmgPct !== 0) parts.push(`${dmgPct > 0 ? '+' : ''}${dmgPct}%`);
    if (base.dmgAdd !== 0) parts.push(`${base.dmgAdd > 0 ? '+' : ''}${base.dmgAdd}`);
    rows.push({ label: 'DMG', value: parts.join(' ') });
  }

  const rngPct = Math.round((base.rngMul - 1) * 100);
  if (rngPct !== 0 || base.rngAdd !== 0) {
    const parts: string[] = [];
    if (rngPct !== 0) parts.push(`${rngPct > 0 ? '+' : ''}${rngPct}%`);
    if (base.rngAdd !== 0) parts.push(`${base.rngAdd > 0 ? '+' : ''}${base.rngAdd}`);
    rows.push({ label: 'RNG', value: parts.join(' ') });
  }

  const rofPct = Math.round((base.rofMul - 1) * 100);
  if (rofPct !== 0 || base.rofAdd !== 0) {
    const parts: string[] = [];
    if (rofPct !== 0) parts.push(`${rofPct > 0 ? '+' : ''}${rofPct}%`);
    if (base.rofAdd !== 0) parts.push(`${base.rofAdd > 0 ? '+' : ''}${base.rofAdd.toFixed(1)}`);
    rows.push({ label: 'RoF', value: parts.join(' ') });
  }

  if (base.killCashChance > 0) {
    const pct = Math.round(base.killCashChance * 100);
    rows.push({ label: 'KILL $', value: `${pct}% × $${base.killCashAmount}`, color: 'var(--accent-3)' });
  }

  const bossDmgPct = Math.round((boss.dmgMul / Math.max(0.0001, base.dmgMul) - 1) * 100);
  if (bossDmgPct !== 0) {
    rows.push({
      label: 'BOSS DMG',
      value: `${bossDmgPct > 0 ? '+' : ''}${bossDmgPct}%`,
      color: isBossWave ? 'var(--accent-1)' : 'var(--muted)',
    });
  }

  if (rows.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        padding: '4px 8px',
        border: '1px solid var(--line)',
        background: 'var(--paper)',
      }}
    >
      <div className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--muted)' }}>
        {t('hud.totalEffects')}
      </div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--muted)' }}>
            {r.label}
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, letterSpacing: '0.1em', color: r.color ?? 'var(--ink)', fontWeight: 700 }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
