# Implementation Plan: Minimal TD — 製品仕様の確定

## Overview

現状は「動くデザインモック」(React+Babel CDN + design-canvas ラッパー) であり、ゲームプレイは `gameplay.jsx` 1ファイルに全てインライン実装されている。本計画はこれを「出荷可能なゲーム」へ昇格させるための **製品決定・スコープ・技術方針** をまとめるもの。

**ゲームの方向性 (確定済)**:
- **エンドレスTD** をメインモードに据える (有限ランや勝利条件は設けない)
- **二重メタ進行**: ラン中のハクスラ的アイテム (ESSENCE) + ラン終了後の永続タワー強化 (CORES) の両輪で、生き延びられる時間が少しずつ伸びていく体験を作る
- **マルチプレイは v1 スコープ外** (将来検討)
- **シグネチャ機能**: 幾何学ミニマル × ハクスラドラフト — Bauhaus 美学とローグライト構造の融合

---

## 1. ゲームデザイン仕様

### 1.1 コアループ (確定)

**エンドレス専用**。明示的な勝利条件なし。「どこまで生き延びたか」を軸に、HP=0 で BREACH (ラン終了)。

```
[Menu] → [Map Select] → [Run 開始] → [Wave ループ (5波ごとにドラフト)]
                                          ↓
                                       BREACH (HP=0)
                                          ↓
                                     [Results: ESSENCE/CORES 換算]
                                          ↓
                       [Research (CORES)] / [Foundry (ESSENCE)]
                                          ↓
                                    [Map Select] へ戻る
```

**1ラン目安**: 序盤は5-10分、メタ進行が進むにつれて20-40分。プレイヤースキルとビルド運で大きく揺れる設計。

### 1.2 ウェーブ構造

**現状コード** (`gameplay.jsx:60-67`): W%5==0 → ボス, W%3==0 → swarm, W%2==0 → tank, それ以外 → runner。スケーリング `hp *= (1 + (wave-1)*0.18)` 線形。

**問題点**: 単一タイプのみ、混合波なし。ベタ書きでチューニング不能。線形スケールはエンドレスに不適 (序盤緩慢、後半天井)。

**推奨**:
- ウェーブ定義をデータ駆動化 (`waves.ts`) — 各ウェーブは `{enemies: [{type, count, delay, every}], boss?, modifier?}`
- スケーリングカーブ:
  - W1-30: `hp = base * 1.12^(wave-1)` (やさしい指数)
  - W31-60: `hp = base * 1.18^(wave-1)` (中盤の壁)
  - W61+: `hp = base * 1.25^(wave-1)` + 数値表示は K/M/B (ハクスラ的インフレ表現)
- ドラフトポイント: **5波ごと** (W5, W10, W15…) に Run-Loot ドラフト発動
- ボス: W10/20/30/… で「Champion」、W50 ごとに「World Boss」 (大型ドロップ確定)
- ウェーブ Modifier: 高ウェーブ帯で確率発生 (例: "All enemies +20% speed", "Money rewards -30%, but loot drop rate +50%") — 戦略性とランダム性を加味

### 1.3 経済バランス (ラン内)

**現状の数値**: 開始 $220, HP 20 / 報酬 runner $6 / tank $14 / swarm $4 / boss $80 / アップグレード費 `cost * 0.6 * level` / 売却 100%。

**問題点**:
- **売却 100% は経済破壊** — 試行錯誤がノーリスクに → **70% に変更**
- アップグレード費が安すぎる (LV1→2 で +50% DMG が破格)
- 開始 $220 は妥当 — オープニングの選択幅 OK

**推奨**:
- 売却率 **70%** (アイテム装備済タワーの売却は装備アイテム喪失)
- アップグレード費は推奨カーブ採用 (詳細は 1.4)
- 報酬: 後半ウェーブほどインフレ (`reward = base * 1.05^wave`)

### 1.4 タワーバランス・差別化

**最重要**: BEACON のオーラバフが**未実装** (`gameplay.jsx:153` のコメントに明記)。8タワー構成が成立していない。

