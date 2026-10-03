import { beforeAll, expect, test } from 'vitest';
import { mountApp, sleep } from './mount-app.ts';

beforeAll(mountApp);

test('氏名欄にフォーカスしているだけ（編集なし）では何も保存しない', async () => {
  // vanilla-autokana は氏名が空でも 30ms ごとにふりがなへ空文字を書き込む。編集とみなして保存してはいけない
  const name = document.getElementById('name-input') as HTMLInputElement;
  name.dispatchEvent(new FocusEvent('focus'));
  await sleep(400);
  name.dispatchEvent(new FocusEvent('blur'));
  const { loadResume } = await import('../../src/db.ts');
  expect(await loadResume()).toBeUndefined();
});
