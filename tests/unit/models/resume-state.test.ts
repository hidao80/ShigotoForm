import { describe, expect, test } from 'vitest';
import { createEmptyResume } from '../../../src/models/Resume.ts';
import { fromResume, resumeReducer, toResume } from '../../../src/models/resume-state.ts';
import { sample } from '../fixtures.ts';

describe('fromResume / toResume', () => {
  test('往復で内容が変わらず、行の id は取り除かれる', () => {
    const state = fromResume(sample());
    expect(state.career.every((row) => typeof row.id === 'string' && row.id !== '')).toBe(true);
    expect(toResume(state)).toEqual(sample());
    for (const row of toResume(state).career) expect(row).not.toHaveProperty('id');
    for (const row of toResume(state).license) expect(row).not.toHaveProperty('id');
  });

  test('行の id は行ごとに一意で、作り直すたびに新しくなる', () => {
    const a = fromResume(sample());
    const b = fromResume(sample());
    const ids = [...a.career, ...a.license, ...b.career, ...b.license].map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('資格の区分は「取得」以外（空など）を「合格」として扱う', () => {
    const state = fromResume({
      ...createEmptyResume(),
      license: [
        { date: '', name: 'a', pass: '' },
        { date: '', name: 'b', pass: '取得' },
        { date: '', name: 'c', pass: 'その他' },
      ],
    });
    expect(state.license.map((l) => l.pass)).toEqual(['合格', '取得', '合格']);
  });

  test('職歴の旧形式フィールド（startDate / endDate）は Resume に出さない', () => {
    const state = fromResume({
      ...createEmptyResume(),
      career: [{ start: '2020-04', end: '', name: 'A', position: '', description: '', startDate: 'x', endDate: 'y' }],
    });
    expect(toResume(state).career[0]).toEqual({ start: '2020-04', end: '', name: 'A', position: '', description: '' });
  });
});

describe('resumeReducer', () => {
  const initial = () => fromResume(sample());

  test('field は単一値の欄だけを更新する', () => {
    const next = resumeReducer(initial(), { type: 'field', field: 'fullname', value: '花子' });
    expect(next.fullname).toBe('花子');
    expect(next.career).toEqual(initial().career.map((row) => ({ ...row, id: expect.any(String) })));
  });

  test('field は値が同じなら同じ状態（同一参照）を返す', () => {
    const state = initial();
    expect(resumeReducer(state, { type: 'field', field: 'fullname', value: state.fullname })).toBe(state);
  });

  test('add-career / add-license は空の行を末尾に追加する（資格の区分は「合格」）', () => {
    const state = resumeReducer(resumeReducer(initial(), { type: 'add-career' }), { type: 'add-license' });
    expect(state.career).toHaveLength(3);
    expect(state.career[2]).toMatchObject({ start: '', end: '', name: '', position: '', description: '' });
    expect(state.license).toHaveLength(3);
    expect(state.license[2]).toMatchObject({ date: '', name: '', pass: '合格' });
  });

  test('update は id の行だけを部分更新する', () => {
    const state = initial();
    const target = state.career[1] as (typeof state.career)[number];
    const next = resumeReducer(state, { type: 'update-career', id: target.id, patch: { name: '新社名' } });
    expect(next.career.map((r) => r.name)).toEqual(['○○大学', '新社名']);
    const lic = state.license[0] as (typeof state.license)[number];
    const next2 = resumeReducer(state, { type: 'update-license', id: lic.id, patch: { pass: '合格' } });
    expect(next2.license.map((r) => r.pass)).toEqual(['合格', '合格']);
  });

  test('remove は途中の行を消しても残りの行の id が変わらない', () => {
    const state = resumeReducer(initial(), { type: 'add-career' });
    const [first, second, third] = state.career as [(typeof state.career)[number], ...(typeof state.career)[number][]];
    const next = resumeReducer(state, { type: 'remove-career', id: second?.id ?? '' });
    expect(next.career.map((r) => r.id)).toEqual([first.id, third?.id]);
    const lic = state.license[0] as (typeof state.license)[number];
    expect(resumeReducer(state, { type: 'remove-license', id: lic.id }).license).toHaveLength(1);
  });

  test('replace は全体を差し替える', () => {
    const next = resumeReducer(initial(), { type: 'replace', resume: createEmptyResume() });
    expect(toResume(next)).toEqual(createEmptyResume());
  });

  test('元の状態を書き換えない', () => {
    const state = initial();
    const snapshot = structuredClone(state);
    resumeReducer(state, { type: 'add-career' });
    resumeReducer(state, { type: 'field', field: 'fullname', value: 'x' });
    expect(state).toEqual(snapshot);
  });
});
