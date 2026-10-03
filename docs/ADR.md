# Architecture Decision Records — ShigotoForm

Git のコミット履歴（`git log`、2026-10-03 時点・HEAD `952c2ab`）から抽出したアーキテクチャ上の意思決定を記録する。日付はコミット日（JST）。
ADR-001〜012 は既存の `docs/ADR.md` の記述を引き継ぎ、コミットハッシュを `git cat-file` で実在確認した。ADR-013 以降は本ファイルで追記・更新している。`docs/ADR.md` は `afc786a` でコミット済み。
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
| 015 | main.ts / resume.ts を features/components に分割 | Superseded by ADR-021 |
| 016 | LP の CSS を外部ファイル（main.css + main.min.css）へ分離 | Accepted |
| 017 | AI エージェント向けインターフェース（WebMCP 宣言的アノテーション + llms.txt） | Accepted |
| 018 | Netlify 配信前提の HTTP ヘッダー定義（`public/_headers`、HSTS） | Accepted |
| 019 | インポート JSON の検証に Zod を導入 | Accepted |
| 020 | フォーム入力の検証に Zod を適用（随時表示 + プレビュー時ブロック） | Accepted |
| 021 | UI を React + react-bootstrap へ全面移行 | Accepted |
| 022 | ふりがな自動入力を @j1nn0/vanilla-autokana へ置き換え | Accepted |
| 023 | プレビューのフォントは swap で先に表示し、PDF 化はフォントの読み込み完了を待つ | Accepted |
| 024 | 学歴・職歴／免許・資格の行を、ドラッグ＆ドロップで並べ替え可能にする（@dnd-kit） | Accepted |

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
- 追補（2026-10-03, `b560cfd`）: Font Awesome の `font-display: block` を Lighthouse の「フォント表示」指摘への対策として `swap` に上書きするため、`src/icons-font.css`（`fa-regular-400.woff2` のみ対象の後勝ち `@font-face`）を新設。`lazyLoadIcons()` は `all.min.css` → `icons-font.css` の順で import し、`document.fonts.load()` 完了後に `icons-loaded` を付与する。`icons-font.css` は `all.min.css` より後に読み込む順序依存があり、使用中の `fa-regular` 以外のウェイトは対象外。コミットメッセージの接頭辞は `docs:` だが実体はコード変更。

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
- `afc786a` 以前の `docs/ADR.md` は ADR-013 を「Bun.WebView 採用（未コミット）」の Accepted としており HEAD と乖離していたが、`afc786a` で Superseded に更新済み（現行の `docs/ADR.md` は本ファイルと同じ ADR-014/015 を含む）。
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

- **Status**: Superseded by ADR-021（文字列 HTML・`setup*()`・`escapeHtml()`・`MutationObserver` による構成は React へ置き換え。`features/` は UI に依存しないロジック、`components/` は React コンポーネントに役割を変えた）
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

## ADR-016: LP の CSS を `<style>` インラインから外部ファイル（`main.css` + `main.min.css`）へ分離

- **Status**: Accepted
- **Date**: 2026-10-03（`0ca9944`, `17db077`）

### Context

- `docs/index.html` は `<style>` に約 5 KB の minify 済み CSS を 1 行で埋め込んでおり、保守時に差分が読めない状態だった（`0ca9944` の diff で確認）。
- Speculative: 可読性・差分管理の改善と、HTML 本体の軽量化が動機と推測される。コミットメッセージに理由の記載はない。

### Decision

- 可読なソース `docs/main.css`（320 行）と、その minify 版 `docs/main.min.css`（1 行）を追加し、`index.html` は `<link rel="stylesheet" href="main.min.css">` で参照（`0ca9944`）。既存の `main.js` / `main.min.js` と同じ「ソース + minify 版を両方コミット」の方式に揃えた。
- LP はビルド工程を持たない方針を維持（`docs/DESIGN.md` は「CSS ライブラリ・Web フォント不使用、CSS は `main.css` に集約」へ更新、`17db077`）。ADR-011 の LP 仕様はこの構成を前提とする。

### Consequences

