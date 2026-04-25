# Phase 5: Screen Flow + UI/Effect Polish — 詳細実装計画

> **Goal**: 全画面遷移を整備し、ゲームプレイのビジュアル品質を底上げする。i18n 基盤と Settings 画面も同時に整備して後フェーズに負債を残さない。
>
> **Success Criteria**:
> - Menu → MapSelect → Game → Results の動線が完成 (Codex / Settings はサイドエントリ)
> - ウェーブ間 Continue (オートセーブ + 復帰) が動作
> - 装備ピッカーが上方向ポップオーバー (画面が縦伸びしない)
> - 攻撃エフェクトの視認性が大幅向上 (サイズ・寿命・パーティクル)
> - ダメージ数値ポップアップが敵の上に表示される
> - 被ダメフラッシュ / 撃破パーティクル / SHIELD 砕け / PHASE 波紋 / BOSS 警告
> - HP/Money/Score/Cores/Essence の数値変化がカウントアップ tween
> - Relic 集計パネル (合計 buff 表示)
> - i18n 基盤 (`t('key')`) + 日本語辞書、JP フォント (Zen Kaku Gothic) 追加
> - 数値フォーマット K/M/B
> - 自主リタイアボタン (BREACH を待たず終了)
> - FPS 計測オーバーレイ (dev only)
> - Settings タブ (theme / language / sfx volume placeholder)
> - typecheck/build OK + 既存 100テスト維持 + 新規テスト 15+ 件
>
> **Non-Goals**:
> - モバイル ポートレートレイアウト (Phase 6)
> - タッチ操作の最適化 (Phase 6)
> - SE / BGM 実装 (Phase 7)
> - パフォーマンスリファクタ (Phase 7)

**期間目安**: 8-12日

---

## Step 5.1 — i18n 基盤

`src/i18n/`:
- `dict.en.ts` — 全UI文字列のキー → 英文 (デフォルト)
- `dict.ja.ts` — 同キー → 日本語訳
- `index.ts` — `t(key, params?)` 関数, `useLanguage()` フック (metaStore.settings.language を購読)

`MetaState` に `settings: { theme, language, sfxVolume, bgmVolume }` を追加 (zod スキーマも同期)。デフォルト言語: ブラウザロケールから検出 (`navigator.language.startsWith('ja') ? 'ja' : 'en'`)。

`index.html` に Zen Kaku Gothic Antique を追加 (Bauhaus 寄りの和文ゴシック)。`styles.css` の `--font-body` に JP フォントを fallback に含める。

タワー名・アイテム名・敵名は英語固定 (キーカタカナ語の表現が散らかるため)。説明文・ボタンラベル・画面タイトルのみ翻訳。

---

## Step 5.2 — 数値フォーマット & ヘルパー

`src/util/format.ts`:
```typescript
export function formatNumber(n: number): string;  // 1234 → "1.2K", 1234567 → "1.2M"
export function formatCurrency(n: number): string; // "$1.2K"
export function formatScore(n: number): string;    // 5桁0埋め → 6桁K表記に切替
```

GamePlay HUD と Results画面で全面適用。

---

## Step 5.3 — 数値カウントアップ tween

`src/components/AnimatedNumber.tsx`:
```typescript
<AnimatedNumber value={hp} format={formatNumber} duration={300} />
```

要件:
- 値変化を検出して tween (linear or easeOut)
- requestAnimationFrame ベース、解放時にキャンセル
- format 関数を毎フレ適用

GamePlay の HP/CREDIT/WAVE/SCORE と Foundry/Research の CORES/ESSENCE 表示を置換。

---

## Step 5.4 — ダメージ数値ポップアップ

新規エフェクトカテゴリ。`projectilesRef` と並列に `damageTextsRef`:
```typescript
{ x, y, value, life: 0.8, vy: -30, color }
```

GamePlay の `applyDamage` ヘルパー内で hit 時に push (DoT は累積でないと数が膨大なので、毎0.5秒のティック単位で push)。

レンダリングは SVG `<text>` + 上昇アニメ + フェードアウト。クリティカル(高ダメージ)は 1.5x サイズ + 強調色。

---

## Step 5.5 — 視覚エフェクト強化

### 5.5.1 寿命延長
- `sniper` projectile: 0.12 → 0.30 (3倍)
- `multi` line: 0.18 → 0.32
- `shock` bolt: 0.15 → 0.32
- `frost` line: 0.20 → 0.30
- `cannon` splash: 0.25 → 0.40 (リング拡大も大きく)
- `dot` 球: 0.16 → 0.28

### 5.5.2 太さ・サイズ
- 線系 strokeWidth: 2 → 3
- 球系 radius: 4 → 6 (ベース)、bolt の中間ジッター幅 ±10 → ±18
- splash リング max radius: 50 → splash 値そのまま (アイテムで増加可)

