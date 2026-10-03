import './resume.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/app.tsx';
import { registerServiceWorker } from './features/pwa-update.ts';

// PWA Service Worker を登録（手動更新フロー）。React の描画前でもイベントを取りこぼさない
registerServiceWorker();

/**
 * アプリの初期化。#app へ React を描画します（保存データの復元は useResumeForm が行います）。
 */
window.addEventListener('DOMContentLoaded', () => {
  const appEl = document.querySelector('#app');
  if (!appEl) return;
  createRoot(appEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
