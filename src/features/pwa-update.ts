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
  updateLink?.addEventListener('click', (e) => onUpdateLinkClick(e, updateStatus));
}

/**
 * 状態表示要素のテキストを設定します（要素がなければ何もしません）。
 * @param {HTMLElement | null} el - 状態表示要素
 * @param {string} text - 表示するテキスト
 * @returns {void}
 * @throws なし
 */
function setStatusText(el: HTMLElement | null, text: string) {
  if (el) el.textContent = text;
}

/**
 * waiting 済みなら即適用し、そうでなければ更新チェックを実行します。
 * @param {Workbox} workbox - Workbox インスタンス
 * @param {HTMLElement | null} updateStatus - 状態表示要素
 * @returns {Promise<void>}
 * @throws workbox の更新・適用エラー
 */
async function checkOrApplyUpdate(workbox: Workbox, updateStatus: HTMLElement | null) {
  if (updateReady) {
    // すでにwaitingなら即適用
    await workbox.messageSkipWaiting();
    return;
  }
  // 更新チェックを実行
  await workbox.update();
  // 一部環境では waiting が即発火しないことがあるためフォールバック
  setTimeout(() => {
    if (updateReady) return;
    // waiting になっていない = 更新なしの可能性が高い
    showToast('最新の状態です。', 'success', 2500);
    setStatusText(updateStatus, '');
    manualCheck = false;
  }, 4000);
}

/**
 * アップデートリンクのクリック処理（手動更新）。
 * @param {Event} e - クリックイベント
 * @param {HTMLElement | null} updateStatus - 状態表示要素
 * @returns {Promise<void>}
 * @throws なし
 */
async function onUpdateLinkClick(e: Event, updateStatus: HTMLElement | null) {
  e.preventDefault();
  if (!wb) {
    // SW未対応環境は単純リロード
    window.location.reload();
    return;
  }
  setStatusText(updateStatus, '更新を確認中…');
  manualCheck = true;
  const clearMsg = showToast('更新を確認中…', 'info', 8000);
  try {
    await checkOrApplyUpdate(wb, updateStatus);
  } catch {
    showToast('更新の確認に失敗しました。ネットワークを確認してください。', 'error', 5000);
    manualCheck = false;
    setStatusText(updateStatus, '');
  } finally {
    clearMsg();
    // 状態表示をクリア（waiting時は上書きされる）
    if (!updateReady) setStatusText(updateStatus, '');
  }
}
