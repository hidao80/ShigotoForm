# Architecture Decision Records — ShigotoForm

Git のコミット履歴（`git log`、2026-10-03 時点・HEAD `7f576d5`）から抽出したアーキテクチャ上の意思決定を記録する。日付はコミット日（JST）。
ADR-001〜012 は既存の `docs/ADR.md` の記述を引き継ぎ、コミットハッシュを `git cat-file` で実在確認した。ADR-013 以降は本ファイルで追記・更新している。
コミットメッセージに理由が書かれていない箇所は **Speculative** と明記する。

| ADR | 概要 | Status |
|---|---|---|
| 001 | クライアントサイド完結型 PWA | Accepted |
| 002 | Vite + TypeScript | Accepted |
| 003 | CDN → npm パッケージ | Accepted |
| 004 | フォント/アイコン遅延読み込み | Accepted |
| 005 | Docker + nginx 配信 | Accepted |
| 006 | GitHub Actions CI | Accepted |
| 007 | pnpm 統一 + overrides | Superseded by ADR-012 |
| 008 | Biome 統一 | Accepted |
| 009 | Playwright E2E | Superseded by ADR-013 |
| 010 | AGENTS.md を正本化 | Accepted |
| 011 | LP の OGP / JSON-LD | Accepted |
| 012 | pnpm → bun | Accepted |
| 013 | E2E を Bun.WebView へ | Superseded by ADR-014 |
| 014 | テスト基盤を Vitest（unit + Browser Mode）へ | Accepted |
| 015 | main.ts / resume.ts を features/components に分割 | Accepted |

---

## ADR-001: クライアントサイド完結型 PWA として構築（バックエンドを持たない）

- **Status**: Accepted
- **Date**: 2025-06-09（`45b5f3a` プレビュー/PDF 出力）、2025-08-11（`9dd032a`, `0d47a50`, `80d7fd8` PWA 化）〜継続中

### Context

履歴書という機微な個人情報を扱うツール。サーバー送信を前提にすると、情報漏えいリスクとホスティングコストの両方を抱える。

### Decision

サーバー・API を一切持たず、全データを IndexedDB（Dexie ラッパー経由）にブラウザ内保存する構成を採用。`src/db.ts` が唯一の永続化層。Vite の PWA 機能（`vite-plugin-pwa` / Workbox）でオフライン動作に対応。

### Consequences

- 個人情報が外部に送信されない設計をアーキテクチャレベルで保証できる（`docs/index.html` の LP でも訴求ポイントに採用）。
- 反面、複数デバイス間の同期は持てない。JSON エクスポート/インポートで代替。
- ホスティングは静的配信のみで済み、ADR-005 の Docker/nginx 構成もこの前提の上に成立する。
- Service Worker の更新は `waiting` 状態をユーザー操作で適用する方式（`src/features/pwa-update.ts`）。

---

## ADR-002: フロントエンド技術スタックとして Vite + TypeScript を採用

- **Status**: Accepted
- **Date**: プロジェクト初期（`f98713b`〜）

### Context

ビルドツールと型付けの選定。SPA フレームワーク（React/Vue 等）を使わず、DOM 直接操作 + Vite のバンドリングという軽量構成にする必要があった。

### Decision

Vite をビルド/開発サーバーとして採用し、TypeScript で型安全性を確保。`src/main.ts` を単一エントリポイントとし、`index.html` からは直接モジュールを読み込まない方針とした。TypeScript は現在 `~7.0.2`、Vite は `^8.2.2`（`package.json`）。

### Consequences

- ビルドは `tsc && vite build` の二段構成となり、型エラーとバンドルエラーを分離して検知できる。
- フレームワークを持たない分、DOM 操作コードと状態管理を手動で書く必要がある（ADR-015 で責務分割）。

---

## ADR-003: CDN 読み込みから npm パッケージ管理への移行

- **Status**: Accepted
- **Date**: 2025-08-11（`98ccccc`）

### Context

Bootstrap や FontAwesome 等を CDN の `<script>`/`<link>` で読み込んでいたが、バージョン固定・オフライン動作（PWA 化）・ビルド時最適化との相性が悪い。

### Decision

