import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { resumeFormHtml } from '../../../src/components/resume-form.ts';
import {
  refreshFormValidation,
  setupFormValidation,
  validateFormWithWarning,
} from '../../../src/features/form-validation.ts';
import { loadToForm } from '../../../src/resume.ts';
import { sample } from '../fixtures.ts';

const $ = (id: string) => document.getElementById(id) as HTMLInputElement;
const feedback = (id: string) => document.getElementById(`${id}-error`);

/** 値を設定して指定イベントを発火する */
const fire = (id: string, type: 'input' | 'change' | 'focusout', value?: string, init: InputEventInit = {}) => {
  const el = $(id);
  if (value !== undefined) el.value = value;
  el.dispatchEvent(
    type === 'input' ? new InputEvent('input', { bubbles: true, ...init }) : new Event(type, { bubbles: true }),
  );
};

const toastText = () => [...document.querySelectorAll('#sf-toast-container .sf-toast')].map((t) => t.textContent ?? '');

beforeEach(() => {
  document.body.innerHTML = resumeFormHtml();
  setupFormValidation();
});

afterEach(() => {
  document.getElementById('sf-toast-container')?.remove();
});

describe('随時表示', () => {
  test('初期表示（空欄）では必須エラーを出さない', () => {
    expect(document.querySelectorAll('.is-invalid')).toHaveLength(0);
    expect(document.querySelectorAll('.invalid-feedback')).toHaveLength(0);
  });

  test('離脱時に検証し、is-invalid / aria-invalid / aria-describedby とメッセージを付ける', () => {
    fire('zip-code-input', 'focusout', '12345');
    const el = $('zip-code-input');
    expect(el.classList.contains('is-invalid')).toBe(true);
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toBe('zip-code-input-error');
    expect(feedback('zip-code-input')?.textContent).toBe('郵便番号は7桁の数字で入力してください（ハイフン可）');
    expect(feedback('zip-code-input')?.previousElementSibling).toBe(el);
  });

  test('空の必須欄から離脱すると必須エラーを出す', () => {
    fire('name-input', 'focusout');
    expect(feedback('name-input')?.textContent).toBe('氏名を入力してください');
  });

  test('エラー表示中の欄は入力のたびに再検証され、直ったら即座に解除される', () => {
    fire('zip-code-input', 'change', '12345');
    fire('zip-code-input', 'input', '1000001');
    const el = $('zip-code-input');
    expect(el.classList.contains('is-invalid')).toBe(false);
    expect(el.hasAttribute('aria-invalid')).toBe(false);
    expect(el.hasAttribute('aria-describedby')).toBe(false);
  });

  test('正しい欄は入力途中の値でエラー表示に変えない（確定時に検証）', () => {
    fire('zip-code-input', 'change', '1000001');
    fire('zip-code-input', 'input', '100');
    expect($('zip-code-input').classList.contains('is-invalid')).toBe(false);
    fire('zip-code-input', 'change', '100');
    expect($('zip-code-input').classList.contains('is-invalid')).toBe(true);
  });

  test('IME 変換中の入力では再検証しない', () => {
    fire('furigana-input', 'change', '山田');
    expect($('furigana-input').classList.contains('is-invalid')).toBe(true);
    fire('furigana-input', 'input', 'やまだ', { isComposing: true });
    expect($('furigana-input').classList.contains('is-invalid')).toBe(true);
    fire('furigana-input', 'input', 'やまだ', { isComposing: false });
    expect($('furigana-input').classList.contains('is-invalid')).toBe(false);
  });

  test('氏名の入力でふりがなが自動入力されたら、表示中のふりがなエラーを解除する', () => {
    fire('furigana-input', 'change', '');
    expect($('furigana-input').classList.contains('is-invalid')).toBe(true);
    $('furigana-input').value = 'やまだ'; // vanilla-autokana はイベントを発火せずに値を書き込む
    fire('name-input', 'input', '山田');
    expect($('furigana-input').classList.contains('is-invalid')).toBe(false);
  });

  test('input-group 内の欄はグループ末尾にフィードバックを置く', () => {
    fire('created-at', 'change', '');
    const group = $('created-at').closest('.input-group');
    expect(group?.classList.contains('has-validation')).toBe(true);
    expect(feedback('created-at')?.parentElement).toBe(group);
    expect(feedback('created-at')?.previousElementSibling?.classList.contains('input-group-text')).toBe(true);
  });

  test('同じエラーの再検証では DOM を書き換えない', () => {
    fire('zip-code-input', 'change', '12345');
    const node = feedback('zip-code-input');
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) => mutations.push(...records));
    observer.observe($('zip-code-input').parentElement as HTMLElement, {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true,
    });
    fire('zip-code-input', 'change', '12345');
    fire('zip-code-input', 'input', '1234');
    return Promise.resolve().then(() => {
      observer.disconnect();
      expect(feedback('zip-code-input')).toBe(node);
      expect(mutations.filter((m) => m.type !== 'characterData')).toHaveLength(0);
    });
  });
});

