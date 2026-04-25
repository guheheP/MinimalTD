# Phase 6: Mobile Portrait + Touch — 詳細実装計画

> **Goal**: モバイル (ポートレート) で快適にプレイできる状態にする。タッチ操作・タップターゲット・レイアウト崩れを解消し、デスクトップ体験を損なわない。
>
> **Success Criteria**:
> - iPhone 13/15 (390x844) 相当のビューポートで Menu / MapSelect / Game / Results / Research / Foundry / Codex / Settings がレイアウト崩れせず表示
> - GamePlay フィールドが画面幅にフィット (現状 900px 固定 → レスポンシブ)
> - タワー配置が 2-タップ方式 (1st: プレビュー, 2nd: 確定) で動作
> - 全主要ボタンのタップターゲット ≥ 44x44 (`.btn` 強化)
> - DraftModal / BossChestModal が portrait で全画面表示
> - HUD (HP/CREDIT/WAVE/SCORE) が狭幅で 2行折り返し
> - タブナビが overflow-x スクロール (5タブが画面幅を超える場合)
> - 既存デスクトップ動作は無回帰
> - typecheck/build OK + テスト数維持 (新規追加はオプショナル)
>
> **Non-Goals**:
> - SE / BGM (Phase 7)
> - パフォーマンス最適化 (Phase 7)
> - PWA インストール対応 (将来)
> - ネイティブアプリ化

**期間目安**: 2-4日

---

## Step 6.1 — ベース mobile CSS

`src/styles.css` に以下を追加:

```css
/* Mobile-first safety */
html, body { overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }

/* Tap target floor (override .btn padding when narrow) */
@media (pointer: coarse) {
  .btn { min-height: 44px; min-width: 44px; padding: 12px 18px; }
}

/* Container shorthand */
.container-portrait { max-width: 100vw; overflow-x: hidden; }
```

`index.html` の viewport meta に `viewport-fit=cover, user-scalable=no` を追加 (ピンチズームを抑え、ノッチに対応)。

---

## Step 6.2 — useViewport フック

`src/util/useViewport.ts`:
```typescript
export function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return {
    ...size,
    isPortrait: size.h > size.w,
    isMobile: size.w < 768,
    isCoarse: matchMedia('(pointer: coarse)').matches,
  };
}
```

各画面で `const { isMobile } = useViewport()` で分岐。

---

## Step 6.3 — GamePlay レスポンシブ化

現状: `width=900 height=560` 固定。サイドパネル 240px は右に並列。

新仕様:
- デスクトップ (≥768px): 現状通り (`900x560` フィールド + 右240px パネル)
- モバイル (<768px): フィールドを画面幅にフィット (`viewBox="0 0 900 560"` で SVG スケール)、パネルはフィールドの**下**に並ぶ

実装:
- App.tsx の `<GamePlay width={900} height={560} ... />` を、モバイル時は `width={viewportWidth}` に変更
- GamePlay 内部: フィールドの SVG を `viewBox` 駆動に。`<div style={{ width: W, height: H }}>` ではなく `<div style={{ width: '100%', aspectRatio: '900/560' }}>`
- 配置時の座標変換: `getBoundingClientRect()` の実サイズで計算するので scale 後でも自動的に正しい座標になる

サイドパネル (`compact` prop は既にある):
- App.tsx で isMobile なら `compact={true}` を GamePlay に渡す
- GamePlay の `compact` ブランチを portrait 用に再設計: BUILD パネル + SELECTED パネルを下に縦並び表示

---

## Step 6.4 — タッチ配置 (2-タップ)

現状: マウス click で即配置。touch でも click は発火するが、ホバープレビューが無い。

新仕様 (coarse pointer 時):
- 1st tap: `setHoverCell(pos)` でプレビュー表示 + 「TAP AGAIN TO PLACE」浮遊ヒント
- 2nd tap が同じセル付近 (≤24px): 配置確定
- 2nd tap が遠く: プレビューを更新 (新しい1st tap として扱う)
- 既存 placed タワーをタップ: 選択 (既存挙動維持)

実装:
- `pendingPlacement: {x, y, t} | null` ステートを追加
- click ハンドラを書き直し: coarse なら 2-step、fine ならその場で配置 (現状維持)
- プレビュー中はタワーアイコンの不透明度を 0.5 にし、ハイライトボックスを追加

ヒント文言の i18n キー: `'game.tapToPlace'` 追加 (en: "TAP AGAIN TO PLACE", ja: "もう一度タップで配置")

---

## Step 6.5 — DraftModal / BossChestModal フルスクリーン化

現状: 中央モーダル、固定幅。

