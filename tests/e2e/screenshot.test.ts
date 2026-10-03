import { beforeAll, describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { mountApp, sleep } from './mount-app.ts';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'fhd', width: 1920, height: 1080 },
];

beforeAll(mountApp);

describe('Full-Page Screenshot Tests', () => {
  for (const viewport of VIEWPORTS) {
    test(`capture homepage (${viewport.name})`, async () => {
      await page.viewport(viewport.width, viewport.height);
      // フォントは requestIdleCallback で遅延読込されるため、読込完了を待つ（最大 5 秒・ベストエフォート）
      for (let i = 0; i < 20 && !document.documentElement.classList.contains('fonts-loaded'); i++) await sleep(250);

      // iframe 内のスクリーンショットはビューポート外を描画しないため、文書全体の高さまで広げて撮影する
      await page.viewport(viewport.width, Math.max(viewport.height, document.documentElement.scrollHeight));
      const path = await page.screenshot({
        element: document.documentElement,
        path: `../../screenshots/homepage-${viewport.name}.png`,
      });

      expect(path).toBeTruthy();
    });
  }
});