- LP のスタイルが別リクエストになるため、初回描画に CSS 取得が加わる（Speculative: 静的ホスティングの小ファイルなので影響は小さいと推測。未計測）。
- `main.css` 編集後に `main.min.css` を手動で再生成する運用が必要。minify の手順・自動化は本調査では確認できず（未確認）。ソースと minify 版の乖離リスクがある。
- 同コミットで LP のクイックスタート（`docker compose up prod`）と技術スタック表示（Bun / Vitest + Playwright E2E / Docker・nginx）を現状に合わせて更新。`DESIGN.md` の既知不整合のうち「Playwright E2E 表記が古い」は解消済み。

---

## ADR-017: AI エージェント向けインターフェースとして WebMCP 宣言的アノテーションと `llms.txt` を導入

- **Status**: Accepted
- **Date**: 2026-10-03（`833664b` アノテーション実装、`3c94c74` / `33e4ee2` `llms.txt`、`952c2ab` README）

### Context

- 履歴書フォームを AI エージェントが確実に識別・入力できるようにする必要があった。コミットメッセージ（`33e4ee2`）は「improve form accessibility for AI agents」と記載。
- Speculative: Lighthouse の WebMCP 監査（README に `WebMCP 4/4` バッジを掲載、`952c2ab`）の通過が直接の動機と推測される。

### Decision

- `src/components/resume-form.ts` の `<form>` に `toolname="fill-resume-basic-info"` / `tooldescription`、各入力に `toolparamdescription` を付与（WebMCP の宣言的アノテーション）。実装は ADR-015 の分割コミット `833664b` に含まれるが、同コミットのメッセージには記載がなく、文書化は 2026-10-03 の `33e4ee2` / `952c2ab` で行われた。動的に追加される学歴・職歴／資格行にも同アノテーションを付ける（README 記載）。
- アプリ向けに `public/llms.txt`（`3c94c74` 新設、`33e4ee2` で WebMCP 追記）を追加し、ビルド成果物のルートで配信する。LP 向けには別途 `docs/llms.txt` を更新（`33e4ee2`）。2 ファイルは用途（アプリ／LP）が異なる。
- LP（`docs/index.html`）に WebMCP 対応の訴求カードと技術スタック項目を追加（`33e4ee2`）。

### Consequences

- 外部ネットワーク通信を追加しない（ADR-001 を維持）。宣言的アノテーションは HTML 属性のみで、README も「データはどこにも送信されない」と明記している。
- WebMCP は実験的機能（README: Microsoft Edge で `edge://flags` から有効化）であり、仕様・対応ブラウザの変動リスクがある。
- フォーム項目を追加・変更する際は `toolparamdescription` の更新が必要になる保守負荷が生じる（Speculative: 規約として `AGENTS.md` には未記載。記載の有無は未確認の項目として残る）。
- `llms.txt` が `docs/ADR.md` 等を参照しているため、文書構成を変えるとリンク切れの恐れがある。

---

## ADR-018: Netlify 配信前提の HTTP ヘッダー定義（`public/_headers`、HSTS）

- **Status**: Accepted
- **Date**: 2026-10-03（`3c94c74`、`952c2ab` README 反映）

### Context

- アプリ本体の公開先は `https://shigotoform.netlify.app/`（`index.html` の OGP、README の Netlify バッジ）。ADR-005 の Docker/nginx 構成（`nginx.conf`）にはセキュリティ関連ヘッダーの設定がない（HEAD で確認）。
- Speculative: Lighthouse の Best Practices（README のスコアが 96 → 100 に更新）での HSTS 指摘解消が動機と推測される。コミットメッセージの記載は「improved security」のみ。

### Decision

- `public/_headers` を追加し、全パスに `Strict-Transport-Security: max-age=31536000; includeSubDomains` を付与（`3c94c74`）。`public/` 配下のため Vite ビルドで `dist/` にコピーされる（`public/` が静的資産ディレクトリである点は Vite の既定動作に依拠、`vite.config.js` に `publicDir` 指定なしを確認）。
- README に「Hosting: Netlify」「HTTPS enforced」を明記（`952c2ab`）。

### Consequences

- `_headers` は Netlify（互換ホスティング）固有の形式であり、Docker/nginx 配信（ADR-005）には適用されない。両経路でヘッダー設定が非対称になる。nginx 側への HSTS 追加は未実施。
- `includeSubDomains` を含むため、ドメインのサブドメインが HTTP のみで運用される場合に影響する（Speculative: 現行運用でのサブドメイン利用有無は未確認）。
- CSP などその他のセキュリティヘッダーは未設定（`_headers` は 2 行のみ）。

