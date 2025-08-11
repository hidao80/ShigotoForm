# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript sources (`main.ts`, `resume.ts`, `models/Resume.ts`, `db.ts`, `theme.ts`) and styles (`resume.css`).
- `public/`: Static assets and PWA icons (referenced by Vite PWA).
- `index.html`: App entry. Do not import modules here that belong in `src/`.
- `dist/`: Build output (generated). Do not commit manual changes.
- Config: `vite.config.js` (PWA + HTTPS dev), `tsconfig.json` (strict), `package.json`.

## Build, Test, and Development Commands
- Install: `pnpm i` (preferred) or `npm ci`.
- Dev server: `pnpm dev` or `npm run dev` (Vite, HTTPS via `@vitejs/plugin-basic-ssl`).
- Build: `pnpm build` or `npm run build` (TypeScript type-check then Vite build to `dist/`).
- Preview: `pnpm preview` or `npm run preview` (serve built `dist/`).
- Type-check only: `pnpm exec tsc --noEmit`.

## Coding Style & Naming Conventions
- Language: TypeScript (ES2020 modules). Strict mode is enabled; keep code free of unused vars/params.
- Indentation: 2 spaces; semicolons required; single quotes preferred.
- Naming: `PascalCase` for types/interfaces, `camelCase` for variables/functions, `kebab-case` for files except Type types (e.g., `models/Resume.ts`).
- Imports: Use relative paths from `src/`. Keep side effects out of module top-level when possible.
- Lint/format: No ESLint/Prettier configured; match existing style and run `tsc` before pushing.

## Testing Guidelines
- Framework: None configured yet. For changes, verify manually via `pnpm dev` and `pnpm preview` builds.
- Suggested addition (future): Vitest for unit tests; Playwright for E2E.
- Ad hoc checks: Validate PDF export, PWA registration, and IndexedDB (Dexie) flows.
- Place future tests under `tests/` mirroring `src/` structure; name files `*.spec.ts`.

## Commit & Pull Request Guidelines
- Commits: Use concise, present-tense messages. Existing history favors emoji + type prefixes (e.g., `:bug: Fix date parsing`, `:art: Tweak UI spacing`, `:mag: Add OGP tags`). Group related changes.
- Branches: `feat/…`, `fix/…`, `chore/…`.
- PRs: Follow `.github/pull_request_template.md`. Include what/why/how, local testing notes, and screenshots/gifs for UI changes. Link related issues (e.g., `Fixes #123`).

## Security & Configuration Tips
- No secrets or backend; all data stays client-side (Dexie/IndexedDB). Keep sensitive logic on-client only.
- Assets: Add icons/images under `public/` and reference relative paths used by the PWA manifest.
- HTTPS dev is enabled for service worker tests; disable by removing `basicSsl()` in `vite.config.js` if not needed.

## Global configurations
- Please respond in Japanese for all interactions