| タワー | 役割 | 何に強い | 現状の問題 |
|---|---|---|---|
| POINT | DPSフロア | runner 群 | 問題なし |
| PIERCE | 単体ピーク | tank, boss | 射程過剰の懸念 |
| BLAST | AoEクリア | swarm 密集 | スプラッシュ50px固定 |
| FREEZE | 制御 | 早い敵 | 意図通り |
| SCATTER | マルチターゲット | 中規模swarm | 優先度ロジックなし |
| VENOM | 持続火力 | tank, boss | スタック上限なし → スパムOP |
| CHAIN | 連鎖AoE | 連なる敵 | $220 に見合う性能か要検証 |
| BEACON | サポート | (他タワー強化) | **未実装** |

**最優先タスク**: BEACON のバフロジック実装 (Phase 2)。

**推奨アップグレードカーブ**:

| タワー | 基本コスト | LV2費 | LV3費 | LV4費 | LV5費 |
|---|---|---|---|---|---|
| POINT | 50 | 60 | 100 | 160 | 250 |
| PIERCE | 120 | 140 | 220 | 350 | 550 |
| BLAST | 160 | 180 | 280 | 450 | 700 |
| FREEZE | 100 | 120 | 200 | 300 | 480 |
| SCATTER | 180 | 220 | 340 | 540 | 850 |
| VENOM | 140 | 160 | 260 | 400 | 640 |
| CHAIN | 220 | 260 | 400 | 640 | 1000 |
| BEACON | 160 | 180 | 280 | 450 | 700 |

### 1.5 敵ロスター

**現状4種** (runner / tank / swarm / boss) — 特殊能力なし、戦術深度浅い。エンドレスでは敵バリエーションが命なので拡充必須。

**推奨ロスター (v1.0 で 6種)**:

| 種別 | HP倍率 | 速度 | 特殊 | 反対策 |
|---|---|---|---|---|
| RUNNER | 1.0x | 60 | なし | POINT |
| SWARM | 0.6x | 78 | なし | BLAST, SCATTER |
| TANK | 3.5x | 36 | armor (物理 -30%) | VENOM (DoT armor 無視) |
| **SHIELD** (新) | 2.2x | 50 | shield (1回吸収) | CHAIN, BLAST |
| **PHASE** (新) | 1.3x | 70 | 周期無敵 (1秒毎0.4秒) | FREEZE 同期化, VENOM 継続 |
| BOSS | 14x | 30 | 全体被ダメ -20% | BEACON 配置で打開 |

**v1.x 追加候補**: REGEN (HP回復) / SPLIT (撃破時に2体に分裂) / TELEPORT (ランダム前進) — エンドレス後半の差別化に有効。

### 1.6 メタ進行 (二重通貨システム)

**設計思想**: ラン内で得たもの (ESSENCE) と、ラン跨ぎで蓄積するもの (CORES) を分離し、二重ループで「次ランも遊びたい」を駆動。

#### 1.6.1 CORES (ラン後の永続タワー強化) — 既存 Research 画面

**獲得**: ラン終了時に `floor(reachedWave * 2 + score / 5000)` + マイルストーンボーナス (W25 +50, W50 +150, W100 +500)

**用途**: 8タワー × 5段階の MASTERY (永続強化)
- LV1-5 効果 (累積): +5% / +10% / +15% / +25% / +40%
- 強化対象: タワーごとに2軸 (例: POINT は damage と range / FREEZE は slow強度 と slow時間)
- 解放コスト: LV1=100, LV2=300, LV3=800, LV4=2000, LV5=5000 CORES (タワーごと)

**初期解放**: POINT, PIERCE, BLAST, FREEZE の4種。残り4種 (SCATTER, VENOM, CHAIN, BEACON) は CORES アンロック (各 800-2000 CORES)。

**マップ解放**: ZIGZAG 初期 / SPIRAL は累計5ラン後 / FORK は W30 到達後 / CROSS は W50 到達後。

#### 1.6.2 ESSENCE (ラン中のハクスラ装備で蓄積する第二通貨) — **新規追加**