---

## ADR-019: インポート JSON の検証に Zod を導入

- **Status**: Accepted
- **Date**: 2026-10-03（`20531e2` 依存追加、`09896e0` 実装、`ed615b5` テスト）

### Context

- インポート処理（`features/backup.ts`）は `JSON.parse` の結果を検証なしで `jsonToFormResume()` に渡し、そのまま `saveResume()` で IndexedDB に保存していた。JSON 構文エラーは未捕捉で、型が壊れたデータも保存され得た。
- 受け入れる入力は現行エクスポート形式に加え、旧フラット形式（`career` / `license` が直下、`startDate` / `endDate`、`resume` 欠落）や他ツール出力（`ResumeJson` のコメント記載）。
- Speculative: 動機はユーザー要望（Zod によるバリデーション対応）。破損ファイルによる保存データ汚染の防止が狙いと推測される。

### Decision

- 依存に `zod`（4.x）を追加し、`src/models/resume-schema.ts` にスキーマと `parseResumeJson()` を配置。
- スキーマは型の検証に限定し（日付・郵便番号等の書式は検証しない）、旧形式を受理して `ResumeJson` へ正規化する（欠落文字列は `''`、`pass` は `'合格'`、`startDate` / `endDate` は `start` / `end` へ、直下の `career` / `license` は `resume` 配下へ）。未知のキーは `z.looseObject` で保持。
- 失敗時は全問題を `errors: string[]`（`パス: 理由`）で返す。日本語化は `safeParse` ごとに `zod/locales` の `ja` を渡す方式とし、グローバルな `z.config()` は使わない（モジュール先頭の副作用を避ける規約に合わせる）。
- `backup.ts` は JSON 構文エラーと検証エラーをトースト（`error`）で通知し、フォームと IndexedDB を変更せず中断する。検証エラーは最大 5 件を箇条書きし、超過分は「…他N件」に集約。複数行表示のため `.sf-toast` に `white-space: pre-line` を追加。
- テスト: unit（`tests/unit/models/resume-schema.test.ts`）と E2E（`tests/e2e/app.test.ts` のインポート検証）を追加。

### Consequences

- 外部通信は追加せず、ADR-001 を維持。ランタイム依存が 1 つ増え、バンドルサイズが増加する（未計測）。
- 型は `db.ts` / `models/Resume.ts` の手書き interface のままで、スキーマから導出していない。`ResumeJson` / `Career` / `License` の変更時はスキーマも更新が必要（二重管理）。
- 検証対象はインポート経路のみ。IndexedDB 読み出し（`loadResume`）には適用していない。フォーム入力の検証は別スキーマで ADR-020 が扱う。
- 書式（日付・郵便番号等）は未検証のため、型が正しければ内容が不正でも受理される。
- 旧形式を保存前に正規化するため、インポート後の保存形式は旧形式のままではなく `resume` 配下の形になる。

---

## ADR-020: フォーム入力の検証に Zod を適用（随時表示 + プレビュー時ブロック）

- **Status**: Accepted
- **Date**: 2026-10-03（コミット前。ハッシュは未確定）

### Context

- 入力欄には HTML の `required` / `pattern` が付いているが、`<form>` に submit 処理がなく `checkValidity()` も呼ばれないため強制されない。必須項目が空でもプレビュー・エクスポート・PDF が通り、`pattern` 違反の見た目のフィードバックもなかった（コードと既存 E2E で確認）。
- Speculative: 動機はユーザー要望（Zod の採用、随時表示、プレビュー時の警告とブロック）。

### Decision

