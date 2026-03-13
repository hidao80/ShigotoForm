# Overview

## What is ShigotoForm?

**ShigotoForm (シゴトフォーム)** is a fully client-side, offline-capable Progressive Web App (PWA) for creating Japanese-style résumés (履歴書). All user data is stored locally in IndexedDB via Dexie and never leaves the device. There is no backend, no server communication, and no authentication.

Version: `0.0.5 alpha`

---

## Tech Stack

| Category | Technology |
|---|---|
| Language | TypeScript 5.6 (strict, ES2020, ESM) |
| Build tool | Vite 6 |
| UI framework | Bootstrap 5.3 |
| Persistence | Dexie 4 (IndexedDB wrapper) |
| PDF export | html2pdf.js 0.14 (html2canvas + jsPDF) |
| PWA / SW | vite-plugin-pwa + @vite-pwa/workbox-window |
| Fonts | Noto Sans JP, Noto Serif JP (@fontsource, lazy-loaded) |
| Icons | Font Awesome 6.4.0 Free (lazy-loaded) |
| Furigana | vanilla-autokana |
| Linter/Formatter | Biome 1.9 |
| Testing | Playwright E2E |

---

## Module Map

```
src/
├── main.ts          — Entry point: HTML injection, event wiring, PWA SW, data conversion
├── resume.ts        — DOM form read/write, row creation, preview HTML generation
├── db.ts            — Dexie IndexedDB wrapper (saveResume / loadResume / clearResume)
├── theme.ts         — Dark/light theme toggle (persisted in localStorage)
├── models/
│   └── Resume.ts    — Internal types: Career / License / Resume / createEmptyResume()
├── types/
│   ├── html2pdf.d.ts          — Type stub for html2pdf.js
│   ├── bootstrap-events.d.ts  — Bootstrap custom event types
│   └── global.d.ts            — requestIdleCallback / IdleDeadline declarations
└── resume.css       — App-specific styles
```

---

## Architecture

The entire UI is injected into `#app` at `DOMContentLoaded` by `main.ts`. There is no client-side router. The app is a single view with Bootstrap modals.

```
Browser (SPA)
┌────────────────────────────────────────────────────┐
│  main.ts  ──►  resume.ts  ──►  db.ts  ──►  Dexie  │
│     │                                    (IndexedDB)│
│     ├──►  theme.ts                                  │
│     └──►  html2pdf.js (PDF export)                  │
│                                                      │
│  vite-plugin-pwa  ──►  Service Worker (Workbox)     │
└────────────────────────────────────────────────────┘
```

---

## Two Data Models

| | `Resume` (internal) | `ResumeJson` (storage/export) |
|---|---|---|
| Defined in | `src/models/Resume.ts` | `src/db.ts` |
| Used by | `saveFromForm()`, `loadToForm()` | `saveResume()`, `loadResume()`, JSON export |
| Career location | `resume.career[]` (flat) | `resume.resume.career[]` (nested) |
| License location | `resume.license[]` (flat) | `resume.resume.license[]` (nested) |
| Extra fields | — | `age`, `photo`, `address1Kana`, `address2Kana`, `subject`, `condition`, `hobby`, `reason`, `expectations`, `education[]` |

Conversion is handled exclusively in `main.ts`:
- `jsonToFormResume(json: ResumeJson) → Resume` — load / import path
- `formResumeToJson(form: Resume) → ResumeJson` — save / export path

---

## Data Flows

### Page Load / Auto-restore
```
IndexedDB → loadResume() → ResumeJson → jsonToFormResume() → Resume → loadToForm() → DOM
```

### Auto-save on Change
```
DOM change/input → saveFromForm() → Resume → formResumeToJson() → ResumeJson → saveResume() → IndexedDB (upsert by createdAt)
```
`MutationObserver` on `#career-history` / `#license-history` auto-attaches save listeners to newly added dynamic rows.

### JSON Export
```
DOM → saveFromForm() → Resume → formResumeToJson() → JSON.stringify() → Blob → <a download>
Filename: resume_YYYYMMDD.json
```

### JSON Import
```
<input type="file"> → file.text() → JSON.parse() → ResumeJson → jsonToFormResume() → Resume → loadToForm() → DOM
                                                                                     └──────► saveResume() → IndexedDB
```

### PDF Export
```
loadResume() → jsonToFormResume() → Resume → generateResumeHtml(data, fontType) → .resume-preview DOM
→ html2pdf().set(opt).from(preview).save() → 履歴書_{name}_{YYYYMMDD}.pdf
```

---

## PWA / Service Worker Update Flow

1. `vite-plugin-pwa` (GenerateSW strategy) pre-caches all build assets at deploy time.
2. When a new SW version reaches `waiting` state, `wb.addEventListener('waiting')` fires:
   - Sets `updateReady = true`
   - Shows "新しいバージョンがあります" in `#pwa-update-status`
3. User clicks **アプリのアップデート** in the offcanvas menu:
   - If `updateReady`: calls `wb.messageSkipWaiting()` immediately
   - Otherwise: calls `wb.update()`, with a 4-second fallback for "already up to date"
4. On `controlling` event: `window.location.reload()` applies the new SW

---

## Font Loading Strategy

Fonts are deferred to keep initial render fast.

| Font | Trigger |
|---|---|
| Noto Sans JP / Noto Serif JP | `requestIdleCallback` after `DOMContentLoaded` |
| Font Awesome 6 | `pointerover`/`focusin` on help buttons, or `show.bs.offcanvas` |

CSS classes added to `<html>` after load:
- `fonts-loaded` — enables Noto typefaces
- `icons-loaded` — reveals Font Awesome glyphs (text fallback shown until then)

Noto fonts are also loaded eagerly (awaited) before opening the preview modal to ensure correct PDF rendering.

---

## Theme System

- Bootstrap 5 `data-bs-theme` attribute on `<body>` drives component colours.
- Toggle switch (`#theme-switch`) in the offcanvas menu persists to `localStorage['theme']`.
- `theme.ts` applies the stored theme at startup via `addThemeSwitchEventListener()`.

---

## Key Constraints

- No backend, no network requests for data; all data lives in IndexedDB.
- `tsconfig.json` enforces `strict`, `noUnusedLocals`, `noUnusedParameters`.
- `dist/` is generated output — never commit manual changes.
- `index.html` only bootstraps `src/main.ts`; do not import other modules there.
- `@ts-ignore` on `html2pdf.js` import is intentional (no `@types` package).
- No ESLint/Prettier — Biome is the sole linter and formatter.
- Docker production target: nginx:alpine on port 80.

---

*Created at commit: de529fb*
