import { describe, expect, test } from 'vitest';
import { formResumeToJson } from '../../../src/features/resume-json.ts';
import { parseResumeJson } from '../../../src/models/resume-schema.ts';
import { sample } from '../fixtures.ts';

describe('parseResumeJson', () => {
  test('formResumeToJson の出力はそのまま検証を通り、内容が変わらない', () => {
    const json = formResumeToJson(sample());
    const result = parseResumeJson(json);
    expect(result).toEqual({ success: true, data: json });
  });

  test('旧形式（json 直下の career / license、resume 欠落、startDate / endDate）を正規化する', () => {
    const result = parseResumeJson({
      fullname: '山田 太郎',
      createdAt: '2026-10-03',
      career: [{ startDate: '2010-04', endDate: '2014-03', name: 'X' }],
      license: [{ date: '2012-06', name: 'Y' }],
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.resume.career).toEqual([
      expect.objectContaining({ start: '2010-04', end: '2014-03', name: 'X', position: '', description: '' }),
    ]);
    expect(result.data.resume.license).toEqual([expect.objectContaining({ date: '2012-06', name: 'Y', pass: '合格' })]);
    expect(result.data.tel1).toBe('');
    expect(result.data.age).toBe(0);
  });

  test('resume 配下の career が json 直下の career より優先される', () => {
    const result = parseResumeJson({
      ...formResumeToJson(sample()),
      career: [{ name: '旧' }],
    });
    expect(result.success && result.data.resume.career.map((c) => c.name)).toEqual(['○○大学', 'ACME']);
  });

  test('未知のキーは保持される', () => {
    const result = parseResumeJson({ ...formResumeToJson(sample()), extra: 'keep' });
    expect(result.success && (result.data as unknown as Record<string, unknown>).extra).toBe('keep');
  });

  test.each([
    ['null', null],
    ['文字列', 'abc'],
    ['配列', []],
  ])('オブジェクト以外（%s）は失敗する', (_label, input) => {
    expect(parseResumeJson(input).success).toBe(false);
  });

  test('項目の型が違えば失敗し、パスを含むメッセージを返す', () => {
    const result = parseResumeJson({ ...formResumeToJson(sample()), fullname: 123 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.join(',')).toContain('fullname');
    expect(result.errors.join(',')).toMatch(/[ぁ-んァ-ヶ一-龠]/);
    expect(result.errors.join(',')).not.toContain('Invalid input');
  });

  test('複数の不正は全件が errors に入る', () => {
    const result = parseResumeJson({ ...formResumeToJson(sample()), fullname: 1, tel1: 2, mail1: null });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors).toHaveLength(3);
    expect(result.errors.map((e) => e.split(':')[0])).toEqual(['fullname', 'tel1', 'mail1']);
  });

  test('職歴の中の型違いはインデックス付きパスで報告される', () => {
    const result = parseResumeJson({
      ...formResumeToJson(sample()),
      resume: { career: [{ name: 1 }] },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.join(',')).toContain('resume.career.0.name');
  });

  test('career が配列でなければ失敗する', () => {
    expect(parseResumeJson({ ...formResumeToJson(sample()), career: 'x' }).success).toBe(false);
  });

  test('career の null 要素は失敗する', () => {
    expect(parseResumeJson({ career: [null] }).success).toBe(false);
  });
});