- `src/models/resume-form-schema.ts` に欄ごとの Zod 規則を定義（必須: 年月日・ふりがな・氏名・生年月日・郵便番号・住所。書式のみ: 電話番号 1・2、メール 1。それ以外と職歴・資格行は検証しない）。インポート用の寛容なスキーマ（ADR-019）とは別にした。メッセージは欄ごとの日本語（`ja` ロケールは正規表現を表示するため使わない）。
- 正規表現のソースは `FIELD_PATTERNS` に一本化し、`components/resume-form.ts` の `pattern` 属性が同じ定数を埋め込む。Zod 側は `^(?:…)$` で全体一致にする。E2E の `patternMismatch` と unit の Zod 検証が同じ表（`tests/field-cases.ts`）を使い、乖離を CI で検出する。
- `features/form-validation.ts` で表示を担当。
  - `<form>` への委譲リスナー 1 つで、離脱・確定時に検証する。エラー表示中の欄だけ入力ごとに再検証する（IME 変換中を除く）。
  - 表示が変わるときだけ DOM を更新する（Bootstrap の `is-invalid` / `.invalid-feedback`、`aria-invalid`、`aria-describedby`）。
  - 復元・インポート・削除後は `refreshFormValidation()` で追従する。
- 「履歴書を表示」は `validateFormWithWarning()` でエラーがあれば警告トースト（`warn`）を出してブロックし、最初の不正欄へフォーカスする（メニュー offcanvas を閉じ、折りたたみ内なら展開してから）。PDF 出力はこのモーダルからのみ到達できる。エクスポートは警告のみで続行する（入力途中のバックアップを可能にするため。ユーザー判断）。自動保存は検証でブロックしない。
- `formatToastList()` を `toast.ts` に追加し、インポートエラーと共用。

### Consequences

- HTML 属性（`required` / `pattern`）と Zod の `required` 規則が二重管理になる。`pattern` は定数共有で乖離を防ぐが、`required` の対応は欄の追加時に手動で揃える（検証欄は `resumeFormFieldSchemas` と `FIELD_IDS` の 2 箇所）。
- 日付の妥当性（未来日・生年月日と作成日の前後など）、職歴・資格行の必須項目（日付だけ入力で名称が空など）は検証していない。未決定。
- バックアップ（エクスポート）はエラー付きのまま出力され得る。不正データは後でインポート時にも ADR-019 の寛容なスキーマで通る。
- ランタイムのバンドルサイズ・描画への影響は未計測。リスナーは 1 つで、検証は 1 欄分の短い文字列への正規表現のみ。
- 追記: 表示（`features/form-validation.ts` の DOM 操作）は ADR-021 の React 移行で `hooks/use-resume-form.ts` と `components/validated-input.tsx` に移った。規則・タイミング・ゲートの仕様は変わらない。

---

## ADR-021: UI を React + react-bootstrap へ全面移行

- **Status**: Accepted
- **Date**: 2026-10-03（`feat/react` ブランチ。コミット前でハッシュは未確定）

### Context

- UI は文字列 HTML（`*Html()`）・DOM 直接操作・`setup*()` によるイベント配線・`MutationObserver` による動的行へのリスナー付与で構成されていた。入力検証（ADR-020）の表示も DOM の `classList` / 属性を直接書き換える実装で、状態が DOM に分散していた。
- Speculative: 動機はユーザー要望（React の導入と全面移行、Bootstrap は react-bootstrap へ置換）。状態管理と描画の宣言化が狙いと推測される。

### Decision

