import postcss from 'postcss';
import { describe, expect, test } from 'vitest';
import { fontDisplaySwap } from '../../../scripts/postcss-font-display-swap.ts';

const run = async (css: string, from: string) => (await postcss([fontDisplaySwap()]).process(css, { from })).css;
const FA = 'E:/app/node_modules/@fortawesome/fontawesome-free/css/all.min.css';

describe('fontDisplaySwap', () => {
  test('Font Awesome の @font-face の font-display を、block を含めてすべて swap にする', async () => {
    const css = await run(
      `@font-face{font-family:"A";font-display:block;src:url(a.woff2)}
@font-face{font-family:"B";font-display:auto;src:url(b.woff2)}
@font-face{font-family:"C";src:url(c.woff2)}`,
      FA,
    );
    expect(css.match(/font-display:\s*swap/g)).toHaveLength(3);
    expect(css).not.toMatch(/font-display:\s*(block|auto)/);
  });

  test('1 つの @font-face に font-display を重複して足さない', async () => {
    const css = await run('@font-face{font-family:"A";src:url(a.woff2)}', FA);
    expect(css.match(/font-display/g)).toHaveLength(1);
  });

  test('Font Awesome 以外の CSS は変更しない', async () => {
    const own = '@font-face{font-family:"X";font-display:block;src:url(x.woff2)}';
    expect(await run(own, 'E:/app/src/own.css')).toBe(own);
  });

  test('パスの区切りが バックスラッシュ でも対象にできる（Windows）', async () => {
    const css = await run(
      '@font-face{font-display:block;src:url(a.woff2)}',
      String.raw`E:\app\node_modules\@fortawesome\fontawesome-free\css\all.min.css`,
    );
    expect(css).toMatch(/font-display:\s*swap/);
  });
});