describe('refreshFormValidation', () => {
  test('入力済みの不正値は表示し、空欄は必須エラーを出さず表示を消す', () => {
    fire('name-input', 'change', '');
    $('zip-code-input').value = '12345';
    $('tel1-input').value = 'abc';
    refreshFormValidation();
    expect($('zip-code-input').classList.contains('is-invalid')).toBe(true);
    expect($('tel1-input').classList.contains('is-invalid')).toBe(true);
    expect($('name-input').classList.contains('is-invalid')).toBe(false);
  });

  test('復元・削除後の値に表示が追従する', () => {
    fire('zip-code-input', 'change', '12345');
    loadToForm(sample());
    refreshFormValidation();
    expect(document.querySelectorAll('.is-invalid')).toHaveLength(0);
  });
});

describe('validateFormWithWarning', () => {
  test('正しければ true で、警告もエラー表示も出さない', () => {
    loadToForm(sample());
    expect(validateFormWithWarning({ header: '誤りがあります。', focus: true })).toBe(true);
    expect(toastText()).toEqual([]);
    expect(document.querySelectorAll('.is-invalid')).toHaveLength(0);
  });

  test('不正なら false で、全ての不正欄を表示し、警告トーストに最大 5 件 + 件数を列挙する', () => {
    expect(validateFormWithWarning({ header: '誤りがあります。', focus: false })).toBe(false);
    expect(document.querySelectorAll('.is-invalid')).toHaveLength(6);
    const [text] = toastText();
    expect(text?.split('\n')[0]).toBe('誤りがあります。');
    expect(text?.split('\n').filter((l) => l.startsWith('・'))).toHaveLength(5);
    expect(text).toContain('…他1件');
    expect(document.querySelector('.sf-toast.warn')).not.toBeNull();
  });

  test('focus: true なら画面上で最初の不正欄にフォーカスする', () => {
    loadToForm({ ...sample(), zipCode: '12345', address1: ' ' });
    validateFormWithWarning({ header: '誤りがあります。', focus: true });
    expect(document.activeElement).toBe($('zip-code-input'));
  });

  test('focus: false ならフォーカスを移さない', () => {
    loadToForm({ ...sample(), zipCode: '12345' });
    validateFormWithWarning({ header: '誤りがあります。', focus: false });
    expect(document.activeElement).not.toBe($('zip-code-input'));
  });

  test('直った欄の表示は解除される', () => {
    loadToForm({ ...sample(), zipCode: '12345' });
    validateFormWithWarning({ header: 'x', focus: false });
    expect($('zip-code-input').classList.contains('is-invalid')).toBe(true);
    $('zip-code-input').value = '1000001';
    expect(validateFormWithWarning({ header: 'x', focus: false })).toBe(true);
    expect(document.querySelectorAll('.is-invalid')).toHaveLength(0);
  });

  test('折りたたみ内（連絡先）の欄が最初の不正なら、展開操作を行う', () => {
    loadToForm({ ...sample(), tel2: 'abc' });
    const toggle = document.querySelector<HTMLElement>('[data-bs-target="#collapseOne"]') as HTMLElement;
    const clicked = vi.fn();
    toggle.addEventListener('click', clicked);
    validateFormWithWarning({ header: 'x', focus: true });
    expect(clicked).toHaveBeenCalledOnce();
  });
});
