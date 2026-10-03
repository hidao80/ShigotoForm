# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository.

## Project Overview

**ShigotoForm** is a client-side-only PWA for creating Japanese-style résumés（履歴書）. No backend or network communication — all data is stored in IndexedDB (Dexie).

## Commands

```bash
bun install           # Install dependencies
bun dev               # HTTPS dev server (https://localhost:5173)
bun run build         # tsc type-check → Vite build → dist/
bun run preview       # Serve built dist/ locally
bun run lint          # Biome check + tsc --noEmit (src/, tests/)
bun run format        # Biome auto-format
bun run test          # Vitest: unit (jsdom) + E2E (Browser Mode, Chromium via Playwright)
bun run test:unit     # tests/unit only
bun run test:e2e      # tests/e2e only (first run: bunx playwright install chromium)
bun run screenshot    # Capture screenshots across all viewports
```

Type-check only: `bunx tsc --noEmit`

## Architecture

```
src/
├── main.ts          # Entry point. Renders the app shell into #app and calls each feature's setup*() in order
├── features/        # Behavior modules (event wiring / logic), one per concern; each exposes setup*()
│   ├── resume-json.ts                           # jsonToFormResume() / formResumeToJson()
│   ├── auto-save.ts, age-display.ts             # Auto-save (change/input + MutationObserver), age calculation
│   ├── backup.ts, delete-content.ts             # JSON export/import, delete-with-confirm
│   ├── form-validation.ts                       # Live field validation display + validateFormWithWarning() gate (Zod)
│   ├── preview-modal.ts, pdf-download.ts        # Résumé preview modal, PDF output (html2pdf)
│   ├── help.ts, accordion.ts                    # Help modal buttons, accordion initial state
│   ├── pwa-update.ts                            # Service Worker registration / manual update link
│   └── lazy-assets.ts                           # Noto fonts / Font Awesome lazy loading
├── resume.ts        # DOM form read/write (saveFromForm / loadToForm), dynamic row add/delete listeners
├── components/      # View components (HTML-returning functions / DOM factories), one per file
│   ├── app-shell.ts                             # appShellHtml() — composes the static components below
│   ├── help-modal.ts, navbar.ts, offcanvas-menu.ts, resume-form.ts,
│   │   confirm-delete-modal.ts, resume-modal.ts   # Static markup (`*Html()`)
│   ├── career-row.ts, license-row.ts            # createCareerRow() / createLicenseRow()
│   ├── resume-preview.ts                        # generateResumeHtml() (A4 résumé preview)
│   ├── escape-html.ts                           # escapeHtml() — use for any value interpolated into HTML
│   └── toast.ts                                 # showToast() / formatToastList()
├── db.ts            # Dexie IndexedDB wrapper (saveResume / loadResume / clearResume)
├── theme.ts         # Dark/light theme toggle (persisted in localStorage)
├── models/Resume.ts # Internal types: Career / License / Resume / createEmptyResume()
├── models/resume-schema.ts # Zod schema + parseResumeJson() — validates/normalizes imported JSON (Japanese error messages)
├── models/resume-form-schema.ts # Zod per-field rules for the form (required / pattern), FIELD_PATTERNS shared with the HTML `pattern` attrs
└── types/           # Type stubs: html2pdf.d.ts, bootstrap-events.d.ts, etc.
```

### Two Data Models

| | `Resume` | `ResumeJson` |
|---|---|---|
| Defined in | `src/models/Resume.ts` | `src/db.ts` |
| Used for | DOM binding | IndexedDB storage / JSON export |
| career location | `resume.career[]` (flat) | `resume.resume.career[]` (nested) |

**Conversion is handled exclusively in `features/resume-json.ts`:**
- `jsonToFormResume(json)` → `Resume` (load/import path)
- `formResumeToJson(form)` → `ResumeJson` (save/export path)

Backwards-compatible: `jsonToFormResume()` also accepts the legacy flat format (`json.career`).

### Import Validation (Zod)

Untrusted JSON (the import button in `features/backup.ts`) must go through `parseResumeJson()` in `models/resume-schema.ts` **before** `jsonToFormResume()` / `saveResume()`:
- Returns `{ success: true, data: ResumeJson }` (normalized) or `{ success: false, errors: string[] }` (every issue as `path: message`, in Japanese via `zod/locales` `ja` passed per `safeParse` call — no global `z.config()`)
- Normalizes legacy input: flat `career` / `license`, missing `resume`, `startDate` / `endDate` → `start` / `end`, missing strings → `''`, missing `pass` → `'合格'`
- Validates types only (no date/zip format checks) and keeps unknown keys (`z.looseObject`)
- On failure `backup.ts` shows up to 5 issues in an error toast and leaves the form and IndexedDB untouched
- When `ResumeJson` / `Career` / `License` change, update the schema too (types in `db.ts` / `models/Resume.ts` are not derived from it)

