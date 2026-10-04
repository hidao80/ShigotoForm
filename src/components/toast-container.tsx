import { useToasts } from './toast.ts';

/**
 * トースト通知の表示領域。error のみ role=alert で即時に読み上げる。
 * role=status は aria-atomic=true を暗黙に持ち、追加のたびに表示中の全トーストを読み直すため、false にして追加分だけ読み上げる。
 */
export function ToastContainer() {
  const toasts = useToasts();
  return (
    <div id="sf-toast-container" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`sf-toast ${toast.kind}`} role={toast.kind === 'error' ? 'alert' : undefined}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
