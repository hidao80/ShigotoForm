# Components

## `src/models/Resume.ts` — Domain Model Types

### `Career` interface

| Field | Type | Description |
|---|---|---|
| `start` | `string` | Start year-month (ISO month string, e.g. `2020-04`) |
| `end` | `string` | End year-month |
| `name` | `string` | Company or school name |
| `position` | `string` | Job title or department/faculty |
| `description` | `string` | Additional notes |
| `startDate?` | `string` | Legacy alias for `start` (optional, backwards-compat import) |
| `endDate?` | `string` | Legacy alias for `end` (optional, backwards-compat import) |

### `License` interface

| Field | Type | Description |
|---|---|---|
| `date` | `string` | Acquisition year-month |
| `name` | `string` | Certification/licence name |
| `pass` | `string` | `"合格"` (passed) or `"取得"` (obtained) |

### `Resume` interface

| Field | Type | Description |
|---|---|---|
| `createdAt` | `string` | Document date (ISO date string) |
| `fullname` | `string` | Full name (kanji) |
| `fullnameKana` | `string` | Full name (hiragana) |
| `birthday` | `string` | Date of birth (ISO date) |
| `sex` | `string` | Gender (free text, optional) |
| `zipCode` | `string` | Postal code |
| `address1` | `string` | Primary address |
| `address2` | `string` | Alternative contact address |
| `tel1` | `string` | Primary phone |
| `tel2` | `string` | Alternative phone |
| `mail1` | `string` | Primary email |
| `mail2` | `string` | Alternative email |
| `career` | `Career[]` | Work / education history |
| `license` | `License[]` | Licences and certifications |

### `createEmptyResume(): Resume`

Factory function returning a `Resume` with all string fields set to `""` and arrays set to `[]`.

---

## `src/resume.ts` — DOM / Form Module

### Exported Functions

#### `saveFromForm(): Resume`

Reads all form inputs from the DOM and returns a `Resume` object. Reads dynamic rows from `#career-history .card` and `#license-history .card`.

#### `loadToForm(resume: Resume): void`

Writes a `Resume` into DOM inputs using `setValue(selector, value)` helper. Clears and re-renders both `#career-history` and `#license-history`.

#### `generateResumeHtml(data: Resume, fontType?: 'gothic' | 'mincho'): string`

Returns an A4 HTML string (`<div class="resume-preview">`) for the preview modal. Applies `font-gothic` or `font-mincho` class. Uses internal helpers `formatDate()` and `formatZipCode()`.

- **`formatDate(dateStr)`** — Converts `YYYY-MM-DD` or `YYYY-MM` to Japanese format (`YYYY年MM月DD日` / `YYYY年MM月`).
- **`formatZipCode(zip)`** — Inserts hyphen after 3rd digit if absent and length ≥ 7.

#### `addHistoryEventListener(): void`

Wires the `#add-career-history` button to append a new career row.

#### `addLicenseEventListener(): void`

Wires the `#add-license-history` button to append a new licence row.

### Internal Functions

#### `createCareerRow(item?: Career): HTMLDivElement`

Creates a Bootstrap `.card` DOM node for one career entry.

#### `createLicenseRow(item?: License): HTMLDivElement`

Creates a Bootstrap `.card` DOM node for one licence entry.

#### `attachCareerRowListeners(div: HTMLElement): void`

Attaches `change`/`input` listeners to all named inputs in the row. Each listener dispatches a bubbling `career-row-updated` event. Also wires the `.remove-row` button.

#### `attachLicenseRowListeners(div: HTMLElement): void`

Same pattern for licence rows; dispatches `license-row-updated`. Listens to fields: `endDate`, `name`, `.status-select`.

#### `addSaveListeners(el, handler): void`

Utility to attach both `change` and `input` events (removes first to prevent duplicates).

---

## `src/theme.ts` — Theme Module

### `addThemeSwitchEventListener(): void`