### 5.5.3 ヒットフラッシュ
- 被弾時に `e.flashUntil = tickRef.current + 0.15`
- 描画でフラッシュ中は色を `var(--paper)` 100% 不透明 + 太い枠

### 5.5.4 撃破パーティクル
新カテゴリ `particlesRef`:
```typescript
{ x, y, vx, vy, life, color, kind: 'shard' }
```
敵が `hp <= 0` で 4-6 個生成、ランダム速度ベクトル、寿命 0.6s、形状は敵のシルエットを継承した小三角/四角。

### 5.5.5 SHIELD 砕け演出
SHIELD が 1発吸収した瞬間に「八方に小六角形が散る」短いエフェクト (0.4s)。

### 5.5.6 PHASE 無敵の波紋
無敵中の PHASE 敵に同心円 (1.0s 周期) を描画。

### 5.5.7 BOSS 出現警告
ボスの最初の spawn 時に画面中央へ「BOSS INCOMING」を 1.5秒オーバーレイ + 上下からブラックバー (シネマ風)。

### 5.5.8 BEACON オーラ脈動
選択時の BEACON 範囲円が呼吸 (透明度 0.06 ↔ 0.14, 1.5s 周期)。

---

## Step 5.6 — 装備ピッカー上方向ポップオーバー

現状の `ItemSlots` 内 `picking !== null && ...` ブロックを削除。代わりに:

`src/components/ItemPickerPopover.tsx`:
- `position: absolute; bottom: 100%; left: 0;` で上方向に表示
- レイヤー: panel の上に z-index で重ねる
- 選択 or 外側クリックで閉じる

ItemSlots は空スロット押下で `setPicking(slotIdx)` → ポップオーバー描画。`overflow: visible` を panel に設定して切り抜きされない。

---

## Step 5.7 — Relic 集計パネル

`GlobalRelicsBar` の右側 (or HUD 下段) に「TOTAL EFFECTS」カード:
```
DMG  +35%
RNG  +20%
RoF  +5%
KILL CASH  12% × $5
BOSS DMG  +60%
```

`computePassiveEffect(inventory, {isBossWave: false})` から派生。空時は非表示。

---

## Step 5.8 — 自主リタイアボタン

GamePlay HUD に「END RUN」ボタン (二段階確認: クリック → 「CONFIRM」)。
- ハンドラ: 強制 BREACH 状態へ遷移、現在の wave をベストとして記録、Results 画面へ
- ウェーブ実行中も使えるが Confirm が必要

---

## Step 5.9 — FPS 計測オーバーレイ (dev only)

`src/components/FpsOverlay.tsx`:
- `import.meta.env.DEV` 時のみ表示
- 60サンプル移動平均で `FPS xx · frame yyyms`
- 画面右上に小さく overlay

GamePlay のループに計測フックを差し込む (mutation 1行)。

---

## Step 5.10 — Settings 画面

`src/components/SettingsScreen.tsx`:
- テーマ選択 (Bauhaus / Dark / Mono / Pastel / Neon) — `metaStore.settings.theme` を更新、`document.body.className` に反映
- 言語選択 (English / 日本語) — `t()` 即時切替
- ゲーム速度の永続化 (1x/2x/3x) — 次ラン開始時に既定値
- リセットボタン (永続データ全消去、確認モーダル付き)

App.tsx のタブを 5タブに: PLAY / RESEARCH / FOUNDRY / **CODEX** / **SETTINGS**

---

## Step 5.11 — Menu 画面

`src/components/MenuScreen.tsx` (新規、`Screens.jsx` の MenuScreen モックは廃止):
- 大型ロゴ
- NEW RUN ボタン → MapSelect
- CONTINUE ボタン (セーブ存在時のみ enabled) → 直接 Game へ
- 統計 (累積ラン数 / 最高ウェーブ / Mythic 入手数)

---

## Step 5.12 — MapSelect 画面

`src/components/MapSelectScreen.tsx`:
- 4マップを 2x2 グリッドで表示
- 各マップ: SVG プレビュー + 難易度 + ベスト (wave / score / 経過時間) + 解放条件 (未解放時)
- 選択 → Game 画面に `mapKey` prop を渡して遷移

---

## Step 5.13 — Results 画面

`src/components/ResultsScreen.tsx`:
- 結果サマリ (REACHED WAVE / SCORE / DURATION / BREACH OR RETIRED)
- LOOT COLLECTED (rarity 別カウント、glyph 並び)
- ESSENCE EARNED + CORES EARNED (count-up tween)
- 新規アンロック告知 (「FORK MAP UNLOCKED」「2 NEW ITEMS UNLOCKED」)
- ボタン: 「BACK TO MENU」「PLAY AGAIN (same map)」

GamePlay は GameOver 内 RESTART を廃止し、Results 画面に遷移。

---

## Step 5.14 — Codex 画面

