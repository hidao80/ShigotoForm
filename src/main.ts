import './resume.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import Modal from 'bootstrap/js/dist/modal';

// Font Awesome をローカルにバンドル
// Font Awesome は遅延読み込み
// window.bootstrapが未定義の場合にModalをセット
if (!(window as unknown as Record<string, unknown>).bootstrap) {
  (window as unknown as Record<string, unknown>).bootstrap = { Modal };
}

import * as AutoKana from 'vanilla-autokana';
import packageJson from '../package.json';
import { appShellHtml } from './components/app-shell.ts';
import { loadResume } from './db.ts';
import { setupAccordionInitialState } from './features/accordion.ts';
import { setupAgeDisplay } from './features/age-display.ts';
import { setupAutoSave } from './features/auto-save.ts';
import { setupBackup } from './features/backup.ts';
import { setupDeleteContent } from './features/delete-content.ts';
import { setupHelpButtons } from './features/help.ts';
import { preloadIconsOnFirstInteraction, scheduleLazyAssets } from './features/lazy-assets.ts';
import { setupPdfDownload } from './features/pdf-download.ts';
import { setupFontSwitch, setupPreviewModal } from './features/preview-modal.ts';
import { registerServiceWorker, setupUpdateLink } from './features/pwa-update.ts';
import { jsonToFormResume } from './features/resume-json.ts';
import * as Resume from './resume.ts';
import { loadToForm } from './resume.ts';
import * as Theme from './theme.ts';

// PWA Service Worker を登録（手動更新フロー）
registerServiceWorker();

/**
 * アプリの初期化。DOM構築・各機能のイベント設定・IndexedDBからの復元を行います。
 */
window.addEventListener('DOMContentLoaded', async () => {
  // 初期レンダリング後のアイドル時間にフォントを遅延読み込み
  scheduleLazyAssets();

  const appEl = document.querySelector('#app');
  if (!appEl) return;
  appEl.innerHTML = appShellHtml();

  // 初回のアイコン使用時に即時ロード（FOUT軽減）。対象ボタンは描画後にのみ存在する
  preloadIconsOnFirstInteraction();

  setupHelpButtons();
  setupUpdateLink();

  AutoKana.bind('#name-input', '#furigana-input');

  Theme.addThemeSwitchEventListener();

  setupAccordionInitialState();

  // IndexedDBから初期化・復元
  const resumeJson = await loadResume();
  if (resumeJson) {
    loadToForm(jsonToFormResume(resumeJson));
  }
  Resume.addHistoryEventListener();
  Resume.addLicenseEventListener();
  // 「履歴書を表示」ボタンを有効化
  const showResumeBtn = document.querySelector('#show-resume') as HTMLButtonElement | null;
  if (showResumeBtn) showResumeBtn.disabled = false;

  setupAutoSave();
  setupAgeDisplay();
  setupBackup();
  setupDeleteContent();
  setupPreviewModal();
  setupPdfDownload();

  const versionNo = document.querySelector('#version-no');
  if (versionNo) versionNo.textContent = packageJson.version;

  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }

  setupFontSwitch();
});
