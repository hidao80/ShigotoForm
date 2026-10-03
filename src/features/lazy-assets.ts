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

// Font Awesome（アイコン）の遅延読み込み
export const lazyLoadIcons = (() => {
  let loaded = false;
  return async () => {
    if (loaded) return;
    try {
      await import('@fortawesome/fontawesome-free/css/all.min.css');
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

/**
 * 初回のアイコン使用時（ヘルプボタン操作・メニュー表示）に、アイコンを即時ロードします（FOUT軽減）。
 * @returns {void}
 * @throws なし
 */
export function preloadIconsOnFirstInteraction() {
  const loadIconsOnFirstInteraction = () => {
    lazyLoadIcons();
    detach();
  };
  const helpTriggerBtn = document.getElementById('help-modal-btn');
  const helpTriggerBtnInMenu = document.getElementById('help-modal-in-menu-btn');
  const offcanvas = document.getElementById('offcanvasNavbar');
  const detach = () => {
    helpTriggerBtn?.removeEventListener('pointerover', loadIconsOnFirstInteraction);
    helpTriggerBtn?.removeEventListener('focusin', loadIconsOnFirstInteraction);
    helpTriggerBtnInMenu?.removeEventListener('pointerover', loadIconsOnFirstInteraction);
    helpTriggerBtnInMenu?.removeEventListener('focusin', loadIconsOnFirstInteraction);
    offcanvas?.removeEventListener('show.bs.offcanvas', loadIconsOnFirstInteraction);
  };
  helpTriggerBtn?.addEventListener('pointerover', loadIconsOnFirstInteraction, { once: true });
  helpTriggerBtn?.addEventListener('focusin', loadIconsOnFirstInteraction, { once: true });
  helpTriggerBtnInMenu?.addEventListener('pointerover', loadIconsOnFirstInteraction, { once: true });
  helpTriggerBtnInMenu?.addEventListener('focusin', loadIconsOnFirstInteraction, { once: true });
  // Offcanvas メニューを開いたら確実に読み込み
  offcanvas?.addEventListener('show.bs.offcanvas', loadIconsOnFirstInteraction, { once: true });
}
