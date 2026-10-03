import { beforeEach, describe, expect, test } from 'vitest';
import { addThemeSwitchEventListener } from '../../src/theme.ts';

beforeEach(() => {
  localStorage.clear();
  delete document.body.dataset.bsTheme;
  document.body.innerHTML = '<input type="checkbox" id="theme-switch">';
});

const getSwitch = () => document.querySelector('#theme-switch') as HTMLInputElement;

describe('addThemeSwitchEventListener', () => {
  test('保存済みテーマ(dark)を復元してスイッチに反映する', () => {
    localStorage.setItem('theme', 'dark');
    addThemeSwitchEventListener();
    expect(document.body.dataset.bsTheme).toBe('dark');
    expect(getSwitch().checked).toBe(true);
  });

  test('保存済みテーマが無ければ何も変更しない', () => {
    addThemeSwitchEventListener();
    expect(document.body.dataset.bsTheme).toBeUndefined();
    expect(getSwitch().checked).toBe(false);
  });

  test('切り替えで data-bs-theme と localStorage が更新される', () => {
    addThemeSwitchEventListener();
    const sw = getSwitch();
    sw.checked = true;
    sw.dispatchEvent(new Event('change'));
    expect(document.body.dataset.bsTheme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    sw.checked = false;
    sw.dispatchEvent(new Event('change'));
    expect(document.body.dataset.bsTheme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
