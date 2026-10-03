import { beforeAll, describe, expect, test, vi } from 'vitest';
import { PATTERN_CASES } from '../field-cases.ts';
import { controlsMissingToolParam } from '../webmcp.ts';
import { mountApp, setNativeValue, sleep } from './mount-app.ts';

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector(selector) as T;
const click = (selector: string) => $(selector).click();

/** 値を設定して input / change を発火する（自動保存の契機） */
const fill = (selector: string, value: string) => {
  const el = $<HTMLInputElement | HTMLSelectElement>(selector);
  setNativeValue(el, value);
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
    expect(controlsMissingToolParam($<HTMLFormElement>('form'))).toEqual([]);
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

  test.each(PATTERN_CASES)('%s に "%s" → patternMismatch=%s', (id, value, expected) => {
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
    await vi.waitFor(() => expect(document.querySelectorAll('#career-history .card')).toHaveLength(0));
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
    // react-bootstrap は id を .modal-dialog に付け、表示状態（show / role）は外側の .modal が持つ
    const deleteModal = () => document.getElementById('confirmDeleteModal')?.closest('.modal');
    await vi.waitFor(() => expect(deleteModal()?.classList.contains('show')).toBe(true));
    expect(deleteModal()?.getAttribute('role')).toBe('dialog'); // react-bootstrap が表示時に付与

    await sleep(500); // 表示トランジション完了前の hide は無視されることがある
    click('#confirm-delete');
    await vi.waitFor(() => expect(deleteModal()?.classList.contains('show') ?? false).toBe(false), { timeout: 5000 });

    expect($<HTMLInputElement>('#name-input').value).toBe('');
    expect($<HTMLInputElement>('#birthdate-input').value).toBe('');
    expect(document.querySelectorAll('#license-history .card')).toHaveLength(0);
    expect($('#age-display').textContent?.trim()).toBe('');
    expect($('#sf-toast-container').getAttribute('aria-live')).toBe('polite');

    const { loadResume } = await import('../../src/db.ts');
    expect(await loadResume()).toBeUndefined();
  });
});

describe('JSON インポートの検証 (zod)', () => {
  /** インポートボタン → 生成された file input に指定内容のファイルを渡す */
  const importJson = async (text: string) => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      if (this.type !== 'file') return;
      const dt = new DataTransfer();
      dt.items.add(new File([text], 'resume.json', { type: 'application/json' }));
      Object.defineProperty(this, 'files', { value: dt.files });
      this.dispatchEvent(new Event('change'));
    });
    try {
      $<HTMLButtonElement>('#upload-button').click();
    } finally {
      click.mockRestore();
    }
  };

  test('旧形式のJSONは正規化されてフォームと保存データへ反映される', async () => {
    await importJson(
      JSON.stringify({
        fullname: '山田 太郎',
        createdAt: '2026-10-03',
        career: [{ startDate: '2010-04', endDate: '2014-03', name: 'ACME' }],
      }),
    );
    await vi.waitFor(() => expect($<HTMLInputElement>('#name-input').value).toBe('山田 太郎'));
    const { loadResume } = await import('../../src/db.ts');
    await vi.waitFor(async () => expect((await loadResume())?.resume.career[0]?.start).toBe('2010-04'));
  });

  test.each([
    ['JSONとして不正', '{not json', 'JSONとして読み込めませんでした'],
    ['型が不正', JSON.stringify({ fullname: 123 }), '履歴書データの形式が正しくありません'],
  ])('%s な場合はエラートーストを出し、既存データを変更しない', async (_label, text, message) => {
    const { loadResume } = await import('../../src/db.ts');
    const before = await loadResume();
    await importJson(text);
    await vi.waitFor(() =>
      expect(
        [...document.querySelectorAll('#sf-toast-container .sf-toast.error')].some((t) =>
          t.textContent?.includes(message),
        ),
      ).toBe(true),
    );
    expect($<HTMLInputElement>('#name-input').value).toBe('山田 太郎');
    expect(await loadResume()).toEqual(before);
  });

  test('複数の不正は箇条書きで列挙され、5件を超える分は件数にまとめる', async () => {
    const { loadResume } = await import('../../src/db.ts');
    const before = await loadResume();
    const bad = { fullname: 1, tel1: 1, tel2: 1, mail1: 1, mail2: 1, zipCode: 1, address1: 1 };
    await importJson(JSON.stringify(bad));
    const findToast = () =>
      [...document.querySelectorAll('#sf-toast-container .sf-toast.error')]
        .map((t) => t.textContent ?? '')
        .find((t) => t.includes('…他2件'));
    await vi.waitFor(() => expect(findToast()).toBeDefined());
    const text = findToast() ?? '';
    expect(text.split('\n').filter((l: string) => l.startsWith('・'))).toHaveLength(5);
    expect(text).not.toMatch(/Invalid input|expected/);
    expect(await loadResume()).toEqual(before);
  });
});