CDN 依存を廃止し、`bootstrap` / `@fortawesome/fontawesome-free` / `@fontsource/*` を npm パッケージとしてバンドルする方式に統一。

### Consequences

- Service Worker によるオフライン対応（ADR-001）と整合する。
- バンドルサイズ増につながるため、後続でフォント/アイコンの遅延読み込み最適化（ADR-004）が必要になった。

---

## ADR-004: フォント/アイコンの遅延読み込みによるパフォーマンス最適化

- **Status**: Accepted
- **Date**: 2025-08-11（`665824f`, `9da581e`）、2025-08-12（`d1af597`）

### Context

Noto フォント（和文）と FontAwesome をバンドルに含めた結果、初期ロードが重くなり Lighthouse スコアに影響。

### Decision

`requestIdleCallback` による Noto フォントの遅延読み込み、ヘルプボタン hover / オフキャンバスメニュー展開時の FontAwesome 遅延読み込みを実装（現在は `src/features/lazy-assets.ts`）。ロード完了後に `fonts-loaded` / `icons-loaded` クラスを `<html>` に付与し CSS 側で切り替える。

### Consequences

- Lighthouse パフォーマンススコアの改善（README にスコア記載）。
- CSS 側は `.fonts-loaded` / `.icons-loaded` クラスに依存した切り替えが必須になり、CSS 変更時の制約として `AGENTS.md` に明文化されている。

---

## ADR-005: Docker + nginx による本番配信構成の追加

- **Status**: Accepted
- **Date**: 2026-01-17（`973a9b4`）〜 2026-07-09（`3a2c8e1`, `4523381`）、2026-03-05（`db88c1e`, `2e31c70`）

### Context

静的サイトのデプロイ手段として、環境非依存のコンテナ化が求められた。

### Decision

`Dockerfile` / `docker-compose.yml` / `nginx.conf` を追加。マルチステージ（ビルドステージ + `nginx:alpine` の 80 番ポート配信）。ベースイメージは当初 `node:24-alpine`、ADR-012 で `oven/bun:1-alpine` に変更。

### Consequences

- Docker イメージタグの大文字小文字問題（`db88c1e`）や `.dockerignore` からの誤ったファイル除外（`2e31c70`）など、コンテナ化特有の不具合対応が発生した。
- `dist/` はビルド生成物として明確に「手動編集禁止」の運用ルールが `AGENTS.md` に明文化されている。

---

## ADR-006: GitHub Actions による CI/CD パイプラインの整備

- **Status**: Accepted
- **Date**: 2026-01-17（`2adab25`, `3046787`）〜 2026-03-05（`ebbea71`, `402ec0c`）〜 2026-07-09（`3fdece9`）〜 2026-10-03（`497c0ff`）

### Context

lint・ビルド・依存監査・テストを手動実行に頼ると、品質担保が属人化する。

### Decision

`.github/workflows/` に lint / build / audit / test の 4 ワークフローを整備。ビルドのランナーは `ubuntu-slim` → 標準ランナーへ変更（`402ec0c`）。Actions のバージョンは更新を継続（`3fdece9`, `497c0ff`）し、2026-09-05 に Dependabot の GitHub Actions 更新を設定（`a7a4e37`）。

### Consequences

- README にビルド/テストバッジを掲載し、CI 状態を可視化。
- 依存監査（`audit.yml`）が脆弱性管理の運用基盤になった（ADR-007 / 012 関連）。
- Speculative: Actions を SHA 固定 + Dependabot で追随する運用（`test.yml` は SHA ピン留め）は、サプライチェーン対策の意図と推測される。

---

## ADR-007: パッケージマネージャを pnpm に統一し、workspace overrides で推移的依存を管理

- **Status**: Superseded by ADR-012
- **Date**: 2026-01-17（`7edbb24`）〜 2026-03-05（`ebbea71`）〜 2026-07-09（`a838ef6`, `d1b0dbe`, `2c8e3b3`）

### Context

`vite-plugin-pwa` → `workbox-build` 配下の推移的依存（`fast-uri`, `brace-expansion` 等）に `pnpm audit` で検出される脆弱性が周期的に発生する。直接の依存アップデートでは解決できない階層にある。

### Decision

