import { useSyncExternalStore } from 'react';

export type ToastKind = 'info' | 'success' | 'warn' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

// どこからでも呼べる命令的な API のため、状態はモジュール内のストアに持つ（React 描画前の通知も取りこぼさない）
let toasts: ToastItem[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => toasts;

/**
 * 表示中のトースト一覧を購読します（ToastContainer 用）。
 * @returns {ToastItem[]} 表示中のトースト
 */
export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * 見出しと箇条書きを 1 つのトースト用メッセージにまとめます（`.sf-toast` は改行を反映）。
 * @param {string} title - 見出し
 * @param {string[]} items - 箇条書きの項目
 * @param {number} [max=5] - 列挙する最大件数。超過分は「…他N件」に集約
 * @returns {string} 改行区切りのメッセージ
 * @throws なし
 * @example
 * showToast(formatToastList('入力内容に誤りがあります。', ['氏名: 必須']), 'warn');
 */
export function formatToastList(title: string, items: string[], max = 5) {
  const lines = items.slice(0, max).map((item) => `・${item}`);
  if (items.length > max) lines.push(`…他${items.length - max}件`);
  return [title, ...lines].join('\n');
}

/**
 * トーストを表示します。
 * @param {string} message - 表示するメッセージ
 * @param {ToastKind} [kind='info'] - 種類
 * @param {number} [ttl=3000] - 自動で消えるまでのミリ秒
 * @returns {() => void} 即座に消す関数
 * @throws なし
 * @example
 * const dismiss = showToast('保存しました', 'success');
 */
export function showToast(message: string, kind: ToastKind = 'info', ttl = 3000) {
  const id = ++nextId;
  toasts = [...toasts, { id, message, kind }];
  emit();
  const timer = setTimeout(dismiss, ttl);
  function dismiss() {
    clearTimeout(timer);
    if (!toasts.some((t) => t.id === id)) return;
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }
  return dismiss;
}