- Reads `localStorage['theme']` on call; sets `document.body.dataset.bsTheme` and the `#theme-switch` checkbox state.
- On `change` event of `#theme-switch`, toggles `data-bs-theme` between `"dark"` and `"light"` and persists to `localStorage`.

---

## `src/main.ts` — Entry Point / Orchestrator

### PWA / Service Worker

- Registers `/sw.js` via `Workbox` (module type in dev).
- `waiting` event → sets `updateReady = true`, shows "新しいバージョンがあります" in `#pwa-update-status`.
- `controlling` event → `window.location.reload()`.
- `installed` event (no update) → shows "最新の状態です。" toast when `manualCheck` is true.

### Conversion Functions

#### `jsonToFormResume(json: ResumeJson): Resume`

Converts storage format to form format. Supports both current (`json.resume.career`) and legacy (`json.career`) formats. Maps `c.startDate` → `c.start`, `c.endDate` → `c.end` for legacy Career records. Defaults `license.pass` to `"合格"` if absent.

#### `formResumeToJson(form: Resume): ResumeJson`

Converts form format to storage format. Nests career/license under `resume.{career,license}`. Sets `age: 0`, `photo: ''`, `address1Kana: ''`, `address2Kana: ''` as placeholder values. Sets `resume.education: []`, `resume.subject/condition/hobby/reason/expectations: ''`.

### Font Lazy-Loading

- `lazyLoadNotoFonts()` — one-shot loader; imports `@fontsource/noto-sans-jp/400.css` and `@fontsource/noto-serif-jp/400.css`, adds `fonts-loaded` to `<html>`.
- `lazyLoadIcons()` — one-shot loader; imports `@fortawesome/fontawesome-free/css/all.min.css`, adds `icons-loaded` to `<html>`.
- Both triggered via `requestIdleCallback` (fallback: `setTimeout(..., 0)`) after `DOMContentLoaded`.
- Icons additionally triggered on `pointerover`/`focusin` of help buttons or `show.bs.offcanvas` event.

### Toast Utility

- `showToast(message, kind, ttl): () => void` — creates a `div.sf-toast.{kind}` in `#sf-toast-container`, auto-removes after `ttl` ms, returns a cancel function.

### Event Wiring (inside DOMContentLoaded)

- Help buttons → Bootstrap `Modal` for `#helpModal`
- `#pwa-update-link` → manual SW update flow
- `AutoKana.bind('#name-input', '#furigana-input')` — furigana auto-completion
- `Theme.addThemeSwitchEventListener()`
- Load IndexedDB → `loadToForm(jsonToFormResume(resumeJson))`
- `Resume.addHistoryEventListener()` / `addLicenseEventListener()`
- Enable `#show-resume` button
- Attach `change`/`input` save handlers to all form elements
- `MutationObserver` on `#career-history` and `#license-history`
- Birthday input → live age calculation in `#age-display`
- `#backup-button` → JSON export (filename: `resume_YYYYMMDD.json`)
- `#upload-button` → JSON import via `<input type="file">`
- `#show-resume` → render preview, open `#resumeModal`
- `#download-resume-html` (delegated on body) → `html2pdf()` with high-res settings
- `#version-no` → set from `package.json`
- `#font-select` → font class toggle on `.resume-preview`

---

## `src/types/`

### `html2pdf.d.ts`

Type stub for `html2pdf.js` (no official `@types` package). Uses `@ts-ignore` is applied at import site in `main.ts`.

### `bootstrap-events.d.ts`

Type stubs for Bootstrap custom events (`show.bs.offcanvas`, etc.).

### `global.d.ts`

Declares `window.requestIdleCallback` / `window.cancelIdleCallback` and related types (`IdleRequestCallback`, `IdleDeadline`, `IdleRequestOptions`) which are absent from TypeScript's standard lib.

---

*Created at commit: de529fb*
