import { useCallback, useLayoutEffect, useState } from 'react';

const readTheme = () => {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
};

/**
 * ダーク/ライトテーマの切り替え。選択は localStorage に保存し、Bootstrap の `data-bs-theme`（body）へ反映する。
 * 保存済みの選択がなければ何も設定しない（ブラウザ既定のまま）。
 * @returns {[boolean, (dark: boolean) => void]} [ダークモードか, 切り替え関数]
 * @throws なし
 * @example
 * const [dark, setDark] = useTheme();
 */
export function useTheme(): [boolean, (dark: boolean) => void] {
  const [dark, setDark] = useState(() => readTheme() === 'dark');

  // 保存済みテーマを復元（初回描画の前に反映して、ライトで一瞬表示されるのを防ぐ）
  useLayoutEffect(() => {
    const saved = readTheme();
    if (saved) document.body.dataset.bsTheme = saved;
  }, []);

  const change = useCallback((next: boolean) => {
    const theme = next ? 'dark' : 'light';
    setDark(next);
    document.body.dataset.bsTheme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // 保存できなくても表示の切り替えは継続
    }
  }, []);

  return [dark, change];
}
