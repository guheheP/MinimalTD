# Changelog

All dates use ISO 8601. Phase summaries reference `docs/PHASEn.md` for tactical detail.

## v1.0.0 — 2026-04-26 (release candidate)

### Phase 7 — Polish (SE / Errors / Docs / 2026-04-26)
- Procedural Web Audio SE library: 12 sounds (`tower-fire`, `tower-place`, `enemy-die`, `enemy-boss-die`, `wave-start`, `wave-cleared`, `breach`, `loot-rarity-mythic`, …)
- 200ms dedup guard on `playSfx`; volume reads `metaStore.settings.sfxVolume` per call
- `unlockAudio()` on first user gesture (iOS Safari compatibility)
- `ErrorBoundary` (class component) wraps `<App />` in `main.tsx`; renders theme-independent fallback with reload button
- `storageHealth.canPersist()` probes `localStorage` once; `<StorageWarningBanner />` shows when persistence is unavailable
- README rewrite + this CHANGELOG

### Phase 6 — Mobile Portrait + Touch (2026-04-25)
- `useViewport()` hook + SSR-safe `readViewport()`
- GamePlay field is responsive via outer container + CSS `transform: scale()` on a fixed-pixel inner wrapper (logical coords stay 900×560)
- 2-tap placement for coarse pointers (≤24px / 200ms debounce + `game.tapToPlace` i18n)
- `DraftModal` / `BossChestModal` go fullscreen on mobile; cards stack vertically
- `ItemSlots` becomes a bottom sheet on mobile with explicit close
- HUD wraps; tab nav scrolls horizontally; `MapSelect` collapses to 1 column

### Phase 5 — Screen Flow + UI/Effect Polish (2026-04-25)
- i18n basics (`src/i18n/`) — English canonical + Japanese partial; `useT()` + `translate()`
- `src/util/format.ts` — K/M/B compact numbers, currency, score, duration
- `AnimatedNumber` — easeOut RAF tween for HP / CREDIT / WAVE / SCORE / CORES / ESSENCE
- `src/state/runSave.ts` — zod-validated Continue snapshot at `localStorage["minimaltd:save"]`
- `src/app/route.ts` — `Route` discriminated union + `RunResultStats`; App is now a route state machine (default `'menu'`)
- New screens: `MenuScreen` / `MapSelectScreen` / `ResultsScreen` / `CodexScreen` / `SettingsScreen`
- 5-tab nav (PLAY / RESEARCH / FOUNDRY / CODEX / SETTINGS), `navHidden` for game/map-select/results
- TOTAL EFFECTS panel; END RUN 2-step retire; FPS overlay (dev only)
- Visual effects: damage popups, hit flash, kill shards, BOSS warning, PHASE ripple, SHIELD shatter

### Phase 4 — Meta Progression & Persistence (2026-04-25)
- Zustand + persist + zod schema for meta state at `localStorage["minimaltd:meta"]`
- CORES (Research) for tower mastery + tower unlocks
- ESSENCE (Foundry) for initial slots / re-rolls / drop boosts / item unlocks
- `recordRun` + `applyMapUnlocksAfterRun` (spiral after 5 runs / fork at W30 / cross at W50)
- 100 unit tests covering store actions and migration

### Phase 3 — Hack-and-Slash Loot (2026-04-25)
- 30-item database across 4 categories (`tower-mod`, `relic`, `unique`, `conditional`) and 5 rarities
- Drop tables with rarity weights; boss chests guarantee Rare+ (Legendary at W50, Mythic at W100)
- 5-wave draft modal with skip → +5 ESSENCE and re-roll
- Per-tower equipment slots (max 3); passive items apply globally; tower-mod items must be equipped
- Set bonus precondition (folded into `effects.ts` aggregate)

### Phase 2 — Game Logic (2026-04-25)
- `src/game/*.ts` becomes the authoritative pure-logic layer (types, towers, enemies, economy, waves, aura)
- BEACON aura buff implemented (+15–55% damage in radius, level-scaled)
- Data-driven wave specs with mixed groups, modifiers, mini-bosses, bosses
- 6-enemy roster with SHIELD (one-shot absorber) and PHASE (cyclic invuln)
- Sell value 70% (down from 100%); upgrade cost recurve

### Phase 1 — Foundation (2026-04-25)
- Vite + React + TypeScript project bootstrap (`allowJs: true` for gradual JSX→TSX migration)
- Strip the `_legacy/` design-tool prototype out of the live build
- Component split: GamePlay, Towers, Screens

---

## Compatibility

- Persistence schema is versioned (`META_VERSION`, `RUN_SAVE_VERSION`). Loading an older blob silently falls back to defaults — no destructive migrations are performed mid-run.
