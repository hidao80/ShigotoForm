# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ShigotoForm** is a client-side-only PWA for creating Japanese-style résumés（履歴書）. No backend or network communication — all data is stored in IndexedDB (Dexie).

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # HTTPS dev server (https://localhost:5173)
pnpm build            # tsc type-check → Vite build → dist/
pnpm preview          # Serve built dist/ locally
pnpm lint             # Biome check
pnpm format           # Biome auto-format
pnpm test             # Playwright E2E tests
pnpm screenshot       # Capture screenshots across all viewports
```

Type-check only: `pnpm exec tsc --noEmit`

## Architecture

```
src/
├── main.ts          # Entry point. Injects full HTML into #app, wires events, registers PWA SW
├── resume.ts        # DOM form read/write, résumé HTML generation, dynamic row add/delete
├── db.ts            # Dexie IndexedDB wrapper (saveResume / loadResume / clearResume)
├── theme.ts         # Dark/light theme toggle (persisted in localStorage)
├── models/Resume.ts # Internal types: Career / License / Resume / createEmptyResume()
└── types/           # Type stubs: html2pdf.d.ts, bootstrap-events.d.ts, etc.
```

### Two Data Models

| | `Resume` | `ResumeJson` |
|---|---|---|
| Defined in | `src/models/Resume.ts` | `src/db.ts` |
| Used for | DOM binding | IndexedDB storage / JSON export |
| career location | `resume.career[]` (flat) | `resume.resume.career[]` (nested) |

**Conversion is handled exclusively in `main.ts`:**
- `jsonToFormResume(json)` → `Resume` (load/import path)
- `formResumeToJson(form)` → `ResumeJson` (save/export path)

Backwards-compatible: `jsonToFormResume()` also accepts the legacy flat format (`json.career`).

### Auto-save

`MutationObserver` watches `#career-history` / `#license-history` and automatically attaches event listeners to dynamically added rows. `change`/`input` → `saveFromForm()` → `formResumeToJson()` → `saveResume()` (upsert by `createdAt`).

### PWA Update Flow

1. When SW reaches `waiting` state, "新しいバージョンがあります" is shown in the menu
2. User clicks → `wb.messageSkipWaiting()` → `controlling` event → page reload

### Font Lazy-Loading

- Noto fonts: `requestIdleCallback` after `DOMContentLoaded`
- Font Awesome: on help button hover / offcanvas menu open
- After loading, `fonts-loaded` / `icons-loaded` classes are added to `<html>`

## Key Constraints

- `dist/` is generated output — never commit manual changes to it
- Do not import modules directly in `index.html`; only `src/main.ts` is bootstrapped there
- Linter is **Biome** — ESLint/Prettier are not used
- `noUnusedLocals` / `noUnusedParameters` are enforced in strict mode
- The `@ts-ignore` on `html2pdf.js` is intentional (no `@types` package exists)
- Docker production target serves on port 80 via nginx:alpine
