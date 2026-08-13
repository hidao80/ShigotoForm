# Architecture Decision Record（ADR）— ShigotoForm

Git のコミット履歴（`f98713b` 〜 `4523381`、2025-01-18 〜 2026-07-09、全85コミット）を根拠に、
プロジェクトの主要なアーキテクチャ判断を時系列に整理したもの。各項目には根拠コミットを付す。

---

## ADR-0001: クライアントサイド完結型 PWA として構築する（バックエンドを持たない）

- **Status**: Accepted
- **Date**: 2025-01-18
- **根拠コミット**: `f98713b`（first commit）

### Context
履歴書（履歴書フォーム）を作成させるツールで、個人情報という機微データを扱う。サーバーに送信せず、
ローカル完結で使わせたいという要求がある。

### Decision
サーバー/バックエンドを一切持たず、Vite + TypeScript の静的サイトとして構築する。初回コミットの時点で
`src/main.ts` / `src/resume.ts` / `src/models/Resume.ts` / `src/indolence.ts`（後の `db.ts`）という
「DOM操作」「データモデル」「永続化」を分離した構成が既に存在する。

### Consequences
- 個人情報がネットワークに出ないため、プライバシー上のリスクが小さい。
- 一方で複数端末間の同期・共有機能は原理的に持てない（エクスポート/インポートで代替、ADR-0002参照）。
- ホスティングは静的配信のみで足りる（後の ADR-0008 の Nginx 構成につながる）。

---

## ADR-0002: データ永続化に IndexedDB（Dexie）を採用し、自前ストレージ層を置き換える

- **Status**: Accepted
- **Date**: 2025-06-09
- **根拠コミット**: `45b5f3a`（Add resume preview display and PDF export functionality）

### Context
初期実装は `src/indolence.ts`（63行）という自作の永続化モジュールだった。プレビュー表示・PDF出力機能を
追加するタイミングで、より構造化されたデータ保存が必要になった。

### Decision
`indolence.ts` を削除し、`dexie` パッケージによる `src/db.ts`（IndexedDB ラッパー、75行）に置き換えた。
以後 `saveResume` / `loadResume` / `clearResume` という Dexie ベースの API が永続化の唯一の窓口になる。

### Consequences
- IndexedDB のスキーマ管理・トランザクションを自前実装せずに済む。
- フォーム用の `Resume` 型とストレージ用の `ResumeJson` 型という二重モデルが生まれ、変換ロジック
  （`jsonToFormResume` / `formResumeToJson`）が `main.ts` に集約される設計になった。

---

## ADR-0003: PDF 出力に html2pdf.js を採用する

- **Status**: Accepted
- **Date**: 2025-06-09
- **根拠コミット**: `45b5f3a`

### Context
履歴書を印刷可能な形式で書き出す要件があり、サーバーサイドレンダリングは使えない（ADR-0001）。

### Decision
クライアントサイドで完結する `html2pdf.js`（内部で html2canvas + jsPDF）を採用し、DOM のプレビューを
そのまま PDF 化する。型定義が存在しないため `src/types/html2pdf.d.ts` を自前で用意し、`@ts-ignore` で
運用する（意図的な例外として CLAUDE.md に明記）。

### Consequences
- 追加のビルドツールやサーバーを必要としない。
- 型安全性は一部犠牲になるが、影響範囲を型スタブファイルに限定して隔離している。
- `7edbb24`（2026-01-17）で html2pdf.js / jspdf のバージョンを pnpm workspace overrides で固定するなど、
  以後もサプライチェーン管理の対象になっている（ADR-0011）。

---

## ADR-0004: PWA 化に vite-plugin-pwa を採用し、オフライン動作を提供する

- **Status**: Accepted
- **Date**: 2025-08-11
- **根拠コミット**: `9dd032a`（Add PWA support using Vite features）, `0d47a50`, `80d7fd8`（Add/Make PWA work offline）,
  `524c430`（Chrome Speculation Rules API）, `ca67f6b`〜`9211c61`（Update toast の反復修正）

### Context
Vite プロジェクトに PWA を自前実装（Service Worker 手書き）するのはメンテナンスコストが高い。