describe('入力検証の表示とブロック (zod)', () => {
  const FIELDS: [selector: string, value: string][] = [
    ['#created-at', '2026-10-03'],
    ['#furigana-input', 'やまだ たろう'],
    ['#name-input', '山田 太郎'],
    ['#birthdate-input', '1990-04-01'],
    ['#zip-code-input', '1000001'],
    ['#address1-input', '東京都千代田区'],
    ['#tel1-input', ''],
    ['#mail1-input', ''],
    ['#tel2-input', ''],
  ];
  const fillValid = (override: Record<string, string> = {}) => {
    for (const [selector, value] of FIELDS) fill(selector, override[selector] ?? value);
  };
  // 前のテストのトーストが残っていても区別できるよう、reset 時点の要素を控えて新しく出たものだけを見る
  // （トーストの DOM は React が管理するため、直接削除はしない）
  const warnToastNodes = () => [...document.querySelectorAll('#sf-toast-container .sf-toast.warn')];
  let seen = new Set<Element>();
  const resetToasts = () => {
    seen = new Set(warnToastNodes());
  };
  const toasts = () =>
    warnToastNodes()
      .filter((n) => !seen.has(n))
      .map((n) => n.textContent ?? '');
  const modalShown = () =>
    document.getElementById('resumeModal')?.closest('.modal')?.classList.contains('show') ?? false;

  test('不正な値は確定時に赤枠・メッセージ・aria 属性で表示され、直すと入力中に解除される', () => {
    fillValid({ '#zip-code-input': '12345' });
    const zip = $<HTMLInputElement>('#zip-code-input');
    expect(zip.classList.contains('is-invalid')).toBe(true);
    expect(zip.getAttribute('aria-invalid')).toBe('true');
    const feedback = document.getElementById(zip.getAttribute('aria-describedby') ?? '');
    expect(feedback?.textContent).toContain('7桁');
    expect(getComputedStyle(feedback as Element).display).toBe('block');

    setNativeValue(zip, '1000001');
    expect(zip.classList.contains('is-invalid')).toBe(false);
    expect(zip.hasAttribute('aria-describedby')).toBe(false);
    expect(feedback?.isConnected).toBe(false);
  });

  test('入力エラーがあると「履歴書を表示」は警告してブロックし、最初の不正欄にフォーカスする', async () => {
    fillValid({ '#zip-code-input': '12345', '#tel1-input': 'abc' });
    await sleep(200);
    resetToasts();
    click('#show-resume');
    await vi.waitFor(() => expect(toasts()).toHaveLength(1));
    expect(toasts()[0]).toContain('修正してから履歴書を表示してください');
    expect(toasts()[0]).toContain('郵便番号');
    expect(toasts()[0]).toContain('電話番号');
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('zip-code-input'));
    expect($<HTMLInputElement>('#tel1-input').classList.contains('is-invalid')).toBe(true);
    await sleep(600);
    expect(modalShown()).toBe(false);
  });

  test('エクスポートは警告を出すがブロックしない', async () => {
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      fillValid({ '#zip-code-input': '12345' });
      resetToasts();
      click('#backup-button');
      await vi.waitFor(() => expect(toasts()).toHaveLength(1));
      expect(toasts()[0]).toContain('エクスポートは続行しました');
      await vi.waitFor(() => expect(anchorClick).toHaveBeenCalledOnce());
    } finally {
      anchorClick.mockRestore();
    }
  });

  test('すべて正しければ「履歴書を表示」でプレビューが開く', async () => {
    fillValid();
    await sleep(200);
    resetToasts();
    click('#show-resume');
    await vi.waitFor(() => expect(modalShown()).toBe(true), { timeout: 10_000 });
    expect(toasts()).toEqual([]);
    expect(document.querySelectorAll('form .is-invalid')).toHaveLength(0);
    await sleep(500); // 表示トランジション完了前の hide() は Bootstrap に無視される
    click('#resumeModal .modal-footer .btn-secondary');
    await vi.waitFor(() => expect(modalShown()).toBe(false), { timeout: 5000 });
  });
});
