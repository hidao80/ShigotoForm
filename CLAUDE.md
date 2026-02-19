# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm i              # Install dependencies
pnpm dev            # Dev server (HTTPS via @vitejs/plugin-basic-ssl, https://localhost:5173)
pnpm build          # tsc type-check + Vite bundle → dist/
pnpm lint           # Type-check only (tsc --noEmit)
pnpm preview        # Serve the built dist/
```

After any TypeScript change, always run `pnpm build` to confirm zero errors.

## Architecture

This is a **single-page, fully client-side PWA** — no backend, no server communication. All resume data is stored in the browser's IndexedDB via Dexie and never leaves the device.

### Module responsibilities

| File | Role |
|---|---|
| `src/models/Resume.ts` | Core TypeScript interfaces: `Resume`, `Career`, `License`, and `createEmptyResume()` |
| `src/db.ts` | Dexie (IndexedDB) wrapper. Defines `ResumeJson` (the stored/exported schema) and `ResumeDB`. Exports `saveResume`, `loadResume`, `clearResume`. |
| `src/resume.ts` | DOM rendering and form logic: `saveFromForm()`, `loadToForm()`, `generateResumeHtml()`, and dynamic row management for career/license entries. |
| `src/theme.ts` | Dark/light theme toggle, persisted in `localStorage`. |
| `src/main.ts` | App entry point: bootstraps the DOM (entire HTML injected via `#app`), wires all event listeners, handles PWA Service Worker via `workbox-window`, and manages PDF export via `html2pdf.js`. |

### Two data representations

There are two distinct data shapes — understanding both is critical:

- **`Resume`** (`src/models/Resume.ts`): The internal form model. Used by `saveFromForm()` / `loadToForm()` to read/write DOM values. Career and license arrays are flat.
- **`ResumeJson`** (`src/db.ts`): The IndexedDB storage and JSON export format. Nests career/license under a `resume` property, and includes extra fields like `age`, `photo`, `address1Kana`, etc. Also supports a legacy flat format (career/license at root level) for backwards compatibility with old exports.

Conversion between the two happens in `main.ts` via `jsonToFormResume()` (ResumeJson → Resume) and `formResumeToJson()` (Resume → ResumeJson).

### Data flow

```
User input (DOM form)
  → saveFromForm()          → Resume (internal)
  → formResumeToJson()      → ResumeJson
  → saveResume()            → IndexedDB (Dexie, "ResumeDB")

Page load / Import:
  IndexedDB / JSON file
  → loadResume() / JSON.parse()
  → jsonToFormResume()      → Resume (internal)
  → loadToForm()            → DOM form
```

### PDF export

The preview modal calls `Resume.generateResumeHtml(data, fontType)` which returns an HTML string rendered at A4 dimensions (210mm × 297mm). The `#download-resume-html` button passes the `.resume-preview` element to `html2pdf.js` with high-resolution html2canvas settings (scale 3, dpi 192).

### PWA / Service Worker

Service Worker registration uses `workbox-window` (manual update flow). In dev mode (`command === 'serve'`), `basicSsl()` and SW dev mode are enabled so the SW can be tested locally over HTTPS. Font Awesome fonts are pre-cached from cdnjs.cloudflare.com.

### Font loading

Noto Sans JP and Noto Serif JP are lazy-loaded after initial render using `requestIdleCallback`. Font Awesome is lazy-loaded on first interaction with the help button or offcanvas menu. CSS classes `fonts-loaded` and `icons-loaded` are added to `<html>` after each loads successfully.

## Key constraints

- No ESLint/Prettier configured — match the existing code style manually.
- `tsconfig.json` enforces `strict`, `noUnusedLocals`, and `noUnusedParameters`; eliminate all unused variables before committing.
- Do not import modules inside `index.html` — it only bootstraps `src/main.ts`.
- `dist/` is generated; never commit manual changes to it.
- The `@ts-ignore` on `html2pdf.js` is intentional — no types package exists.

## Action History
Record a summary of all user commands and their results in the project's `.claude/histories/{YYYYMM}.md` file in the following format. Before executing a command, check the most recent history to determine what the user wants to do and then decide on an action.