import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { formatToastList, showToast } from '../../../src/components/toast.ts';
import { ToastContainer } from '../../../src/components/toast-container.tsx';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  // 表示中のトーストをストアから消してから片付ける
  act(() => {
    vi.runAllTimers();
  });
  cleanup();
  vi.useRealTimers();
});

const toasts = () => [...document.querySelectorAll('#sf-toast-container .sf-toast')];

describe('ToastContainer / showToast', () => {
  test('コンテナは role=status / aria-live=polite で、error のみ role=alert になる', () => {
    render(<ToastContainer />);
    act(() => {
      showToast('ok', 'success');
      showToast('ng', 'error');
    });
    const container = document.getElementById('sf-toast-container');
    expect(container?.getAttribute('role')).toBe('status');
    expect(container?.getAttribute('aria-live')).toBe('polite');
    const [ok, ng] = toasts();
    expect(ok?.getAttribute('role')).toBeNull();
    expect(ok?.classList.contains('success')).toBe(true);
    expect(ng?.getAttribute('role')).toBe('alert');
    expect(ng?.classList.contains('error')).toBe(true);
  });

  test('メッセージはテキストとして描画される（タグとして解釈しない）', () => {
    render(<ToastContainer />);
    act(() => {
      showToast('<img src=x onerror=alert(1)>', 'info');
    });
    expect(document.querySelector('#sf-toast-container img')).toBeNull();
    expect(toasts()[0]?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  test('ttl 経過で自動的に消え、返り値の関数で即座に消せる', () => {
    render(<ToastContainer />);
    act(() => {
      showToast('a', 'info', 1000);
    });
    let dismiss = () => {};
    act(() => {
      dismiss = showToast('b', 'info', 10_000);
    });
    expect(toasts().map((t) => t.textContent)).toEqual(['a', 'b']);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(toasts().map((t) => t.textContent)).toEqual(['b']);
    act(() => dismiss());
    expect(toasts()).toHaveLength(0);
  });

  test('描画前に出したトーストも、描画後に表示される', () => {
    act(() => {
      showToast('early', 'info', 5000);
    });
    render(<ToastContainer />);
    expect(toasts().map((t) => t.textContent)).toEqual(['early']);
  });

  test('二重に消しても例外にならない', () => {
    render(<ToastContainer />);
    let dismiss = () => {};
    act(() => {
      dismiss = showToast('x', 'info');
    });
    act(() => dismiss());
    expect(() => act(() => dismiss())).not.toThrow();
  });
});

describe('formatToastList', () => {
  test('見出しと箇条書きを改行でつなぐ', () => {
    expect(formatToastList('見出し', ['a', 'b'])).toBe('見出し\n・a\n・b');
  });

  test('max 件を超える分は「…他N件」にまとめる（既定は 5 件）', () => {
    const items = ['1', '2', '3', '4', '5', '6', '7'];
    expect(formatToastList('t', items)).toBe('t\n・1\n・2\n・3\n・4\n・5\n…他2件');
    expect(formatToastList('t', items, 2)).toBe('t\n・1\n・2\n…他5件');
  });

  test('項目が空なら見出しのみ', () => {
    expect(formatToastList('t', [])).toBe('t');
  });
});