- React 19 と react-bootstrap を導入し、`main.tsx` から `<App />` を `#app` へ描画する（`DOMContentLoaded` で初期化。Service Worker 登録は描画の外で先に行う）。Bootstrap の CSS は維持し、Bootstrap の JS（`data-bs-*`、`window.bootstrap`）は廃止した。
- 状態: フォーム値は `useResumeForm()`（reducer + 復元 + 自動保存 + 検証表示）に集約。動的行は安定した `id` を持つ配列で、保存・エクスポートの前に `toResume()` で `id` を除く。
- 自動保存はユーザー編集の後だけ行う（復元・インポート・削除の `replace()` では保存しない）。復元の完了前は保存しない。
- vanilla-autokana は制御コンポーネントと相容れない（配布版は id 文字列のみ受け付け、`value` へ直接書き込む）ため、`value` の setter を横取りする非表示の proxy input を介して state 更新に変換する（`hooks/use-autokana.ts`）。
- トースト・アプリ更新状態は、React の描画前にも通知が届くためモジュール内のストア（`useSyncExternalStore`）で持つ。`showToast()` の呼び出し形は維持。
- 履歴書プレビューは JSX で構築し、`escapeHtml()` と `dangerouslySetInnerHTML` を使わない。
- メニューをモーダルを開く・欄へフォーカスを移すために閉じるときは、トグルボタンへのフォーカス復帰を無効にする（`restoreFocus`。有効のままだと復帰が後から走ってフォーカスを奪う）。
- vanilla-autokana のタイマーによる同値の書き込み（氏名が空でも 30ms ごと）は、値が変わらなければ state 更新・保存をしない（`setField()` と proxy の setter）。
- メニュー（offcanvas）は `renderStaticNode` で閉じていても DOM に残し、E2E と `aria-controls` の参照先を保つ。モーダルは閉じている間は DOM に無いため、モーダルのトリガーの `aria-controls` は外した（`aria-haspopup="dialog"` は維持。ユーザー判断）。
- 副次的な変更: モーダルを開く操作（ヘルプ・プレビュー・削除）ではメニューを先に閉じる（react-bootstrap の focus trap の競合を避けるため）。`<div role="main">` / `role="group"` は `<main>` / `<fieldset>` に変更（Biome の a11y ルール）。ナビバーのブランドと更新リンクの `href="#"` は、`#app` へのリンクとボタンに変更。年齢は自動保存時に生年月日から計算して保存する（従来は他の編集で 0 に戻っていた）。
- ツール: `@vitejs/plugin-react`、`tsconfig` の `jsx: react-jsx`、vitest の各 project に React plugin、E2E project の `optimizeDeps.include`（React の二重読み込み対策）。テストは React Testing Library を追加。

### Consequences

- バンドルが増えた: ビルドの index JS は 1,277.71 kB（gzip 369.50 kB）から 1,433.72 kB（gzip 420.18 kB）になり、gzip で約 +50.7 kB（+13.7%）。React / ReactDOM / react-bootstrap の追加が Bootstrap JS の削除を上回った。Lighthouse などの実測は未実施。コード分割（`React.lazy` でプレビューモーダルと html2pdf を遅延読み込みするなど）は未着手で、初期表示の軽量化の余地がある。
- ARIA の契約が一部変わった（モーダルのトリガーの `aria-controls` 廃止、メニュー・モーダルの DOM 構造の差）。`id` は react-bootstrap の `Modal` では `.modal-dialog` に付き、`show` は外側の `.modal` が持つ。
- E2E は DOM の id・クラスを契約として維持できたが、React の値追跡（ネイティブ setter が必要）と非同期の状態更新に合わせてテストのヘルパーと待機を変えた。
- 閉じたメニュー内の要素が DOM に残るため、開閉の遷移中は一時的に同じ id の要素が 2 つ存在する（遷移完了後は 1 つ）。
- `ResumeJson` / `Career` / `License` の手書き型とスキーマの二重管理は ADR-019 のまま。
- 状態更新は非同期で描画される。DOM を直接参照するコード（フォーカス移動など）は、メニューの `onExited` やアコーディオンの `onEntered` を待つ必要がある（`<App />` の `afterMenuClosed` / `afterContactOpened`）。

---

## ADR-022: ふりがな自動入力を @j1nn0/vanilla-autokana へ置き換え

- **Status**: Accepted（ADR-021 の vanilla-autokana と proxy input に関する記述を置き換える）
- **Date**: 2026-10-03（`feat/replace-autokana` ブランチ。コミット前でハッシュは未確定）

### Context

- ADR-021 では、vanilla-autokana（1.3.0、2021-05 が最終リリース。リポジトリの master には Element 対応があるが npm の配布物は古い）を使うため、id 文字列でのバインド、DOM に置く非表示の proxy input、30ms ごとのタイマー書き込みの抑止、といった回避策が必要だった。
- ユーザー要望: React 向けの適切なふりがなライブラリがあれば差し替える。

### 検討した候補（npm / GitHub API で 2026-10-03 に確認）

| 候補 | 評価 |
|---|---|
| `vanilla-autokana`（現行） | 週 25,142 DL。2021 以降リリースなし。配布版は id 文字列のみ・タイマー監視・`value` 直接書き込み |
| `react-use-kana` 2.4.0 | React のフック（週 11,928 DL、npm の最終リリースは 2022-03）。ただし state を内部に持ち、氏名の変更履歴だけから導出する。復元済みのふりがなの続きや手入力を引き継げず、現行の挙動より後退する |
| `react-auto-kana` | 2015 年のまま。対象外 |
| `@j1nn0/vanilla-autokana` 3.0.1 | vanilla-autokana のフォーク（2026-08 に v3）。Element を受け付け、タイマーではなく入力・IME（composition）イベントで追跡し、`onChange` と `destroy()` を持ち、型を同梱。React 専用ではない。週 20 DL・スター 0・単独メンテナ |

