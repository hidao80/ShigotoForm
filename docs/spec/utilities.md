# Utilities

## `main.ts` — App-Level Utilities

### `jsonToFormResume(json: ResumeJson): Resume`

Converts `ResumeJson` (IndexedDB / JSON export format) to `Resume` (form-binding format).

**Logic:**
1. Resolves `career` source: `json.resume.career[]` (current) → `json.career[]` (legacy) → `[]`
2. Resolves `license` source: `json.resume.license[]` (current) → `json.license[]` (legacy) → `[]`
3. Maps each `Career` entry: `c.start ?? c.startDate ?? ''`, `c.end ?? c.endDate ?? ''`
4. Maps each `License` entry: defaults `pass` to `"合格"` if absent

**Called by:** DB load path, JSON import path.

---

### `formResumeToJson(form: Resume): ResumeJson`

Converts `Resume` (form-binding format) to `ResumeJson` (IndexedDB / JSON export format).

**Produces:**
- Top-level personal fields from `form.*`
- `age: 0` (placeholder; the actual age is computed separately and written before save during birthday change)
- `photo: ''`, `address1Kana: ''`, `address2Kana: ''` — not captured by form
- `resume.education: []`, `resume.subject/condition/hobby/reason/expectations: ''` — not exposed in UI
- `resume.career` and `resume.license` from `form.career` / `form.license`

**Called by:** auto-save, export, birthday-change handler.

---

### `showToast(message, kind, ttl): () => void`

Lightweight toast notification utility.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `message` | `string` | — | Toast text content |
| `kind` | `'info' \| 'success' \| 'warn' \| 'error'` | `'info'` | CSS class applied to toast element |
| `ttl` | `number` | `3000` | Auto-dismiss delay in ms |

Returns a cancel function that clears the timer and removes the element immediately.

**DOM:** Creates `div.sf-toast.{kind}` inside `#sf-toast-container`. The container is lazily created and appended to `<body>` on first use (`ensureToastContainer()`).

---

### `ensureToastContainer(): HTMLElement`

Returns `#sf-toast-container`, creating and appending it to `<body>` if not present.

---

## `resume.ts` — Preview Utilities (internal)

### `formatDate(dateStr: string): string`

Converts ISO date string to Japanese format.

| Input | Output |
|---|---|
| `"2024-04-01"` | `"2024年04月01日"` |
| `"2024-04"` | `"2024年04月"` |
| `"2024"` | `"2024年"` |
| `""` | `""` |

Splits on `-` or `/`. Only called within `generateResumeHtml()`.

---

### `formatZipCode(zip: string): string`

Formats a postal code with a hyphen separator.

| Input | Output |
|---|---|
| `"1234567"` | `"123-4567"` |
| `"123-4567"` | `"123-4567"` (unchanged) |
| `"12345"` | `"12345"` (unchanged, too short) |
| `""` | `""` |

Only called within `generateResumeHtml()`.

---

### `addSaveListeners(el: HTMLElement, handler: () => void): void`

Removes then re-attaches both `change` and `input` event listeners to prevent duplicate registration when rows are re-rendered. Used internally in `attachCareerRowListeners` and `attachLicenseRowListeners`.

---

## Font Loading (main.ts closures)

### `lazyLoadNotoFonts(): Promise<void>`

One-shot async loader (guarded by `loaded` flag). Dynamically imports:
- `@fontsource/noto-sans-jp/400.css`
- `@fontsource/noto-serif-jp/400.css`

On success, adds `fonts-loaded` class to `document.documentElement`. Failures are silently swallowed (fallback fonts continue to work).

**Trigger:** `requestIdleCallback` after `DOMContentLoaded`; also called eagerly before opening the preview modal.

---

### `lazyLoadIcons(): Promise<void>`

One-shot async loader (guarded by `loaded` flag). Dynamically imports:
- `@fortawesome/fontawesome-free/css/all.min.css`

On success, adds `icons-loaded` class to `document.documentElement`.

**Trigger:** `requestIdleCallback`; also on `pointerover`/`focusin` on `#help-modal-btn` / `#help-modal-in-menu-btn`; and on `show.bs.offcanvas` of `#offcanvasNavbar`. All triggers are `{ once: true }` and share a single detach function.

---

*Created at commit: de529fb*
