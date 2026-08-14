# Architecture Decision Records — ShigotoForm

Git のコミット履歴から抽出したアーキテクチャ上の意思決定を記録する。日付はコミット日（JST）。

---

## ADR-001: クライアントサイド完結型 PWA として構築（バックエンドを持たない）

- **Status**: Accepted
- **Date**: プロジェクト初期〜継続中

### Context

履歴書という機微な個人情報を扱うツール。サーバー送信を前提にすると、情報漏えいリスクとホスティングコストの両方を抱える。

### Decision

サーバー・API を一切持たず、全データを IndexedDB（Dexie ラッパー経由）にブラウザ内保存する構成を採用。`src/db.ts` が唯一の永続化層。

### Consequences

- 個人情報が外部に送信されない設計をアーキテクチャレベルで保証できる（`docs/index.html` の LP でも訴求ポイントに採用）。
- 反面、複数デバイス間の同期は持てない。JSON エクスポート/インポートで代替（ADR-007 関連）。
- ホスティングは静的配信のみで済み、後述の Docker/nginx 構成もこの前提の上に成立する。

---

## ADR-002: フロントエンド技術スタックとして Vite + TypeScript を採用

- **Status**: Accepted
- **Date**: プロジェクト初期

### Context

ビルドツールと型付けの選定。SPA フレームワーク（React/Vue 等）を使わず、DOM 直接操作 + Vite のバンドリングという軽量構成にする必要があった。

### Decision

Vite をビルド/開発サーバーとして採用し、TypeScript で型安全性を確保。`src/main.ts` を単一エントリポイントとし、`index.html` からは直接モジュールを読み込まない方針とした。

### Consequences

- ビルドは `tsc && vite build` の二段構成となり、型エラーとバンドルエラーを分離して検知できる。
- フレームワークを持たない分、DOM 操作コード（`resume.ts`）と状態管理を手動で書く必要がある。

---

## ADR-003: CDN 読み込みから npm パッケージ管理への移行

- **Status**: Accepted
- **Date**: 2025-08-11（`98ccccc`）

### Context

Bootstrap や FontAwesome 等を CDN の `<script>`/`<link>` で読み込んでいたが、バージョン固定・オフライン動作（PWA 化）・ビルド時最適化との相性が悪い。

### Decision

CDN 依存を廃止し、`bootstrap` / `@fortawesome/fontawesome-free` / `@fontsource/*` を npm パッケージとしてバンドルする方式に統一。

### Consequences

- Service Worker によるオフライン対応（ADR-001 の PWA 化）と整合する。
- バンドルサイズ増につながるため、後続でフォント/アイコンの遅延読み込み最適化（ADR-004）が必要になった。

---

## ADR-004: フォント/アイコンの遅延読み込みによるパフォーマンス最適化

- **Status**: Accepted
- **Date**: 2025-08-11（`665824f`, `9da581e`, `d1af597`）

### Context

Noto フォント（和文）と FontAwesome をバンドルに含めた結果、初期ロードが重くなり Lighthouse スコアに影響。

### Decision

`requestIdleCallback` による Noto フォントの遅延読み込み、ヘルプボタン hover / オフキャンバスメニュー展開時の FontAwesome 遅延読み込みを実装。ロード完了後に `fonts-loaded` / `icons-loaded` クラスを `<html>` に付与し CSS 側で切り替える。

### Consequences

- Lighthouse パフォーマンススコアの改善（README にスコア記載）。
- CSS 側は `.fonts-loaded` クラスに依存したフォント切り替えが必須になり、CSS 変更時の制約として `AGENTS.md` に明文化されている。

---

## ADR-005: Docker + nginx による本番配信構成の追加

- **Status**: Accepted
- **Date**: 2026-01-17（`973a9b4`）〜 2026-07-09（`3a2c8e1`, `4523381`, `db88c1e`, `2e31c70`）

### Context

静的サイトのデプロイ手段として、環境非依存のコンテナ化が求められた。

### Decision

`Dockerfile` / `docker-compose.yml` / `nginx.conf` を追加し、pnpm workspace 構成を Docker ビルドに対応させる。ベースイメージは `node:24-alpine` に統一し、本番は nginx:alpine の 80番ポートで配信。

### Consequences

