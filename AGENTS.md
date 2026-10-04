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
bun run lint          # Biome check (src/, tests/, vitest.config.ts) + tsc --noEmit
bun run format        # Biome auto-format
bun run test          # Vitest: unit (jsdom) + E2E (Browser Mode, Chromium via Playwright)
bun run test:unit     # tests/unit only
bun run test:e2e      # tests/e2e only (first run: bunx playwright install chromium)
bun run coverage      # Run all tests with V8 coverage (text + coverage/index.html + coverage/lcov.info)
bun run screenshot    # Capture screenshots across all viewports
```

Type-check only: `bunx tsc --noEmit`

## Architecture

```
src/
├── main.tsx         # Entry point. Registers the Service Worker, then renders <App /> into #app on DOMContentLoaded
├── components/      # React components (react-bootstrap), one per file
│   ├── app.tsx                                  # <App /> — owns form state (useResumeForm) and menu/modal open state
│   ├── app-navbar.tsx, app-menu.tsx             # Navbar, offcanvas menu (always in the DOM: renderStaticNode)
│   ├── help-modal.tsx, delete-modal.tsx, resume-modal.tsx   # Modals (shown only while open)
│   ├── resume-form.tsx, validated-input.tsx     # The form, and a controlled input with validation display
│   ├── career-row.tsx, license-row.tsx          # One dynamic row each
│   ├── sortable-list.tsx                        # <SortableList /> (dnd-kit context) and <SortableRow /> (Card + drag handle) — drag-and-drop reordering
│   ├── resume-preview.tsx                       # <ResumePreview /> (A4 résumé), formatDate() / formatZipCode()
│   ├── field-ids.ts                             # Validated field → input id mapping
│   ├── toast.ts, toast-container.tsx            # showToast() / formatToastList() (imperative store) and <ToastContainer />
├── hooks/           # use-resume-form (state, restore, auto-save, validation), use-autokana, use-theme
├── features/        # Non-UI logic
│   ├── resume-json.ts                           # jsonToFormResume() / formResumeToJson()
│   ├── backup.ts                                # exportResume() / pickJsonFile() / readResumeFile() (JSON export/import)
│   ├── age-display.ts                           # calculateAge()
│   ├── pdf-download.ts                          # downloadResumePdf() (html2pdf)
│   ├── pwa-update.ts                            # Service Worker registration, requestAppUpdate(), useUpdateStatus()
│   └── lazy-assets.ts                           # Noto fonts / Font Awesome lazy loading
├── db.ts            # Dexie IndexedDB wrapper (saveResume / loadResume / clearResume)
├── models/Resume.ts # Internal types: Career / License / Resume / createEmptyResume()
├── models/resume-state.ts # FormState (rows with stable ids), resumeReducer(), fromResume() / toResume()
├── models/resume-schema.ts # Zod schema + parseResumeJson() — validates/normalizes imported JSON (Japanese error messages)
├── models/resume-form-schema.ts # Zod per-field rules for the form (required / pattern), FIELD_PATTERNS shared with the HTML `pattern` attrs
└── types/           # Type stubs: html2pdf.d.ts, webmcp.d.ts (WebMCP attributes in JSX), etc.
```

### Two Data Models

| | `Resume` | `ResumeJson` |
|---|---|---|
| Defined in | `src/models/Resume.ts` | `src/db.ts` |
| Used for | Form data (validation, preview, export source) | IndexedDB storage / JSON export |
| career location | `resume.career[]` (flat) | `resume.resume.career[]` (nested) |

**Conversion is handled exclusively in `features/resume-json.ts`:**
- `jsonToFormResume(json)` → `Resume` (load/import path)
- `formResumeToJson(form)` → `ResumeJson` (save/export path)

Backwards-compatible: `jsonToFormResume()` also accepts the legacy flat format (`json.career`).

**Form state** is a third shape, `FormState` (`models/resume-state.ts`): `Resume` whose career/license rows carry a stable `id` (React keys — never use the index, deleting a middle row would swap inputs). `fromResume()` adds ids, `toResume()` strips them. Always pass `toResume(state)` (not the state) to `formResumeToJson()` / save / export so `id` never leaks into stored or exported JSON.

### Import Validation (Zod)

Untrusted JSON (the import button; `readResumeFile()` in `features/backup.ts`) must go through `parseResumeJson()` in `models/resume-schema.ts` **before** `jsonToFormResume()` / `saveResume()`:
- Returns `{ success: true, data: ResumeJson }` (normalized) or `{ success: false, errors: string[] }` (every issue as `path: message`, in Japanese via `zod/locales` `ja` passed per `safeParse` call — no global `z.config()`)
- Normalizes legacy input: flat `career` / `license`, missing `resume`, `startDate` / `endDate` → `start` / `end`, missing strings → `''`, missing `pass` → `'合格'`
- Validates types only (no date/zip format checks) and keeps unknown keys (`z.looseObject`)
- On failure `readResumeFile()` shows up to 5 issues in an error toast and returns `null`; the form and IndexedDB stay untouched
- When `ResumeJson` / `Career` / `License` change, update the schema too (types in `db.ts` / `models/Resume.ts` are not derived from it)

### Form Validation (Zod)

Input fields are validated by `models/resume-form-schema.ts` (`validateField()` / `validateResumeForm()`), held and displayed through `hooks/use-resume-form.ts` and `components/validated-input.tsx`. This is separate from (and stricter than) the lenient import schema above:
- Rules mirror the HTML attributes: required = `createdAt` / `fullnameKana` / `fullname` / `birthday` / `zipCode` / `address1`; pattern-only (empty allowed) = `tel1` / `tel2` / `mail1`. Optional fields (sex, address2, career/license rows) are not validated
- Regex sources live in `FIELD_PATTERNS` and are used for the `pattern` attributes in `components/resume-form.tsx` — change them there only. Zod wraps them as `^(?:…)$` to match the browser's implicit full match. Messages are custom Japanese (not the `ja` locale, which would print the regex)
- To add a validated field: add it to `resumeFormFieldSchemas` (key order = on-screen order) **and** `FIELD_IDS` in `components/field-ids.ts`; add cases to `tests/field-cases.ts` (shared by the E2E `pattern` test and the unit schema test so HTML and Zod rules cannot drift)
- Display state is `errors` in `useResumeForm()`. `commitField()` validates on blur / native `change` (one delegated `change` listener on `<form>`, because React's `onChange` is the `input` event); `setField()` re-checks only a field that already shows an error (not during IME composition) so it clears immediately. Valid fields are not flagged mid-typing. Untouched empty required fields show nothing on load
- `ValidatedInput` renders `is-invalid` / `aria-invalid` / `aria-describedby` / Bootstrap `.invalid-feedback` only while an error exists (no custom colors)
- `replace()` (restore, import, delete) shows errors for filled fields only. The furigana auto-fill goes through `setField()`, so it re-checks furigana too
- Gate (`validateWithWarning()` in `components/app.tsx`): validates the current form state, marks every field, shows a `warn` toast. "履歴書を表示" blocks on errors (focus moves to the first invalid field after the offcanvas menu has exited / the contact accordion has opened; PDF output is only reachable through that modal). Export only warns and still proceeds so half-filled résumés can be backed up. Auto-save is never gated (it keeps saving invalid drafts)

### Auto-save

`useResumeForm()` restores from IndexedDB on mount, then saves in an effect **only after a user edit** (`edit()` / `setField()` set a dirty flag): `toResume(state)` → `formResumeToJson()` → `saveResume()` (upsert by `createdAt`; `age` is computed from the birthday). It never saves before the restore resolves (that would overwrite stored data with the empty initial state) and never saves after `replace()` (restore / import / delete — import saves its own validated JSON, delete clears the DB), so data the form does not cover (e.g. `resume.hobby` in an imported file) survives a plain page load.

### Furigana auto-fill (@j1nn0/vanilla-autokana)

`hooks/use-autokana.ts` binds [@j1nn0/vanilla-autokana](https://github.com/j1nn0/vanilla-autokana) (the maintained fork of `vanilla-autokana`) to the name and furigana inputs. It is event-driven (input / IME `compositionstart` / `compositionend`, no timers), reports changes through `onChange` (→ `setField('fullnameKana', …)`), supports `destroy()` (called in the effect cleanup, so StrictMode re-runs do not double-bind), and has its own types. Notes:
- The library also writes `furigana.value` directly; this is consistent with React because the same value arrives through `onChange`. Never read the furigana from the library — the form state is the source of truth
- It reacts to *any* `input` event on the name field, including browser autofill and programmatic changes, so the hook only forwards changes while the name field is focused (otherwise it would overwrite furigana the user typed)
- `onChange` is forwarded in a `setTimeout`, not synchronously: the library's listener runs before React's root listener, and with real (trusted) input a microtask checkpoint between them would flush the furigana update first and re-render the name field from its stale state — clearing the IME composition (issue #20, phones / tablets). Synthetic `dispatchEvent` tests do not reveal this; `tests/e2e/integration.test.ts` drives real IME events through CDP (`Input.imeSetComposition`)
- Kanji typed in one go (paste, keyboard suggestion/autofill) cannot be turned into kana, and the library then overwrites the furigana with whitespace only — the "ふりがなはひらがなで入力してください" toast blocked "履歴書を表示" (issue #21). The `onChange` guard reverts an update that leaves no hiragana while the name is non-empty and the furigana had some, restores the furigana input, and re-syncs the library by dispatching a `focus` event on the name field
- At focus it continues from the existing furigana only when the name field is **not empty**; with an empty name, typing starts the furigana over
- Single-maintainer package with very low adoption: review its changelog / diff before bumping the version

### Menu focus

The offcanvas menu restores focus to its toggler when it closes. When it is closed *for another action* (opening a modal, moving focus to the first invalid field), `closeMenuForAction()` in `<App />` turns `restoreFocus` off first, otherwise the restore runs after our `focus()` and steals it back (a programmatic `.click()` in tests does not reveal this — focus the toggler first, as `tests/e2e/integration.test.ts` does).

### PWA Update Flow

1. When SW reaches `waiting` state, "新しいバージョンがあります" is shown in the menu (`useUpdateStatus()`)
2. User clicks → `requestAppUpdate()` → `wb.messageSkipWaiting()` → `controlling` event → page reload

`registerServiceWorker()` runs at the entry (outside React) and Workbox events can arrive before the first render, so update status and toasts live in module-level stores read with `useSyncExternalStore`.

### Font Lazy-Loading

- Noto fonts: `requestIdleCallback` after the first render (`scheduleLazyAssets()` in `<App />`)
- Font Awesome: also in the idle callback, and earlier on help button `onPointerOver` / `onFocus` or offcanvas `onShow`
- After loading, `fonts-loaded` / `icons-loaded` classes are added to `<html>`
- Every web font that is actually requested uses `font-display: swap`: `@fontsource/noto-*` already do (124 unicode-range subsets each), and Font Awesome's `font-display: block` is rewritten to `swap` at build time by the PostCSS plugin `scripts/postcss-font-display-swap.ts` (wired in `vite.config.js`), for every face in its CSS. Do not add a second `@font-face` that overrides one: both rules stay in `document.fonts` and the `block` one is still loaded
- Swap means the preview shows immediately in a fallback font and is replaced when the font file arrives. The PDF must not be captured in the fallback: `waitForPreviewFonts()` (`features/lazy-assets.ts`) waits (up to 5 s, then continues) for `document.fonts.load()` with the text actually shown, so only the needed subsets are fetched. `<ResumeModal />` starts it when it opens and awaits it before `downloadResumePdf()`

## Coding Conventions

- Types/interfaces: `PascalCase` (e.g. `ResumeJson`, `Career`)
- Variables/functions: `camelCase` (e.g. `formResumeToJson`, `calculateAge`); React components: `PascalCase`; hooks: `useXxx`
- File names: `kebab-case` (exception: type files like `models/Resume.ts`); components are `.tsx`
- Imports use relative paths from `src/`. Avoid module-level side effects
- `any` is `warn`-level (Biome). Only allowed for external libraries without type stubs
- Write semantic HTML: choose elements by meaning (`<main>`, `<header>`, `<nav>`, `<section>`, `<fieldset>` / `<legend>`, `<label>`, `<button>`, lists, tables for tabular data), not `<div>` / `<span>` with classes or `role=`
- Formatting (indent width, quotes, semicolons, line width, trailing commas, import sorting) is enforced by `biome.json` and `.editorconfig` — run `bun run format` / `bun run lint` rather than hand-formatting

### CSS (resume.css)

- Any changes to A4 layout values (210mm × 297mm) must be visually verified via PDF output
- Theme is controlled via Bootstrap 5 `data-bs-theme` — do not write `color`/`background` directly
- Résumé font family is chosen by `.font-gothic` / `.font-mincho` on `.resume-preview`; `html.icons-loaded` gates the icon fallback styles

### React

- UI is React 19 + react-bootstrap. Use react-bootstrap components for Modal / Offcanvas / Accordion / Navbar / Button / Form controls; **do not** import Bootstrap's JS or use `data-bs-*` toggles (the Bootstrap CSS is still imported in `main.tsx`)
- Form values are controlled and live in `useResumeForm()` state (reducer in `models/resume-state.ts`); change them via `edit()` / `setField()` / `replace()`, never by writing to the DOM. Dynamic rows are state arrays with stable `id` keys; reordering is `move-career` / `move-license` (the saved / exported order follows the state, nothing is sorted elsewhere). Rows render through `<SortableRow />`, and only its handle starts a drag (mouse / touch / keyboard) so inputs are not affected. The handle icon is inline SVG, not Font Awesome (no extra font face)
- User values are rendered as JSX text, so they cannot be interpreted as HTML — **never** use `dangerouslySetInnerHTML` (the résumé preview is built in JSX for this reason)
- react-bootstrap puts `id` on `.modal-dialog` (not on the outer `.modal`, which carries `show` / `role` / `aria-labelledby`); modal contents are unmounted while closed, so triggers do not use `aria-controls` for them. The menu is rendered statically so its buttons always exist
- WebMCP attributes (`toolname` / `tooldescription` / `toolparamdescription`) are plain lowercase props, typed in `types/webmcp.d.ts`; keep them when editing inputs, including dynamic rows
- Biome's a11y and hooks rules apply to JSX (e.g. use `<main>` / `<fieldset>` rather than `role=`, no `href="#"`): fix the code instead of suppressing the rule
- Tests: React tracks an input's `value`, so `el.value = x` followed by an event does not fire `onChange` — use the native prototype setter (`setNativeValue()` in `tests/e2e/mount-app.ts`, or RTL's `fireEvent.change`). State updates are asynchronous, so E2E assertions after a click use `vi.waitFor`. vitest inline projects do not inherit root plugins (React plugin is set per project) and the E2E project pre-bundles React deps (`optimizeDeps.include`) to avoid a duplicate React ("Invalid hook call")

## Key Constraints

- `dist/` is generated output — never commit manual changes to it
- Do not import modules directly in `index.html`; only `src/main.tsx` is bootstrapped there
- Linter is **Biome** — ESLint/Prettier are not used
- `noUnusedLocals` / `noUnusedParameters` are enforced in strict mode
- `html2pdf.js` has no `@types` package; its types come from the local stub `src/types/html2pdf.d.ts`
- Docker production target serves on port 80 via nginx:alpine
- Ensure `bun run lint` passes before committing
