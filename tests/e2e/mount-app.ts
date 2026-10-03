import { expect, vi } from 'vitest';
import type { ResumeJson } from '../../src/db.ts';

/**
 * 実ブラウザ上に main.tsx を読み込み、アプリ全体をマウントする。
 * main.tsx は DOMContentLoaded で初期化するため、テストページでは手動で発火する。
 * Service Worker 登録はテスト用サーバーに /sw.js が無く失敗するため、何もしないスタブに差し替える。
 */
export const mountApp = () => mountAppWith();

/**
 * mountApp と同じ。保存データ（seed）を IndexedDB に入れた状態で起動する（復元の検証用）。
 * @param seed - 起動前に保存しておく履歴書データ
 */
export async function mountAppWith(seed?: ResumeJson) {
  // テスト間で状態を持ち越さない（IndexedDB / localStorage はオリジン共有）
  localStorage.clear();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('ResumeDB');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
  if (seed) {
    const { saveResume } = await import('../../src/db.ts');
    await saveResume(seed);
  }
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
  await import('../../src/main.tsx');
  window.dispatchEvent(new Event('DOMContentLoaded'));
  // 初期化完了（IndexedDB 復元後）で「履歴書を表示」が有効になる
  await vi.waitFor(() => expect(document.querySelector<HTMLButtonElement>('#show-resume')?.disabled).toBe(false), {
    timeout: 10_000,
  });
}

/**
 * 入力欄の値を設定して input イベントを発火する。
 * React は要素の value プロパティを追跡しているため、`el.value = …` では onChange が発火しない。
 * プロトタイプの setter で値を書き込むと、通常の入力と同じく変更として検知される。
 */
export function setNativeValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/** 指定時間だけ待つ（モーダルのトランジション待ち等） */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
