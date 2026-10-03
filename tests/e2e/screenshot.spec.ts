import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

const BASE_URL = 'https://localhost:5173';
const PAGES = [{ path: '/', name: 'homepage' }];
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'fhd', width: 1920, height: 1080 },
];

let devServer: ReturnType<typeof Bun.spawn> | undefined;

const isServerUp = () =>
  fetch(BASE_URL, { tls: { rejectUnauthorized: false } }).then(
    () => true,
    () => false,
  );

// Reuse a running dev server; otherwise start one for the duration of the tests
beforeAll(async () => {
  if (await isServerUp()) return;
  devServer = Bun.spawn(['bun', 'run', 'dev'], { stdout: 'ignore', stderr: 'ignore' });
  for (let i = 0; i < 120 && !(await isServerUp()); i++) await Bun.sleep(500);
}, 60_000);

afterAll(() => devServer?.kill());

// Fonts are lazy-loaded via requestIdleCallback, so wait for the class (best effort)
async function waitForFonts(view: Bun.WebView) {
  for (let i = 0; i < 20; i++) {
    if (await view.evaluate("document.documentElement.classList.contains('fonts-loaded')")) return;
    await Bun.sleep(250);
  }
}

describe('Full-Page Screenshot Tests', () => {
  for (const viewport of VIEWPORTS) {
    for (const pageInfo of PAGES) {
      test(`capture ${pageInfo.name} (${viewport.name})`, async () => {
        await using view = new Bun.WebView({
          width: viewport.width,
          height: viewport.height,
          backend: { type: 'chrome', url: false, argv: ['--ignore-certificate-errors'] },
        });
        await view.navigate(BASE_URL + pageInfo.path);
        await waitForFonts(view);

        // WebView captures only the viewport, so use CDP to capture the full page
        const height = (await view.evaluate('document.documentElement.scrollHeight')) as number;
        const { data } = (await view.cdp('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: viewport.width, height, scale: 1 },
        })) as { data: string };
        await Bun.write(`screenshots/${pageInfo.name}-${viewport.name}.png`, Buffer.from(data, 'base64'));

        expect(view.title.length).toBeGreaterThan(0);
      }, 60_000);
    }
  }
});
