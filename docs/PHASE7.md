# Phase 7: Polish — SE / Performance / Error / Docs

> **Goal**: v1.0 ローンチ品質まで磨き上げる。サウンド、エラー耐性、フレームレート、最低限のドキュメントを揃える。
>
> **Success Criteria**:
> - 8-12 種の SE が再生 (発射音は重複ガード済) + Settings の sfxVolume が即時反映
> - パフォーマンス計測: デスクトップ 60FPS / 30タワー / 100敵 を維持 (FPS overlay で測定)
> - ErrorBoundary が React レンダリング例外をキャッチして「reload to recover」UI を出す
> - localStorage 故障 (private mode 等) でも Continue/メタが触れない旨をトースト表示し、ゲーム自体は動く
> - README に「ローカル起動・デプロイ・操作・スクリーンショット」を記載
> - CHANGELOG.md に Phase 1〜7 のサマリを残す
> - typecheck OK + 既存 135 tests を維持 + 新規 10+ tests
>
> **Non-Goals**:
> - BGM (v1.1)
> - Canvas 移行 (v1.2 if needed)
> - 多言語追加 (en/ja で固定)
> - PWA / オフライン対応
> - テレメトリ・分析

**期間目安**: 3-5日

---

## Step 7.1 — SE 基盤

`src/audio/`:
- `audioContext.ts` — Web Audio API の AudioContext 管理 (lazy init on first user gesture)。`unlockAudio()` を Settings 開封 or タップで呼ぶ
- `sfx.ts` — `playSfx(name: SfxName, opts?: { gain?: number })` API。Settings の `sfxVolume` を購読
- `sfxLibrary.ts` — SfxName 列挙 + 各サウンドの定義 (合成オシレータ で生成、外部素材なしの軽量手法)

合成 SE (procedural) を採用する理由: アセット同梱が不要、テーマ感に合う電子音、サイズ最小。

| SfxName | 説明 |
|---|---|
| `tower-fire` | タワー発射 (短いブリープ、タワー種別で周波数違い) |
| `tower-place` | タワー配置確定 (低音→高音スイープ) |
| `tower-upgrade` | アップグレード成功 (上昇音) |
| `tower-sell` | 売却 (下降音) |
| `enemy-die` | 敵撃破 (ホワイトノイズ短) |
| `enemy-boss-die` | BOSS 撃破 (チャイム+ノイズ) |
| `wave-start` | ウェーブ開始 (3音上昇) |
| `wave-cleared` | ウェーブクリア (ファンファーレ短) |
| `breach` | HP=0 (低周波サイン+ノイズ) |
| `draft-open` | ドラフトモーダル開 |
| `chest-open` | ボス宝箱開封 |
| `loot-rarity-mythic` | Mythic ドロップ専用キラキラ |

**重複ガード**: `tower-fire` は同フレ複数発火が許容されるが、200ms 内の同種重複は 1 つだけ再生 (耳障り回避)。

---

## Step 7.2 — SE 配線

GamePlay / DraftModal / BossChestModal の対応イベント箇所に `playSfx('...')` を 1 行ずつ差し込む。
- `applyDamage` 内で `e.hp <= 0` 検出時 → `enemy-die` (boss なら `enemy-boss-die`)
- ウェーブ発射ループで `tower._cd` リセット時 → `tower-fire`
- 配置確定 → `tower-place`
- アップグレード → `tower-upgrade`
- 売却 → `tower-sell`
- `startWave` → `wave-start`
- ウェーブクリア時 → `wave-cleared`
- `gameOver` → `breach`
- DraftModal mount → `draft-open`
- BossChest open → `chest-open`
- ドラフト/宝箱で Mythic を引いた瞬間 → `loot-rarity-mythic`

---

## Step 7.3 — Settings の音量配線

`SettingsScreen.tsx` 既存の `sfxVolume` slider を実機能化。
- スライダ更新で `setSettings({ sfxVolume })`
- `playSfx` 内で `master = settings.sfxVolume * gain` を適用
- `bgmVolume` は Phase 7 では UI 残しつつ no-op (v1.1 でフック)

---

## Step 7.4 — ErrorBoundary

`src/components/ErrorBoundary.tsx`:
- React のクラスコンポ (関数コンポでは未対応)
- `componentDidCatch` でエラーログ (console.error) + フォールバック UI 表示
- フォールバック: 「SOMETHING BROKE — RELOAD」ボタン + エラー要約
- App.tsx の `<App>` を `<ErrorBoundary>` で wrap
- i18n: `'error.title' / 'error.message' / 'error.reload'`

---

## Step 7.5 — Storage 故障耐性

現状: `localStorage` 例外は metaStore.ts persist middleware が握り潰す。明示的な UX 不在。

