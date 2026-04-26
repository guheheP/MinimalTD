import { useEffect, useState } from 'react';
import { subscribePwaUpdate, type PwaUpdateState } from '../pwa';
import { useT } from '../i18n';

const NOOP = () => undefined;

export default function UpdatePrompt() {
  const t = useT();
  const [state, setState] = useState<PwaUpdateState>({ available: false, trigger: NOOP });

  useEffect(() => subscribePwaUpdate(setState), []);

  if (!state.available) return null;

  return (
    <div
      className="mono"
      style={{
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: '6px 14px',
        fontSize: 11,
        letterSpacing: '0.16em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span>◆ {t('pwa.updateAvailable')}</span>
      <button
        onClick={state.trigger}
        style={{
          background: 'var(--accent-1)',
          border: '1px solid var(--accent-1)',
          color: 'var(--paper)',
          padding: '4px 12px',
          fontSize: 10,
          letterSpacing: '0.18em',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 600,
        }}
      >
        {t('pwa.update')}
      </button>
    </div>
  );
}
