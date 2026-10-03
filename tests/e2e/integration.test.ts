import { beforeAll, describe, expect, test, vi } from 'vitest';
import { cdp } from 'vitest/browser';
import { formResumeToJson } from '../../src/features/resume-json.ts';
import { sample } from '../unit/fixtures.ts';
import { mountAppWith, setNativeValue, sleep } from './mount-app.ts';

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector(selector) as T;
const input = (id: string) => document.getElementById(id) as HTMLInputElement;
const fill = (id: string, value: string) => {
  setNativeValue(input(id), value);
  input(id).dispatchEvent(new Event('change', { bubbles: true }));
};

const seed = formResumeToJson(sample());
seed.resume.hobby = 'フォームに無い項目';

beforeAll(() => mountAppWith(seed));

describe('保存データの復元', () => {
  test('復元した内容が入力欄・行に表示され、復元しただけでは保存し直さない', async () => {
    expect(input('name-input').value).toBe('山田 太郎');
    expect(input('zip-code-input').value).toBe('1000001');
    expect(document.querySelectorAll('#career-history .card')).toHaveLength(2);
    expect(document.querySelectorAll('#license-history .card')).toHaveLength(2);
    expect($('#age-display').textContent?.trim()).toMatch(/^\d+$/);
    await sleep(300);
    const { loadResume } = await import('../../src/db.ts');
    expect((await loadResume())?.resume.hobby).toBe('フォームに無い項目');
  });

  test('復元後の編集は保存される', async () => {
    fill('address1-input', '東京都港区');
    const { loadResume } = await import('../../src/db.ts');
    await vi.waitFor(async () => expect((await loadResume())?.address1).toBe('東京都港区'));
    const saved = await loadResume();
    expect(saved?.resume.career).toHaveLength(2);
    expect(saved?.resume.career[0]).not.toHaveProperty('id');
  });
});

describe('ふりがなの自動入力（@j1nn0/vanilla-autokana）', () => {
  const name = () => input('name-input');
  const kana = () => input('furigana-input');
  // ふりがなの自動入力は氏名欄を編集している間だけ反映されるため、実際にフォーカスを移す
  const focusName = () => name().focus();
  const blurName = () => name().blur();
  const savedKana = async () => (await (await import('../../src/db.ts')).loadResume())?.fullnameKana;

  test('ひらがなの入力が、ふりがなの表示と保存データへ反映される', async () => {
    fill('name-input', '');
    fill('furigana-input', '');
    focusName();
    for (const value of ['や', 'やま', 'やまだ']) setNativeValue(name(), value);
    await vi.waitFor(() => expect(kana().value).toBe('やまだ'));
    blurName();
    await vi.waitFor(async () => expect(await savedKana()).toBe('やまだ'));
  });

  test('IME で入力して漢字に変換しても、ふりがなが残る（composition イベント）', async () => {
    fill('name-input', '');
    fill('furigana-input', '');
    focusName();
    name().dispatchEvent(new CompositionEvent('compositionstart'));
    for (const value of ['さ', 'さと', 'さとう']) setNativeValue(name(), value);
    // 変換を確定: 氏名は漢字になり、ふりがなは確定前の読みのまま
    setNativeValue(name(), '佐藤');
    name().dispatchEvent(new CompositionEvent('compositionend'));
    await vi.waitFor(() => expect(kana().value).toBe('さとう'));
    blurName();
    await vi.waitFor(async () => expect(await savedKana()).toBe('さとう'));
    const { loadResume } = await import('../../src/db.ts');
    expect((await loadResume())?.fullname).toBe('佐藤');
  });

  test('実際の IME 入力（信頼されたイベント）でも、変換中の氏名欄の値が消えない', async () => {
    fill('name-input', '');
    fill('furigana-input', '');
    focusName();
    const session = cdp();
    // 合成イベントと違い、実際の入力ではリスナーの間にマイクロタスクが走る。
    // ふりがなの state 更新が氏名欄より先に描画されると、氏名欄が空に戻される（スマホ・タブレットで入力できない不具合）
    for (const text of ['さ', 'さと', 'さとう']) {
      await session.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
      await sleep(50);
      expect(name().value).toBe(text);
      expect(kana().value).toBe(text);
    }
    await session.send('Input.insertText', { text: '佐藤' });
    await vi.waitFor(() => expect(name().value).toBe('佐藤'));
    expect(kana().value).toBe('さとう');
    blurName();
  });

  test('すでにある氏名・ふりがなの続きとして入力する', async () => {
    fill('name-input', '佐藤');
    fill('furigana-input', 'さとう');
    focusName();
    setNativeValue(name(), 'た');
    await vi.waitFor(() => expect(kana().value).toBe('さとうた'));
    blurName();
  });

  test('氏名欄を編集していないとき（自動入力など）の変更では、ふりがなを上書きしない', async () => {
    fill('furigana-input', 'ふりがな');
    fill('name-input', '山田 花子');
    await sleep(100);
    expect(kana().value).toBe('ふりがな');
  });
});