pnpm を正式採用し、`pnpm-workspace.yaml` の `overrides` で脆弱パッケージをパッチ版へ固定。`allowBuilds` でビルドスクリプト許可対象を限定し、`minimumReleaseAge` 系の設定で新しすぎるリリースの採用を抑止（`ddfba73` で npm 側にも ignore-scripts / release age 設定を追加）。

### Consequences

- 監査結果が変わるたびに overrides を追随更新する継続的なメンテナンスが発生する。
- `package.json` 側の `pnpm.overrides` は新しい pnpm では読まれず、`pnpm-workspace.yaml` に一本化する必要があった。

---

## ADR-008: リンタを Biome に統一（ESLint / Prettier は不採用）

- **Status**: Accepted
- **Date**: 2026-02-19（`f297af1`）以降 v2 系へ更新継続（現在 `^2.5.12`）、2026-08-14（`48fcf58` スキーマ更新）

### Context

Lint とフォーマットを別ツール（ESLint + Prettier）で運用すると設定の二重管理・実行速度のコストが発生する。

### Decision

Biome 単体で lint・format・import 整理を担う構成に統一。`biome.json` で `noExplicitAny: warn` 等プロジェクト固有ルールを定義。対象は `src/` に加え、ADR-014 以降 `tests/` と `vitest.config.ts` も含む（`28a2668`）。

### Consequences

- Biome 2.x 系メジャーアップデート時に `biome migrate --write` でスキーマ移行が必要（`files.ignore` → `files.includes` 等）。
- Biome 2.x の `noImportantStyles` は、アクセシビリティ目的の意図的な `!important`（`resume.css` の reduced-motion / focus-visible）と衝突するため off にする判断を行った（既存 `docs/ADR.md` の記述を引用）。

---

## ADR-009: E2E テストに Playwright を採用

- **Status**: Superseded by ADR-013
- **Date**: 2026-03-05（`ebbea71`）

### Context

E2E テストとマルチビューポートのスクリーンショット取得の手段が必要だった。

### Decision

`playwright.config.ts` を追加し、複数ビューポート（fhd / mobile / tablet）でのスクリーンショット取得を含む E2E スイートを整備。`pnpm test` / `pnpm screenshot` として運用。

### Consequences

- ブラウザバイナリのバージョン依存があり、`@playwright/test` 更新のたびに `playwright install` が必要（手動ステップ）。
- この手動ステップが ADR-013 の動機と推測される（Speculative）。

---

## ADR-010: AI コーディングエージェント向けガイド文書の整備と統合

- **Status**: Accepted
- **Date**: 2025-08-11（`064a983`）〜 2026-02-19（`1c2ab04`）〜 2026-08-13（`2197a6f`, `85be351`）〜 2026-10-03（`a8c1e69`）

### Context

Claude Code / Codex など複数の AI コーディングツールを併用するため、ツールごとに重複したガイドを持つと更新漏れが発生する。

### Decision

`AGENTS.md` を正本とし、プロジェクト概要・コマンド・アーキテクチャ・コーディング規約・制約を集約。2026-10-03 の `a8c1e69` で `CLAUDE.md`（`@AGENTS.md` 参照のみ）も削除し、`AGENTS.md` のみに一本化した。

### Consequences

- ドキュメントの二重メンテナンスを回避できる。
- 過去に `ebbea71` で `AGENTS.md`/`CLAUDE.md` が一時削除され、後で復活した経緯がある。
- `AGENTS.md` は構造変更（ADR-014 / 015）のたびに更新が必要。

---

## ADR-011: LP（`docs/index.html`）への OGP / Twitter Card / JSON-LD 導入

- **Status**: Accepted
- **Date**: 2025-07-23（`5095bf7`）、2025-08-11（`556456c`）、2026-07-09（`df2c15d`, `431428c`）〜 2026-08-14（`1d2187b`）〜 2026-10-03（`5a957d1` DESIGN.md）

### Context

GitHub Pages で公開する LP のシェア時プレビューと検索エンジン向け構造化データが不足していた。

### Decision

`og:*` / `twitter:card`（summary_large_image）/ `schema.org` の `WebApplication` JSON-LD を追加。公開先は `https://hidao80.github.io/ShigotoForm/`。ソーシャル画像は GitHub raw URL から専用の `social-preview` 画像へ移行（`make-social-preview` スキル）。LP の仕様・ガイドラインは `docs/DESIGN.md` に文書化（`5a957d1`）。

