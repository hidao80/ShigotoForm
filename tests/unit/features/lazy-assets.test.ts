import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// lazyLoadIcons はモジュール内で一度きりのため、テストごとにモジュールを読み直す
const load = () => import('../../../src/features/lazy-assets.ts');
const iconsLoaded = () => document.documentElement.classList.contains('icons-loaded');

beforeEach(() => {
  vi.resetModules();
  document.documentElement.classList.remove('icons-loaded');
  document.body.innerHTML = `
    <button id="help-modal-btn"></button>
    <button id="help-modal-in-menu-btn"></button>
    <div id="offcanvasNavbar"></div>`;
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('preloadIconsOnFirstInteraction', () => {
  test('操作前はアイコンを読み込まない', async () => {
    const { preloadIconsOnFirstInteraction } = await load();
    preloadIconsOnFirstInteraction();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(iconsLoaded()).toBe(false);
  });

  test.each([
    ['#help-modal-btn', 'pointerover'],
    ['#help-modal-btn', 'focusin'],
    ['#help-modal-in-menu-btn', 'pointerover'],
    ['#help-modal-in-menu-btn', 'focusin'],
    ['#offcanvasNavbar', 'show.bs.offcanvas'],
  ])('%s の %s でアイコンを読み込む', async (selector, eventName) => {
    const { preloadIconsOnFirstInteraction } = await load();
    preloadIconsOnFirstInteraction();
    document.querySelector(selector)?.dispatchEvent(new Event(eventName));
    await vi.waitFor(() => expect(iconsLoaded()).toBe(true));
  });
});
