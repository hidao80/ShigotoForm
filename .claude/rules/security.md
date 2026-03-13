---
description: Security guidelines (ShigotoForm project)
paths: ["src/**/*.ts", "Dockerfile", ".github/workflows/**"]
---

# Security Guidelines

## Data Handling

- **No backend, no network transmission**: all data is stored exclusively in IndexedDB (Dexie). Do not add external API calls
- `ResumeJson` including photo data (Base64) exists only in IndexedDB — do not write to `localStorage` or cookies
- JSON export is client-side only via `<a download>`. No server uploads

## Dependencies

- `pnpm audit --audit-level=high` runs automatically in CI (audit.yml). Address high/critical vulnerabilities immediately
- When overriding supply-chain vulnerabilities via `package.json` `overrides`, leave a comment explaining why
- Takumi Guard supply-chain scanning is enabled in CI. Evaluate new dependencies before adding them

## PDF / HTML Generation

- User input passed to `generateResumeHtml()` must be inserted via `textContent` to prevent XSS from direct innerHTML expansion
- Do not dynamically inject external styles or scripts inside the `html2pdf.js` `onclone` callback

## PWA / Service Worker

- Only use `vite-plugin-pwa` GenerateSW strategy. Do not add external-origin fetches in custom SW files
- Workbox runtime cache is for fonts and CDN assets only. Do not cache API responses

## Docker / CI

- Dockerfile uses multi-stage build. Do not include `devDependencies` in the runner stage
- Reference secrets in CI workflows only via `${{ secrets.XXX }}` — never hardcode them
- Pin external GitHub Actions to a version tag (e.g. `@v4`)
- nginx.conf serves only SPA fallback (`try_files $uri /index.html`). Directory listing is disabled

## Development Environment

- The HTTPS dev server (`@vitejs/plugin-basic-ssl`) is for Service Worker testing only — do not use as a production certificate
- `.env` files do not exist (secrets-free architecture). Do not accidentally create or commit one
