import { describe, expect, test } from 'vitest';
import { createEmptyResume } from '../../../src/models/Resume.ts';
import {
  FIELD_PATTERNS,
  RESUME_FORM_FIELDS,
  type ResumeFormField,
  validateField,
  validateResumeForm,
} from '../../../src/models/resume-form-schema.ts';
import { PATTERN_CASES } from '../../field-cases.ts';
import { sample } from '../fixtures.ts';

const FIELD_BY_ID: Record<string, ResumeFormField> = {
  'furigana-input': 'fullnameKana',
  'name-input': 'fullname',
  'zip-code-input': 'zipCode',
  'address1-input': 'address1',
  'tel1-input': 'tel1',
  'tel2-input': 'tel2',
  'mail1-input': 'mail1',
};

describe('validateField', () => {
  // E2E の pattern 属性（patternMismatch）と同じ表を使い、HTML と Zod の規則の乖離を検出する
  test.each(PATTERN_CASES)('%s に "%s" → 不正=%s', (id, value, invalid) => {
    const field = FIELD_BY_ID[id] as ResumeFormField;
    expect(field).toBeDefined();
    expect(validateField(field, value) !== null).toBe(invalid);
  });

  test.each(['createdAt', 'fullnameKana', 'fullname', 'birthday', 'zipCode', 'address1'] as const)(
    '必須の %s は空文字を拒否する',
    (field) => {
      expect(validateField(field, '')).toMatch(/入力してください/);
    },
  );

  test.each(['tel1', 'tel2', 'mail1'] as const)('任意の %s は空文字を許可する', (field) => {
    expect(validateField(field, '')).toBeNull();
  });

  test('メッセージは日本語で、正規表現のソースを含まない', () => {
    for (const [id, value, invalid] of PATTERN_CASES) {
      if (!invalid) continue;
      const message = validateField(FIELD_BY_ID[id] as ResumeFormField, value) ?? '';
      expect(message).toMatch(/[ぁ-んァ-ヶ一-龠]/);
      for (const source of Object.values(FIELD_PATTERNS)) expect(message).not.toContain(source);
    }
  });

  test('パターンは全体一致（前後に余計な文字があれば不正）', () => {
    expect(validateField('zipCode', 'x1000001')).not.toBeNull();
    expect(validateField('zipCode', '1000001x')).not.toBeNull();
    expect(validateField('tel1', '03-1234-5678 ')).not.toBeNull();
  });
});

describe('validateResumeForm', () => {
  test('正しい履歴書データはエラーなし', () => {
    expect(validateResumeForm(sample())).toEqual([]);
  });

  test('空のデータは必須項目を画面上の並び順で 1 欄 1 件ずつ返す', () => {
    const errors = validateResumeForm(createEmptyResume());
    expect(errors.map((e) => e.field)).toEqual([
      'createdAt',
      'fullnameKana',
      'fullname',
      'birthday',
      'zipCode',
      'address1',
    ]);
    expect(RESUME_FORM_FIELDS.slice(0, 6)).toEqual(errors.map((e) => e.field));
  });

  test('任意項目の不正も検出する', () => {
    const errors = validateResumeForm({ ...sample(), tel1: 'abc', mail1: 'x@', tel2: '1' });
    expect(errors.map((e) => e.field)).toEqual(['tel1', 'mail1', 'tel2']);
  });

  test('性別・連絡先住所・職歴・資格は検証しない', () => {
    const resume = { ...sample(), sex: '', address2: '', career: [], license: [] };
    expect(validateResumeForm(resume)).toEqual([]);
  });
});