### Decision
`vite-plugin-pwa` を導入し、`manifest.json` 生成・precache・`navigateFallback` などを設定ベースで管理する。
`clientsClaim: true` / `skipWaiting: true` を明示せず（後述 main.ts 側で `wb.messageSkipWaiting()` を使う
ユーザー主導のアップデートフローを採用、PWA Update Flow 参照）、SW が `waiting` 状態になったらメニューに
「新しいバージョンがあります」を表示しユーザーのクリックで反映する設計にした（この UI は `ca67f6b` までの
複数コミットで色・トースト表示を調整）。あわせて `index.html` に Chrome の Speculation Rules API
（`524c430`）でプリロードを追加し、体感速度を上げている。

### Consequences
- Service Worker のキャッシュ戦略をライブラリに委譲でき、独自バグの温床を減らせる。
- 一方でアップデート通知 UI・トーストの見た目調整に複数回の修正コミットを要しており（`:lipstick:` 系が
  8個連続）、SW のライフサイクル制御は経験的にハマりやすい箇所であることが読み取れる。

---

## ADR-0005: サードパーティ資産を CDN からバンドル npm パッケージへ移行する

- **Status**: Accepted
- **Date**: 2025-08-11
- **根拠コミット**: `98ccccc`（Replace CDN with npm package）

### Context
Font Awesome を `https://cdnjs.cloudflare.com/...` から動的 `<link>` 挿入で読み込んでいたが、
PWA のオフライン対応（ADR-0004）と相性が悪く、precache に外部 URL を列挙する必要があった。

### Decision
`@fortawesome/fontawesome-free` を npm 依存として追加し、`import '@fortawesome/fontawesome-free/css/all.min.css'`
でローカルバンドルに切り替えた。これにより `vite.config.js` の `additionalManifestEntries` から
CDN の外部 URL 参照を削除できた。

### Consequences
- オフライン時の外部ドメイン依存が消え、PWA としての信頼性が上がった。
- ビルド成果物のサイズは増えるが、Font Awesome は「ホバー時 / オフキャンバスメニュー展開時に遅延ロード」
  （`665824f` Lazy load fonts and icons）することでこのトレードオフを緩和している。
- Noto フォント類も同様に `@fontsource/*` パッケージとして管理され、`requestIdleCallback` で
  遅延ロードする方針が確立した（CLAUDE.md記載の Font Lazy-Loading）。

---

## ADR-0006: パッケージマネージャーに pnpm を採用し、workspace 設定でサプライチェーンを管理する

- **Status**: Accepted
- **Date**: 2026-01-17 〜 2026-07-09（継続的に強化）
- **根拠コミット**: `973a9b4`, `4b2c616`, `aefb08a`, `7edbb24`, `a838ef6`, `d1b0dbe`, `2c8e3b3`, `ddfba73`

### Context
npm ではなく pnpm を一貫して使用（`pnpm-lock.yaml` は初回コミットから存在）。CI（ADR-0009）や
Docker ビルド（ADR-0008）でも pnpm を前提とする。

### Decision
`pnpm-workspace.yaml` を単なるロックファイル補助ではなく、サプライチェーン統制の設定ファイルとして育てた：
- `allowBuilds`: postinstall スクリプトの実行を許可するパッケージをホワイトリスト化（`@biomejs/biome`,
  `@fortawesome/fontawesome-free`, `core-js`, `esbuild`）。
- `overrides`: `vite-plugin-pwa > workbox-build` 経由の脆弱な推移的依存（`@babel/core`, `brace-expansion`,
  `fast-uri`, `lodash`, `picomatch`, `serialize-javascript`）を `pnpm audit` の指摘に基づいて強制上書き。
- `minimumReleaseAgeExclude`: 特定バージョンを最小リリース経過期間ポリシーの例外にする。
- `.npmrc` に ignore-scripts と release age の設定を追加（`ddfba73`）。

### Consequences
- 依存パッケージの postinstall スクリプトを既定でブロックしつつ、必要なものだけ許可する
  最小権限方針になっている（サプライチェーン攻撃対策）。
- `pnpm-lock.yaml` の差分が大きいコミットが頻発するが、これは意図した挙動（脆弱性修正のたび lockfile が
  再生成されるため）。
- Dockerfile にも `pnpm-workspace.yaml` を明示的に COPY する必要があり、後述 `4523381` で修正されている
  （設定ファイルが増えるとビルドコンテキストの同期漏れが起きやすい典型例）。