### Consequences

- 画像 URL / サイズ指定の修正コミットが複数発生（`d87ccb4`, `aa2711a`, `a81eb4a`, `e0983e8`, `220c1b3`）。

---

## ADR-012: パッケージマネージャを pnpm から bun へ移行

- **Status**: Accepted
- **Date**: 2026-08-14（`c148765`, `d79d8a0`, `21937a0`, `35e9873`, `8ecac8a`, `b98014f`, `ebb0136`, `2ff46ab`, `4e14965`）、2026-08-16（`9929221`）

### Context

より高速なインストール・実行を持つ bun への切り替え。pnpm 固有機能（`allowBuilds` / バージョン範囲付き `overrides` / `minimumReleaseAgeExclude`）は bun にそのまま移植できない。理由はコミットメッセージに明記なし（速度は既存 `docs/ADR.md` の記述、Speculative）。

### Decision

- CI: `pnpm/setup` → `oven-sh/setup-bun`、コマンドを `bun install` / `bun run` / `bunx` に統一。
- `Dockerfile`: `oven/bun:1-alpine` に変更、`bun install --frozen-lockfile --ignore-scripts`（`9929221` でライフサイクルスクリプトをスキップ）。
- `pnpm-workspace.yaml` を削除し `package.json` に統合（`allowBuilds` → `trustedDependencies`、`overrides` はパッケージ名のみのキーへ単純化）。
- `pnpm-lock.yaml` → `bun.lock`。

### Consequences

- `minimumReleaseAge` 相当の防御層が失われた（bun に同等機能なし）。
- `overrides` のバージョン範囲指定が失われ、常に指定版へ強制される。
- `.npmrc` は残存（`ddfba73` 由来）。bun での扱いは未検証。

---

## ADR-013: E2E テストを Playwright から Bun.WebView（`bun:test`）へ置き換え

- **Status**: Superseded by ADR-014
- **Date**: 2026-10-03（`f924fdc`, `9aa2554`, `9c16f45`）

### Context

- bun 移行（ADR-012）後も E2E テストだけが `@playwright/test` と `playwright.config.ts` に依存していた。
- Speculative: ブラウザバイナリの手動導入（ADR-009 の Consequences）を減らし、ツールチェーンを bun に一本化する意図と推測される。コミットメッセージに理由の記載はない。

### Decision

- `playwright.config.ts` を削除（`f924fdc`）、`package.json` のテストスクリプトを `bun test` 系へ変更（`9aa2554`）。
- スクリーンショットテスト `tests/e2e/screenshot.spec.ts` を `bun:test` ベースへ書き換え（`9c16f45`）。

### Consequences

- 同日中に `b1a8f18` で当該スクリーンショットテストを削除し、`28a2668` で `@types/bun` と `bun test` 系スクリプトを撤去した。Bun.WebView 方式は定着せず、同日（2026-10-03）中に ADR-014 に置き換わった。
- 既存 `docs/ADR.md` の ADR-013 は「Bun.WebView 採用（未コミット）」のまま Accepted になっており、現状（HEAD）と乖離している。同ファイルは未コミットで編集中のため、本ファイルでは Superseded として扱う。
- Speculative: 撤回の理由（Bun 1.4 必須・experimental API・Windows での起動不具合など、`docs/ADR.md` 記載の懸念）は、コミットからは確認できない。

---

## ADR-014: テスト基盤を Vitest（unit: jsdom / E2E: Browser Mode + Playwright provider）へ統一

- **Status**: Accepted
- **Date**: 2026-10-03（`28a2668`, `d354b8f`, `633b18f`, `882566d`, `bf8e4ab`）

### Context

- ユニットテストの基盤がなく、E2E も ADR-013 の過渡的構成だった。
- Speculative: ユニット・E2E を単一のランナーで扱い、CI と開発環境を揃える意図と推測される。

### Decision

- `vitest.config.ts` に 2 つの project を定義（`d354b8f`）：
  - `unit`: `environment: 'jsdom'`、`tests/unit/**/*.test.ts`（IndexedDB は `fake-indexeddb`）。
  - `e2e`: Browser Mode（`@vitest/browser-playwright`、Chromium、headless）、`tests/e2e/**/*.test.ts`。IndexedDB がオリジン共有のため `fileParallelism: false`、`testTimeout` 30 秒。
