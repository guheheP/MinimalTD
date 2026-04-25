# Phase 4: Meta Progression & Persistence — 詳細実装計画

> **Goal**: ラン終了時に CORES と ESSENCE を貯め、Research / Foundry 画面で永続強化を購入する仕組みを実装。すべての状態は localStorage に保存し、zod でバリデーション。
>
> **Success Criteria**:
> - CORES がラン終了時に獲得される (`floor(reachedWave * 2 + score / 5000)` + マイルストーン)
> - ESSENCE がアイテム所持数に応じて獲得される
> - Research 画面でタワーマスタリ (LV1-5, +5/+10/+15/+25/+40% 累積) とタワー解放
> - Foundry 画面でアイテム解放 / ドロップ率ブースト / 初期スロット / 再ロール
> - マスタリがラン中の発射計算に乗る
> - 解放されたタワーのみ BUILD ショップに出現
> - 解放されたアイテムのみドラフトに登場
> - 初期スロット = ラン開始時に N 個ランダムアイテムを所持
> - localStorage 永続化 + zod スキーマ検証 + version マイグレーション
> - メタストアの純粋ロジックにテスト
>
> **Non-Goals (Phase 4 では触らない)**:
> - Menu / MapSelect / Results / Codex 画面の遷移整備 (Phase 5)
> - Continue 機能 (Phase 5)
> - モバイル対応 (Phase 6)

**期間目安**: 3-5日

---

## Step 4.1 — 依存追加

```bash
npm install zustand zod
```

---

## Step 4.2 — 型定義 (`src/state/types.ts`)

```typescript
import type { TowerId, MapKey, ItemRarity } from '../game/types';

export interface BestRun {
  wave: number;
  score: number;
  durationMs: number;
  date: string;             // ISO
}

export interface FoundryConfig {
  initialSlots: number;     // 0..2  (ラン開始時の所持アイテム数)
  rerollCount: number;      // 0..3  (ドラフトでの再ロール回数)
  dropRateBoost: Partial<Record<ItemRarity, number>>; // weight 加算
}

export interface MetaState {
  version: number;          // 現状 1
  cores: number;
  essence: number;
  unlocks: {
    towers: TowerId[];
    maps: MapKey[];
    items: string[];        // ItemDef.id
  };
  mastery: Partial<Record<TowerId, number>>; // 0..5
  foundry: FoundryConfig;
  bestRuns: Partial<Record<MapKey, BestRun>>;
  totalRuns: number;
  highestWave: number;
}
```

**初期値**:
- `cores: 0`, `essence: 0`
- `unlocks.towers: ['basic', 'sniper', 'cannon', 'frost']`
- `unlocks.maps: ['zigzag']`
- `unlocks.items: <Common 全12 + Rare 全9>` (Epic/Legendary/Mythic は Foundry で解放)
- `mastery: {}`
- `foundry: { initialSlots: 0, rerollCount: 0, dropRateBoost: {} }`

---

## Step 4.3 — zod スキーマ + マイグレーション (`src/state/schema.ts`)

```typescript
const v1Schema = z.object({
  version: z.literal(1),
  cores: z.number().int().nonnegative(),
  essence: z.number().int().nonnegative(),
  // ... 全フィールド
});

export function migrate(raw: unknown): MetaState | null {
  // version mismatch → null (= reset to defaults)
  // version === 1 → validate via v1Schema
  // version > 1 (将来) → 段階的にマイグレート
}
```

破損時は `null` を返し、ストアはデフォルトにフォールバック (ユーザー警告ログのみ)。

---

## Step 4.4 — Zustand ストア (`src/state/metaStore.ts`)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface MetaActions {
  addCores: (n: number) => void;
  spendCores: (n: number) => boolean;
  addEssence: (n: number) => void;
  spendEssence: (n: number) => boolean;
  unlockTower: (id: TowerId) => boolean;
  unlockMap: (key: MapKey) => void;
  unlockItem: (id: string) => boolean;
  upgradeMastery: (id: TowerId) => boolean; // 1 step
  buyFoundryUpgrade: (key: 'initialSlots' | 'rerollCount') => boolean;
  buyDropBoost: (rarity: ItemRarity) => boolean;
  recordRun: (mapKey: MapKey, run: { wave: number; score: number; durationMs: number }) => void;
  reset: () => void;          // dev/debug
}

