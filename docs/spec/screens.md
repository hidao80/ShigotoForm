# Screens

## Main Form Screen (`#main`)

The single-page application renders all UI into `#app` at `DOMContentLoaded`. There is no client-side router. The main form is always visible and occupies the full viewport below the fixed navbar.

### Fields

| DOM ID | Type | Name attribute | Required | Notes |
|---|---|---|---|---|
| `#created-at` | `date` | `createdAt` | Yes | Document date |
| `#furigana-input` | `text` | `fullname-kana` | Yes | Hiragana-only pattern; auto-filled by vanilla-autokana |
| `#name-input` | `text` | `fullname` | Yes | Triggers autokana binding |
| `#birthdate-input` | `date` | `birthday` | Yes | Age computed live in `#age-display` |
| `#sex-input` | `text` | `sex` | No | Optional free-text |
| `#zip-code-input` | `text` | `zip-code` | Yes | Pattern `\d{3}-?\d{4}` |
| `#address1-input` | `text` | `address1` | Yes | Primary address |
| `#tel1-input` | `tel` | `tel1` | No | Pattern `\d{2,4}-?\d{2,4}-?\d{3,4}` |
| `#mail1-input` | `email` | `mail1` | No | Pattern enforces valid email format |
| `#address2-input` | `text` | `address2` | No | Inside collapsible accordion |
| `#tel2-input` | `tel` | — | No | Inside collapsible accordion (no name attr on input) |

### Dynamic Rows

- **`#career-history`** — career/education entries. Each row is a Bootstrap `.card` with inputs: `start` (month), `end` (month), `name` (text), `position` (text), `description` (text). Added via `#add-career-history` button.
- **`#license-history`** — licence/certification entries. Each row has: `endDate` (month), `name` (text), `.status-select` (`<select>` with 合格/取得). Added via `#add-license-history` button.

Both containers are watched by `MutationObserver` in `main.ts` to auto-attach save listeners to newly added inputs.

---

## Navbar (Fixed Top)

- App logo (`ShigotoForm`) with version number (`#version-no`)
- Help button (`#help-modal-btn`) — opens `#helpModal`
- Hamburger toggle — opens `#offcanvasNavbar`

---

## Offcanvas Menu (`#offcanvasNavbar`)

| Element | ID | Purpose |
|---|---|---|
| PWA update link | `#pwa-update-link` | Manually check/apply SW update |
| PWA update status | `#pwa-update-status` | Shows "新しいバージョンがあります" or blank |
| Dark mode toggle | `#theme-switch` | Checkbox; persisted to `localStorage['theme']` |
| Export button | `#backup-button` | Downloads `resume_YYYYMMDD.json` |
| Import button | `#upload-button` | Opens file picker for `.json` import |
| Show resume button | `#show-resume` | Opens `#resumeModal` (disabled until DB loaded) |
| Delete button | `#delete-content` | Opens `#confirmDeleteModal` |
| Help button (in menu) | `#help-modal-in-menu-btn` | Same function as navbar help button |

---

## Resume Preview Modal (`#resumeModal`)

- Full-screen Bootstrap modal
- Content rendered into `#resume-modal-content` by `generateResumeHtml()`
- Footer contains:
  - Font selector (`#font-select` with gothic/mincho options)
  - **履歴書PDFダウンロード** button (`#download-resume-html`)
  - Close button

---

## Help Modal (`#helpModal`)

- Bootstrap modal (size: `modal-xl`, centered)
- Static HTML content explaining input methods, import/export, preview, and PWA update

---

## Delete Confirmation Modal (`#confirmDeleteModal`)

- Triggered by `#delete-content` button
- Confirms data deletion with Cancel / Delete (danger) buttons (`#confirm-delete`)

> **Remark (known bug):** The modal header incorrectly shows "履歴書プレビュー" as title (copy-paste from preview modal). Body correctly says "入力内容を削除します。よろしいですか？". See `known_bugs.md`.

---

## Toast Notifications

Lightweight, non-Bootstrap toasts injected into `#sf-toast-container` (appended to `<body>` on demand). Kinds: `info`, `success`, `warn`, `error`. Auto-dismiss after configurable TTL (default 3000 ms).

---

*Created at commit: de529fb*