### Decision

- 挙動を保てる `@j1nn0/vanilla-autokana` を採用し、`vanilla-autokana` を削除した。React 専用ライブラリは、既存のふりがなの続き入力を保てないため採用しなかった。
- `hooks/use-autokana.ts` は氏名・ふりがなの入力欄にバインドし、`onChange` を `setField('fullnameKana', …)` に渡す（proxy input、id 文字列、タイマー起因の同値書き込み対策は不要になった）。`destroy()` を effect のクリーンアップで呼ぶ。
- ライブラリは氏名欄への任意の `input` イベント（ブラウザの自動入力、プログラムによる変更）にも反応するため、氏名欄にフォーカスがあるときだけ `onChange` を state へ反映する（ユーザーが入力したふりがなを上書きしないため）。

### Consequences

- 挙動の差: 氏名が空のままフォーカスして入力を始めると、ふりがな欄の既存の内容を起点にせず最初から作り直す（氏名が入っているときは続きから入力する）。従来は常に続きから入力していた。
- 採用実績が少ない単独メンテナのパッケージを依存に加えた。配布物（9.7 kB、ネットワーク通信なし）は 3.0.1 の時点で確認したが、更新時は差分の確認が必要。`bun audit` は問題なし。Takumi Guard によるマルウェアスキャンは CI で実行される。
- 追従しづらい場合は、`vanilla-autokana` + proxy 方式（ADR-021）へ戻せる。
- E2E: IME（composition）で漢字へ変換しても読みが残ること、既存の氏名・ふりがなの続きとして入力できること、自動入力ではふりがなを上書きしないことを追加で検証した。

---

## ADR-023: プレビューのフォントは swap で先に表示し、PDF 化はフォントの読み込み完了を待つ

- **Status**: Accepted（ADR-004 の遅延読み込み・swap 方針を、描画完了まで拡張する）
- **Date**: 2026-10-03（`feat/pdf-font-wait` ブランチ。コミット前でハッシュは未確定）

### Context

- ユーザー要望: フォント表示を swap で、描画が完了するまでを最適化する。
- 現状の確認（ビルド成果物）: Noto Sans/Serif JP（`@fontsource`）は 124 の unicode-range 分割ですべて `font-display: swap`。Font Awesome の `all.min.css` は 10 個の `@font-face` がすべて `block` だが、使っているのは `fa-regular` の 1 面のみで、これは `icons-font.css` が `swap` で上書き済み（ADR-004 / Lighthouse 対策）。つまり表示（swap）自体は既に満たしていた。
- 残っていた問題: `lazyLoadNotoFonts()` が完了するのは CSS の読み込みであって、フォントファイルではない。swap のためプレビューは代替フォントで先に出て後から差し替わるが、PDF 化（html2canvas）は読み込み完了を待たずに実行され、代替フォントで撮られ得た。

### Decision

- `waitForPreviewFonts(fontType, text)` を追加（`features/lazy-assets.ts`）。`document.fonts.load('400 1em "<family>"', text)` で、実際に表示している文字列に必要な unicode-range の分割だけを読み込み、完了まで待つ。上限 5 秒を超えたら待たずに続行し（オフライン等）、失敗は握りつぶす。`document.fonts` が無い環境では待たない。
- `<ResumeModal />` は、表示と同時に（表示を待たせず）この読み込みを開始し、PDF ダウンロードの直前にも完了を待つ。表示は従来どおり swap で先に出る。

### Consequences

- PDF が代替フォントで出力されることを防ぐ。通常は表示から操作までの間に読み込みが終わるため、ダウンロードは待たされない。
- 書体を切り替えると、その書体の読み込みを改めて始める。
- 未実施: 実ブラウザでのフォント差し替えの見た目と、PDF の出力フォントの目視確認。Font Awesome の未使用の `block` 面（`fa-solid` 等）は使っていないため要求されず、上書きもしていない（使う場合は同様に `swap` で上書きが必要）。