export const useMetaStore = create<MetaState & MetaActions>()(
  persist(
    (set, get) => ({ /* state + actions */ }),
    {
      name: 'minimaltd:meta',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState, version) => migrate(persistedState),
    },
  ),
);
```

**価格表 (PLAN.md §1.6 反映)**:

| Mastery LV | 価格 (CORES) |
|---|---|
| LV1 | 100 |
| LV2 | 300 |
| LV3 | 800 |
| LV4 | 2000 |
| LV5 | 5000 |

**タワー解放**:
- SCATTER 800
- VENOM 800
- CHAIN 2000
- BEACON 2000

**Foundry 価格**:
- initialSlots LV1: 200 ESSENCE / LV2: 600 ESSENCE
- rerollCount LV1: 150 / LV2: 400 / LV3: 1000 ESSENCE
- ドロップ率ブースト: rare 100 / epic 300 / legendary 800 / mythic 2000 ESSENCE

**アイテム解放**:
- Epic 6個: 各 200 ESSENCE
- Legendary 2個: 各 800 ESSENCE
- Mythic 1個: 2500 ESSENCE

---

## Step 4.5 — マスタリの効果適用

`src/game/items/effects.ts` の `emptyEffect` ベースに、`computeTowerEffect` がメタストアからマスタリを参照し dmgMul に乗算する。

```typescript
// マスタリ LV1-5 の累積効果
const MASTERY_BONUS = [0, 0.05, 0.15, 0.30, 0.55, 0.95];
//                    ^LV0 ^LV1 ^LV2 ^LV3 ^LV4 ^LV5

export function masteryDmgMul(level: number): number {
  return 1 + (MASTERY_BONUS[level] ?? 0);
}
```

GamePlay の発射計算で:
```javascript
const masteryMul = masteryDmgMul(metaStore.mastery[tw.towerId] ?? 0);
const baseDmg = def.dmg * (1 + ...) * masteryMul * auraMul * eff.dmgMul + eff.dmgAdd;
```

---

## Step 4.6 — エンドオブラン報酬計算 (`src/state/rewards.ts`)

```typescript
export function calcCoresEarned(reachedWave: number, score: number): number {
  let cores = Math.floor(reachedWave * 2 + score / 5000);
  if (reachedWave >= 25) cores += 50;
  if (reachedWave >= 50) cores += 150;
  if (reachedWave >= 100) cores += 500;
  return cores;
}

const RARITY_ESSENCE = { common: 1, rare: 5, epic: 25, legendary: 100, mythic: 500 };