- `package.json` のスクリプトを `vitest run`（`test` / `test:unit` / `test:e2e` / `screenshot`）に変更し、`lint` / `format` の対象に `tests/` と `vitest.config.ts` を追加（`28a2668`）。依存に `vitest` / `@vitest/browser-playwright` / `playwright` / `jsdom` / `fake-indexeddb` を追加、`@types/bun` を削除。
- テストスイートを追加（`633b18f`）：unit（db / models / resume / theme / components / features）と E2E（`app.test.ts`, `mount-app.ts`, `screenshot.test.ts`）。
- CI `test.yml` に `bunx playwright install --with-deps chromium` を追加（`882566d`）。`.vitest/` を `.gitignore` に追加（`bf8e4ab`）。

### Consequences

- Playwright のバイナリ導入が再び必要になった（ADR-009 / 013 で課題視された手動ステップが CI で明示ステップ化）。
- `tsconfig.json` のスコープに `tests/` が加わり、`bun run lint` が型検査をテストにも適用する（`d354b8f`）。
- 実ブラウザ E2E を `fileParallelism: false` で直列実行するため、テスト時間は増える（Speculative: 規模が小さい間は許容範囲と推測）。
- `AGENTS.md` のコマンド記述は `56bd9c1` で本構成に更新済み。

---

## ADR-015: `main.ts` / `resume.ts` を `features/` と `components/` に責務分割

- **Status**: Accepted
- **Date**: 2026-10-03（`833664b`）

### Context

- 分割前の `main.ts` は大規模（`833664b` で `main.ts` の変更行数が 826）で、アプリシェル HTML・イベント配線・PDF/バックアップ等を内包していたとみられる。`resume.ts` にも行の生成ロジックが同居していた（`createCareerRow` / `createLicenseRow` の抽出がコミットメッセージに明記）。
- Speculative: テスト容易性と保守性の確保（ADR-014 のテスト追加が直後のコミット）が動機と推測される。

### Decision

- `src/components/`: 静的マークアップ（`*Html()`）と行ファクトリ（`createCareerRow()` / `createLicenseRow()`）、`escapeHtml()`、`showToast()`、`generateResumeHtml()` を 1 ファイル 1 責務で配置。`app-shell.ts` が静的コンポーネントを合成。
- `src/features/`: 振る舞いモジュールを `setup*()` として公開（auto-save, age-display, backup, delete-content, preview-modal, pdf-download, help, accordion, pwa-update, lazy-assets, resume-json）。`main.ts` はシェル描画と `setup*()` の呼び出しに限定。
- データ変換は `features/resume-json.ts` に一元化（`jsonToFormResume()` / `formResumeToJson()`）。内部型 `Resume` と保存形式 `ResumeJson` を分離し、旧フラット形式も受理する後方互換を維持（`AGENTS.md` 記載）。
- アコーディオン初期表示のスタイルを `resume.css` に追加。

### Consequences

- ユーザー入力値の HTML 埋め込みは `escapeHtml()` 経由とする規約が `AGENTS.md` に明文化された。
- 動的行は `MutationObserver` がリスナーを自動付与するため、手動での二重登録を避ける運用制約がある。
- 構造変更に伴い `AGENTS.md` のアーキテクチャ節の更新が必要になる（`56bd9c1`）。

---

## Appendix: 決定に至っていない／継続検討中の論点

- **TypeScript 7 系**: `docs/ADR.md` 付録は「5.9.3 に留め 7.x は再検討」としているが、現在の `package.json` は `typescript ~7.0.2`。付録の記述は陳腐化している（移行時期・理由を示すコミット/ADR は未確認）。
- **顔写真添付機能**: 既存 `docs/ADR.md` は LP の「近日対応予定」文言を根拠に未決定としている。本ファイル作成時に LP 側の再確認はしていない（未検証）。
- **`minimumReleaseAge` 相当の防御**: ADR-012 で失われたまま。代替策は未決定。
- **`.npmrc` の扱い**: bun 移行後も残存。有効性は未検証。
