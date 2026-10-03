import { beforeAll, describe, expect, test, vi } from 'vitest';
import { mountApp, sleep } from './mount-app.ts';

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector(selector) as T;
const click = (selector: string) => $(selector).click();

/** 値を設定して input / change を発火する（自動保存の契機） */
const fill = (selector: string, value: string) => {
  const el = $<HTMLInputElement>(selector);
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};

beforeAll(mountApp);

describe('ARIA', () => {
  test('aria-labelledby / aria-controls / aria-describedby / label[for] の参照先が全て存在する', () => {
    const broken: string[] = [];
    for (const el of document.querySelectorAll('[aria-labelledby], [aria-controls], [aria-describedby], label[for]')) {
      for (const attr of ['aria-labelledby', 'aria-controls', 'aria-describedby', 'for']) {
        for (const id of (el.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean)) {
          if (!document.getElementById(id)) broken.push(`${attr}->${id}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  test('id が重複していない', () => {
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  test('form は見出しでラベル付けされ、全入力欄と動的セクションを内包し main の中にある', () => {
    const form = $<HTMLFormElement>('form');
    expect(form.getAttribute('aria-labelledby')).toBe('resume-form-title');
    expect($('#main').contains(form)).toBe(true);
    for (const sel of ['#career-history', '#license-history', '#add-career-history', '#add-license-history']) {
      expect(form.contains($(sel)), sel).toBe(true);
    }
  });

  test('アコーディオンは閉じた状態で aria-expanded="false"', () => {
    const btn = $('.accordion-button');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.classList.contains('collapsed')).toBe(true);
  });

  test('アコーディオンは開閉で状態が同期し、初期表示用クラスは最初の開閉で外れる', async () => {
    const btn = $('.accordion-button');
    expect(btn.classList.contains('sf-accordion-initial')).toBe(true);
    btn.click();
    await vi.waitFor(() => expect($('#collapseOne').classList.contains('show')).toBe(true));
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(btn.classList.contains('collapsed')).toBe(false);
    expect(btn.classList.contains('sf-accordion-initial')).toBe(false);
    btn.click();
    await vi.waitFor(() => expect($('#collapseOne').classList.contains('show')).toBe(false));
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.classList.contains('collapsed')).toBe(true);
  });
});

describe('宣言型 WebMCP', () => {
  test('form に toolname / tooldescription があり、toolautosubmit は無い', () => {
    const form = $('form');
    expect(form.getAttribute('toolname')).toBe('fill-resume-basic-info');
    expect(form.getAttribute('tooldescription')).toBeTruthy();
    expect(form.hasAttribute('toolautosubmit')).toBe(false);
  });

  test('name を持つ全コントロールが toolparamdescription を持つ', () => {
    const missing = [...$<HTMLFormElement>('form').elements]
      .filter((el) => (el as HTMLInputElement).name)
      .filter((el) => !el.getAttribute('toolparamdescription'))
      .map((el) => (el as HTMLInputElement).name);
    expect(missing).toEqual([]);
  });

  test('静的入力欄の name がスキーマのプロパティ名として揃っている', () => {
    const names = [...$<HTMLFormElement>('form').elements].map((el) => (el as HTMLInputElement).name).filter(Boolean);
    expect(names).toEqual(
      expect.arrayContaining([
        'createdAt',
        'fullname-kana',
        'fullname',
        'birthday',
        'sex',
        'zip-code',
        'address1',
        'tel1',
        'mail1',
        'address2',
        'tel2',
      ]),
    );
  });
});

describe('入力検証 (pattern)', () => {
  const mismatch = (id: string, value: string) => {
    const el = document.getElementById(id) as HTMLInputElement;
    el.value = value;
    return el.validity.patternMismatch;
  };

  test.each([
    ['furigana-input', 'やまだ たろう', false],
    ['furigana-input', 'ゆーき', false],
    ['furigana-input', '山田', true],
    ['name-input', '山田 太郎', false],
    ['name-input', '  ', true],
    ['zip-code-input', '1000001', false],
    ['zip-code-input', '100-0001', false],
    ['zip-code-input', '12345', true],
    ['address1-input', '東京都千代田区', false],
    ['address1-input', ' ', true],
    ['tel1-input', '03-1234-5678', false],
    ['tel1-input', '09012345678', false],
    ['tel1-input', 'abc', true],
    ['tel2-input', '06-1234-5678', false],
    ['mail1-input', 'taro@example.com', false],
    ['mail1-input', 'x@', true],
  ])('%s に "%s" → patternMismatch=%s', (id, value, expected) => {
    expect(mismatch(id, value)).toBe(expected);
  });
});

describe('動的行と自動保存', () => {
  test('追加した行の入力で保存され、再マウント相当の復元後も編集が保存される', async () => {
    fill('#created-at', '2026-10-03');
    click('#add-career-history');
    await vi.waitFor(() => expect(document.querySelectorAll('#career-history .card')).toHaveLength(1));
    await sleep(50); // MutationObserver によるリスナー付与待ち
    fill('#career-history input[name="name"]', 'ACME');
    await sleep(200);

    const { loadResume } = await import('../../src/db.ts');
    await vi.waitFor(async () => expect((await loadResume())?.resume.career[0]?.name).toBe('ACME'));
  });

  test('各行の「削除」で行が消える', async () => {
    click('#career-history .remove-row');
    expect(document.querySelectorAll('#career-history .card')).toHaveLength(0);
  });
});

describe('入力内容の削除', () => {
  test('メニュー → 削除 → 確認で、フォームと保存データが空になる', async () => {
    fill('#name-input', '山田 太郎');
    fill('#birthdate-input', '1990-04-01');
    click('#add-license-history');
    await vi.waitFor(() => expect(document.querySelectorAll('#license-history .card')).toHaveLength(1));
    await sleep(200);

    click('#delete-content');
    await vi.waitFor(() => expect($('#confirmDeleteModal').classList.contains('show')).toBe(true));
    expect($('#confirmDeleteModal').getAttribute('role')).toBe('dialog'); // Bootstrap が表示時に付与;

    await sleep(500); // 表示トランジション完了前の hide() は Bootstrap に無視される
    click('#confirm-delete');
    await vi.waitFor(() => expect($('#confirmDeleteModal').classList.contains('show')).toBe(false), { timeout: 5000 });

    expect($<HTMLInputElement>('#name-input').value).toBe('');
    expect($<HTMLInputElement>('#birthdate-input').value).toBe('');
    expect(document.querySelectorAll('#license-history .card')).toHaveLength(0);
    expect($('#age-display').textContent?.trim()).toBe('');
    expect($('#sf-toast-container').getAttribute('aria-live')).toBe('polite');

    const { loadResume } = await import('../../src/db.ts');
    expect(await loadResume()).toBeUndefined();
  });
});
