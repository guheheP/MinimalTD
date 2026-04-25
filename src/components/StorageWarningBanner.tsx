import { useState } from 'react';
import { canPersist } from '../util/storageHealth';
import { useT } from '../i18n';

export default function StorageWarningBanner() {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  if (canPersist()) return null;
  return (
    <div
      className="mono"
      style={{
        background: 'var(--accent-1)',
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
      <span>⚠ {t('storage.unavailable')}</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="dismiss"
        style={{
          background: 'transparent',
          border: '1px solid var(--paper)',
          color: 'var(--paper)',
          padding: '2px 8px',
          fontSize: 10,
          cursor: 'pointer',
          fontFamily: 'inherit',
          letterSpacing: '0.16em',
        }}
      >
        ×
      </button>
    </div>
  );
}
