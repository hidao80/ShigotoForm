export type ToastKind = 'info' | 'success' | 'warn' | 'error';

// 軽量トースト通知
function ensureToastContainer() {
  let el = document.getElementById('sf-toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sf-toast-container';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  return el;
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

export function showToast(message: string, kind: ToastKind = 'info', ttl = 3000) {
  const container = ensureToastContainer();
  const div = document.createElement('div');
  div.className = `sf-toast ${kind}`;
  div.textContent = message;
  if (kind === 'error') div.setAttribute('role', 'alert');
  container.appendChild(div);
  const timer = setTimeout(() => {
    div.remove();
  }, ttl);
  return () => {
    clearTimeout(timer);
    div.remove();
  };
}