**獲得**:
- ラン中に拾った全アイテムが、ラン終了時にレアリティに応じて ESSENCE に変換 (Common 1 / Rare 5 / Epic 25 / Legendary 100 / Mythic 500)
- 「アイテムを使い切る (装備した状態でラン終了)」ことで満額 / 売却済みは半額

**用途 — Foundry 画面 (新規スクリーン)**:
1. **アイテム解放**: ESSENCE を消費して新アイテムをドロップテーブルに追加
2. **ドロップ率強化**: 特定レアリティのドロップ率を上げる (Mythic 出現率を 0.1% → 0.3% など)
3. **初期スロット**: ラン開始時の初期所持アイテムスロット拡張 (0 → 1 → 2)
4. **再ロール**: ドラフト時の re-roll 回数増加 (0 → 1 → 2)

### 1.7 マップ設計

4マップ (ZIGZAG / SPIRAL / FORK / CROSS)。FORK 以外は曲がり角の数違いのみで、戦略的差異が薄い。

**v1.0 差別化方針 — 経済プレッシャーで個性化**:
- ZIGZAG: 開始 $250, 標準
- SPIRAL: 開始 $220, パスが長く DoT が効く
- FORK: 開始 $200, 双パスで物量2倍 (難)
- CROSS: 開始 $180, 報酬-10% (経済難度)

**v1.x 追加候補**: マップ別の "Map Trait" (例: SPIRAL は FREEZE 効果 +30% / FORK は AoE 範囲 +20%)

### 1.8 **NEW** ハクスラ・ルートシステム (シグネチャ機能)

**設計**: ハイブリッド型 — **ドラフト方式メイン + ボス撃破時の宝箱ドロップ**

#### 1.8.1 ドラフト (5波ごと)

5波クリア時にゲームを自動ポーズし、3枚のアイテムカードを提示。1枚選択してラン中の手札に加える。

- カードプール: そのランで解放済のアイテム + 解放数に応じたランダム新規 (1/3 確率)
- 再ロール (re-roll): デフォルト0回、Foundry 強化で増加
- スキップ: 選ばずに ESSENCE を 5 もらうオプション (ビルドが噛み合わない時の救済)

#### 1.8.2 ボス宝箱 (W10/20/30…)

ボスウェーブ撃破時に確定で1個ドロップ (Rare 以上保証)。W50 / W100 では Legendary / Mythic 確定。

#### 1.8.3 アイテムカテゴリ

| カテゴリ | 例 | スロット |
|---|---|---|
| **タワー専用 Mod** | "POINT: RoF +30%" "CHAIN: 跳弾 +2" | タワーに装備 (タワーあたり最大3スロット) |
| **グローバル Relic** | "全タワー射程 +15%" "敵撃破時 5% で $5 追加" | 装備不要、所持で常時発動 |
| **ビルド定義 Unique** | "CHAIN 跳弾 +5、ダメージ -50%" "FREEZE が DoT に変化" | グローバル相当、強烈な効果 |
| **コンディショナル** | "ボス戦中 全タワー +50% DMG" "$0 タワーは射程 2倍" | グローバル相当、状況依存 |

#### 1.8.4 レアリティ

| レアリティ | 色 (5テーマ対応) | ドロップ率 (基本) | 効果スケール |
|---|---|---|---|
| Common | グレー | 60% | 弱い単一効果 |
| Rare | 青 | 25% | 中程度の単一効果 |
| Epic | 紫 | 10% | 強い単一 or 複合効果 |
| Legendary | 金 | 4% | 強烈な複合効果 |
| Mythic | 赤 | 1% | ゲーム体験を変えるレベル |

#### 1.8.5 セットボーナス

同系統のアイテムを規定数集めると追加効果発動。例:
- "Frost" 系3個装備: 凍結中の敵に DoT
- "Pierce" 系3個装備: 弾が貫通+1
- "Volatile" 系2個装備: 撃破時 25% で爆発

#### 1.8.6 アイテム数の段階的拡張

