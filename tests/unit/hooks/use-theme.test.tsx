import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useTheme } from '../../../src/hooks/use-theme.ts';

beforeEach(() => {
  localStorage.clear();
  delete document.body.dataset.bsTheme;
});

afterEach(cleanup);

describe('useTheme', () => {
  test('保存済みテーマ(dark)を復元して反映する', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe(true);
    expect(document.body.dataset.bsTheme).toBe('dark');
  });

  test('保存済みテーマが無ければ何も変更しない', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe(false);
    expect(document.body.dataset.bsTheme).toBeUndefined();
  });

  test('切り替えで data-bs-theme と localStorage が更新される', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    expect(document.body.dataset.bsTheme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    expect(document.body.dataset.bsTheme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
