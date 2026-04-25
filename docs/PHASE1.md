# Phase 1: Foundation — 詳細実装計画

> **Goal**: design-canvas ラッパーを剥離し、Vite + React + TypeScript (gradual) でゲームプレイ画面が単独で動作する状態にする。**ロジック変更ゼロ**。
>
> **Success Criteria**:
> - `npm run dev` で `GamePlay` コンポーネントがブラウザに表示される
> - 既存の 4マップ × 8タワー × 4敵 の挙動に**回帰なし** (BEACONは引き続き未実装のまま)
> - `npm run build` が成功し、`dist/` に静的ファイルが出力される
> - `design-canvas.jsx`, `tweaks-panel.jsx` は出荷ビルドに含まれない (`_legacy/` 退避)
>
> **Non-Goals (Phase 1 では触らない)**:
> - BEACON 実装 (Phase 2)
> - ハクスラ機能 (Phase 3)
> - メタ進行 (Phase 4)
> - モバイル対応 (Phase 6)
> - バランス調整 (Phase 2)

**期間目安**: 1-2日

---

## Step 1.1 — 既存ファイルの退避

新規 Vite プロジェクトを既存ディレクトリに重ねる前に、既存ファイルを `_legacy/` に退避してリファレンスとして保護する。

```
C:\Project\MinimalTD\
  _legacy/
    index.html          ← 移動
    styles.css          ← コピー (src/ にも置くため)
    towers.jsx          ← 移動
    screens.jsx         ← 移動
    gameplay.jsx        ← 移動
    tweaks-panel.jsx    ← 移動
    design-canvas.jsx   ← 移動
  docs/
    PLAN.md
    PHASE1.md (this)
```

**理由**: gameplay.jsx を分割していく過程で原本との diff を取りたくなる。`git init` 前なので物理コピーで保全。

---

## Step 1.2 — Vite 初期化

ディレクトリは空ではないので `--template` を直接指定して上書き。`react-ts` テンプレートで初期化し、`allowJs: true` で `.jsx` ファイルを共存させる。

```bash
npm create vite@latest . -- --template react-ts
npm install
```

**手動マージが必要なファイル** (Vite が生成するが既存と衝突):
- `package.json` — そのまま採用
- `tsconfig.json` — 後で `allowJs`, `checkJs: false` を追加
- `vite.config.ts` — そのまま採用
- `index.html` — Vite 形式 (`<div id="root">` + `<script type="module" src="/src/main.tsx">`) で書き直し
- `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/App.css` — 削除して自前実装に置換

**.gitignore 追加**:
```
node_modules/
dist/
.vscode/
*.log
.DS_Store
```

---

## Step 1.3 — tsconfig.json 設定 (段階移行)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

**ポイント**:
- `allowJs: true, checkJs: false` — `.jsx` をそのままインポート可、型チェック対象外
- `strict: true` — 新しく書く `.tsx` は厳格モード
- `noUnusedLocals: false` — 移行中の警告を抑制 (TS 化が進んだら true に戻す)

---

## Step 1.4 — ディレクトリ構造作成

```
src/
  main.tsx               ← 新規 (エントリ)
  App.tsx                ← 新規 (Phase 1 では GamePlay を直接マウント)
  styles.css             ← _legacy からコピー
  game/                  ← Phase 2 以降で使用、Phase 1 では空
  state/                 ← Phase 2 以降
  components/
    GamePlay.jsx         ← _legacy/gameplay.jsx をリネーム移動
    Towers.jsx           ← _legacy/towers.jsx
    Screens.jsx          ← _legacy/screens.jsx (Phase 5 まで非アクティブ)
```

**Phase 1 で動かさないファイル** (永久退役):
- `design-canvas.jsx` — 出荷ビルドから完全除外、`_legacy/` 据え置き
- `tweaks-panel.jsx` — 同上

---

## Step 1.5 — グローバル React → ES Modules への変換

**現状**: 既存 `.jsx` は UMD スクリプト経由で `React`, `useState` 等がグローバル。Vite では ES modules 必須。

**変換ルール** — 各 `.jsx` ファイル先頭に追加:

```jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
```

**対象ファイル別の変更点**:

### `src/components/GamePlay.jsx`
- 先頭に `import React, {...} from 'react';`
- 末尾に `export default GamePlay;` 追加
- `Towers.jsx` の `TOWERS`, `TowerIcon` 等を named import:
  ```jsx
  import { TOWERS, TowerIcon, EnemyShape } from './Towers';
  ```

### `src/components/Towers.jsx`
- 先頭に React import
- 末尾で必要なシンボルを `export {...};` で公開

### `src/components/Screens.jsx`
- React import + 各画面コンポーネントを export
- Phase 1 ではどこからもインポートしない (Phase 5 で使用)

