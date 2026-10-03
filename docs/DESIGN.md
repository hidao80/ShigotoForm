# DESIGN — ShigotoForm ランディングページ

[docs/index.html](index.html) のデザイン仕様。GitHub Pages 公開の静的 LP（`main.css`・`main.min.js` と multilanguagejs のみ使用、ビルド不要）。アプリ本体（`src/`）は対象外。

## 1. デザイン原則

| 原則 | 具体化 |
|---|---|
| 信頼感 | 「個人情報を送信しない」を最初に提示。朱（赤）を単一アクセントとし、日本の書類・判子を連想 |
| 軽量 | フレームワーク・CSS ライブラリ・Web フォント不使用。CSS は [main.css](main.css) に集約 |
| 日本語ファースト | 日本語フォントスタック先頭、`line-height: 1.8` で可読性確保 |
| 自動テーマ | OS 設定（`prefers-color-scheme`）追従。手動切替 UI なし |
| 多言語 | ja / en / zh / es / ru の 5 言語をクライアント側で切替 |

## 2. デザイントークン
全て `:root` の CSS 変数で定義。ダークモードは `@media (prefers-color-scheme: dark)` で同名変数を上書き。`color-scheme: light dark` 指定でフォームコントロール等ネイティブ UI も追従。

| トークン | Light | Dark | 用途 |
|---|---|---|---|
| `--bg` | `#faf9f7` | `#171412` | ページ背景 |
| `--surface` | `#ffffff` | `#221f1c` | カード・ナビ・コード行の面 |
| `--text` | `#1c1917` | `#f5f5f4` | 本文 |
| `--text-sub` | `#57534e` | `#a8a29e` | 補足文・リード文・キャプション |
| `--accent` | `#b91c1c` | `#f87171` | 強調語・主ボタン・ステップ番号・リンク |
| `--accent-soft` | `#fef2f2` | `#3b1a1a` | ヒーロー背景グラデ・ホバー面 |
| `--border` | `#e7e5e4` | `#3a3532` | 罫線・カード枠 |
| `--shadow` | 弱 2 段（`0 1px 3px` / `0 8px 24px`、alpha .06 / .07） | 同構成（alpha .4 / .35） | カード・ボタンホバー |

固定色（トークン外）: 主ボタン文字 `#fff`、コピー完了チェック `#16a34a`。

### タイポグラフィ
```css
font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "BIZ UDPGothic", Meiryo, system-ui, sans-serif;
line-height: 1.8;
```

| 要素 | サイズ | 太さ |
|---|---|---|
| ヒーロー `h1` | `clamp(2rem, 6vw, 3.4rem)` | 800 |
| タグライン | `clamp(1.05rem, 2.5vw, 1.4rem)` | 400（`strong` はアクセント色） |
| セクション `h2` | `clamp(1.5rem, 4vw, 2.1rem)` | 既定（bold） |
| 補足・注記 | `.85rem`〜`.95rem` | 400 |

### スペーシング・形状
セクション: 最大幅 `800px`、中央寄せ、上下 `4.5rem` / 左右 `1.5rem`。カード角丸 `1rem`、ボタン `999px`（ピル型）、入力系 `.5rem`〜`.6rem`。グリッド余白 `1.2rem`〜`1.5rem`。

## 3. レイアウト構成
上から順に以下のセクション構成。
1. **ナビバー**（`.navbar`）— `position: sticky; top: 0`。左にブランド名、右に言語セレクタ
2. **ヒーロー**（`.hero`）— `min-height: 80svh`、中央配置。`--accent-soft` の楕円ラジアルグラデを上部に敷く。絵文字（📄🖋️）、`h1`、タグライン、CTA 2 つ、注記（登録不要・無料・インストール不要）
3. **課題と解決**（7 枚の `.vs-card`）— プライバシー / 日本式履歴書 / PDF 無料 / データ移行 / オフライン / アクセシビリティ / AI エージェント（WebMCP）
4. **使い方**（3 枚の `.step`）— 入力 → プレビュー → PDF 保存
5. **クイックスタート**（`.code-row` × 3）— `docker compose up dev`、`git clone … && bun dev`、`docker compose up prod`
6. **スクリーンショット**（3 枚の `figure`）— 入力画面 / A4 ゴシック / A4 明朝
7. **技術スタック**（`.tech-list`）— ピル型タグ 12 個
8. **フッター**— CTA 2 つ、ライセンス・貢献案内

### レスポンシブ
ブレークポイントなし。`repeat(auto-fit, minmax(…, 1fr))` と `clamp()` で流動対応。

| グリッド | 最小カード幅 |
|---|---|
| `.vs-grid` | `17rem` |
| `.steps` | `15rem` |
| `.shots` | `18rem` |

## 4. コンポーネント
### ボタン（`.btn`）
共通: `padding: .9rem 2.2rem`、`border-radius: 999px`、太さ 700、下線なし。`.btn-primary`: 背景 `--accent`、文字白。`.btn-ghost`: 透明背景、`2px solid var(--border)` 枠、文字 `--text`。ホバー: `translateY(-2px)` + `--shadow`（`.15s ease`）。配置: `.cta-row`（flex、`gap: 1rem`、折り返し可）。

