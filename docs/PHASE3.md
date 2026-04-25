# Phase 3: Hack-and-Slash Loot System — 詳細実装計画

> **Goal**: ラン中のドラフト + ボス宝箱でアイテムを獲得し、タワーや全体に効果を適用するハクスラ基盤を実装。本ゲームのシグネチャ機能。
>
> **Success Criteria**:
> - 30アイテムが配布される (Common 12 / Rare 9 / Epic 6 / Legendary 2 / Mythic 1)
> - 5波ごとに 3択ドラフトモーダルが起動
> - ボスウェーブ (W10/20/30…) クリア時にボス宝箱モーダルが起動
> - タワー固有 Mod は1タワーあたり最大3スロットに装備可能
> - グローバル Relic は所持で常時発動
> - レアリティに応じたドロップ確率 (60/25/10/4/1)
> - ラン終了時に「Mythic ×1, Legendary ×0, Epic ×3 …」のような獲得アイテム集計表示 (ESSENCE 換算は Phase 4 でメタ進行に接続)
> - 純粋ロジックのテストが追加 (drops, effects)
>
> **Non-Goals (Phase 3 では触らない)**:
> - ESSENCE 通貨と Foundry 画面 (Phase 4)
> - メタ進行 / localStorage 永続化 (Phase 4)
> - セットボーナス (Phase 3.5 として後回し可)
> - 画面遷移・Menu/Results 接続 (Phase 5)

**期間目安**: 5-7日

---

## Step 3.1 — 型拡張 (`src/game/types.ts`)

```typescript
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemCategory = 'tower-mod' | 'relic' | 'unique' | 'conditional';
export type ItemScope = TowerId | 'any';

export interface ItemEffect {
  // タワー固有スタット (mul/add)
  dmgMul?: number;
  dmgAdd?: number;
  rngMul?: number;
  rngAdd?: number;
  rofMul?: number;
  rofAdd?: number;
  // 特殊フラグ (タワー固有)
  splashRangeMul?: number;       // BLAST スプラッシュ半径
  scatterTargetsAdd?: number;    // SCATTER ターゲット追加
  chainBouncesAdd?: number;      // CHAIN 跳弾追加
  poisonStackMul?: number;       // VENOM スタック上限
  freezeStrengthAdd?: number;    // FREEZE 強度
  beaconRangeMul?: number;       // BEACON aura 範囲
  beaconBuffAdd?: number;        // BEACON buff 強度
  // グローバル/条件付き
  killCashChance?: number;       // 撃破時に追加 $ ドロップ確率
  killCashAmount?: number;
  bossWaveDmgMul?: number;       // ボスウェーブ中のみ全タワー dmg
  // ユニーク
  ignoreArmor?: boolean;         // PIERCE: 装甲無視
  endlessPoison?: boolean;       // VENOM: DoT が敵死亡まで継続
}

export interface ItemDef {
  id: string;
  name: string;
  rarity: ItemRarity;
  category: ItemCategory;
  scope: ItemScope;              // タワー固有 mod なら TowerId, グローバルなら 'any'
  desc: string;
  effect: ItemEffect;
  glyph?: string;
}

export interface OwnedItem {
  uid: string;                   // 所持インスタンスのユニーク ID
  itemId: string;                // ItemDef.id への参照
  equippedTo?: string;           // PlacedTower.id (装備中のタワー)
}

export interface RunInventory {
  items: OwnedItem[];
  draftHistory: { wave: number; pickedItemId: string | null }[];
}

export interface ComputedTowerEffect {
  dmgMul: number;
  dmgAdd: number;
  rngMul: number;
  rngAdd: number;
  rofMul: number;
  rofAdd: number;
  splashRangeMul: number;
  scatterTargetsAdd: number;
  chainBouncesAdd: number;
  poisonStackMul: number;
  freezeStrengthAdd: number;
  beaconRangeMul: number;
  beaconBuffAdd: number;
  ignoreArmor: boolean;
  endlessPoison: boolean;
}
```

`PlacedTower` に slots を追加:

```typescript
export interface PlacedTower {
  id: string;
  towerId: TowerId;
  x: number;
  y: number;
  level: number;
  spent: number;
  equippedItems: string[];   // OwnedItem.uid の配列、最大3
}
```

---

## Step 3.2 — アイテムDB (`src/game/items/database.ts`)

30アイテム。レアリティ分布:

| レアリティ | 数 | 期待効果範囲 |
|---|---|---|
| Common | 12 | 単一スタットに小〜中効果 (+15-30%) |
| Rare | 9 | 中効果 + 部分複合 |
| Epic | 6 | 強力な単一 or 中規模複合 |
| Legendary | 2 | ビルド定義級複合 |
| Mythic | 1 | ゲーム体験を変えるレベル |