新仕様 (mobile):
- inset: 0 (全画面)
- カードを縦並び (現状横並び 3枚 → portrait では縦)
- 余白を縮小

実装: 各 Modal コンポ内で `useViewport` → mobile 分岐。CSS でも `@media (max-width: 600px)` で対応可。

---

## Step 6.6 — HUD 折り返し

現状: HP/CREDIT/WAVE/SCORE + ▶/×× ボタン + END RUN を1行。390px 幅で破綻。

新仕様:
- HUD の `<div>` に `flex-wrap: wrap` + `gap` を維持
- 行間に `row-gap: 8px`
- HP/CREDIT/WAVE/SCORE の `.stat .v` を mobile では fontSize 22 (デスクトップ 28)

実装: GamePlay HUD 部の style にメディアクエリ相当の調整。useViewport で fontSize を切替。

---

## Step 6.7 — タブナビ overflow scroll

5タブ + ロゴ = 横長。390px だと折り返す。

新仕様:
- nav に `overflow-x: auto; flex-wrap: nowrap; scrollbar-width: none`
- 各 TabButton に `flex: 0 0 auto`
- ロゴをコンパクト化 (mobile では fontSize 14)

実装: App.tsx の nav style 調整。

---

## Step 6.8 — ItemPickerPopover / ItemSlots mobile

現状: 上方向ポップオーバー。デスクトップ最適。

mobile (compact 時):
- `position: fixed; bottom: 0; left: 0; right: 0;` でボトムシート風
- 縦スクロール可能、最大高 50vh
- 閉じるボタン明示

実装: ItemSlots の picking ポップオーバーに mobile 分岐。

---

## Step 6.9 — Menu / MapSelect / Results portrait

確認すべき箇所:
- MenuScreen のロゴ fontSize 96 → mobile では 56
- MapSelect 2x2 グリッド → mobile では 1列
- Results: `minWidth: 480` を `minWidth: min(480, 100% - 32px)`

実装: 各画面で useViewport → fontSize/grid columns 分岐。

---

## Step 6.10 — テスト (オプショナル)

- `useViewport.test.ts` — resize イベントで size が更新される (jsdom で `Object.defineProperty(window, 'innerWidth', ...)` を使う)
- 既存 133 件は無回帰

---

## Phase 6 完了チェックリスト

- [x] Step 6.1 ベース mobile CSS + viewport meta
- [x] Step 6.2 useViewport フック
- [x] Step 6.3 GamePlay レスポンシブ化
- [x] Step 6.4 タッチ配置 2-タップ
- [x] Step 6.5 DraftModal / BossChestModal フルスクリーン
- [x] Step 6.6 HUD 折り返し
- [x] Step 6.7 タブナビ overflow scroll
- [x] Step 6.8 ItemPickerPopover ボトムシート
- [x] Step 6.9 Menu / MapSelect / Results portrait 調整
- [x] Step 6.10 useViewport テスト

**Phase 6 完了**: 2026-04-25。typecheck OK / 135 tests passing (Phase 5 末 133 から +2)。

---

## 想定問題と対処

| 問題 | 対処 |
|---|---|
| viewBox スケール時の hit test ずれ | getBoundingClientRect() の実サイズを使うので自動補正される |
| 2-タップで誤操作 (誤って2連打配置) | timeout 200ms 以内の連打は無視 (debounce) |
| iOS Safari の 100vh バグ | `min-height: 100svh` (small viewport) を併記 |
| Modal フルスクリーン中に背景スクロール | `body { overflow: hidden }` を modal open 中だけ付与 |
| useViewport が SSR (vitest jsdom) で window 未定義 | `typeof window === 'undefined'` チェックでデフォルト値返却 |

---

## スコープから除外 (Phase 7 以降)

- ランドスケープ (横向き) 専用最適化
- ピンチズーム/パンによるフィールド拡縮
- ハプティクスフィードバック
- PWA マニフェスト + オフライン対応
- iOS スタンドアロンモード対応 (status bar スタイル等)

---

**STOP — Phase 6 着手前の確認**:

1. **対象ビューポート**: iPhone 13/15 (390x844) を主、Android (360x800) も想定で良いか?
2. **2-タップ配置の閾値**: 同セル判定 ≤24px、debounce 200ms で良いか?
3. **タブナビの方針**: 5タブを overflow scroll で良いか? それともハンバーガーメニュー化が良いか?
4. **ボトムシート**: ItemPickerPopover を mobile でボトム固定にするが、装備中のタワーから視線が遠くなる懸念あり。許容できるか?
5. **テストは省略可**で良いか? (視覚回帰が中心なので、unit test の費用対効果が低い)

OK であれば実装開始します。