### 課題カード（`.vs-card`）
アイコン（絵文字、`aria-hidden`）→ `.problem`（取り消し線 `--accent` `2px`、`--text-sub`）→ `.solution`（太字）の順。「不安を取り消し線で消し、解決策を提示」する対比を視覚化。

### ステップカード（`.step`）
CSS カウンター（`counter-reset: step`）で `::before` に番号を自動採番。カード左上にはみ出す円形バッジ（`2.4rem`、`--accent` 背景、白文字）。見出しは絵文字 + 短い動詞。

### スクリーンショット（`.shots figure`）
カード内に画像（角丸 `.5rem`、`loading="lazy"`）と `figcaption`。画像は GitHub の user-attachments 参照。

### コードブロック（`.code-row`）
`--surface` 背景の横スクロール可能な行（`max-width: 40rem`）。右端にコピーボタン（`.copy-btn`）。アイコン（コピー / チェックの SVG 2 つ）は HTML には書かず、`main.js` が `.copy-btn` へ挿入する（同じ SVG を 3 回書くと重複するため。`main.min.js` も再生成すること）。クリックで `data-copy` の内容をクリップボードへ書込、コピーアイコンを緑のチェックに `1.5s` 切替（`.copied` クラス）。複数行コマンドは `data-copy` 内で `&#10;` により改行表現。

### 技術タグ（`.tech-list li`）
`--surface` 背景 + `--border` 枠のピル型。中央寄せ、折り返し。

## 5. モーション
ボタンホバー: 上方向 2px 移動（`transition: transform, box-shadow .15s`）。スクロール連動の出現: `.vs-card` / `.step` / `.shots figure` が `@keyframes rise`（下から `2rem` + フェードイン）で出現。`animation-timeline: view()` と `animation-range: entry 0% entry 60%` 使用。適用条件は二重ガード: `@media (prefers-reduced-motion: no-preference)` かつ `@supports (animation-timeline: view())`。非対応ブラウザ・モーション低減設定では静的表示に退避。

## 6. 多言語（i18n）
### マークアップ
`<template type="language-group">` 内に `<span language="xx">` を言語別に並べる（multilanguagejs 2.0.1、unpkg 経由）。全テキストノードがこの形式。

### 挙動（[main.js](main.js)）

| 項目 | 内容 |
|---|---|
| 対応言語 | `ja` `en` `zh` `es` `ru` |
| 初期言語 | `localStorage`（キー `shigotoform-lp-lang`）→ `navigator.language` 先頭 2 文字 → 該当なしなら `en` |
| 切替 | ナビバーの `#lang-select`。変更時に保存 |
| メタ更新 | `document.title`、`meta[name=description]`、`<html lang>` を言語別に書換 |

注意点: `og:*` / `twitter:*` / JSON-LD は静的で日本語固定（クローラーは JS 非実行のため）。言語追加時は `main.js` の `LANGUAGES` と `META`、`index.html` の全 `language-group`、`<select>` の `<option>` を同時更新。`main.min.js` は `main.js` のビルド成果物。HTML は `main.min.js` を読込むため、`main.js` 編集後は再生成が必要（生成手順はリポジトリ内で未確認）。

## 7. アクセシビリティ
実装済の配慮: `<html lang>` を言語切替に連動更新。装飾用絵文字・アイコンに `aria-hidden="true"`。言語セレクタ `aria-label="Language"`、コピーボタン `aria-label="Copy"`。`meta color-scheme` と `prefers-color-scheme` によるダーク対応。`prefers-reduced-motion` 尊重。画像に `alt`（ただし日本語固定で言語切替非連動）。

LP 本文は「Lighthouse アクセシビリティ 100、WAVE エラー 0」を訴求するが、LP 自体の測定値は未確認（アプリ本体を指す記述と推測）。

## 8. SEO / SNS メタ

| 項目 | 値 |
|---|---|
| OGP 画像 | `https://hidao80.github.io/ShigotoForm/social-preview.png`（1280×640） |
| Twitter Card | `summary_large_image` |
| 構造化データ | JSON-LD `WebApplication`（価格 0 JPY、MIT、`codeRepository`） |
| ファビコン | `favicon32.webp` |
| LLM 向け | [llms.txt](llms.txt) |

## 9. 外部依存・リンク先

| 種別 | URL |
|---|---|
| ライブデモ | https://shigotoform.netlify.app/ |
| リポジトリ | https://github.com/hidao80/ShigotoForm |
| i18n ライブラリ | `https://unpkg.com/multilanguagejs@2.0.1/dist/multilanguagejs.umd.cjs` |

## 10. 既知の不整合・改善候補（調査所見）
実装との差異。修正未実施。
1. （解消済）技術スタック表示を「Vitest + Playwright E2E」に更新（ADR-014 でテスト基盤が Vitest Browser Mode + Playwright Chromium へ移行したため）
2. （解消済）`main.js` の `META.*.description` から「JIS 規格」の表現を削除し、静的メタ・本文の表現と揃えた
3. 「顔写真添付には近日対応予定」は機能現状に合わせた更新が必要
4. `main.js` の `META` と `index.html` の静的メタ（日本語）で `title` / `description` 文言が相違（例: ja は一致、en は LP 本文と OGP が別表現）
5. スクリーンショット `alt` が言語切替に非連動
6. 外部 CDN（unpkg）に i18n 依存。「外部通信なし」の訴求対象はアプリ本体で LP ではない点を明示すれば誤解減
