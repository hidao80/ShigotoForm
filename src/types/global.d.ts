/// <reference types="vite/client" />

interface Window {
  /** requestIdleCallback は TypeScript の標準 lib に未収録のため宣言 */
  requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number;
  cancelIdleCallback(id: number): void;
}

type IdleRequestCallback = (deadline: IdleDeadline) => void;

interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

interface IdleRequestOptions {
  timeout?: number;
}