- **v1.0 ローンチ**: 30アイテム (Common 12 / Rare 9 / Epic 6 / Legendary 2 / Mythic 1)
- **v1.1**: +20 (Foundry 解放型を含む)
- **v1.2**: +30 (セットボーナス拡充)

8タワー × 4カテゴリ × 5レアリティ = 理論上 160+ 組み合わせなので、初期は絞ってバランス検証する。

#### 1.8.7 UI 配置

- ラン中: 右サイドパネル下部に「装備中アイテム一覧」常時表示 (アイコンのみ、ホバーで詳細)
- タワー選択時: そのタワーの装備スロット (最大3) を強調表示、ドラッグ&ドロップで装備
- ドラフト時: 中央モーダルで3枚カード提示、各カードはレアリティ色枠 + 効果文
- ボス宝箱: 撃破時に画面中央に箱が出現、クリックで開封 (アイテム1個 + 演出)

---

## 2. スコープ & MVP 境界

### v1.0 で出荷 (Must)

**コア**:
- [x] エンドレスゲームループ (リファクタ必要)
- [ ] BEACON 実装
- [ ] ウェーブデータ駆動化 (`waves.ts`)
- [ ] バランス調整 (売却率, アップグレードカーブ, 報酬カーブ)
- [ ] 6種敵ロスター (SHIELD, PHASE 追加)

**ハクスラ** (新規):
- [ ] ドラフトシステム (5波ごとモーダル)
- [ ] ボス宝箱
- [ ] 30アイテム (4カテゴリ × 5レアリティ)
- [ ] 装備UI (タワー専用Mod / グローバルRelic)
- [ ] セットボーナス (3-5セット)
- [ ] レアリティ視覚表現 (5テーマ対応)

**メタ進行**:
- [ ] CORES (Research 画面) — タワーMastery + 解放
- [ ] ESSENCE (Foundry 画面 — 新規) — アイテム解放, ドロップ率強化
- [ ] localStorage 永続化 (zod + version)

**画面**:
- [ ] Menu, MapSelect, Game, Results, Research, Codex, **Foundry** (新), **DraftModal** (新), **BossChestModal** (新)
- [ ] モバイル ポートレート実動作

**世界**:
- [ ] 5テーマ / 4マップ

### v1.1+
- 敵3種追加 (REGEN, SPLIT, TELEPORT)
- アイテム +20, セットボーナス拡充
- BGM
- 日本語UI / その他ローカライズ
- ストーリーモード (オプショナル、敵ロスターを使ったキャンペーン)

### v2.x (将来検討)
- マルチプレイ (非同期ゴースト → 同期PvP)
- 季節イベント (限定アイテム, 限定マップ)

### Cut from MVP
- `design-canvas.jsx`, `tweaks-panel.jsx` (出荷ビルドから除外)
- `SystemCard` (デザインドキュメント、ゲーム不要)
- 複数セーブスロット
- マルチプレイ
- 有限ランモード (エンドレス専用に集中)

---

## 3. 技術仕様

### 3.1 ビルド (推奨確定: Vite + React + TypeScript)

**現状**: React+Babel CDN + `<script type="text/babel">` (本番不適、TypeScript 不可)

**推奨**: **Vite + React + TypeScript**
- 段階移行: まず Vite 化 (jsx 維持) → コンポーネント分割 → TS 化
- 出荷は静的アセット (`vite build` → `dist/`)
- ホスト: GitHub Pages / Cloudflare Pages / itch.io

### 3.2 状態管理 (推奨: Zustand + persist)

**現状**: 518行の単一コンポーネントに `useState` 20個近く。

**推奨アーキテクチャ**:

```
src/
  game/
    engine.ts          — ゲームループ (DOM非依存)
    types.ts           — Tower, Enemy, Wave, Item, GameState
    waves.ts           — ウェーブデータ
    towers.ts          — タワー定義
    maps.ts            — マップ定義
    enemies.ts         — 敵定義
    economy.ts         — コスト・報酬計算
    items/
      database.ts      — アイテム定義 (30+)
      sets.ts          — セットボーナス定義
      drops.ts          — ドロップテーブル, レアリティ抽選
      effects.ts       — 装備効果適用ロジック
  state/
    gameStore.ts       — Zustand (ラン中状態)
    metaStore.ts       — Zustand + persist (CORES/ESSENCE/解放/ベスト)
  components/
    GameField.tsx
    Hud.tsx
    BuildPanel.tsx
    ItemSlots.tsx      — タワー装備UI
    GlobalRelicsBar.tsx — Relic 一覧
    DraftModal.tsx     — 5波ごとのドラフト
    BossChestModal.tsx — ボス撃破時の開封演出
    screens/
      MenuScreen.tsx
      MapSelectScreen.tsx
      ResearchScreen.tsx — CORES
      FoundryScreen.tsx  — ESSENCE (新規)
      ResultsScreen.tsx
      CodexScreen.tsx
  app/
    Router.tsx
    App.tsx
```

### 3.3 永続化 (zod 検証)

```ts
// minimaltd:meta
{
  version: 2,
  cores: number,
  essence: number,
  unlocks: {
    towers: TowerId[],   // 初期 4 → 解放で 8
    maps: MapId[],
    items: ItemId[],     // Foundry で解放したアイテム
  },
  upgrades: { [TowerId]: 0..5 },     // タワー Mastery
  foundry: {
    initialSlots: number,            // 0..2
    rerollCount: number,             // 0..3
    dropRateBoost: { [Rarity]: number },
  },
  bestRuns: {
    [MapId]: { wave: number, score: number, durationMs: number, date: string }
  },
  settings: { theme, iconStyle, sfxVolume, bgmVolume },
}

// minimaltd:save (Continue 用、ウェーブ間でのみ書き込み)
{
  version: 2,
  mapKey, wave, money, hp, score, timeMs,
  towers: [...], items: [...], globalRelics: [...]
}
```

zod でスキーマ検証、version mismatch 時は migration 関数でアップグレード or リセット。

### 3.4 モバイル対応 (推奨: 単一コンポーネント + CSS分岐)

- レスポンシブ: SVG ベースのフィールドで normalized 座標、CSS Container Queries で portrait/landscape 分岐
- タッチ: 1タップ目=プレビュー、2タップ目=確定の2段階配置
- タップターゲット: 44x44 以上
- ドラフトモーダルはモバイルでフルスクリーン表示

### 3.5 アセット・音響 (推奨: SE のみで v1.0)

- SVG インライン継続 (現状維持)
- フォント: Google Fonts (`font-display: swap`)、本気で軽量化するなら self-host
- SE: Howler.js + 8-12音 (発射, 撃破, 配置, 波開始, ボス, アイテム取得, レアリティ別ドロップ音, ドラフト開始)
- BGM: v1.1

### 3.6 パフォーマンス

**現状ループ問題**: 毎フレ O(towers × enemies) 距離計算、敵位置の重複計算。

**ターゲット**: デスクトップ 60FPS / 30タワー / 100敵、モバイル 60FPS / 20タワー / 60敵。

**最適化**:
- 敵位置を1フレ1回計算してキャッシュ
- アイテム効果は装備時に集約計算 (毎フレ再計算しない)
- 高ウェーブ帯 (W100+) で敵が膨大になる場合は LoD (簡易描画)
- v1.2+ で必要なら Canvas 移行

---

## 4. リスク & 未解決の論点

### CRITICAL

1. **BEACON 未実装** → Phase 2 最優先
2. **ハクスラのバランスインフレ** — Mythic の効果が強すぎるとビルド固定化、弱すぎると無意味
   - 対策: 30アイテム小規模スタート + プレイテスト + テレメトリ(任意)
3. **エンドレス特有の "壁問題"** — どこかで突然死、メタ進行が薄いと「もう1ラン」が起きない
   - 対策: ESSENCE の獲得カーブを「壁にぶつかった次ランで明確に強くなる」体感に調整

### HIGH