---

## ADR-0007: Lint/Format に Biome を採用し、ESLint + Prettier は使わない

- **Status**: Accepted
- **Date**: 2026-02-19
- **根拠コミット**: `f297af1`（update linting process and add biome configuration）

### Context
TypeScript プロジェクトの標準的な選択肢は ESLint + Prettier だが、設定ファイルが分散し依存も増える。

### Decision
`biome.json` を追加し、`pnpm lint` は `biome check src/ && tsc --noEmit`、`pnpm format` は
`biome format --write src/` に統一。CLAUDE.md にも「ESLint/Prettier は使わない」と明記されている。

### Consequences
- lint/format が単一ツール・単一設定ファイルに集約され、依存関係と設定コストが減る。
- Biome 固有のルールセットに合わせてコードスタイルを揃える必要がある（`5d967f0` で型・整形の
  一括リファクタが行われている）。

---

## ADR-0008: Docker + Nginx によるマルチステージビルドで配信する

- **Status**: Accepted
- **Date**: 2026-01-17（導入）、2026-03-05・2026-07-09（改善が継続）
- **根拠コミット**: `973a9b4`, `db88c1e`, `2e31c70`, `3a2c8e1`, `2c8e3b3`, `4523381`

### Context
ADR-0001 の通りビルド成果物は静的ファイルのみなので、コンテナ化する場合はビルド用イメージと配信用イメージを
分離するのが自然。

### Decision
`Dockerfile` を builder（`node:24-alpine` + pnpm + `pnpm run build`）と runner（`nginx:alpine` が
`dist/` を配信）の2段構成にする。`docker-compose.yml` と `nginx.conf` を添える。ベースイメージは
当初の Node バージョンから `node:24-alpine`（`3a2c8e1`、性能改善目的）へ更新。

### Consequences
- 本番イメージに Node.js やソースコードを含めず、Nginx + 静的ファイルのみになるため軽量・攻撃面が小さい。
- ビルドに必要な `pnpm-lock.yaml` / `pnpm-workspace.yaml` を `.dockerignore` から除外する必要があり、
  一度ハマって `2e31c70` で修正されている（Docker ビルドが `pnpm-lock.yaml` 抜きで失敗した）。
- イメージタグはリポジトリ名を小文字化する必要があり `db88c1e` で修正（GHCR 等の大文字タグ非対応への対応）。

---

## ADR-0009: GitHub Actions で lint / audit / build / test の CI を構築する

- **Status**: Accepted
- **Date**: 2026-01-17（導入）、以後継続的に調整
- **根拠コミット**: `2adab25`（lint & audit workflow）, `3046787`（build workflow）, `ebbea71`（test workflow 追加）,
  `402ec0c`（runner を ubuntu-slim → ubuntu-latest に変更）, `3fdece9`（actions/checkout v6, Node 24 化）,
  `aefb08a`（ubuntu-slim + pnpm 対応）

### Context
単独開発者プロジェクトでも、push のたびに lint・脆弱性監査・ビルド・E2E を自動検証したい。

### Decision
`.github/workflows/` 配下に `lint.yml` / `audit.yml` / `build.yml` / `test.yml` を用意し、それぞれ
Biome lint、`pnpm audit`、Docker ビルド、Playwright E2E を担当させる。ランナーは軽量な `ubuntu-slim` を
試したのち、依存解決の問題（pnpm や glibc 依存のネイティブモジュール等）から `ubuntu-latest` に戻している。

### Consequences
- CI の各ステップが単機能ワークフローに分割されており、失敗箇所の切り分けがしやすい。
- 「軽量ランナーを試す→動かない→標準ランナーに戻す」という試行錯誤が履歴に残っており、
  今後同様の軽量化を試みる際の参考になる（`ubuntu-slim` は pnpm ベースのビルドでは避けたほうが無難）。

---

## ADR-0010: E2E テストに Playwright を採用する

- **Status**: Accepted
- **Date**: 2026-03-05
- **根拠コミット**: `ebbea71`（modernize project with Playwright E2E tests and pnpm Docker support）

### Context
DOM 操作中心の PWA であり、ユニットテストだけでは実際のブラウザ挙動（フォーム入力→保存→PDF出力等）を
検証しにくい。

