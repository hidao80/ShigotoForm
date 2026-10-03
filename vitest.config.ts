import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        // インライン project はルートの plugins を継承しないため、各 project に React plugin を指定する
        plugins: [react()],
        // DOM のみで検証できるロジック（jsdom + fake-indexeddb）
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['tests/unit/**/*.test.{ts,tsx}'],
        },
      },
      {
        plugins: [react()],
        // 実行中に依存が追加で最適化されると React が二重に読み込まれる（Invalid hook call）ため、先に最適化しておく
        optimizeDeps: {
          include: [
            'react',
            'react/jsx-dev-runtime',
            'react-dom',
            'react-dom/client',
            'react-bootstrap',
            '@vite-pwa/workbox-window',
            'html2pdf.js',
            '@j1nn0/vanilla-autokana',
            'dexie',
            'zod',
            'zod/locales',
          ],
        },
        resolve: { dedupe: ['react', 'react-dom'] },
        // 実ブラウザ(Chromium)でアプリ全体をマウントして検証する E2E
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.test.{ts,tsx}'],
          testTimeout: 30_000,
          // IndexedDB はオリジン共有のため、ファイル間は直列実行する
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
