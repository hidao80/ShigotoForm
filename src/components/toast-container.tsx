import { useToasts } from './toast.ts';

/**
 * トースト通知の表示領域。error のみ role=alert で即時に読み上げる。
 */
export function ToastContainer() {
  const toasts = useToasts();
  return (
    <div id="sf-toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`sf-toast ${toast.kind}`} role={toast.kind === 'error' ? 'alert' : undefined}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