4. **518行単一コンポーネント** — 段階移行 (Vite → 分割 → TS)
5. **モバイル/デスクトップ分岐** — Phase 1 で早期検証
6. **アイテム × タワーの組み合わせ爆発** — 8 × 30 × タワーレベル × セット = 数千通り
   - 対策: アイテム効果を「乗数 / 加算 / 置換」の3型に正規化、効果適用順序を厳格定義
7. **セーブ破損** — zod + version マイグレーション

### MEDIUM

8. design-canvas ラッパー剥離 (Phase 1)
9. テーマ切替の Settings 画面統合
10. Continue: ウェーブ間のみオートセーブ
11. ドラフトUI のモバイル最適化 — 3カードがポートレートで縦並びになる
12. ESSENCE 獲得 vs CORES 獲得のバランス — 片方に偏ると進行感が崩れる

### LOW

13. iconStyle の Settings 移植
14. Google Fonts オフラインロード
15. アイテムアイコンのデザイン — 30個分の幾何学SVG作成コスト

---

## 5. 実装フェーズ案

| Phase | 目標 | 期間 |
|---|---|---|
| 1. Foundation | Vite 移行 + design-canvas 剥離 + ファイル分割 | 1-2日 |
| 2. ゲームロジック完成 | BEACON, ウェーブDD化, 6種敵, バランス, 売却率変更 | 4-6日 |
| 3. ハクスラ基盤 | アイテムDB, ドラフト, 装備UI, レアリティ抽選, セットボーナス, ボス宝箱 | 5-7日 |
| 4. メタ進行 | CORES (Research), ESSENCE (Foundry), localStorage, 解放制度 | 3-5日 |
| 5. 画面遷移 | Menu/MapSelect/Results/Codex 接続, Continue | 2-3日 |
| 6. モバイル対応 | ポートレート, タッチ, レスポンシブ | 2-3日 |
| 7. ポリッシュ | SE, テーマ統合, エラー, パフォーマンス, テスト | 3-5日 |

**合計**: 20-31日 (1人作業) — ハクスラ追加で当初推定 +9日

---

## 6. 確認していただきたい決定事項

ハクスラ・エンドレス方向は確定。残る要決定事項は以下:

### ゲームデザイン (確認)
- [x] **コアループ**: エンドレス専用 ✓
- [x] **マルチプレイ**: v1 スコープ外 ✓
- [x] **シグネチャ**: ハイブリッド型ハクスラ (ドラフト + ボス宝箱) ✓
- [ ] **敵種**: 6種 (SHIELD, PHASE 追加) で良いか?
- [ ] **売却率**: 100% → 70% で良いか? (装備アイテムは喪失)
- [ ] **アイテム数 v1.0**: 30個スタートで良いか?
- [ ] **ドラフト頻度**: 5波ごとで良いか? (3波/7波 の案もあり)

### スコープ
- [ ] **MVP 画面**: Menu, MapSelect, Game, Results, Research, **Foundry**, Codex, DraftModal, BossChestModal で確定?
- [ ] **System Card 除外** で良いか?
- [ ] **Continue 機能**: ウェーブ間のみオートセーブで良いか?

### 技術
- [ ] **ビルドツール**: Vite で良いか?
- [ ] **TypeScript**: 段階移行で良いか?
- [ ] **状態管理**: Zustand + persist で良いか?
- [ ] **音響**: SE のみ v1.0 で良いか?
- [ ] **モバイル戦略**: 単一コンポーネント + CSS分岐で良いか?

### デプロイ
- [ ] **ホスト先**: GitHub Pages / itch.io / Cloudflare Pages / 自前ドメイン?

---

## 関連ファイル

- `index.html` — Phase 1 で design-canvas 剥離
- `styles.css` — 流用 (5テーマ)
- `towers.jsx` → `src/game/towers.ts`
- `gameplay.jsx` → Phase 1-3 で全面分割
- `screens.jsx` → `src/components/screens/*.tsx`、Foundry 新規追加
- `design-canvas.jsx`, `tweaks-panel.jsx` — 出荷から除外

---

**STOP — 上記決定事項について承認/修正待ち。**
