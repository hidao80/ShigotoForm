import 'fake-indexeddb/auto';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ResumeForm } from '../../../src/components/resume-form.tsx';
import { clearResume } from '../../../src/db.ts';
import { useResumeForm } from '../../../src/hooks/use-resume-form.ts';
import { createEmptyResume } from '../../../src/models/Resume.ts';
import { sample } from '../fixtures.ts';

type Form = ReturnType<typeof useResumeForm>;

let latest: Form;

function Harness({ initialContactOpen = false }: { initialContactOpen?: boolean }) {
  const form = useResumeForm();
  latest = form;
  const [open, setOpen] = useState(initialContactOpen);
  return <ResumeForm form={form} contactOpen={open} onContactToggle={setOpen} onContactEntered={() => {}} />;
}

const mount = async (props: { initialContactOpen?: boolean } = {}) => {
  const view = render(<Harness {...props} />);
  await waitFor(() => expect(latest.loaded).toBe(true));
  return view;
};

const $ = (id: string) => document.getElementById(id) as HTMLInputElement;
const feedback = (id: string) => document.getElementById(`${id}-error`);

// 前のテストの自動保存（非同期）が完了してから初期化する
beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  await clearResume();
});

afterEach(cleanup);

describe('随時表示', () => {
  test('初期表示（空欄）では必須エラーを出さない', async () => {
    await mount();
    expect(document.querySelectorAll('.is-invalid')).toHaveLength(0);
    expect(document.querySelectorAll('.invalid-feedback')).toHaveLength(0);
  });

  test('離脱時に検証し、is-invalid / aria-invalid / aria-describedby とメッセージを付ける', async () => {
    await mount();
    fireEvent.change($('zip-code-input'), { target: { value: '12345' } });
    fireEvent.blur($('zip-code-input'));
    const el = $('zip-code-input');
    expect(el.classList.contains('is-invalid')).toBe(true);
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toBe('zip-code-input-error');
    expect(feedback('zip-code-input')?.textContent).toBe('郵便番号は7桁の数字で入力してください（ハイフン可）');
    expect(feedback('zip-code-input')?.previousElementSibling).toBe(el);
  });

  test('値の確定（change）でも検証する', async () => {
    await mount();
    $('zip-code-input').value = '12345';
    await act(async () => {
      fireEvent.change($('zip-code-input'), { target: { value: '12345' } });
    });
    expect($('zip-code-input').classList.contains('is-invalid')).toBe(true);
  });

  test('空の必須欄から離脱すると必須エラーを出す', async () => {
    await mount();
    fireEvent.blur($('name-input'));
    expect(feedback('name-input')?.textContent).toBe('氏名を入力してください');
  });

  test('エラー表示中の欄は入力のたびに再検証され、直ったら即座に解除される', async () => {
    await mount();
    fireEvent.change($('zip-code-input'), { target: { value: '12345' } });
    fireEvent.blur($('zip-code-input'));
    fireEvent.input($('zip-code-input'), { target: { value: '1000001' } });
    const el = $('zip-code-input');
    expect(el.classList.contains('is-invalid')).toBe(false);
    expect(el.hasAttribute('aria-invalid')).toBe(false);
    expect(el.hasAttribute('aria-describedby')).toBe(false);
    expect(feedback('zip-code-input')).toBeNull();
  });

  test('正しい欄は入力途中の値でエラー表示に変えない（離脱時に検証）', async () => {
    await mount();
    fireEvent.change($('zip-code-input'), { target: { value: '1000001' } });
    fireEvent.blur($('zip-code-input'));
    fireEvent.input($('zip-code-input'), { target: { value: '100' } });
    expect($('zip-code-input').classList.contains('is-invalid')).toBe(false);
    fireEvent.blur($('zip-code-input'));
    expect($('zip-code-input').classList.contains('is-invalid')).toBe(true);
  });

  test('IME 変換中の入力では再検証せず、変換が確定した入力で再検証する', async () => {
    await mount();
    fireEvent.change($('furigana-input'), { target: { value: '山田' } });
    fireEvent.blur($('furigana-input'));
    expect($('furigana-input').classList.contains('is-invalid')).toBe(true);
    fireEvent.input($('furigana-input'), { target: { value: 'やま' }, isComposing: true });
    expect($('furigana-input').classList.contains('is-invalid')).toBe(true);
    fireEvent.input($('furigana-input'), { target: { value: 'やまだ' }, isComposing: false });
    expect($('furigana-input').classList.contains('is-invalid')).toBe(false);
  });

  test('input-group 内の欄はグループ末尾にフィードバックを置く', async () => {
    await mount();
    fireEvent.blur($('created-at'));
    const group = $('created-at').closest('.input-group');
    expect(group?.classList.contains('has-validation')).toBe(true);
    expect(feedback('created-at')?.parentElement).toBe(group);
    expect(feedback('created-at')?.previousElementSibling?.classList.contains('input-group-text')).toBe(true);
  });

  test('同じエラーの再検証では DOM を書き換えない', async () => {
    await mount();
    fireEvent.change($('zip-code-input'), { target: { value: '12345' } });
    fireEvent.blur($('zip-code-input'));
    const node = feedback('zip-code-input');
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) => mutations.push(...records));
    observer.observe($('zip-code-input').parentElement as HTMLElement, {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true,
    });
    fireEvent.blur($('zip-code-input'));
    fireEvent.input($('zip-code-input'), { target: { value: '1234' } });
    await Promise.resolve();
    observer.disconnect();
    expect(feedback('zip-code-input')).toBe(node);
    // React は制御コンポーネントの type / name / value を毎回書き直すため、表示に関わる変更だけを見る
    const visible = mutations.filter(
      (m) => m.type === 'childList' || ['class', 'aria-invalid', 'aria-describedby'].includes(m.attributeName ?? ''),
    );
    expect(visible).toHaveLength(0);
  });

  test('連絡先（折りたたみ内）の電話番号も検証する', async () => {
    await mount({ initialContactOpen: true });
    fireEvent.change($('tel2-input'), { target: { value: 'abc' } });
    fireEvent.blur($('tel2-input'));
    expect(feedback('tel2-input')?.textContent).toMatch(/連絡先の電話番号/);
  });
});

