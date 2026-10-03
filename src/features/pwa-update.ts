import { Workbox } from '@vite-pwa/workbox-window';
import { useSyncExternalStore } from 'react';
import { showToast } from '../components/toast.ts';

// Workbox インスタンス（手動更新用に外でも参照）
let wb: Workbox | null = null;
let updateReady = false;
let manualCheck = false;

// メニューに表示する更新状態。Service Worker のイベントは React 描画前にも届くため、モジュール内のストアで持つ
let status = '';
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => status;
const setStatus = (text: string) => {
  if (status === text) return;
  status = text;
  for (const listener of listeners) listener();
};

/**
 * アプリ更新の状態表示（「更新を確認中…」「新しいバージョンがあります」など）を購読します。
 * @returns {string} 表示する状態。なければ空文字
 */
export function useUpdateStatus(): string {
  return useSyncExternalStore(subscribe, getSnapshot);
}

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
    setStatus('新しいバージョンがあります');
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
 * waiting 済みなら即適用し、そうでなければ更新チェックを実行します。
 * @param {Workbox} workbox - Workbox インスタンス
 * @returns {Promise<void>}
 * @throws workbox の更新・適用エラー
 */
async function checkOrApplyUpdate(workbox: Workbox) {
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
    setStatus('');
    manualCheck = false;
  }, 4000);
}

/**
 * アプリの更新を手動で確認・適用します（メニューの「アプリのアップデート」）。
 * @returns {Promise<void>}
 * @throws なし
 */
export async function requestAppUpdate() {
  if (!wb) {
    // SW未対応環境は単純リロード
    window.location.reload();
    return;
  }
  setStatus('更新を確認中…');
  manualCheck = true;
  const clearMsg = showToast('更新を確認中…', 'info', 8000);
  try {
    await checkOrApplyUpdate(wb);
  } catch {
    showToast('更新の確認に失敗しました。ネットワークを確認してください。', 'error', 5000);
    manualCheck = false;
    setStatus('');
  } finally {
    clearMsg();
    // 状態表示をクリア（waiting時は上書きされる）
    if (!updateReady) setStatus('');
  }
}