---

## ADR-024: 学歴・職歴／免許・資格の行を、ドラッグ＆ドロップで並べ替え可能にする（@dnd-kit）

- **Status**: Accepted
- **Date**: 2026-10-03（`feat/reorder-rows` ブランチ。コミット前でハッシュは未確定）

### Context

- ユーザー要望: 「学歴・職歴」と「免許・資格」の各項目の右端にハンドルアイコンを付け、上下の順番をドラッグ＆ドロップで変更可能にする。データの順番も変更する。
- 履歴書は時系列が重要で、追加済みの行の途中へ差し込みたい場面が多いが、これまでは削除して入れ直すしかなかった。
- 制約: PWA でスマホでも使う（タッチ操作が必須）。キーボード操作・スクリーンリーダーにも対応したい（アクセシビリティ評価ツールで検証している）。

### Decision

- ライブラリは `@dnd-kit/core` / `@dnd-kit/sortable` / `@dnd-kit/utilities`（安定版）を採用する。HTML5 の Drag and Drop API は、タッチ端末で動かず、キーボード操作もないため採用しない。ポインタ操作を自前で実装する案は、並べ替えアニメーション・自動スクロール・読み上げまで含めると保守が重いため採用しない。
- `components/sortable-list.tsx` の `<SortableList />`（DndContext。ポインタ + キーボードのセンサー、縦方向のみの移動、日本語の読み上げ文）と `<SortableRow />`（Card + 右端のハンドル）に集約し、`career-row.tsx` / `license-row.tsx` は `<SortableRow />` を使う。
- ドラッグを始められるのはハンドルのボタンだけにする（入力欄の文字選択などと干渉しない）。キーボードは、ハンドルにフォーカス → Space で持ち上げ → ↑↓ で移動 → Space で確定、Esc で取り消し。
- データの順序は state（`FormState.career` / `license`）が正本。reducer に `move-career` / `move-license`（`activeId` の行を `overId` の位置へ）を追加し、`edit()` 経由で自動保存の対象にする。保存・エクスポート・プレビュー・PDF は state の順序をそのまま使う（並べ替えの処理は他に無い）。同じ行・存在しない id では同じ state を返し、再描画と保存を起こさない。
- ハンドルのアイコンは、インライン SVG（`aria-hidden`）にする。Font Awesome の `fa-solid`（grip）は、遅延読み込みと swap の上書きが必要な別の書体面を増やす（ADR-023）ため使わない。
- 学歴・職歴の行は狭い画面で横に溢れており（ページが横スクロールし、右端の削除ボタンとハンドルが画面外になる）、右端のハンドルに届かないため、`md` 未満では折り返し、会社・学校名 / 役職・学科 / 説明を縦に並べる。`md` 以上は従来どおり 1 行。

### Consequences

- 依存が 3 パッケージ増え、本体 JS は約 +15 kB（gzip）。`bun audit` は問題なし。
- 一覧のコンテキストごとに読み上げ用の隠し要素（説明文・ライブリージョン）が DOM に追加される。
- E2E は実ブラウザで、キーボード（確定・Esc 取り消し）とポインタ操作（ドラッグ）を検証している。ポインタ操作は、実際のマウスではなく `PointerEvent` を段階的に送って再現している。
- 未実施: 実機のタッチ操作・スクリーンリーダー（NVDA / VoiceOver）での読み上げの確認。狭い画面でのスクロール中のドラッグの感触。

---

## Appendix: 決定に至っていない／継続検討中の論点

- **TypeScript 7 系**: `docs/ADR.md` 付録は「5.9.3 に留め 7.x は再検討」としているが、現在の `package.json` は `typescript ~7.0.2`。付録の記述は陳腐化している（移行時期・理由を示すコミット/ADR は未確認）。
- **顔写真添付機能**: 既存 `docs/ADR.md` は LP の「近日対応予定」文言を根拠に未決定としている。本ファイル作成時に LP 側の再確認はしていない（未検証）。
- **`minimumReleaseAge` 相当の防御**: ADR-012 で失われたまま。代替策は未決定。
- **`.npmrc` の扱い**: bun 移行後も残存。有効性は未検証。
