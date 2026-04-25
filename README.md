# Minimal TD

Geometric, Bauhaus-styled **endless tower defense** with hack-and-slash item drafting and a two-currency meta progression. Built with Vite + React 19 + TypeScript.

## Highlights

- **Endless mode** with rising HP curve (W1–30 1.12ˣ, W31–60 1.18ˣ, W61+ 1.25ˣ)
- **8 towers**: POINT / PIERCE / BLAST / FREEZE / SCATTER / VENOM / CHAIN / BEACON
- **6 enemy kinds** including SHIELD (one-shot absorber) and PHASE (cyclic invuln, DoT bypasses)
- **30 items** across 4 categories × 5 rarities (Common → Mythic)
- **Two-currency meta**: CORES (tower mastery, Research screen) + ESSENCE (drop-rate boosts and item unlocks, Foundry screen)
- **Continue between waves** via zod-validated `localStorage["minimaltd:save"]`
- **5 themes** (Bauhaus / Dark / Mono / Pastel / Neon) + **i18n** (English / Japanese)
- **Mobile portrait** with 2-tap placement and bottom-sheet item picker
- **Procedural SE** (Web Audio API, no external assets)

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173/ in a browser.

## Build

```bash
npm run build      # tsc -b + vite build → dist/
npm run preview    # serve the built dist/ locally
```

The output is static — deploy `dist/` to any static host (GitHub Pages, Cloudflare Pages, Netlify, itch.io, …).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Serve `dist/` locally |
| `npm run typecheck` | Run TypeScript without building |
| `npm run lint` | ESLint over `src/` |
| `npm test` | Vitest one-shot |
| `npm run test:watch` | Vitest in watch mode |

## Controls

### Desktop
- **Click** an empty cell to place the selected tower
- **Click** a placed tower to select it (then UPGRADE / SELL on the side panel)
- **Play / pause** button or speed (1× → 2× → 3×) on the HUD
- **END RUN**: 2-step confirm to retire

### Mobile (portrait)
- **Tap** an empty cell to **preview** placement, **tap again** to confirm
- **Tap** a placed tower to select
- Tab nav scrolls horizontally
- Item picker rises as a bottom sheet

## Architecture

```
src/
  main.tsx               # Vite entry (StrictMode + ErrorBoundary)
  App.tsx                # Route state machine + global theme
  styles.css             # Design system + 5 themes + mobile rules

  app/route.ts           # Route discriminated union + RunResultStats
  audio/                 # Web Audio API (audioContext + sfx + sfxLibrary)
  components/            # Screens, modals, HUD pieces
  game/                  # Pure game logic (towers, enemies, waves, aura, items)
  i18n/                  # dict.en (canonical) + dict.ja (partial) + translate()
  state/                 # Zustand+persist meta store, runSave (Continue)
  util/                  # format, useViewport, storageHealth
```

Pure logic (`game/*`) is fully unit-tested; UI stays a thin layer on top.

## Persistence

| Key | Schema | Versioned | Use |
|---|---|---|---|
| `minimaltd:meta` | `MetaState` (zod) | yes | CORES, ESSENCE, unlocks, mastery, settings, best runs |
| `minimaltd:save` | `RunSnapshot` (zod) | yes | Continue between waves |

Bad / older payloads are dropped silently and replaced with defaults; the game continues running. Private-mode browsers see a top banner indicating progress will not persist.

## Tech stack

- **Vite 8** + **React 19** + **TypeScript** (`tsc --noEmit` clean)
- **Zustand 5** + persist middleware
- **zod 4** for schema validation
- **Vitest 4** for unit tests
- **Web Audio API** for procedural SE (no external assets)

## Documentation

- [docs/PLAN.md](docs/PLAN.md) — Strategic product spec and phase roadmap
- [docs/PHASE1.md](docs/PHASE1.md) … [docs/PHASE7.md](docs/PHASE7.md) — Tactical step-by-step per phase
- [CHANGELOG.md](CHANGELOG.md) — Per-phase summary

## License

MIT.
