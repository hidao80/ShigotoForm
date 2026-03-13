# Configuration

## `package.json`

| Field | Value |
|---|---|
| `name` | `shigotoform` |
| `version` | `0.0.5 alpha` |
| `type` | `module` (ESM) |
| `packageManager` | pnpm (inferred from project conventions) |

### Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | HTTPS dev server on https://localhost:5173 |
| `build` | `tsc && vite build` | Type-check then bundle to `dist/` |
| `preview` | `vite preview` | Serve built `dist/` |
| `lint` | `biome check src/ && tsc --noEmit` | Biome lint + TypeScript type check |
| `format` | `biome format --write src/` | Auto-format with Biome |
| `test` | `playwright test` | Run all Playwright E2E tests |
| `test:e2e` | `playwright test` | Same as `test` |
| `test:e2e:ui` | `playwright test --ui` | Interactive Playwright UI mode |
| `test:e2e:headed` | `playwright test --headed` | Headed browser mode |
| `screenshot` | `playwright test tests/e2e/screenshot.spec.ts` | Capture viewport screenshots |

### Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@fontsource/noto-sans-jp` | `^5.2.9` | Noto Sans JP (lazy-loaded) |
| `@fontsource/noto-serif-jp` | `^5.2.8` | Noto Serif JP (lazy-loaded) |
| `@fortawesome/fontawesome-free` | `6.4.0` | Icons (lazy-loaded) |
| `@vitejs/plugin-basic-ssl` | `^1.2.0` | HTTPS for dev server |
| `bootstrap` | `^5.3.8` | UI framework |
| `dexie` | `^4.2.1` | IndexedDB wrapper |
| `html2pdf.js` | `^0.14.0` | PDF export (html2canvas + jsPDF) |
| `vanilla-autokana` | `^1.3.0` | Furigana auto-completion |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@biomejs/biome` | `^1.9.4` | Linter + formatter |
| `@playwright/test` | `^1.49.0` | E2E test framework |
| `@types/bootstrap` | `^5.2.10` | Bootstrap type stubs |
| `@vite-pwa/workbox-window` | `^8.0.0` | SW registration client |
| `typescript` | `~5.6.3` | TypeScript compiler |
| `vite` | `^6.4.1` | Build tool |
| `vite-plugin-pwa` | `^0.21.2` | PWA / Service Worker generation |

### pnpm Overrides

```json
"pnpm": {
  "overrides": {
    "serialize-javascript": ">=7.0.3"
  }
}
```
Forces `serialize-javascript` to a patched version to resolve a known vulnerability.

---

## `vite.config.js`

- **HTTPS in dev**: `basicSsl()` plugin added only when `command === 'serve'`
- **PWA** via `VitePWA`:
  - `injectRegister: false` — SW registration is handled manually by `workbox-window`
  - `manifest.id`: `/`, `start_url`: `/`, `display`: `standalone`, `lang`: `ja`
  - Icons: webp at 32/48/64/72/128/256/512 px + png at 32 px
  - `workbox.clientsClaim: true`, `skipWaiting: true`
  - `globPatterns`: caches all js/css/html/ico/png/svg/webp/woff/woff2
  - `additionalManifestEntries`: pre-caches `index.html` + Font Awesome CDN assets (css + woff2 for solid, regular, brands)
  - `navigateFallback`: `/index.html`
  - `cleanupOutdatedCaches: true`
  - Runtime caching rules:
    - Images (`CacheFirst`, 30 days, max 200 entries)
    - CDN CSS (`StaleWhileRevalidate`)
    - CDN fonts (`CacheFirst`, 1 year, max 50 entries)
    - Remote images from `shigotoform.netlify.app` (`CacheFirst`, 30 days)
  - `devOptions.enabled`: true when `command === 'serve'`, type `module`

---

## `tsconfig.json`

TypeScript strict mode (`strict: true`) with `noUnusedLocals` and `noUnusedParameters` enforced. Target: ES2020. Module resolution: bundler (Vite).

---

## `biome.json`

| Setting | Value |
|---|---|
| VCS integration | git, honours `.gitignore` |
| Ignored paths | `dist/`, `node_modules/` |
| Indent style | space, width 2 |
| Line width | 120 |
| Quote style | single |
| Trailing commas | all |
| Semicolons | always |
| `noExplicitAny` | warn |
| Recommended rules | enabled |
| Organize imports | enabled |

---

## `playwright.config.ts`

| Setting | Value |
|---|---|
| Test directory | `./tests/e2e` |
| Base URL | `https://localhost:5173` |
| Browser | Chromium only |
| HTTPS errors | ignored (`ignoreHTTPSErrors: true`) |
| Trace | on first retry |
| Screenshot | on failure only |
| CI retries | 2 |
| CI workers | 1 |
| Reporter | HTML |
| Web server | `pnpm run dev` (reused if not CI) |

### Projects (Viewports)

| Name | Width | Height |
|---|---|---|
| `mobile` | 375 | 812 |
| `tablet` | 768 | 1024 |
| `fhd` | 1920 | 1080 |

---

*Created at commit: de529fb*
