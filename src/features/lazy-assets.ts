// フォントの遅延読み込み（初期レンダリング後に読込）
export const lazyLoadNotoFonts = (() => {
  let loaded = false;
  return async () => {
    if (loaded) return;
    try {
      await Promise.all([import('@fontsource/noto-sans-jp/400.css'), import('@fontsource/noto-serif-jp/400.css')]);
      loaded = true;
      document.documentElement.classList.add('fonts-loaded');
    } catch {
      // 失敗してもフォールバックフォントで継続
    }
  };
})();

/**
 * 履歴書プレビューが使う Web フォントの実ファイルが読み込まれるまで待ちます。
 * フォントは font-display: swap のため、プレビューは待たずに代替フォントで先に表示され、読み込みが終わると差し替わる。
 * PDF 化（canvas への描画）は差し替わる前の代替フォントで撮らないよう、この関数で完了を待つ。
 * Noto は unicode-range で分割されているため、実際に表示する文字列を渡して必要な分だけ読み込む。
 * @param {'gothic' | 'mincho'} fontType - プレビューの書体
 * @param {string} text - プレビューに表示している文字列
 * @param {number} [timeoutMs=5000] - 待つ上限。超えたら待たずに続行する（オフライン等で永久に待たないため）
 * @returns {Promise<void>}
 * @throws なし
 * @example
 * await waitForPreviewFonts('mincho', previewEl.textContent ?? '');
 */
export async function waitForPreviewFonts(fontType: 'gothic' | 'mincho', text: string, timeoutMs = 5000) {
  await lazyLoadNotoFonts();
  const family = fontType === 'mincho' ? 'Noto Serif JP' : 'Noto Sans JP';
  const loading = document.fonts?.load(`400 1em "${family}"`, text).catch(() => {});
  if (!loading) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  await Promise.race([loading, timeout]);
  clearTimeout(timer);
}

// Font Awesome（アイコン）の遅延読み込み
export const lazyLoadIcons = (() => {
  let loaded = false;
  return async () => {
    if (loaded) return;
    try {
      // @font-face の font-display は、ビルド時に PostCSS（scripts/postcss-font-display-swap.ts）で swap にしている
      await import('@fortawesome/fontawesome-free/css/all.min.css');
      // フォント取得完了までは代替表示（"?"）を維持し、アイコンが空白で表示されるのを防ぐ
      await document.fonts?.load('400 1em "Font Awesome 7 Free"').catch(() => {});
      loaded = true;
      document.documentElement.classList.add('icons-loaded');
    } catch {
      // 失敗してもテキスト代替とARIAで継続
    }
  };
})();

/**
 * 初期レンダリング後のアイドル時間にフォントとアイコンを遅延読み込みします。
 * @returns {void}
 * @throws なし
 */
export function scheduleLazyAssets() {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      lazyLoadNotoFonts();
      lazyLoadIcons();
    });
  } else {
    setTimeout(() => {
      lazyLoadNotoFonts();
      lazyLoadIcons();
    }, 0);
  }
}