**Common (12)** — 各タワー専用 + グローバル:
- `red-dot` (POINT, dmg +25%)
- `long-lens` (PIERCE, rng +20%)
- `heavy-shell` (BLAST, splash +25%)
- `frostbite` (FREEZE, slow strength +30%)
- `spread` (SCATTER, targets +1)
- `toxin` (VENOM, poison stack +25%)
- `conduit` (CHAIN, bounces +1)
- `resonator` (BEACON, aura range +15%)
- `steady-hands` (any, rof +5%)
- `sharpened` (any, dmg +5%)
- `quick-loader` (POINT, rof +25%)
- `ranged-sight` (any, rng +10%)

**Rare (9)**:
- `crimson-lens` (POINT, dmg +60%)
- `ballistic-calc` (PIERCE, dmg +40%, rof +25%)
- `shrapnel` (BLAST, splash +60%)
- `glacial` (FREEZE, dmg +120%)
- `blossom` (SCATTER, targets +2)
- `necrotic` (VENOM, stack cap +50%)
- `storm-coil` (CHAIN, bounces +2)
- `beacon-core` (BEACON, buff strength +25pp)
- `profit-margin` (relic, 12% chance $5 on kill)

**Epic (6)**:
- `hyperloop` (relic, all towers rof +25%)
- `ion-strike` (POINT, dmg +120%, rof +30%)
- `quantum-lens` (PIERCE, ignoreArmor)
- `mortar-pod` (BLAST, splash +120%)
- `oversoul` (BEACON, aura range +50%, buff +35pp)
- `endless-toxin` (VENOM, endlessPoison)

**Legendary (2)**:
- `twin-stars` (SCATTER, targets +3, dmg +60%)
- `black-sun` (relic, all towers dmg +60% during boss waves)

**Mythic (1)**:
- `singularity` (relic, all towers dmg +30%, rng +20%, rof +20%)

---

## Step 3.3 — 効果適用 (`src/game/items/effects.ts`)

```typescript
export function computeTowerEffect(
  tower: PlacedTower,
  inventory: RunInventory,
  context: { isBossWave: boolean }
): ComputedTowerEffect;
```

集計ルール:
- mul は積算 (`1 × m1 × m2 × …`)
- add は加算 (`a1 + a2 + …`)
- 計算順: `final = (base × ∏mul) + Σadd`
- 装備された tower-mod (scope === towerId or scope === 'any') を集約
- グローバル relic は全タワーに加算
- 条件付き (boss-wave) は context で判定

GamePlay の発射計算で `computeTowerEffect` を毎フレ呼ぶのは重い。`useMemo([placed, inventory, isBossWave])` で再計算。

---

## Step 3.4 — ドロップロジック (`src/game/items/drops.ts`)

```typescript
const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  mythic: 1,
};

// 5波ごとのドラフト: 3カード抽選 (重複なし)
export function rollDraft(rng: () => number, owned: OwnedItem[]): ItemDef[];

// ボス宝箱: 最低 Rare、レアリティを底上げ
export function rollBossChest(rng: () => number, wave: number): ItemDef;

// W10 → 通常 + Rare floor
// W30 → Epic floor
// W50 → Legendary floor
// W100 → Mythic 確定
```

`rng` は引数化 (テスト容易性)。デフォルトは `Math.random`。

---

## Step 3.5 — インベントリ管理 (`src/game/items/inventory.ts`)

純粋関数で書く (`(state, action) => state`):
- `addItem(inventory, itemDef)` — uid 生成、items に push
- `equipItem(inventory, uid, towerId)` — 装備、未装備状態にする (3 スロットを超えたら拒否)
- `unequipItem(inventory, uid)` — タワーから取り外す
- `removeItem(inventory, uid)` — タワー売却時にも装備アイテムを inventory から外す

---

## Step 3.6 — DraftModal コンポーネント (`src/components/DraftModal.tsx`)

5波クリア時にゲームをポーズして表示:
- 3カード横並び (モバイルは縦)
- 各カードは レアリティ色枠 + glyph + 名前 + 効果文
- 1枚クリックで採用、`onPick(item)` 呼び出し
- 「SKIP」ボタン (将来 ESSENCE 引換、Phase 3 では noop)

---

## Step 3.7 — BossChestModal コンポーネント (`src/components/BossChestModal.tsx`)

ボス撃破直後にゲームをポーズ:
- 中央に箱アイコン (ASCII or SVG 幾何学)
- クリックで開封演出 (短いアニメーション、フェードイン)
- アイテム1個表示、「TAKE」で採用

---

## Step 3.8 — 装備UI (`src/components/ItemSlots.tsx`, `GlobalRelicsBar.tsx`)

**ItemSlots**: タワー選択時に右サイドパネル下部に表示
- 3スロット (空 / 装備中アイテム glyph)
- 空スロットクリック → 装備可能アイテム一覧 (未装備の tower-mod でかつ scope 一致)
- 装備中アイテムクリック → 取り外し / 売却 / キャンセル