- Docker イメージタグの大文字小文字問題（`db88c1e`）や `.dockerignore` からの誤ったファイル除外（`2e31c70`）など、コンテナ化特有の不具合対応が発生した。
- `dist/` はビルド生成物として明確に「手動編集禁止」の運用ルールが `AGENTS.md` に明文化されている。

---

## ADR-006: GitHub Actions による CI/CD パイプラインの整備

- **Status**: Accepted
- **Date**: 2026-01-17（`2adab25`, `3046787`）〜 2026-03-05（`ebbea71`, `402ec0c`）〜 2026-07-09（`3fdece9`）

### Context

lint・ビルド・依存監査・E2E テストを手動実行に頼ると、品質担保が属人化する。

### Decision

`.github/workflows/` に lint / build / audit / test の 4 ワークフローを整備。ランナーは `ubuntu-slim` → 標準ランナーへの変更を経て安定化（`402ec0c`）、`actions/checkout` を v6 に更新（`3fdece9`）。

### Consequences

- README にビルドバッジを掲載し、CI 状態を可視化。
- CI 上で `pnpm audit` を定期実行する体制となり、ADR-008（依存脆弱性管理）の運用基盤になった。

---

## ADR-007: パッケージマネージャを pnpm に統一し、workspace overrides で推移的依存を管理

- **Status**: Superseded by ADR-012
- **Date**: 2026-03-05（`ebbea71`）〜 2026-08-14（`c148765`）

### Context

`vite-plugin-pwa` → `workbox-build` 配下の推移的依存（`fast-uri`, `brace-expansion` 等）に `pnpm audit` で検出される脆弱性が周期的に発生する。直接の依存アップデートでは解決できない階層にある。

### Decision

pnpm を正式採用し、`pnpm-workspace.yaml` の `overrides` フィールドで脆弱パッケージを強制的にパッチ版へ固定する運用を確立。`minimumReleaseAgeExclude` で信頼済みパッケージのリリース直後利用も許可。

### Consequences

- `pnpm audit` の結果が変わるたびに `pnpm-workspace.yaml` の overrides を追随更新する継続的なメンテナンスタスクが発生する（実際、直近の会話でも `fast-uri`/`brace-expansion` の再ピン留めを実施）。
- `package.json` 側の `pnpm.overrides` フィールドは新しい pnpm では読まれない（`pnpm-workspace.yaml` に一本化）ことが判明し、誤った設定場所を使うと警告が出るだけで無効化される点に注意が必要。

---

## ADR-008: リンタを Biome に統一（ESLint / Prettier は不採用）

- **Status**: Accepted
- **Date**: 2026-02-19（`f297af1`）以降 v2 系へ更新継続

### Context

Lint とフォーマットを別ツール（ESLint + Prettier）で運用すると設定の二重管理・実行速度のコストが発生する。

### Decision

Biome 単体で lint・format・import 整理を担う構成に統一。`biome.json` で `noExplicitAny: warn` 等プロジェクト固有ルールを定義。

### Consequences

- Biome 2.x 系メジャーアップデート時に `biome migrate --write` でスキーマ移行が必要（`files.ignore` → `files.includes`、`organizeImports` → `assist` 等）。
- Biome 2.x で新設された `noImportantStyles` ルールは、アクセシビリティ目的の意図的な `!important` 使用（`resume.css` の reduced-motion / focus-visible）と衝突するため明示的に off にする判断を行った。

---

## ADR-009: E2E テストに Playwright を採用

- **Status**: Accepted
- **Date**: 2026-03-05（`ebbea71`）

### Command

`playwright.config.ts` を追加し、複数ビューポート（fhd/mobile/tablet）でのスクリーンショット取得を含む E2E テストスイートを整備。`pnpm test` / `pnpm screenshot` として運用。

### Consequences

- ブラウザバイナリのバージョン依存があり、`@playwright/test` をアップデートするたびに `playwright install` でバイナリ再取得が必要になる（自動化されていない手動ステップ）。

---

## ADR-010: AI コーディングエージェント向けガイド文書の整備と統合

- **Status**: Accepted
- **Date**: 2025-08-11（`064a983`）〜 2026-08-13（`2197a6f`, `85be351`）

### Context

Claude Code / Codex など複数の AI コーディングツールを併用する開発フローのため、ツールごとに重複したガイドを持つと更新漏れが発生する。

### Decision

