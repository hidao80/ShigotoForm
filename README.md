# ShigotoForm

[![Netlify Status](https://api.netlify.com/api/v1/badges/d7518453-f8ce-435d-a995-aecb75f57f44/deploy-status)](https://app.netlify.com/projects/shigotoform/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Accessibility](https://img.shields.io/badge/Accessibility-Validated-blue)](#)
![Lint](https://github.com/hidao80/ShigotoForm/actions/workflows/lint.yml/badge.svg)
![Audit](https://github.com/hidao80/ShigotoForm/actions/workflows/audit.yml/badge.svg)

ShigotoForm is a project designed to help job seekers, students, and career changers easily and quickly create professional PDF resumes and streamline the job application process. With an intuitive interface and no technical skills required, users can build a professional-quality resume efficiently. All user data is stored locally in the browser and never transmitted to any servers, ensuring maximum privacy. Saved resume data can be exported and imported as JSON files for easy backup or transfer.

This README provides an overview of the project, setup instructions, and contribution guidelines.

## Table of Contents

- [Security & Privacy](#lock-security--privacy)
- [Installation](#installation)
- [Usage](#usage)
- [Screenshots](#camera_flash-screenshots)
- [Technology choices](#hammer_and_wrench-technology-choices)
- [Performance Metrics](#zap-performance-metrics)
- [Accessibility Compliance](#wheelchair-accessibility-compliance)
- [Contributing](#busts_in_silhouette-contributing)
- [License](#page_facing_up-license)

## :lock: Security & Privacy

- **Client-side only**: No data transmission to external servers
- **Local storage**: All data remains in your browser
- **Privacy-first**: Designed with personal data protection in mind
- **Future enhancement**: Local encryption planned for additional security

## Installation

To install ShigotoForm, follow these steps:

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/ShigotoForm.git
    ```

2. Navigate to the project directory:

    ```bash
    cd ShigotoForm
    ```

3. Install the necessary dependencies:

    ```bash
    npm install
    ```

## Quick Start

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
npm install
npm run dev
```

This will start the development server on `https://localhost:5173`.

## Usage

### Input Instructions

1. **Full Name**: Enter your full name in the text box. Furigana will be auto-filled to some extent.
2. **Date of Birth**: Select a date from the calendar or enter it in YYYY/MM/DD format.
3. **Address**: Enter your postal code for auto-completion. Please enter the detailed address manually.
4. **Phone Number**: Enter numbers in half-width digits without hyphens.
5. **Email Address**: Enter a valid email address format.
6. **Education/Work History**: Enter your educational and work history in a list format. You can add or remove rows using the "Add" or "Delete" buttons.
7. **Qualifications/Licenses**: Enter your qualifications and licenses in a list format. You can add or remove rows using the "Add" or "Delete" buttons.

### Import/Export

You can export the entered resume information to a JSON file or import a previously exported JSON file.  
Open the menu from the hamburger button at the top right and click the "Export" or "Import" button.

When exporting, a JSON file will be downloaded.  
When importing, select a JSON file from your device and the input screen will be updated immediately.

### Preview

The content entered on the input screen can be previewed in A4 paper size.  
At this time, you can select either Gothic or Mincho font.

By clicking the "Download Resume PDF" button at the bottom right of the preview screen, you can download the preview content as a PDF.

## :camera_flash: Screenshots

1. **Input Screen**:  
<img width="600" alt="Input Screen" src="https://github.com/user-attachments/assets/01a0c251-604e-4536-8c74-9b74bed8fff6">

2. **Menu**:  
<img width="200" alt="Menu" src="https://github.com/user-attachments/assets/f52b7b3f-87c2-44e7-8fd0-eb458391a5f9">

3. **Preview (Gothic Font)**:  
<img width="600" alt="Preview (Gothic Font)" src="https://github.com/user-attachments/assets/50bf681b-34f1-4d8d-9ddd-0efa1905d911">

4. **Preview (Mincho Font)**:  
<img width="600" alt="Preview (Mincho Font)" src="https://github.com/user-attachments/assets/f2ab3688-2c8c-437e-b42c-7424b81b87ee">

## :hammer_and_wrench: Technology Choices

### Why Dexie over localStorage?
- Larger storage capacity for resume data
- Better async handling with Promise-based API
- TypeScript integration for type safety

### Why html2pdf.js?
- Client-side processing (no server required)
- High-quality Japanese font rendering
- Customizable PDF layout control

## :zap: Performance Metrics

### :iphone: Mobile Results
- :yellow_circle: **Performance**: 73/100
- :green_circle: **Accessibility**: 100/100
- :green_circle: **Best Practices**: 96/100
- :green_circle: **SEO**: 100/100

#### Core Web Vitals
- :red_circle: **First Contentful Paint**: 4.2s
- :red_circle: **Largest Contentful Paint**: 4.6s
- :green_circle: **Total Blocking Time**: 0ms
- :green_circle: **Cumulative Layout Shift**: 0
- :red_circle: **Speed Index**: 4.2s

### :desktop_computer: Desktop Results
- :green_circle: **Performance**: 99/100
- :green_circle: **Accessibility**: 96/100
- :green_circle: **Best Practices**: 100/100
- :green_circle: **SEO**: 100/100

#### Core Web Vitals
- :green_circle: **First Contentful Paint**: 0.8s
- :green_circle: **Largest Contentful Paint**: 0.9s
- :green_circle: **Total Blocking Time**: 0ms
- :green_circle: **Cumulative Layout Shift**: 0
- :green_circle: **Speed Index**: 0.9s

*Tested on: 2025-08-11 using Google PageSpeed Insights*

## :wheelchair: Accessibility Compliance

**WAVE Accessibility Evaluation Results:**
- :white_check_mark: **0 Errors** - No accessibility violations detected
- :white_check_mark: **0 Contrast Errors** - All text meets WCAG color contrast requirements  
- :warning: **2 Alerts** - Minor suggestions for enhancement
- :dart: **1 Feature** - Accessibility features properly implemented

*Tested with WAVE Web Accessibility Evaluator on 2025-08-11*

## :busts_in_silhouette: Contributing

We welcome contributions to ShigotoForm! To contribute, follow these steps:

1. Fork the repository.
2. Create a new branch:

    ```bash
    git checkout -b feature-branch
    ```

3. Make your changes and commit them:

    ```bash
    git commit -m "Description of changes"
    ```

4. Push to the branch:

    ```bash
    git push origin feature-branch
    ```

5. Create a pull request.

## :world_map: Roadmap

### Planned Improvements
- [ ] React + TypeScript migration
- [ ] Enhanced accessibility testing

## :page_facing_up: License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