**GlobalRelicsBar**: HUD 直下に常時表示
- 所持中の `relic`/`unique`/`conditional` アイテムを横並びアイコン
- ホバーで効果ツールチップ

---

## Step 3.9 — GamePlay 統合

`GamePlay.jsx` の変更:
1. インポート追加: `database`, `effects`, `inventory` from `../game/items/*`
2. State: `const [inventory, setInventory] = useState<RunInventory>({ items: [], draftHistory: [] })`
3. State: `const [draftPending, setDraftPending] = useState(false)`, `const [bossChestPending, setBossChestPending] = useState<ItemDef | null>(null)`
4. ウェーブクリア時 (`if (allSpawned && enemiesRef.current.length === 0)`):
   - `wave % 5 === 0` (= W5/10/15/...) で `setDraftPending(true)` → ゲーム自動ポーズ
   - クリアしたウェーブが boss なら `rollBossChest` の結果を `setBossChestPending`
5. `useMemo` で per-tower effect 計算: `const towerEffects = useMemo(() => placed.map(t => [t.id, computeTowerEffect(t, inventory, {isBossWave})]), [placed, inventory, isBossWave])`
6. 発射計算で `dmg = def.dmg * (1 + 0.5*(level-1)) * auraMul * effect.dmgMul + effect.dmgAdd` 等
7. SCATTER ターゲット数 = `4 + scatterTargetsAdd`
8. CHAIN 跳弾 = `3 + chainBouncesAdd`
9. ignoreArmor が true なら `applyDamage` の armor 計算をスキップ

---

## Step 3.10 — テスト (`*.test.ts`)

- `database.test.ts` — 30アイテムの ID 一意性、レアリティ分布、scope の整合性
- `drops.test.ts` — 重み付き抽選 (大量試行でレアリティ分布が ±2pp 以内)、bossChest が Rare 以上、W100 で Mythic 確定
- `effects.test.ts` — タワー固有 mod のみ装備時、relic 重複時、boss wave 条件付き、装備3スロット制限
- `inventory.test.ts` — equip/unequip/remove の純粋性

カバレッジ目標: items/* の純粋関数で 90%+

---

## Step 3.11 — ラン終了時のサマリ

GameOver 画面に「LOOT COLLECTED」セクションを追加:
- レアリティ別カウント
- 「ESSENCE EARNED: 計算値 (saved next run)」のプレースホルダ表示 (Phase 4 で永続化)

---

## Phase 3 完了チェックリスト

- [ ] Step 3.1 types.ts 拡張 (Item*, RunInventory, ComputedTowerEffect, PlacedTower.equippedItems)
- [ ] Step 3.2 30アイテムの DB
- [ ] Step 3.3 effects.ts (computeTowerEffect)
- [ ] Step 3.4 drops.ts (rollDraft, rollBossChest)
- [ ] Step 3.5 inventory.ts (純粋関数)
- [ ] Step 3.6 DraftModal.tsx
- [ ] Step 3.7 BossChestModal.tsx
- [ ] Step 3.8 ItemSlots.tsx + GlobalRelicsBar.tsx
- [ ] Step 3.9 GamePlay 統合 (発射計算で effects 適用)
- [ ] Step 3.10 テスト追加
- [ ] Step 3.11 ラン終了サマリ

---

## Phase 3 で発見しうる問題と対処

| 想定問題 | 対処 |
|---|---|
| 効果適用順序 (mul と add の衝突) | 明確な順序: `(base × auraMul × ∏(dmgMul)) + Σ(dmgAdd)` |
| ドラフトでタワー未配置時にタワー固有Modが出る | scope を見て、配置済タワーが scope に合致しなければ「装備不可」表示 |
| ストックインフレ (大量アイテムでUI崩壊) | 30アイテム前提で UI を組む; v1.1 で解放型を増やす場合は仕様追加 |
| Mythic Singularity 単体で OP | Phase 6 のプレイテストで再調整、必要なら効果値を弱める |
| BossChest と Draft が同じウェーブで重なる | W10/20/30 はボスウェーブかつ %5 == 0 なので両方発火 → ドラフト → 宝箱の順で表示 |

---

**STOP — Phase 3 着手前の確認**:

1. **アイテム数**: 30個スタートで良いか? (より少なく開始したい / 多めに用意したい?)
2. **効果範囲**: 上記 6-7 種の効果型で十分か? (もっと特殊効果を入れたい?)
3. **セットボーナス**: Phase 3 では実装せず Phase 3.5 で追加で良いか?
4. **ボス宝箱の出現タイミング**: ボスウェーブクリア時のみ (W10, W20, W30…) で良いか?
5. **Skip ボタン**: ドラフトを skip する選択肢を v1.0 で出すか? (出さない案もあり)

OK であれば実装を開始します。
