---
description: TypeScript/Biome coding conventions (ShigotoForm project)
paths: ["src/**/*.ts", "src/**/*.css"]
---

# Code Style

## TypeScript

- Indent: **2 spaces**, semicolons required, single quotes preferred
- Types/interfaces: `PascalCase` (e.g. `ResumeJson`, `Career`)
- Variables/functions: `camelCase` (e.g. `saveFromForm`, `loadToForm`)
- File names: `kebab-case` (exception: type files like `models/Resume.ts`)
- `strict` mode is enabled. Remove unused variables immediately — `noUnusedLocals` / `noUnusedParameters` cause compile errors
- `any` is `warn`-level (Biome). Only allowed for external libraries without type stubs
- Imports use relative paths from `src/`. Avoid module-level side effects

## Biome (Linter / Formatter)

- Line width: 120 characters
- Trailing commas: always
- Import sorting: enabled (Biome organizer)
- Ensure `pnpm lint` passes before committing

## CSS (resume.css)

- Any changes to A4 layout values (210mm × 297mm) must be visually verified via PDF output
- Theme is controlled via Bootstrap 5 `data-bs-theme` — do not write `color`/`background` directly
- Font families are conditionally applied via `.fonts-loaded` class (matches lazy-load timing)

## DOM Manipulation

- Dynamic rows (career/license) must be created via `createCareerRow()` / `createLicenseRow()`
- After adding a row, always call `attachCareerRowListeners()` / `attachLicenseRowListeners()`
- `MutationObserver` auto-attaches listeners — avoid duplicate manual registration
