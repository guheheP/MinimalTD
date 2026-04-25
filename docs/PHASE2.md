# Phase 2: Game Logic Completion — 詳細実装計画

> **Goal**: BEACON タワー実装 + ウェーブデータ駆動化 + 6種敵 + バランス調整。エンドレスゲームループとして完結させる。ハクスラ・メタ進行は Phase 3-4 で対応するため、本フェーズでは触らない。
>
> **Success Criteria**:
> - 8タワーすべてが効果を発揮する (BEACON のオーラバフが機能)
> - 6種の敵 (SHIELD, PHASE 新規追加) が登場
> - ウェーブ構成が `src/game/waves.ts` のデータから生成される (コードベタ書き廃止)
> - 売却率 70%, アップグレードコストが新カーブ (PLAN.md §1.4)
> - HP/報酬スケーリングが新カーブ (PLAN.md §1.2)
> - 純粋ロジックが `src/game/*.ts` に TS で抽出済 (gradual TS migration の本格 step)
> - W1-W30 を通しでプレイ可能、`npm run build` 成功

**期間目安**: 4-6日

---

## Step 2.1 — `src/game/types.ts` (型定義)

ラン中状態を TypeScript で固める。後続ステップの基盤。

主要型: `TowerId`, `TowerDef`, `EnemyKind`, `EnemyDef`, `MapKey`, `MapDef`, `WaveSpec`, `WaveModifier`, `PlacedTower`, `ActiveEnemy`, `Projectile`.

**新フィールド**:
- `EnemyDef`: `armor?`, `shield?`, `phaseDuration?`, `phaseCycle?`, `bossAura?`
- `TowerDef`: `isAura?`, `auraRange?`, `auraBuff?`
- `ActiveEnemy`: `shielded?`, `phaseInvuln?`

---

## Step 2.2 — `src/game/enemies.ts` (敵定義 + スケーリング)

```typescript
export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  runner: { hpBase: 22, speed: 60, reward: 6,  ... },
  swarm:  { hpBase: 14, speed: 78, reward: 4,  ... },
  tank:   { hpBase: 80, speed: 36, reward: 14, armor: 0.3, ... },
  shield: { hpBase: 50, speed: 50, reward: 12, shield: true, ... },   // NEW
  phase:  { hpBase: 30, speed: 70, reward: 10, phaseDuration: 0.4, phaseCycle: 1.0, ... }, // NEW
  boss:   { hpBase: 320, speed: 30, reward: 80, bossAura: 0.2, ... },
};

export function scaleHp(base: number, wave: number): number {
  if (wave <= 30) return base * Math.pow(1.12, wave - 1);
  if (wave <= 60) return base * Math.pow(1.12, 29) * Math.pow(1.18, wave - 30);
  return base * Math.pow(1.12, 29) * Math.pow(1.18, 30) * Math.pow(1.25, wave - 60);
}

export function scaleReward(base: number, wave: number): number {
  return Math.floor(base * Math.pow(1.05, wave - 1));
}
```

**SVG パーツ** (`EnemyShape` コンポーネント) は `Towers.jsx` 側に残し、SHIELD/PHASE 用の追加形状を JSX に足す。

---

## Step 2.3 — `src/game/towers.ts` (タワー定義 TS化)

`Towers.jsx` の `TOWERS` 配列と `MAPS` オブジェクトを TS に純化。`TOWER_DEFS: Record<TowerId, TowerDef>` 形式に再構成。

BEACON に `isAura: true, auraRange: 100, auraBuff: { dmg: 0.15 }` を追加。

`TowerGlyph`, `pathLength`, `pointAt` は `Towers.jsx` に残置 (描画/汎用ユーティリティ)。

---

## Step 2.4 — `src/game/economy.ts` (経済式)

```typescript
const UPGRADE_COSTS: Record<TowerId, number[]> = { /* PLAN.md §1.4 のカーブ */ };

export function getUpgradeCost(towerId, currentLevel): number;
export function getSellValue(towerId, level): number;       // 70% of total spent
export function getWaveBonus(wave): number;                  // 40 + wave * 8
```

---

## Step 2.5 — `src/game/waves.ts` (ウェーブ生成)

W1-10 は固定スクリプト (チュートリアル相当)。W11+ は手続き生成だが、5/10/15...の節目はミニボス/ボス確定。

```typescript
export function getWave(index: number): WaveSpec;
```

**Wave Modifier** (W21+ の確率発生) は Phase 2 では型だけ用意し、実効果適用は Phase 3 でハクスラと統合。

---

## Step 2.6 — `src/game/aura.ts` (BEACON バフ計算)

```typescript
export function computeAuras(towers: PlacedTower[]): Record<number, AuraEffect> {
  // For each non-beacon tower, sum buffs from beacons in range.
  // LV1 BEACON: +15% dmg / 100px range
  // LV5 BEACON: +55% dmg / 180px range (auraRange: 100 + 20*(lv-1))
  // Multiple beacons stack additively, capped at +60%.
}
```

毎フレ実行可能だが、タワー配置/売却/アップグレード時のみ再計算する (パフォ重視)。

---

## Step 2.7 — `src/components/GamePlay.jsx` のリファクタ

最も影響範囲の大きいステップ。次の順で進める:

1. **インポート差し替え**: ハードコード `TOWERS`/`MAPS`/コスト計算を `src/game/*` 経由に
2. **敵生成**: `getWave(index)` で `WaveSpec` を取得 → groups を時間差でスポーン
3. **HP/報酬スケーリング**: `scaleHp`/`scaleReward` 経由
4. **売却**: `getSellValue` 経由 (100% → 70%)
5. **アップグレード費**: `getUpgradeCost` 経由
6. **オーラバフ統合**: タワー配列変更時に `computeAuras` 再計算、フレーム内では結果のみ参照
7. **SHIELD/PHASE 挙動**:
   - `applyDamage(enemy, dmg, source)` ヘルパー追加
   - SHIELD: 1発吸収 → `enemy.shielded = false`
   - PHASE: `phaseInvuln > 0` の間は projectile 無効、DoT (poison) は通る
   - TANK の armor (-30%) は projectile のみ、DoT は素通り
8. **boss aura** (-20% 受け被ダメ): boss が射程内にいる場合のみ、全タワーのダメージに乗算

**目標**: 行数 518行 → 400行以下 (ロジック外出しで自然減)。

---

## Step 2.8 — テスト追加 (`vitest`)

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react
```

`vite.config.ts` に test 設定を追加。新規テスト:
- `src/game/economy.test.ts` — sell rate 70%, upgrade curve 整合性
- `src/game/enemies.test.ts` — `scaleHp`/`scaleReward` 単調増加、境界値 (W30, W60)
- `src/game/aura.test.ts` — BEACON 範囲内/外、複数 BEACON のスタッキング
- `src/game/waves.test.ts` — W5/W10/W30 の boss 検出、ウェーブインデックスの一意性

カバレッジ目標 80%+ (純粋関数のみ)。React コンポーネント側は Phase 7 でカバー。

---

## Step 2.9 — 動作検証

ブラウザで `npm run dev`:
- [ ] W1 から開始、W30 まで通しでプレイ可能
- [ ] 全8タワーが配置可能、BEACON のオーラ効果が見える (近くのタワーの DPS が上がる)
- [ ] SHIELD 敵は2発必要 (見た目で 1回光るとシールド消費)
- [ ] PHASE 敵は周期的に無敵 (見た目で点滅、その間 DoT のみ通る)
- [ ] 売却で支払い総額の 70% 返金
- [ ] HP スケーリングが感覚的に妥当 (W10 までは余裕、W20 で崩れ始め、W30 で限界)

---

## Step 2.10 — クリーンアップ

- `src/components/Towers.jsx` から TS に外出した部分を削除 (重複排除)
- `styles.css` (root) を削除 (Phase 1 で残った重複)
- 型エラー再確認 (`npm run typecheck`)
- ビルドサイズ確認 (`npm run build`)

---

## Phase 2 完了チェックリスト

- [ ] Step 2.1 `src/game/types.ts` 作成
- [ ] Step 2.2 `src/game/enemies.ts` (SHIELD, PHASE 含む) + scaleHp/scaleReward
- [ ] Step 2.3 `src/game/towers.ts` (TOWER_DEFS, MAPS)
- [ ] Step 2.4 `src/game/economy.ts` (sell 70%, upgrade curve)
- [ ] Step 2.5 `src/game/waves.ts` (W1-10 固定 + W11+ 手続き生成)
- [ ] Step 2.6 `src/game/aura.ts` (BEACON 計算)
- [ ] Step 2.7 `GamePlay.jsx` のリファクタ (新モジュール統合 + SHIELD/PHASE 挙動)
- [ ] Step 2.8 vitest セットアップ + 純粋関数テスト
- [ ] Step 2.9 ブラウザ動作確認
- [ ] Step 2.10 クリーンアップ + typecheck/build

---

## Phase 2 で発見しうる問題と対処

| 想定問題 | 対処 |
|---|---|
| BEACON のスタックが OP 化 (重ね置きで指数強化) | 加算スタック (max +60%) で頭打ち、または1タワーに対し最強1個のみ採用 |
| SHIELD/PHASE のビジュアル区別がつかない | 形状を変える (六角形/菱形) + 状態ごとのフィルター効果 |
| Wave データ駆動化で W1-W10 が単調になる | グループの delay/spacing をランダム化、または map ごとに開始ウェーブを変える |
| 既存 `gameplay.jsx` の状態初期化が壊れる | 段階的に置換、各 Step で `npm run dev` 確認 |
| TS と JS 混在で named export の名前衝突 (TOWERS in towers.ts vs Towers.jsx) | Towers.jsx 側を `TOWER_GLYPHS` 等にリネーム、データは `towers.ts` に集約 |

---

**STOP — Phase 2 着手前の確認**:

1. **BEACON 仕様**: dmg のみバフ (range/rof は据え置き) で良いか? それとも range +10%, rof +5% も加味?
2. **SHIELD/PHASE の追加**: v1.0 で出す (PLAN.md 推奨) で確定?
3. **TS 移行範囲**: `src/game/*.ts` のみ TS、`GamePlay.jsx` は JSX のまま (Phase 7 で TS化) で良いか?
4. **テスト範囲**: 純粋関数のみ vitest、React コンポーネントは後回しで良いか?

OK であれば Phase 2 の実装を開始します。