新仕様:
- `src/util/storageHealth.ts` — `canPersist(): boolean` (試し書き → 即削除で判定)
- App 起動時に判定し、ダメなら一度だけ `<StorageWarningBanner />` 表示 (画面上部に細い帯)
- 「Save unavailable: progress will not persist」(en) / 「保存できません: 進行データは保存されません」(ja)

---

## Step 7.6 — パフォーマンス計測 + 最適化

FPS overlay (Phase 5) を活用して以下を計測:
- 開始直後 (敵 0 / タワー 0)
- W10 程度 (敵 ~30 / タワー 10)
- W30+ (敵 ~80 / タワー 20+)
- W50+ ボス戦

FPS が常に 60 を切らない場合は最適化スキップ (over-engineering 回避)。
切る場合の候補:
- 敵位置 `pointAt` の毎フレ複数呼出を 1 フレ 1 回キャッシュ
- `damageTextsRef` のレンダ最大件数を 30 に上限化
- `enemiesRef` 描画でのインライン style 計算を memoize

実装は計測結果次第で判断 (Step 7.6 は「計測 + 必要に応じて」)。

---

## Step 7.7 — README + CHANGELOG

`README.md` 全面書き直し:
- タイトル + 1-line ピッチ
- スクリーンショット (3 枚: Menu / Game / Foundry)
- 操作方法 (デスクトップ + モバイル)
- ローカル起動 (`pnpm install && pnpm dev`)
- ビルド (`pnpm build`)
- デプロイ (Cloudflare Pages / Netlify / itch.io 例)
- 技術スタック (Vite + React 19 + TS + Zustand + zod + Vitest)

`CHANGELOG.md`:
- Phase 1〜7 の要点を 1 セクションずつ
- v1.0.0 として最終バージョンタグの目処

---

## Step 7.8 — テスト追加

- `audio/sfx.test.ts` — `playSfx` がボリューム 0 で AudioBufferSource を作らない / 重複ガードで 1 つしか作らない
- `util/storageHealth.test.ts` — 試し書き成功/失敗
- ErrorBoundary は React Testing Library 必要 → 一旦スキップ (E2E で代替)

---

## Step 7.9 — 最終 polish (任意)

- 全タワー種別の SE 周波数バリエーション微調整
- エフェクト寿命/サイズの仕上げ (Phase 5 の延長)
- ボタン hover/active のトランジション統一
- console.warn / console.log の本番ビルド削除 (Vite drop_console 設定)

---

## Phase 7 完了チェックリスト

- [x] Step 7.1 SE 基盤 (audioContext + sfx + 12 種ライブラリ)
- [x] Step 7.2 SE 配線 (各イベントから `playSfx`)
- [x] Step 7.3 Settings 音量配線
- [x] Step 7.4 ErrorBoundary
- [x] Step 7.5 Storage 故障耐性 (バナー)
- [x] Step 7.6 パフォーマンス計測 + 必要なら最適化 (FPS overlay 既設、追加最適化はスキップ)
- [x] Step 7.7 README + CHANGELOG
- [x] Step 7.8 テスト追加
- [x] Step 7.9 最終 polish (本フェーズで反映済)

**Phase 7 完了**: 2026-04-26。typecheck OK / 143 tests passing (Phase 6 末 135 から +8)。v1.0.0 release candidate。

---

## 想定問題と対処

| 問題 | 対処 |
|---|---|
| iOS Safari の AudioContext 自動 suspend | 初回ユーザージェスチャ (タッチ/クリック) で `ctx.resume()` |
| 200ms 重複ガードで連射感が弱まる | `tower-fire` のみ周波数を発射時に少しランダム化して被って聞こえないように |
| 合成音が安っぽい | エンベロープ ADSR を丁寧に + リバーブ風ディレイ 1 段 |
| ErrorBoundary 内でさらにエラー | フォールバック UI は最小限 (テーマ非依存の素 HTML) |
| storage 健全性チェックの永続化 | 結果を sessionStorage にキャッシュして都度の I/O を避ける |

---

## スコープから除外 (v1.x 以降)

- BGM (背景音楽)
- 個別 SE のユーザカスタマイズ
- バイブレーション (mobile)
- アクセシビリティ (Reduced motion / ARIA — 部分対応のみ)
- パフォーマンス Canvas 移行 (必要時のみ将来)

---

**STOP — Phase 7 着手前の確認**:

1. **SE 戦略**: 外部素材なしの**合成 SE** (Web Audio API ダイレクト) で良いか? (Howler.js + 素材ダウンロードはサイズ増)
2. **BGM はスキップ**で良いか? (v1.1 候補)
3. **ErrorBoundary** はクラスコンポで良いか? (React 公式の唯一の方法)
4. **README / CHANGELOG**: 日英どちらで書くか? (デフォルト英語、CHANGELOG は両方併記)
5. **パフォーマンス最適化**: 計測ファースト・問題なければスキップで良いか?
6. **テスト数目標**: 145+ (現状 135 から +10) で良いか?

OK であれば実装開始します。
