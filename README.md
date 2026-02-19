# ShigotoForm

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)&emsp;[![Accessibility](https://img.shields.io/badge/Accessibility-Validated-blue)](#)&emsp;![Audit](https://github.com/hidao80/ShigotoForm/actions/workflows/audit.yml/badge.svg)&emsp;![Lint](https://github.com/hidao80/ShigotoForm/actions/workflows/lint.yml/badge.svg)&emsp;![Build](https://github.com/hidao80/ShigotoForm/actions/workflows/build.yml/badge.svg)&emsp;[![Netlify Status](https://api.netlify.com/api/v1/badges/d7518453-f8ce-435d-a995-aecb75f57f44/deploy-status)](https://app.netlify.com/projects/shigotoform/deploys)&emsp;[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/hidao80/ShigotoForm)

![Accessibility](https://img.shields.io/badge/Accessibility-100-brightgreen?style=flat-square)&emsp;![Best_Practices](https://img.shields.io/badge/Best_Practices-96-brightgreen?style=flat-square)&emsp;![Performance](https://img.shields.io/badge/Performance-84-yellow?style=flat-square)&emsp;![SEO](https://img.shields.io/badge/SEO-100-brightgreen?style=flat-square)&emsp;*Tested on: 2026-02-19 using [lighthouse-badges](https://github.com/hidao80/lighthouse-badges)*

***Your resume, your device — private by design.***

- **Private**: Your personal data never leaves your device — no accounts, no uploads.
- **Offline-ready**: Works without internet once installed as a PWA via Service Worker.
- **Print-perfect**: Exports A4-accurate PDFs with Gothic or Mincho Japanese font choice.

## Overview

ShigotoForm is a **client-side PWA** for creating Japanese-style resumes.
All data is stored in your browser's IndexedDB and never transmitted anywhere.
Fill in the form, preview in A4 layout, and download a high-resolution PDF —
no account, no backend, no privacy risk.

## Issues & Reasons

- **Cloud exposure**: Most resume tools upload your data to a server — ShigotoForm runs entirely client-side; nothing is ever transmitted.
- **No Japanese support**: Western PDF tools lack the JIS-standard resume（履歴書）layout — ShigotoForm renders it with proper Japanese font support.
- **Paywalled PDF export**: Most tools charge for PDF output — ShigotoForm generates PDFs locally using html2pdf.js, for free.
- **Data loss on device switch**: Switching devices without a backup means losing your data — use JSON export/import to back up and restore anywhere.

[:rocket: **Live Demo**](https://shigotoform.netlify.app/)

## :lock: Security & Privacy

- **Client-side only**: No data transmission to external servers
- **Local storage**: All data remains in your browser
- **Privacy-first**: Designed with personal data protection in mind
- **Future enhancement**: Local encryption planned for additional security

## :rocket: Quick Start

### Run with Docker

```bash
# Development with hot reload
docker compose up dev

# Production build
docker build -t shigotoform .
docker run -p 80:80 shigotoform
```

### Run locally

```bash
git clone https://github.com/hidao80/ShigotoForm.git
cd ShigotoForm
pnpm install
pnpm dev
```

This will start the development server on `https://localhost:5173`.

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
You can select either Gothic or Mincho font.

Click "Download Resume PDF" at the bottom of the preview to save as PDF.

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

## :wheelchair: Accessibility Compliance

**WAVE Accessibility Evaluation Results:**
- :white_check_mark: **0 Errors** - No accessibility violations detected
- :white_check_mark: **0 Contrast Errors** - All text meets WCAG color contrast requirements  
- :warning: **2 Alerts** - Minor suggestions for enhancement
- :dart: **1 Feature** - Accessibility features properly implemented

*Tested with WAVE Web Accessibility Evaluator on 2025-08-11*

## :handshake: Contributing

Bug reports and pull requests are welcome.

## :page_facing_up: License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
