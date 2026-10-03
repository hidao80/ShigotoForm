# ShigotoForm

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Accessibility](https://img.shields.io/badge/Accessibility-Validated-blue)](#)
![Audit](https://github.com/hidao80/ShigotoForm/actions/workflows/audit.yml/badge.svg)
![Lint](https://github.com/hidao80/ShigotoForm/actions/workflows/lint.yml/badge.svg)
![Build](https://github.com/hidao80/ShigotoForm/actions/workflows/build.yml/badge.svg)
![Test](https://github.com/hidao80/ShigotoForm/actions/workflows/test.yml/badge.svg)
[![Netlify Status](https://api.netlify.com/api/v1/badges/d7518453-f8ce-435d-a995-aecb75f57f44/deploy-status)](https://app.netlify.com/projects/shigotoform/deploys)
[![Security: Takumi Guard](https://img.shields.io/badge/Security-Takumi%20Guard-blue)](https://github.com/flatt-security/setup-takumi-guard-npm)
[![Ask DeepWiki](https://img.shields.io/badge/Ask_DeepWiki-007ec6?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAPoAAAD6AG1e1JrAAACIUlEQVRYw%2B2XP2gUQRTGv7d3JhYWQawkIBaCVWzETos0gmAnVoKNTSoLK0E7EQQrC20sBVFBtLPQRgTBtBaKjYgIQUSxiJq7fT%2BLvCGPJZdNLt4dQj5Y3u7sznzfzLw%2Fs9IO%2FicANiniCujEfWdsQgBLxAbsbraPZcmBfcAt4DNwKQsZNfEUsAB8YRV12LfA6ZHuedg7AO7ed%2Fc%2BUBcbQhbiu%2B6wXIM6EnZWkszMJe2Ke0n6I2la0v51hFeSMLN6OwIK6jJwEBdUYb2MAxRSz6sY4geiahFgLe1Hwq6YWe3us8AN4FQQU4QM64SPY69Xyr43fADgNjAPXHb3peSsD4FDQ0VLEjAHvIhBPS6AHvA1bBO9JPAXcHFbIRtJ5yzwIQZ9CZwAusDJENIkLqsG8DpNyIZJwSUk9wLHgakcesC1JCCjiHm1kYDNOEjptCxpSVK%2F8f73OFLxPLAYM3oCzEX7MXf%2FlJbc%2F8kWpA4HgQdpYI9IWAbeh83whi84cHXL%2B58EPBoQhnmm94EzwE3gZ2p%2FDhzdbhg%2BTaRr01x7ftb4%2FjBwFzjXrCvDpmLW9crVLNeR9CaapoGemb2TdCERW1tNaBNQ8jktwmozqwtpqRNtdWAjARYk39IS12ZWRX7vmJmA71nQZgi36gN7gCvAj5xc3P0jcH7kx7Ik5IC73wsh14GZsZySow5002l4Jr0b6%2Bm4eSyvpAn8lEzsx2QHo8RfUrlN%2BuPq4ksAAAAASUVORK5CYII%3D&labelColor=010101)](https://deepwiki.com/hidao80/ShigotoForm)

**Desktop**

![Accessibility](https://img.shields.io/badge/Accessibility-100-brightgreen?style=flat-square)
![Best_Practices](https://img.shields.io/badge/Best_Practices-100-brightgreen?style=flat-square)
![Performance](https://img.shields.io/badge/Performance-100-brightgreen?style=flat-square)
![SEO](https://img.shields.io/badge/SEO-100-brightgreen?style=flat-square)
![WebMCP](https://img.shields.io/badge/WebMCP-4%2F4-brightgreen?style=flat-square)

**Mobile**

![Accessibility](https://img.shields.io/badge/Accessibility-100-brightgreen?style=flat-square)
![Best_Practices](https://img.shields.io/badge/Best_Practices-100-brightgreen?style=flat-square)
![Performance](https://img.shields.io/badge/Performance-96-brightgreen?style=flat-square)
![SEO](https://img.shields.io/badge/SEO-100-brightgreen?style=flat-square)
![WebMCP](https://img.shields.io/badge/WebMCP-4%2F4-brightgreen?style=flat-square)

*Tested on 2026-10-03 with Lighthouse in Microsoft Edge 154.0.4258.48*

***Your resume, your device — private by design.***

- **Private**: Your personal data never leaves your device — no accounts, no uploads.
- **Offline-ready**: Works without internet once installed as a PWA via Service Worker.
- **Print-perfect**: Exports A4-accurate PDFs with Gothic or Mincho Japanese font choice.
- **Agent-ready**: The input form is annotated for WebMCP, so AI agents in WebMCP-capable browsers can fill it in.

## Overview

ShigotoForm is a **client-side PWA** for creating Japanese-style resumes.
All data is stored in your browser's IndexedDB and never transmitted anywhere.
Fill in the form, preview in A4 layout, and download a high-resolution PDF —
no account, no backend, no privacy risk.

## Issues & Reasons

- **Cloud exposure**: Most resume tools upload your data to a server — ShigotoForm runs entirely client-side; nothing is ever transmitted.
- **No Japanese support**: Western PDF tools lack the Japanese resume（履歴書）layout — ShigotoForm renders it with proper Japanese font support.
- **Paywalled PDF export**: Most tools charge for PDF output — ShigotoForm generates PDFs locally using html2pdf.js, for free.
- **Data loss on device switch**: Switching devices without a backup means losing your data — use JSON export/import to back up and restore anywhere.

[:rocket: **Live Demo**](https://shigotoform.netlify.app/)

## :lock: Security & Privacy

- **Client-side only**: No data transmission to external servers
- **Local storage**: All data remains in your browser
- **Privacy-first**: Designed with personal data protection in mind
- **HTTPS enforced**: The Netlify deployment sends a `Strict-Transport-Security` header (see [public/_headers](public/_headers))
- **Future enhancement**: Local encryption planned for additional security

## :rocket: Quick Start

### Run with Docker

```bash
# Development with hot reload
docker compose up dev

# Production build (nginx, http://localhost)
docker compose up prod
# or
docker build -t shigotoform .
docker run -p 80:80 shigotoform
```

### Run locally

```bash
git clone https://github.com/hidao80/ShigotoForm.git
cd ShigotoForm
bun install
bun dev
```

This will start the development server on `https://localhost:5173`.

### Development commands

```bash
bun run build         # Type-check (tsc) → Vite build → dist/
bun run preview       # Serve the built dist/ locally
bun run lint          # Biome check + tsc --noEmit
bun run format        # Biome auto-format
bun run test          # Vitest: unit (jsdom) + E2E (Chromium via Playwright)
bun run test:unit     # Unit tests only
bun run test:e2e      # E2E tests only (first run: bunx playwright install chromium)
bun run screenshot    # Capture screenshots across all viewports
```

## :open_book: Usage

### Input Instructions

1. **Full Name**: Enter your full name in the text box. Furigana will be auto-filled to some extent.
2. **Date of Birth**: Select a date from the calendar or enter it in YYYY/MM/DD format.
3. **Address**: Enter your postal code and full address.
4. **Phone Number**: Enter numbers in half-width digits without hyphens.
5. **Email Address**: Enter a valid email address format.
6. **Education/Work History**: Enter your educational and work history in a list format. You can add or remove rows using the "Add" or "Delete" buttons.
7. **Qualifications/Licenses**: Enter your qualifications and licenses in a list format. You can add or remove rows using the "Add" or "Delete" buttons.

## :sparkles: Features

### Import/Export

You can export the entered resume information to a JSON file or import a previously exported JSON file.  
Open the menu from the hamburger button at the top right and click the "Export" or "Import" button.

When exporting, a JSON file will be downloaded.  
When importing, select a JSON file from your device and the input screen will be updated immediately.

### Preview

The content entered on the input screen can be previewed in A4 paper size.  
Click "Show resume" in the menu to open the preview (enabled once there is input).  
You can select either Gothic or Mincho font.

Click "Download Resume PDF" at the bottom of the preview to save as PDF.

### Auto-save

Everything you type is saved to IndexedDB automatically, including added or removed education/work and license rows.
Reopening the app restores your last input.

### Dark mode

Switch between light and dark themes with the "Dark mode" toggle in the menu. Your choice is remembered on your device.

### Delete input

Click "Delete input" in the menu to clear all saved data (a confirmation dialog is shown first).

### WebMCP

The input form declares a WebMCP tool (`fill-resume-basic-info`) via declarative annotations (`toolname` / `tooldescription` on the form, `toolparamdescription` on each field, including dynamically added education/work and license rows).
In a browser with WebMCP enabled (experimental, e.g. Microsoft Edge with the feature turned on from `edge://flags`), an AI agent can discover the form and fill it in. Everything still runs locally; no data is sent anywhere.

### Help & app updates

The help button (?) in the header opens a usage guide.
When a new version is available, click "App update" in the menu to apply it.

## :camera_flash: Screenshots

<details>
<summary><strong>1. Input Screen</strong></summary>
<img width="600" alt="Input Screen" src="https://github.com/user-attachments/assets/01a0c251-604e-4536-8c74-9b74bed8fff6">
</details>
<br>

<details>
<summary><strong>2. Menu</strong></summary>
<img width="200" alt="Menu" src="https://github.com/user-attachments/assets/f52b7b3f-87c2-44e7-8fd0-eb458391a5f9">
</details>
<br>

<details>
<summary><strong>3. Preview (Gothic Font)</strong></summary>
<img width="600" alt="Preview (Gothic Font)" src="https://github.com/user-attachments/assets/50bf681b-34f1-4d8d-9ddd-0efa1905d911">
</details>
<br>

<details>
<summary><strong>4. Preview (Mincho Font)</strong></summary>
<img width="600" alt="Preview (Mincho Font)" src="https://github.com/user-attachments/assets/f2ab3688-2c8c-437e-b42c-7424b81b87ee">
</details>

## :hammer_and_wrench: Technology Choices

### Why Dexie over localStorage?
- Larger storage capacity for resume data
- Better async handling with Promise-based API
- TypeScript integration for type safety

### Why html2pdf.js?
- Client-side processing (no server required)
- High-quality Japanese font rendering
- Customizable PDF layout control

### Other stack
- **Build / PWA**: Vite + vite-plugin-pwa (Workbox Service Worker), TypeScript (strict)
- **UI**: Bootstrap 5, Font Awesome, Noto Sans/Serif JP (lazy-loaded), vanilla-autokana (furigana)
- **Quality**: Biome (lint/format), Vitest (unit: jsdom / E2E: Browser Mode + Playwright Chromium)
- **Hosting**: Netlify (HTTP headers via `public/_headers`); `public/llms.txt` describes the site for LLMs / AI agents

## :wheelchair: Accessibility Compliance

**WAVE Accessibility Evaluation Results:**
- :white_check_mark: **0 Errors** - No accessibility violations detected
- :white_check_mark: **0 Contrast Errors** - All text meets WCAG color contrast requirements  
- :white_check_mark: **0 Alerts** - No items flagged for manual review

*Tested on 2026-10-03 with the [WAVE Evaluation Tool](https://chromewebstore.google.com/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh) Chrome extension (3.3.1.0)*

## :handshake: Contributing

Bug reports and pull requests are welcome.  
Please note that this project uses [Takumi Guard](https://github.com/flatt-security/setup-takumi-guard-npm) in CI workflows to scan dependencies for malware and ensure supply chain security. This scanning only applies to CI and does not affect your local development environment.

## :page_facing_up: License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
