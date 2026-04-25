import { useState } from 'react';
import { useMetaStore } from '../state/metaStore';
import { playSfx } from '../audio/sfx';
import { useT } from '../i18n';
import type { LanguageId, ThemeId } from '../state/types';

const THEME_OPTIONS: { id: ThemeId; labelKey: 'settings.theme.default' | 'settings.theme.dark' | 'settings.theme.mono' | 'settings.theme.pastel' | 'settings.theme.neon' }[] = [
  { id: 'default', labelKey: 'settings.theme.default' },
  { id: 'dark', labelKey: 'settings.theme.dark' },
  { id: 'mono', labelKey: 'settings.theme.mono' },
  { id: 'pastel', labelKey: 'settings.theme.pastel' },
  { id: 'neon', labelKey: 'settings.theme.neon' },
];

const LANG_OPTIONS: { id: LanguageId; labelKey: 'settings.lang.en' | 'settings.lang.ja' }[] = [
  { id: 'en', labelKey: 'settings.lang.en' },
  { id: 'ja', labelKey: 'settings.lang.ja' },
];

export default function SettingsScreen() {
  const t = useT();
  const settings = useMetaStore((s) => s.settings);
  const setSettings = useMetaStore((s) => s.setSettings);
  const reset = useMetaStore((s) => s.reset);
  const [confirming, setConfirming] = useState(false);

  return (
    <div style={{ padding: 24, color: 'var(--ink)', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ borderBottom: '2px solid var(--line)', paddingBottom: 12, marginBottom: 18 }}>
        <div className="eyebrow">{t('settings.subtitle')}</div>
        <div className="h-display" style={{ fontSize: 32 }}>{t('settings.title')}</div>
      </div>

      <Section title={t('settings.theme')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className="btn"
              onClick={() => setSettings({ theme: opt.id })}
              style={{
                padding: '6px 12px',
                fontSize: 11,
                background: settings.theme === opt.id ? 'var(--ink)' : 'transparent',
                color: settings.theme === opt.id ? 'var(--paper)' : 'var(--ink)',
              }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t('settings.language')}>
        <div style={{ display: 'flex', gap: 6 }}>
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className="btn"
              onClick={() => setSettings({ language: opt.id })}
              style={{
                padding: '6px 12px',
                fontSize: 11,
                background: settings.language === opt.id ? 'var(--ink)' : 'transparent',
                color: settings.language === opt.id ? 'var(--paper)' : 'var(--ink)',
              }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t('settings.sfxVolume')}>
        <input
          type="range" min={0} max={1} step={0.05}
          value={settings.sfxVolume}
          onChange={(e) => setSettings({ sfxVolume: Number(e.target.value) })}
          onMouseUp={() => playSfx('tower-place')}
          onTouchEnd={() => playSfx('tower-place')}
          style={{ width: 240 }}
        />
        <span className="mono" style={{ marginLeft: 12, fontSize: 11 }}>
          {Math.round(settings.sfxVolume * 100)}%
        </span>
      </Section>

      <Section title={t('settings.bgmVolume')}>
        <input
          type="range" min={0} max={1} step={0.05}
          value={settings.bgmVolume}
          onChange={(e) => setSettings({ bgmVolume: Number(e.target.value) })}
          style={{ width: 240 }}
        />
        <span className="mono" style={{ marginLeft: 12, fontSize: 11 }}>
          {Math.round(settings.bgmVolume * 100)}%
        </span>
      </Section>

      <div style={{ marginTop: 32, padding: 18, border: '2px dashed var(--accent-1)' }}>
        <div className="eyebrow" style={{ color: 'var(--accent-1)', marginBottom: 10 }}>{t('settings.danger')}</div>
        {!confirming ? (
          <button className="btn" onClick={() => setConfirming(true)} style={{ padding: '8px 14px', fontSize: 11, borderColor: 'var(--accent-1)', color: 'var(--accent-1)' }}>
            {t('settings.resetAll')}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12 }}>{t('settings.resetConfirm')}</span>
            <button className="btn btn-accent" onClick={() => { reset(); setConfirming(false); }} style={{ padding: '6px 12px', fontSize: 11 }}>
              {t('common.confirm')}
            </button>
            <button className="btn" onClick={() => setConfirming(false)} style={{ padding: '6px 12px', fontSize: 11 }}>
              {t('common.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}