### Decision
`@playwright/test` を導入し、`playwright.config.ts` を追加。`pnpm test` / `pnpm test:e2e` / `pnpm screenshot`
などのスクリプトを整備し、`tests/e2e/screenshot.spec.ts` で全ビューポートのスクリーンショットを撮る
仕組みを用意した。

### Consequences
- 実ブラウザでの回帰確認が CI（ADR-0009）に組み込める。
- テスト用の Chromium 等のダウンロードが必要になり、CI 実行時間・イメージサイズが増える
  トレードオフがある（範囲は screenshot 中心で、フルカバレッジの E2E スイートではない）。

---

## ADR-0011: 依存関係に「最小リリース経過期間」ポリシーを適用し、サプライチェーン攻撃に備える

- **Status**: Accepted
- **Date**: 2026-04-04 〜 2026-07-09
- **根拠コミット**: `ddfba73`（.npmrc に ignore-scripts と release age を追加）, `2c8e3b3`（minimumReleaseAgeExclude 追加）

### Context
公開直後の npm パッケージ（特にマイナーバージョン）が乗っ取り・悪意あるコード混入の標的になる事例が
増えている。

### Decision
`.npmrc` で postinstall スクリプトを既定禁止にしつつ、`pnpm-workspace.yaml` の `minimumReleaseAgeExclude`
で新しいバージョンの自動採用を意図的に遅らせる（例外リストにあるものだけ許可）。ADR-0006 の
`allowBuilds` / `overrides` と組み合わせて、依存関係更新に対する多層防御を構成している。

### Consequences
- 依存の自動更新が「公開から一定期間が経過したバージョンのみ」に絞られ、サプライチェーン攻撃のリスク
  ウィンドウを縮小できる。
- 一方で緊急のセキュリティパッチが必要な場合は `minimumReleaseAgeExclude` に個別追加する運用が要る
  （実際、脆弱性修正コミット `5d1d7b2` 等で個別パッケージのオーバーライドが積み重なっている）。

---

## ADR-0012: AI エージェント（Claude Code）向けにプロジェクトドキュメントを整備する

- **Status**: Accepted
- **Date**: 2026-02-19 〜 2026-03-13
- **根拠コミット**: `1c2ab04`（CLAUDE.md 追加）, `744bded`（docs/design.md 追加）, `668da3b`（CLAUDE.md と
  Claude Code ルールファイル追加）, `324ff72`（docs/spec/ 配下に8種の仕様書を追加、AI監査由来のバグ5件を記載）,
  `064a983`（AGENTS.md for Codex CLI、2025-08-11時点で先行導入）

### Context
一人開発プロジェクトで、AIコーディングエージェントに継続的にコンテキストを与える必要がある。

### Decision
`CLAUDE.md`（アーキテクチャ概要・コマンド・制約）、`docs/design.md`（設計思想）、`docs/spec/*.md`
（画面・設定・コンポーネント・DB・既知バグ・TODO 等のモジュール別仕様書）を整備し、AI エージェントの
監査で見つかったバグも `known_bugs.md` に記録する運用にした。

### Consequences
- 新しいセッションのAIエージェント（本ツールを含む）がコードベース探索なしに設計判断を把握できる。
- ドキュメントとコードの乖離を防ぐ運用コストが発生する（`docs/spec/*.md` は本ADR作成時点の
  `git status` で削除保留中であり、`docs/analyzed/` への再編途中であることがうかがえる）。

---

## 補足: 未解決・観測された論点

- **SW 更新 UI の反復修正**（ADR-0004）: トースト色・ネストCSSの修正が短時間に連発しており、
  PWA のアップデート通知 UI は今後変更する際に注意を要する箇所。
- **Docker ビルドコンテキストの同期漏れ**（ADR-0006, ADR-0008）: `pnpm-workspace.yaml` や
  `.dockerignore` の更新を Dockerfile の COPY 対象に反映し忘れるパターンが複数回発生している。
  新しい設定ファイルを追加する際は Dockerfile 側の COPY 一覧も合わせて見直すこと。
- **バージョン表記の揺れ**: `package.json` の `version` フィールドが `"0.0.5 alpha"` のように
  semver 非準拠の文字列になっている（`440427a` 以降）。CI/CD やパッケージ公開を今後行う場合は
  是正が必要になる可能性がある。