`AGENTS.md` を正本とし、`CLAUDE.md` は `@AGENTS.md` の参照のみに簡素化。プロジェクト概要・コマンド・アーキテクチャ・コーディング規約・制約を `AGENTS.md` に集約。

### Consequences

- ドキュメントの二重メンテナンスを回避できる。
- 一時的に `ebbea71`（モダナイズ）で `AGENTS.md`/`CLAUDE.md` が削除されたが、後のコミットで復活しており、AI 運用ドキュメントの重要性が再確認された形跡がある。

---

## ADR-011: LP（`docs/index.html`）への OGP / Twitter Card / JSON-LD 導入

- **Status**: Accepted
- **Date**: 2025-08-11（`556456c`, `431428c`）〜 2026-08-14（`1d2187b`, 直近作業）

### Context

GitHub Pages で公開する LP のシェア時プレビューと検索エンジン向け構造化データが不足していた。

### Decision

`og:url` / `og:site_name` / `og:locale` に加え `twitter:card`（summary_large_image）と `schema.org` の `WebApplication` 型 JSON-LD を追加。公開先 URL は `https://hidao80.github.io/ShigotoForm/` に確定。

### Consequences

- ソーシャルシェア画像は当初 GitHub raw URL を使っていたが、専用の `social-preview` 画像に差し替える運用に移行中（`make-social-preview` スキル運用と連動）。

---

## ADR-012: パッケージマネージャを pnpm から bun へ移行

- **Status**: Accepted
- **Date**: 2026-08-14（`c148765`, `d79d8a0`, `21937a0`, `35e9873`, `8ecac8a`, `b98014f`, `ebb0136`, `2ff46ab`）

### Context

ADR-007 で pnpm に統一していたが、より高速なインストール・実行速度を持つ bun へ切り替える判断が下された。pnpm 固有機能（`pnpm-workspace.yaml` の `allowBuilds` / `overrides` セレクタ構文 / `minimumReleaseAgeExclude`）は bun にそのまま移植できず、移行に伴う互換性検討が必要だった。

### Decision

- CI（`.github/workflows/{test,audit,lint}.yml`）: `pnpm/setup@v1` → `oven-sh/setup-bun@v2` に置換、実行コマンドを `bun install` / `bun run <script>` / `bunx` に統一。
- `Dockerfile`: ベースイメージを `node:24-alpine` + `corepack pnpm` から `oven/bun:1-alpine` に変更。
- `docker-compose.yml` / `playwright.config.ts`: `pnpm run dev` → `bun run dev`。
- `pnpm-workspace.yaml` を削除し、内容を `package.json` に統合：
  - `allowBuilds` → `trustedDependencies` 配列。
  - `overrides` → npm/bun 互換の `overrides` フィールド。pnpm 固有のバージョン範囲付きセレクタ（例: `lodash@<=4.17.23`）は bun/npm では解釈されないため、パッケージ名のみのキーに単純化した（影響範囲が「特定バージョン以下」から「全バージョン強制」に変わる）。
  - `minimumReleaseAgeExclude`（サプライチェーン攻撃対策としてのリリース経過日数チェック除外リスト）は bun に相当機能がないため削除。
- `pnpm-lock.yaml` は `bun install` の自動移行機能で `bun.lock` に変換。
- `README.md` / `AGENTS.md` のコマンド例を bun 系に更新。

### Consequences

- pnpm が持っていた `minimumReleaseAge`（サプライチェーン攻撃対策：新しすぎるパッケージバージョンの自動採用を防ぐ機能）に相当する防御層が失われた。bun 側で同等機能が追加されない限り、この観点の防御は手動運用に戻る。
- `overrides` のバージョン範囲指定が失われ、対象パッケージは常に指定バージョンへ強制されるようになった（脆弱性対応目的のため実運用上の影響は限定的）。
- `bun run lint` / `bun run build` で動作確認済み。`bun audit` コマンドの CI 実運用（`audit.yml`）は今後の CI 実行結果で継続検証が必要。

---

## Appendix: 決定に至っていない／継続検討中の論点

- **TypeScript 7 系（ネイティブ/Go 実装ポート）への移行**: 2026-08-14 時点で `5.9.3` に留め、7.x は既存プラグインエコシステムの成熟を待って再検討する方針（未 ADR 化、暫定判断）。
- **顔写真添付機能**: `docs/index.html` の LP 文言に「近日対応予定」と記載があるが、実装方針は未決定。
