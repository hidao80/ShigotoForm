import type { Plugin } from 'postcss';

/**
 * 指定したパスの CSS にある @font-face を、すべて font-display: swap にする PostCSS プラグイン。
 * Font Awesome の CSS は @font-face がすべて font-display: block で、node_modules の中は編集できない。
 * 後から同じ family / weight の @font-face を足して上書きする方法は、両方の規則がフォントセットに残り、
 * document.fonts.load() で block 側も読み込まれる（Lighthouse の「フォント表示」で block として指摘される）ため使わない。
 * @param {RegExp} [include=/[\\/]@fortawesome[\\/]/] - 書き換え対象にする CSS ファイルのパス
 * @returns {Plugin} PostCSS プラグイン
 * @throws なし
 * @example
 * // vite.config.js
 * css: { postcss: { plugins: [fontDisplaySwap()] } }
 */
export const fontDisplaySwap = (include: RegExp = /[\\/]@fortawesome[\\/]/): Plugin => ({
  postcssPlugin: 'font-display-swap',
  AtRule: {
    'font-face': (rule) => {
      if (!include.test(rule.source?.input.file ?? '')) return;
      let found = false;
      rule.walkDecls('font-display', (decl) => {
        found = true;
        decl.value = 'swap';
      });
      // 指定が無いと既定の auto（block 相当）になるため、無い場合も足す
      if (!found) rule.append({ prop: 'font-display', value: 'swap' });
    },
  },
});
