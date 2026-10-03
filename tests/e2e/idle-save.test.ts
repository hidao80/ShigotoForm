import { beforeAll, expect, test } from 'vitest';
import { mountApp, sleep } from './mount-app.ts';

beforeAll(mountApp);

test('氏名欄にフォーカスしているだけ（編集なし）では何も保存しない', async () => {
  // フォーカスだけではふりがなの自動入力が何も書き込まず、編集とみなされて保存されてはいけない
  const name = document.getElementById('name-input') as HTMLInputElement;
  name.focus();
  await sleep(400);
  name.blur();
  const { loadResume } = await import('../../src/db.ts');
  expect(await loadResume()).toBeUndefined();
});
