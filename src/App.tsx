import { useEffect, useState, useCallback } from 'react';
import GamePlay from './components/GamePlay';
import ResearchScreen from './components/ResearchScreen';
import FoundryScreen from './components/FoundryScreen';
import SettingsScreen from './components/SettingsScreen';
import MenuScreen from './components/MenuScreen';
import MapSelectScreen from './components/MapSelectScreen';
import ResultsScreen from './components/ResultsScreen';
import CodexScreen from './components/CodexScreen';
import FpsOverlay from './components/FpsOverlay';
import StorageWarningBanner from './components/StorageWarningBanner';
import UpdatePrompt from './components/UpdatePrompt';
import { isNavHidden, type Route, type RunResultStats } from './app/route';
import { useMetaStore } from './state/metaStore';
import { useViewport } from './util/useViewport';
import { unlockAudio } from './audio/audioContext';
import { useT } from './i18n';

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'menu' });
  const t = useT();
  const theme = useMetaStore((s) => s.settings.theme);
  const { isMobile } = useViewport();

  useEffect(() => {
    const cls = ['theme-dark', 'theme-mono', 'theme-pastel', 'theme-neon'];
    cls.forEach((c) => document.body.classList.remove(c));
    if (theme !== 'default') document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // Unlock the AudioContext once on the user's first gesture (required by browsers).
  useEffect(() => {
    const onFirst = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
    };
    window.addEventListener('pointerdown', onFirst, { once: true });
    window.addEventListener('keydown', onFirst, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
    };
  }, []);

  const navigate = useCallback((next: Route) => setRoute(next), []);
  const handleRunExit = useCallback(
    (stats: RunResultStats) => setRoute({ name: 'results', stats }),
    [],
  );

  const navHidden = isNavHidden(route);
  const isPlay = route.name === 'game';

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <UpdatePrompt />
      <StorageWarningBanner />
      {!navHidden && (
        <nav
          className="nav-scroll"
          style={{
            display: 'flex',
            gap: 8,
            padding: isMobile ? '10px 12px' : '12px 18px',
            borderBottom: '2px solid var(--line)',
            background: 'var(--paper)',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => navigate({ name: 'menu' })}
            className="btn"
            style={{
              flex: '0 0 auto',
              padding: 0,
              marginRight: isMobile ? 8 : 18,
              background: 'transparent',
              borderColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            <div className="h-display" style={{ fontSize: isMobile ? 14 : 18 }}>
              MINIMAL<span style={{ color: 'var(--accent-1)' }}>TD</span>
            </div>
          </button>
          <TabButton label={t('nav.play')} active={route.name === 'menu'} onClick={() => navigate({ name: 'menu' })} />
          <TabButton label={t('nav.research')} active={route.name === 'research'} onClick={() => navigate({ name: 'research' })} />
          <TabButton label={t('nav.foundry')} active={route.name === 'foundry'} onClick={() => navigate({ name: 'foundry' })} />
          <TabButton label={t('nav.codex')} active={route.name === 'codex'} onClick={() => navigate({ name: 'codex' })} />
          <TabButton label={t('nav.settings')} active={route.name === 'settings'} onClick={() => navigate({ name: 'settings' })} />
        </nav>
      )}

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: isPlay ? 'center' : 'flex-start',
          justifyContent: 'center',
          padding: isPlay ? 0 : 0,
        }}
      >
        {route.name === 'menu' && <MenuScreen navigate={navigate} />}
        {route.name === 'map-select' && <MapSelectScreen navigate={navigate} />}
        {route.name === 'game' && (
          <GamePlay
            width={900}
            height={560}
            mapKey={route.mapKey}
            iconStyle="geometric"
            compact={isMobile}
            onExit={handleRunExit}
            resume={route.resume}
          />
        )}
        {route.name === 'results' && <ResultsScreen stats={route.stats} navigate={navigate} />}
        {route.name === 'research' && <ResearchScreen />}
        {route.name === 'foundry' && <FoundryScreen />}
        {route.name === 'codex' && <CodexScreen />}
        {route.name === 'settings' && <SettingsScreen />}
      </main>
      <FpsOverlay />
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn"
      style={{
        flex: '0 0 auto',
        padding: '6px 14px',
        fontSize: 11,
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink)',
        borderColor: 'var(--line)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
