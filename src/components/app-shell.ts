import { confirmDeleteModalHtml } from './confirm-delete-modal.ts';
import { helpModalHtml } from './help-modal.ts';
import { navbarHtml } from './navbar.ts';
import { offcanvasMenuHtml } from './offcanvas-menu.ts';
import { resumeFormHtml } from './resume-form.ts';

/**
 * アプリ全体（#app 直下）のHTMLを組み立てます。
 * @returns {string} HTML文字列
 */
export function appShellHtml(): string {
  return `
<a href="#main" class="skip-link">本文へスキップ</a>
${helpModalHtml()}
${navbarHtml()}

${offcanvasMenuHtml()}

<div class="resume">
${resumeFormHtml()}
${confirmDeleteModalHtml()}
</div>
`;
}