`src/components/CodexScreen.tsx`:
- TOWER タブ: 8タワー一覧、stats、説明、解放状態
- ENEMY タブ: 6敵、HP/速度/特殊能力
- ITEM タブ: 30アイテム、レアリティ別、解放状態
- 検索/絞り込みは v1.x 以降

---

## Step 5.15 — Continue (ウェーブ間オートセーブ)

`src/state/runSave.ts`:
```typescript
interface RunSnapshot {
  version: 1;
  mapKey: MapKey;
  wave: number;
  hp: number;
  money: number;
  score: number;
  placed: PlacedTower[];        // _cd は省略 (再計算)
  inventory: RunInventory;
  startedAt: string;             // ISO
}

export function saveRun(snap: RunSnapshot): void;        // localStorage["minimaltd:save"]
export function loadRun(): RunSnapshot | null;
export function clearRun(): void;
```

GamePlay の wave クリア時 (`setWave(w => w+1)` 直後) に `saveRun` を呼ぶ。Menu → CONTINUE で `loadRun` を読み Game 画面に flush。BREACH 時は `clearRun()`。

---

## Step 5.16 — ルーティング

`react-router` は導入せず、`App.tsx` に簡易 state machine:
```typescript
type Route =
  | { name: 'menu' }
  | { name: 'map-select' }
  | { name: 'game'; mapKey: MapKey; resume?: RunSnapshot }
  | { name: 'results'; stats: RunResultStats }
  | { name: 'research' } | { name: 'foundry' } | { name: 'codex' } | { name: 'settings' };
```

タブナビは Menu / Research / Foundry / Codex / Settings。Game/MapSelect/Results はナビ非表示の専用画面 (`navHidden: true`)。

---

## Step 5.17 — テスト

- `i18n.test.ts` — fallback (key not in dict → return key), パラメータ展開
- `format.test.ts` — K/M/B 境界
- `runSave.test.ts` — round-trip + zod validate, version mismatch reset
- `metaStore.test.ts` 拡張 — settings.theme/language の永続化
- 既存 100件は無回帰

---

## Phase 5 完了チェックリスト

- [x] Step 5.1 i18n 基盤
- [x] Step 5.2 数値フォーマット
- [x] Step 5.3 AnimatedNumber
- [x] Step 5.4 ダメージポップアップ
- [x] Step 5.5 エフェクト強化 (寿命/サイズ/フラッシュ/パーティクル/BOSS警告/PHASE波紋/SHIELD演出/BEACON脈動)
- [x] Step 5.6 装備ピッカー上ポップオーバー
- [x] Step 5.7 Relic 集計パネル
- [x] Step 5.8 リタイアボタン
- [x] Step 5.9 FPS オーバーレイ
- [x] Step 5.10 Settings 画面
- [x] Step 5.11 Menu 画面
- [x] Step 5.12 MapSelect 画面
- [x] Step 5.13 Results 画面
- [x] Step 5.14 Codex 画面
- [x] Step 5.15 Continue 機能
- [x] Step 5.16 ルーティング
- [x] Step 5.17 テスト追加

**Phase 5 完了**: 2026-04-25。typecheck OK / 133 tests passing (Phase 4 末から +33)。

---

## 想定問題と対処

| 問題 | 対処 |
|---|---|
| ダメージポップアップが大量で画面が混雑 | DoT は0.5秒間隔でしか push しない、同一敵の同フレ複数 hit は合算 |
| エフェクト寿命延長で projectile 配列が膨らみ FPS 低下 | Phase 7 で Canvas 化検討、Phase 5 では DOM/SVG 維持しつつ実測 |
| i18n 文字列のキー漏れ | `dict.en.ts` を「真の source」とし、`dict.ja.ts` のキーが欠けていれば fallback |
| Continue で `_cd` 等の動的状態が消える | wave クリア瞬間に保存するので発射クールダウンはリセットされる前提 (許容) |
| Results 画面でメタ反映タイミング | RESTART 時の処理を Results 画面の onUnmount/onContinue に移し、表示中は実効値で計算 |
| Settings の言語切替が即時反映されない | dict は state に乗せず、metaStore.settings.language を直接購読 |

---

**STOP — Phase 5 着手前の確認**:

1. **i18n キー戦略**: タワー/敵/アイテムの **名称は英語固定**, 説明・ボタン・画面タイトルのみ翻訳で良いか?
2. **JP フォント**: Zen Kaku Gothic Antique で良いか? (代替: Noto Sans JP / M PLUS Rounded)
3. **Continue の保存タイミング**: 「ウェーブクリア瞬間」のみで良いか? (= ウェーブ実行中の中断は復帰不可)
4. **Codex は静的表示**で良いか? それともプレイ中の遭遇率/撃破数なども記録?
5. **Settings 内のリセットボタン**: 永続データ全消去だが、解放状態も含めて全消去で良いか? (一度全クリアでデバッグ用)

OK であれば実装開始します。
