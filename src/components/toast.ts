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
