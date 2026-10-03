import { Workbox } from '@vite-pwa/workbox-window';
import { showToast } from '../components/toast.ts';

// Workbox インスタンス（手動更新用に外でも参照）
let wb: Workbox | null = null;
let updateReady = false;
let manualCheck = false;

/**
 * PWA Service Worker を workbox-window で登録します（手動更新フロー）。
 * @returns {void}
 * @throws なし
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const options = import.meta.env.DEV ? { type: 'module' as const } : undefined;
  wb = new Workbox('/sw.js', options);

  // 新バージョンが waiting になったら、リンクから手動適用できる状態にする
  wb.addEventListener('waiting', () => {
    updateReady = true;
    const status = document.getElementById('pwa-update-status');
    if (status) status.textContent = '新しいバージョンがあります';
    if (manualCheck) {
      showToast('新しいバージョンがあります。もう一度クリックで適用します。', 'info', 5000);
    }
  });

  // コントロール切替後にリロードして最新反映
  wb.addEventListener('controlling', () => {
    window.location.reload();
  });

  // インストール完了（更新なし/初回インストール）
  wb.addEventListener('installed', (event) => {
    if (manualCheck) {
      if (event?.isUpdate === false) {
        showToast('最新の状態です。', 'success', 2500);
      }
    }
  });

  wb.register();
}

/**
 * アプリのアップデート（手動更新）リンクにイベントリスナーを追加します。
 * @returns {void}
 * @throws なし
 */
export function setupUpdateLink() {
  const updateLink = document.getElementById('pwa-update-link');
  const updateStatus = document.getElementById('pwa-update-status');
  if (updateLink) {
    updateLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!wb) {
        // SW未対応環境は単純リロード
        window.location.reload();
        return;
      }
      if (updateStatus) updateStatus.textContent = '更新を確認中…';
      manualCheck = true;
      const clearMsg = showToast('更新を確認中…', 'info', 8000);
      try {
        if (updateReady) {
          // すでにwaitingなら即適用
          await wb.messageSkipWaiting();
        } else {
          // 更新チェックを実行
          await wb.update();
          // 一部環境では waiting が即発火しないことがあるためフォールバック
          setTimeout(() => {
            if (!updateReady) {
              // waiting になっていない = 更新なしの可能性が高い
              showToast('最新の状態です。', 'success', 2500);
              if (updateStatus) updateStatus.textContent = '';
              manualCheck = false;
            }
          }, 4000);
        }
      } catch {
        showToast('更新の確認に失敗しました。ネットワークを確認してください。', 'error', 5000);
        manualCheck = false;
        if (updateStatus) updateStatus.textContent = '';
      } finally {
        clearMsg();
        // 状態表示をクリア（waiting時は上書きされる）
        if (!updateReady && updateStatus) updateStatus.textContent = '';
      }
    });
  }
}
