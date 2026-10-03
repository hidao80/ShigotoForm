import 'fake-indexeddb/auto';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { clearResume, loadResume, saveResume } from '../../../src/db.ts';
import { calculateAge } from '../../../src/features/age-display.ts';
import { formResumeToJson } from '../../../src/features/resume-json.ts';
import { useResumeForm } from '../../../src/hooks/use-resume-form.ts';
import { createEmptyResume } from '../../../src/models/Resume.ts';
import { sample } from '../fixtures.ts';

const mount = async () => {
  const hook = renderHook(() => useResumeForm());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
};

/** 保存が（あれば）完了するまで少し待つ */
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 50)));

// 前のテストの自動保存（非同期）が完了してから初期化する
beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  await clearResume();
});

afterEach(cleanup);

describe('復元と自動保存', () => {
  test('保存データがなければ空の状態で、何も保存しない', async () => {
    const { result } = await mount();
    await settle();
    expect(result.current.resume).toEqual(createEmptyResume());
    expect(await loadResume()).toBeUndefined();
  });

  test('保存データを復元し、復元しただけでは保存し直さない（フォーム外の項目を失わない）', async () => {
    const json = formResumeToJson(sample());
    json.resume.hobby = 'フォームに無い項目';
    await saveResume(json);
    const { result } = await mount();
    expect(result.current.resume.fullname).toBe('山田 太郎');
    expect(result.current.state.career).toHaveLength(2);
    await settle();
    expect((await loadResume())?.resume.hobby).toBe('フォームに無い項目');
  });

  test('ユーザー編集は保存され、行の id は保存データに混ざらない', async () => {
    const { result } = await mount();
    act(() => {
      result.current.setField('createdAt', '2026-10-03');
      result.current.setField('birthday', '1990-04-01');
      result.current.edit({ type: 'add-career' });
    });
    await waitFor(async () => expect((await loadResume())?.createdAt).toBe('2026-10-03'));
    const saved = await loadResume();
    expect(saved?.resume.career).toHaveLength(1);
    expect(saved?.resume.career[0]).not.toHaveProperty('id');
    expect(saved?.age).toBe(Number(calculateAge('1990-04-01')));
  });

  test('値が変わらない書き込み（vanilla-autokana の空書き込みなど）は編集とみなさず、保存しない', async () => {
    const { result } = await mount();
    const before = result.current.state;
    act(() => {
      result.current.setField('fullnameKana', '');
      result.current.setField('fullnameKana', '');
    });
    await settle();
    expect(result.current.state).toBe(before);
    expect(await loadResume()).toBeUndefined();
  });

  test('replace（インポート・削除など）は保存しない', async () => {
    const { result } = await mount();
    act(() => result.current.replace(sample()));
    await settle();
    expect(result.current.resume.fullname).toBe('山田 太郎');
    expect(await loadResume()).toBeUndefined();
  });

  test('編集の後の replace でも、差し替えた内容を保存し直さない', async () => {
    const { result } = await mount();
    act(() => {
      result.current.setField('createdAt', '2026-10-03');
    });
    await waitFor(async () => expect(await loadResume()).toBeDefined());
    await clearResume();
    act(() => result.current.replace(createEmptyResume()));
    await settle();
    expect(await loadResume()).toBeUndefined();
  });
});

describe('検証表示', () => {
  test('commitField で検証し、エラー表示中の欄は setField のたびに再検証して解除する', async () => {
    const { result } = await mount();
    act(() => result.current.commitField('zipCode', '12345'));
    expect(result.current.errors.zipCode).toMatch(/7桁/);
    act(() => result.current.setField('zipCode', '123456'));
    expect(result.current.errors.zipCode).toBeDefined();
    act(() => result.current.setField('zipCode', '1000001'));
    expect(result.current.errors.zipCode).toBeUndefined();
  });

  test('正しい欄は入力途中の値でエラーにしない（確定時に検証）', async () => {
    const { result } = await mount();
    act(() => result.current.setField('zipCode', '100'));
    expect(result.current.errors).toEqual({});
    act(() => result.current.commitField('zipCode', '100'));
    expect(result.current.errors.zipCode).toBeDefined();
  });

  test('IME 変換中（composing）は再検証しない', async () => {
    const { result } = await mount();
    act(() => result.current.commitField('fullnameKana', '山田'));
    expect(result.current.errors.fullnameKana).toBeDefined();
    act(() => result.current.setField('fullnameKana', 'やまだ', true));
    expect(result.current.errors.fullnameKana).toBeDefined();
    act(() => result.current.setField('fullnameKana', 'やまだ', false));
    expect(result.current.errors.fullnameKana).toBeUndefined();
  });

  test('検証対象外の欄（性別など）は検証しない', async () => {
    const { result } = await mount();
    act(() => {
      result.current.setField('sex', 'x');
      result.current.commitField('sex', 'x');
    });
    expect(result.current.errors).toEqual({});
  });

  test('validateAll は全欄を検証して表示へ反映し、画面上の並び順で返す', async () => {
    const { result } = await mount();
    let found: ReturnType<typeof result.current.validateAll> = [];
    act(() => {
      found = result.current.validateAll();
    });
    expect(found.map((e) => e.field)).toEqual([
      'createdAt',
      'fullnameKana',
      'fullname',
      'birthday',
      'zipCode',
      'address1',
    ]);
    expect(Object.keys(result.current.errors)).toHaveLength(6);
  });

  test('validateAll は直った欄の表示を解除する', async () => {
    const { result } = await mount();
    act(() => {
      result.current.validateAll();
    });
    act(() => result.current.replace(sample()));
    act(() => {
      expect(result.current.validateAll()).toEqual([]);
    });
    expect(result.current.errors).toEqual({});
  });

  test('replace は入力済みの不正値だけ表示し、空欄は必須エラーを出さない', async () => {
    const { result } = await mount();
    act(() => result.current.replace({ ...createEmptyResume(), zipCode: '12345', tel1: 'abc' }));
    expect(Object.keys(result.current.errors).sort()).toEqual(['tel1', 'zipCode']);
  });

  test('復元した保存データの不正値は表示される', async () => {
    await saveResume(formResumeToJson({ ...sample(), zipCode: '12345' }));
    const { result } = await mount();
    expect(result.current.errors.zipCode).toBeDefined();
  });
});