export function calcEssenceEarned(rarityCounts: Record<ItemRarity, number>): number {
  return Object.entries(rarityCounts).reduce(
    (sum, [r, c]) => sum + RARITY_ESSENCE[r as ItemRarity] * c, 0,
  );
}
```

GamePlay の GameOver オーバーレイで RESTART を押した時に `useMetaStore.getState().addCores(...)`, `addEssence(...)`, `recordRun(...)`.

---

## Step 4.7 — タワー解放ゲート

`GamePlay.jsx` の BUILD ショップで `metaStore.unlocks.towers` に含まれないタワーは disabled + ロックアイコン表示。

---

## Step 4.8 — アイテムプール / ドロップブースト統合

`src/game/items/drops.ts` を拡張:

```typescript
export function rollDraft(
  rng: () => number = Math.random,
  count = 3,
  options?: { unlocked?: ReadonlySet<string>; boosts?: Partial<Record<ItemRarity, number>> },
): ItemDef[];
```

- `unlocked` で解放アイテムだけからプール構築
- `boosts` で `RARITY_WEIGHTS` に加算
- GamePlay は `useMetaStore` から呼び出し時に渡す

---

## Step 4.9 — 初期スロット / 再ロール

**初期スロット** (`MetaState.foundry.initialSlots`):
- ラン開始時 (`useEffect` で `placed`/`inventory` 初期化と同時に) N 個のランダムアイテムを `addItem` する

**再ロール** (`MetaState.foundry.rerollCount`):
- DraftModal に `rerollsRemaining` プロップ追加
- ボタン「RE-ROLL」押下で options を再抽選、残り回数表示

---

## Step 4.10 — Research / Foundry 画面の機能化

既存 `Screens.jsx` の `UpgradeScreen` (Research) を機能化、新規 `FoundryScreen` を追加。

両画面の構造:
- 上部: 通貨表示 (CORES / ESSENCE)
- 中央: 購入可能項目リスト (現在 LV / 次 LV コスト / 効果)
- ボタン: 「PURCHASE」(価格不足時 disabled)

Phase 4 ではこれらを直接マウント可能にする (Phase 5 で Router から繋ぐ)。`App.tsx` に簡易タブ切替を一時的に置く案もあり。

---

## Step 4.11 — テスト

- `state/rewards.test.ts` — `calcCoresEarned` / `calcEssenceEarned` 数値、マイルストーン
- `state/metaStore.test.ts` — addCores/spendCores 不足時拒否、unlockTower 重複拒否、upgradeMastery LV5 上限
- `state/schema.test.ts` — zod パース成功/失敗、マイグレーション (null 返却)
- `game/items/drops.test.ts` 拡張 — unlocked プールで未解放アイテムが出ない、boosts でレアリティが偏る

---

## Step 4.12 — Phase 5 へのお膳立て

GamePlay.jsx は次のフックを Phase 5 で `App.tsx` の Router 側に繋げるよう疎結合化:
- `onRunEnd(stats)` プロップ (Phase 5 で Results 画面に渡す)
- `initialMeta` (Phase 5 で MapSelect から選んだマップ・初期スロットを渡す)

ただし Phase 4 では `useMetaStore` を直接呼んで動作確認できるように。

---

## Phase 4 完了チェックリスト

- [ ] Step 4.1 zustand + zod 追加
- [ ] Step 4.2 `state/types.ts` MetaState 定義
- [ ] Step 4.3 `state/schema.ts` zod + migrate
- [ ] Step 4.4 `state/metaStore.ts` Zustand + persist
- [ ] Step 4.5 マスタリ効果適用 (`effects.ts` 拡張)
- [ ] Step 4.6 `state/rewards.ts` 計算式
- [ ] Step 4.7 BUILD ショップにタワー解放ゲート
- [ ] Step 4.8 `drops.ts` に unlocked + boosts オプション
- [ ] Step 4.9 初期スロット + 再ロール統合
- [ ] Step 4.10 Research 画面機能化 + Foundry 画面新規作成
- [ ] Step 4.11 テスト追加
- [ ] Step 4.12 Phase 5 用フック整備

---

## 想定問題と対処

| 問題 | 対処 |
|---|---|
| localStorage の容量上限 (5MB) | 永続化対象を最小化 (`bestRuns` は map ごと最高1件) |
| zod 検証で旧データが弾かれた時の UX | `console.warn` + デフォルト値復帰、ユーザーに警告表示は最小限 |
| マスタリ LV5 (+95%) と Mythic Singularity が重なって OP | Phase 6 プレイテストで再調整 |
| 初期スロットでタワー固有 Mod が出るが配置タワーがない | アイテムは inventory に入るだけ、配置後に装備可能なので問題なし |
| 再ロールがチート的に強くなる | rerollCount LV3 = 3回/ドラフト で頭打ち、価格 1000 ESSENCE で抑制 |

---

**STOP — Phase 4 着手前の確認**:

1. **マスタリ価格カーブ**: `100/300/800/2000/5000` で良いか? (もっと易しく / 難しく?)
2. **タワー解放価格**: SCATTER/VENOM 各 800、CHAIN/BEACON 各 2000 で良いか?
3. **Foundry 価格**: 上記表で良いか?
4. **アイテム初期解放**: Common+Rare 計21個を初期解放、Epic/Legendary/Mythic は ESSENCE で解放、で良いか? (全初期解放案もあり)
5. **マスタリの効果**: dmg のみに乗算 (range/rof は据え置き) で良いか?

OK であれば実装開始します。