describe('メニューからのプレビュー表示のブロック', () => {
  const menu = () => document.getElementById('offcanvasNavbar') as HTMLElement;
  const openMenu = async () => {
    // 実際の操作と同じく、トグルボタンにフォーカスがある状態で開く（閉じたときのフォーカス復帰と競合しないことの確認）
    $('.navbar-toggler').focus();
    $('.navbar-toggler').click();
    await vi.waitFor(() => expect(menu().classList.contains('show')).toBe(true));
  };
  const modalShown = () =>
    document.getElementById('resumeModal')?.closest('.modal')?.classList.contains('show') ?? false;
  const resetForm = () => {
    fill('created-at', '2026-10-03');
    fill('furigana-input', 'やまだ たろう');
    fill('name-input', '山田 太郎');
    fill('birthdate-input', '1990-04-01');
    fill('zip-code-input', '1000001');
    fill('address1-input', '東京都千代田区');
    fill('tel1-input', '');
    fill('mail1-input', '');
    fill('tel2-input', '');
  };

  test('メニューを開いた状態でエラーがあると、メニューを閉じてから最初の不正欄にフォーカスする', async () => {
    resetForm();
    fill('zip-code-input', '12345');
    await sleep(200);
    await openMenu();
    $('#show-resume').click();
    await vi.waitFor(() => expect(menu().classList.contains('show')).toBe(false), { timeout: 5000 });
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('zip-code-input'), { timeout: 5000 });
    // その後にメニューのフォーカス復帰でトグルボタンへ戻されないこと
    await sleep(400);
    expect(document.activeElement?.id).toBe('zip-code-input');
    expect(modalShown()).toBe(false);
  });

  test('最初の不正欄が連絡先（折りたたみ内）なら、展開してからフォーカスする', async () => {
    resetForm();
    fill('tel2-input', 'abc');
    await sleep(200);
    expect(document.getElementById('collapseOne')?.classList.contains('show')).toBe(false);
    await openMenu();
    $('#show-resume').click();
    await vi.waitFor(() => expect(document.getElementById('collapseOne')?.classList.contains('show')).toBe(true), {
      timeout: 5000,
    });
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('tel2-input'), { timeout: 5000 });
    await sleep(400);
    expect(document.activeElement?.id).toBe('tel2-input');
    expect(modalShown()).toBe(false);
  });

  test('すべて正しければメニューが閉じ、プレビューが開く', async () => {
    resetForm();
    await sleep(200);
    await openMenu();
    $('#show-resume').click();
    await vi.waitFor(() => expect(modalShown()).toBe(true), { timeout: 10_000 });
    expect(menu().classList.contains('show')).toBe(false);
    expect(document.querySelector('#resume-modal-content .resume-preview')?.textContent).toContain('山田 太郎');
  });
});
