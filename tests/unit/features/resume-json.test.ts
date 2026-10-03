import { describe, expect, test } from 'vitest';
import type { ResumeJson } from '../../../src/db.ts';
import { formResumeToJson, jsonToFormResume } from '../../../src/features/resume-json.ts';
import { sample } from '../fixtures.ts';

describe('formResumeToJson / jsonToFormResume', () => {
  test('往復で入力項目・学歴・職歴・免許・資格が保持される', () => {
    const form = sample();
    expect(jsonToFormResume(formResumeToJson(form))).toMatchObject({
      createdAt: form.createdAt,
      fullname: form.fullname,
      fullnameKana: form.fullnameKana,
      birthday: form.birthday,
      zipCode: form.zipCode,
      address1: form.address1,
      tel1: form.tel1,
      mail1: form.mail1,
      career: form.career,
      license: form.license,
    });
  });

  test('ResumeJson の career / license は json.resume 配下に入る', () => {
    const json = formResumeToJson(sample());
    expect(json.resume.career).toHaveLength(2);
    expect(json.resume.license).toHaveLength(2);
    expect(json.age).toBe(0);
  });

  test('空データは空文字・空配列で埋める', () => {
    const json = formResumeToJson({ ...sample(), fullname: '', career: [], license: [] });
    expect(json.fullname).toBe('');
    expect(json.resume.career).toEqual([]);
  });

  test('旧形式（json 直下の career / license、startDate / endDate）にも対応する', () => {
    const legacy = {
      ...formResumeToJson(sample()),
      resume: undefined,
      career: [{ startDate: '2010-04', endDate: '2014-03', name: 'X', position: '', description: '' }],
      license: [{ date: '2012-06', name: 'Y' }],
    } as unknown as ResumeJson;
    const form = jsonToFormResume(legacy);
    expect(form.career).toEqual([{ start: '2010-04', end: '2014-03', name: 'X', position: '', description: '' }]);
    expect(form.license).toEqual([{ date: '2012-06', name: 'Y', pass: '合格' }]);
  });

  test('career / license が配列でも null 要素は除外し、無ければ空配列', () => {
    const json = {
      ...formResumeToJson(sample()),
      resume: undefined,
      career: [null],
      license: undefined,
    } as unknown as ResumeJson;
    const form = jsonToFormResume(json);
    expect(form.career).toEqual([]);
    expect(form.license).toEqual([]);
  });
});