### Form Validation (Zod)

Input fields are validated by `models/resume-form-schema.ts` (`validateField()` / `validateResumeForm()`), displayed by `features/form-validation.ts`. This is separate from (and stricter than) the lenient import schema above:
- Rules mirror the HTML attributes: required = `createdAt` / `fullnameKana` / `fullname` / `birthday` / `zipCode` / `address1`; pattern-only (empty allowed) = `tel1` / `tel2` / `mail1`. Optional fields (sex, address2, career/license rows) are not validated
- Regex sources live in `FIELD_PATTERNS` and are interpolated into the `pattern` attributes in `components/resume-form.ts` — change them there only. Zod wraps them as `^(?:…)$` to match the browser's implicit full match. Messages are custom Japanese (not the `ja` locale, which would print the regex)
- To add a validated field: add it to `resumeFormFieldSchemas` (key order = on-screen order) **and** `FIELD_IDS` in `form-validation.ts`; add cases to `tests/field-cases.ts` (shared by the E2E `pattern` test and the unit schema test so HTML and Zod rules cannot drift)
- Live display: a single delegated listener on `<form>` (no per-field / per-row registration). Validate on `focusout` / `change`; a field already showing an error is re-checked on every `input` (skipped during IME composition) so it clears immediately. Valid fields are not flagged mid-typing. Untouched empty required fields show nothing on load
- DOM writes happen only when the display state changes (`is-invalid`, `aria-invalid`, `aria-describedby`, Bootstrap `.invalid-feedback`; no custom colors)
- Programmatic writes fire no events: call `refreshFormValidation()` after `loadToForm()` (init, import, delete). vanilla-autokana's furigana fill is handled by re-checking furigana on name input
- Gate: `validateFormWithWarning({ header, focus })` validates the current DOM form (`saveFromForm()`), marks every field, shows a `warn` toast. `#show-resume` blocks on errors (focus moves to the first invalid field after closing the offcanvas menu / expanding the accordion; PDF output is only reachable through that modal). Export only warns and still proceeds so half-filled résumés can be backed up. Auto-save is never gated (it keeps saving invalid drafts)

### Auto-save

`MutationObserver` watches `#career-history` / `#license-history` and automatically attaches event listeners to dynamically added rows. `change`/`input` → `saveFromForm()` → `formResumeToJson()` → `saveResume()` (upsert by `createdAt`).

### PWA Update Flow

1. When SW reaches `waiting` state, "新しいバージョンがあります" is shown in the menu
2. User clicks → `wb.messageSkipWaiting()` → `controlling` event → page reload

### Font Lazy-Loading

- Noto fonts: `requestIdleCallback` after `DOMContentLoaded`
- Font Awesome: also in the idle callback, and earlier on help button `pointerover`/`focusin` or offcanvas open
- After loading, `fonts-loaded` / `icons-loaded` classes are added to `<html>`

## Coding Conventions

- Types/interfaces: `PascalCase` (e.g. `ResumeJson`, `Career`)
- Variables/functions: `camelCase` (e.g. `saveFromForm`, `loadToForm`)
- File names: `kebab-case` (exception: type files like `models/Resume.ts`)
- Imports use relative paths from `src/`. Avoid module-level side effects
- `any` is `warn`-level (Biome). Only allowed for external libraries without type stubs
- Formatting (indent width, quotes, semicolons, line width, trailing commas, import sorting) is enforced by `biome.json` and `.editorconfig` — run `bun run format` / `bun run lint` rather than hand-formatting

### CSS (resume.css)

- Any changes to A4 layout values (210mm × 297mm) must be visually verified via PDF output
- Theme is controlled via Bootstrap 5 `data-bs-theme` — do not write `color`/`background` directly
- Résumé font family is chosen by `.font-gothic` / `.font-mincho` on `.resume-preview`; `html.icons-loaded` gates the icon fallback styles

### DOM Manipulation

- Dynamic rows (career/license) must be created via `createCareerRow()` / `createLicenseRow()` (`components/`)
- Escape every user value interpolated into HTML strings with `escapeHtml()`
- After adding a row, always call `attachCareerRowListeners()` / `attachLicenseRowListeners()`
- `MutationObserver` auto-attaches listeners — avoid duplicate manual registration

## Key Constraints

- `dist/` is generated output — never commit manual changes to it
- Do not import modules directly in `index.html`; only `src/main.ts` is bootstrapped there
- Linter is **Biome** — ESLint/Prettier are not used
- `noUnusedLocals` / `noUnusedParameters` are enforced in strict mode
- `html2pdf.js` has no `@types` package; its types come from the local stub `src/types/html2pdf.d.ts`
- Docker production target serves on port 80 via nginx:alpine
- Ensure `bun run lint` passes before committing