describe('復元・差し替え後の表示', () => {
  test('入力済みの不正値は表示し、空欄は必須エラーを出さない', async () => {
    await mount();
    act(() => latest.replace({ ...createEmptyResume(), zipCode: '12345', tel1: 'abc' }));
    expect($('zip-code-input').classList.contains('is-invalid')).toBe(true);
    expect($('tel1-input').classList.contains('is-invalid')).toBe(true);
    expect($('name-input').classList.contains('is-invalid')).toBe(false);
  });

  test('正しい内容に差し替えると表示が消える', async () => {
    await mount();
    fireEvent.change($('zip-code-input'), { target: { value: '12345' } });
    fireEvent.blur($('zip-code-input'));
    act(() => latest.replace(sample()));
    expect(document.querySelectorAll('.is-invalid')).toHaveLength(0);
    expect($('name-input').value).toBe('山田 太郎');
  });

  test('生年月日から満年齢を表示する（空なら空白）', async () => {
    await mount();
    expect($('age-display').textContent?.trim()).toBe('');
    vi.setSystemTime(new Date('2026-10-03T12:00:00'));
    act(() => latest.replace({ ...createEmptyResume(), birthday: '1990-04-01' }));
    expect($('age-display').textContent).toBe('36');
    vi.useRealTimers();
  });
});

describe('動的行', () => {
  const rows = () => [...document.querySelectorAll('#career-history .card')];
  const nameOf = (row: Element | undefined) => row?.querySelector<HTMLInputElement>('input[name="name"]')?.value;

  test('追加・入力・削除ができ、途中の行を消しても残りの行の入力値が保たれる', async () => {
    await mount();
    const add = $('add-career-history');
    fireEvent.click(add);
    fireEvent.click(add);
    fireEvent.click(add);
    expect(rows()).toHaveLength(3);
    for (const [i, row] of rows().entries()) {
      fireEvent.change(row.querySelector('input[name="name"]') as HTMLInputElement, { target: { value: `会社${i}` } });
    }
    fireEvent.click(rows()[0]?.querySelector('.remove-row') as HTMLElement);
    expect(rows().map(nameOf)).toEqual(['会社1', '会社2']);
    fireEvent.click(rows()[1]?.querySelector('.remove-row') as HTMLElement);
    expect(rows().map(nameOf)).toEqual(['会社1']);
  });

  test('免許・資格の区分は選択でき、既定は「合格」', async () => {
    await mount();
    fireEvent.click($('add-license-history'));
    const select = document.querySelector('#license-history .status-select') as HTMLSelectElement;
    expect(select.value).toBe('合格');
    fireEvent.change(select, { target: { value: '取得' } });
    expect(select.value).toBe('取得');
  });

  test('復元した職歴・資格が行として表示される', async () => {
    await mount();
    act(() => latest.replace(sample()));
    expect(rows().map(nameOf)).toEqual(['○○大学', 'ACME']);
    const selects = [...document.querySelectorAll<HTMLSelectElement>('#license-history .status-select')];
    expect(selects.map((s) => s.value)).toEqual(['取得', '合格']);
  });
});

describe('WebMCP（宣言的アノテーション）', () => {
  test('form に toolname / tooldescription があり、name を持つ全コントロールが toolparamdescription を持つ（動的行を含む）', async () => {
    await mount();
    fireEvent.click($('add-career-history'));
    fireEvent.click($('add-license-history'));
    const form = document.querySelector('form') as HTMLFormElement;
    expect(form.getAttribute('toolname')).toBe('fill-resume-basic-info');
    expect(form.getAttribute('tooldescription')).toBeTruthy();
    const missing = [...form.elements]
      .filter((el) => (el as HTMLInputElement).name)
      .filter((el) => !el.getAttribute('toolparamdescription'))
      .map((el) => (el as HTMLInputElement).name);
    expect(missing).toEqual([]);
  });

  test('Enter などによる submit でページ遷移しない', async () => {
    await mount();
    const form = document.querySelector('form') as HTMLFormElement;
    const notPrevented = fireEvent.submit(form);
    expect(notPrevented).toBe(false);
  });
});
