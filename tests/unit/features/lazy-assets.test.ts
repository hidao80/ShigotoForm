import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { waitForPreviewFonts } from '../../../src/features/lazy-assets.ts';

const setFonts = (load: ((font: string, text?: string) => Promise<unknown>) | undefined) => {
  Object.defineProperty(document, 'fonts', { configurable: true, value: load ? { load } : undefined });
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(document, 'fonts');
});

describe('waitForPreviewFonts', () => {
  test.each([
    ['gothic', 'Noto Sans JP'],
    ['mincho', 'Noto Serif JP'],
  ] as const)(
    '%s は %s を、表示している文字列を指定して読み込む（unicode-range の分割に対応）',
    async (type, family) => {
      const load = vi.fn().mockResolvedValue([]);
      setFonts(load);
      await waitForPreviewFonts(type, '山田太郎');
      expect(load).toHaveBeenCalledWith(`400 1em "${family}"`, '山田太郎');
    },
  );

  test('フォントの読み込みが終わるまで待つ', async () => {
    let finish: () => void = () => {};
    setFonts(() => new Promise<void>((resolve) => (finish = resolve)));
    const done = vi.fn();
    const promise = waitForPreviewFonts('gothic', 'あ').then(done);
    await vi.advanceTimersByTimeAsync(1000);
    expect(done).not.toHaveBeenCalled();
    finish();
    await promise;
    expect(done).toHaveBeenCalledOnce();
  });

  test('読み込みが終わらなくても、上限時間で待つのをやめる（オフライン等）', async () => {
    setFonts(() => new Promise(() => {}));
    const done = vi.fn();
    const promise = waitForPreviewFonts('gothic', 'あ', 3000).then(done);
    await vi.advanceTimersByTimeAsync(2999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(done).toHaveBeenCalledOnce();
  });

  test('読み込みに失敗しても例外にせず続行する', async () => {
    setFonts(() => Promise.reject(new Error('network')));
    await expect(waitForPreviewFonts('gothic', 'あ')).resolves.toBeUndefined();
  });

  test('document.fonts が無い環境では待たずに終わる', async () => {
    setFonts(undefined);
    await expect(waitForPreviewFonts('gothic', 'あ')).resolves.toBeUndefined();
  });
});