**検証**: `React.useState` ではなく `useState` をそのまま使っているか、`React.createElement` 直接呼び出しがないか確認。

---

## Step 1.6 — エントリポイント作成

### `index.html` (プロジェクトルート、Vite 形式)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Minimal TD</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

**変更点**: Babel 関連の `<script src=...babel.min.js>` 等を全削除。`type="text/babel"` 行も全削除。Google Fonts は維持。

### `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `src/App.tsx` (Phase 1 ではゲームプレイ直マウント)

```tsx
import GamePlay from './components/GamePlay';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <GamePlay width={900} height={560} mapKey="zigzag" iconStyle="geometric" />
    </div>
  );
}
```

**Phase 1 の意図**: テーマ切替・マップ切替UI なし、デフォルト ZIGZAG マップで動けばOK。Phase 5 で Router を入れた時に画面遷移を整備する。

---

## Step 1.7 — Tweaks 機能の暫定対応

`tweaks-panel.jsx` の `useTweaks` フックは Phase 1 では使わない (Phase 4 で metaStore に統合)。GamePlay の引数 `iconStyle`, `mapKey` は App.tsx で固定値を渡す。テーマ切替UIは Phase 5 まで一時的に消える。

---

## Step 1.8 — package.json scripts

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit"
}
```

**`tsc -b` の挙動**: `.jsx` ファイルは `checkJs: false` で型エラー出ず。`.tsx` (App.tsx, main.tsx) のみ厳格チェック。

---

## Step 1.9 — 動作確認

```bash
npm run dev
```

**ブラウザで確認** (`http://localhost:5173`):
- [ ] GamePlay コンポーネントがマウント
- [ ] フィールドにタワーを配置できる
- [ ] START WAVE で敵が出る
- [ ] 4マップ全種類で動く (App.tsx で `mapKey` を切り替えてテスト)
- [ ] 8タワー全種類が配置できる (BEACON は配置可、効果なし)
- [ ] PAUSE / SPEED 1x/2x/3x 動作
- [ ] アップグレード / 売却動作
- [ ] HP=0 で BREACH 表示

**ビルド確認**:
```bash
npm run build
npm run preview
```

`dist/` に最小限のアセットが出力され、preview で動作することを確認。

---

## Step 1.10 — README.md 作成

リポジトリ直下に新規:

```md
# Minimal TD

Geometric Bauhaus-style endless tower defense with roguelite item drafting.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Documentation

- [Plan](docs/PLAN.md) — Product spec & roadmap
- [Phase 1](docs/PHASE1.md) — Foundation migration steps
```

---

## Phase 1 完了チェックリスト

- [ ] Step 1.1 既存ファイル退避 (`_legacy/`)
- [ ] Step 1.2 Vite 初期化 (`react-ts` テンプレート)
- [ ] Step 1.3 tsconfig 設定 (allowJs)
- [ ] Step 1.4 ディレクトリ構造作成
- [ ] Step 1.5 .jsx の React import 整備
- [ ] Step 1.6 main.tsx / App.tsx / index.html 作成
- [ ] Step 1.7 Tweaks 暫定対応 (App.tsx で固定値)
- [ ] Step 1.8 package.json scripts 確認
- [ ] Step 1.9 動作確認 (`npm run dev` / `npm run build`)
- [ ] Step 1.10 README.md 作成

**Done condition**: `npm run dev` でゲームが動き、`npm run build` が成功し、`npm run preview` で同じ動作が再現。

---

## Phase 1 で発見しうる問題と対処

| 想定問題 | 対処 |
|---|---|
| `.jsx` 内の `React.Fragment` が UMD 前提でクラッシュ | `<>...</>` 短縮形に置換 or `React` import |
| Vite が `.jsx` をデフォルトで TS としてパースしない | `vite.config.ts` で `esbuild.loader: { '.jsx': 'jsx' }` 追加 (通常は不要) |
| 既存コードに `var` や `function` 巻き上げ依存 | 動くまま放置、Phase 2 のリファクタで対応 |
| `styles.css` の CSS変数が App.tsx に効かない | `main.tsx` で `import './styles.css'` していれば OK |
| Strict Mode による副作用2回実行 | ゲームループ用 `useEffect` のクリーンアップを確認、問題が出れば Phase 2 で修正 |

---

**STOP — Phase 1 着手前の最終確認**:

1. `_legacy/` 退避方針で良いか? (削除案もあり)
2. `react-ts` テンプレートで gradual TS 移行で良いか? (純 JS の `react` テンプレート案もあり)
3. 既存 `index.html`, `tweaks-panel.jsx` 等の挙動は **Phase 1 では再現しない** (テーマ切替UI、マップ切替UI が一時的に消える) ことを了承いただけるか? Phase 5 で復活する。

OK であれば Phase 1 の実装を開始します。
