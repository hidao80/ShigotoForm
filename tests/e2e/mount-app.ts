import { expect, vi } from 'vitest';

/**
 * 実ブラウザ上に main.ts を読み込み、アプリ全体をマウントする。
 * main.ts は DOMContentLoaded で初期化するため、テストページでは手動で発火する。
 * Service Worker 登録はテスト用サーバーに /sw.js が無く失敗するため、何もしないスタブに差し替える。
 */
export async function mountApp() {
  // テスト間で状態を持ち越さない（IndexedDB / localStorage はオリジン共有）
  localStorage.clear();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('ResumeDB');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
  const registration = { installing: null, waiting: null, active: null, addEventListener() {}, update: async () => {} };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: null,
      ready: new Promise(() => {}),
      register: async () => registration,
      getRegistration: async () => registration,
      addEventListener() {},
      removeEventListener() {},
    },
  });
  document.body.innerHTML = '<div id="app"></div>';
  await import('../../src/main.ts');
  window.dispatchEvent(new Event('DOMContentLoaded'));
  // 初期化完了（IndexedDB 復元後）で「履歴書を表示」が有効になる
  await vi.waitFor(() => expect(document.querySelector<HTMLButtonElement>('#show-resume')?.disabled).toBe(false), {
    timeout: 10_000,
  });
}

/** 指定時間だけ待つ（モーダルのトランジション待ち等） */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
