import { describe, expect, test } from 'vitest';
import { escapeHtml } from '../../../src/components/escape-html.ts';
import { generateResumeHtml } from '../../../src/components/resume-preview.ts';
import { createEmptyResume } from '../../../src/models/Resume.ts';
import { sample } from '../fixtures.ts';

describe('generateResumeHtml', () => {
  test('日付を YYYY年MM月DD日 / YYYY年MM月 形式に整形する', () => {
    const html = generateResumeHtml(sample());
    expect(html).toContain('1990年04月01日');
    expect(html).toContain('2010年04月 ～ 2014年03月');
  });

  test('終了年月が空なら「現在」と表示する', () => {
    expect(generateResumeHtml(sample())).toContain('2014年04月 ～ 現在');
  });

  test('郵便番号は 7 桁ならハイフンを挿入し、ハイフン付きはそのまま', () => {
    expect(generateResumeHtml(sample())).toContain('100-0001');
    expect(generateResumeHtml({ ...sample(), zipCode: '123-4567' })).toContain('123-4567');
  });

  test('フォント種別に応じたクラスを付与する（既定はゴシック）', () => {
    expect(generateResumeHtml(sample())).toContain('font-gothic');
    expect(generateResumeHtml(sample(), 'mincho')).toContain('font-mincho');
  });

  test('免許・資格の区分を出力する', () => {
    const html = generateResumeHtml(sample());
    expect(html).toContain('普通自動車免許');
    expect(html).toContain('取得');
    expect(html).toContain('合格');
  });

  test('空データでも例外なく生成できる', () => {
    expect(() => generateResumeHtml(createEmptyResume())).not.toThrow();
  });
});

describe('HTML エスケープ', () => {
  const nasty = `"><img src=x onerror=alert(1)> & '`;

  test('escapeHtml は & < > " \' を数値文字参照へ置換し、未指定は空文字', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&#38;&#60;&#62;&#34;&#39;');
    expect(escapeHtml(undefined)).toBe('');
  });

  test('履歴書プレビューは値をタグとして解釈せず、文字列として表示する', () => {
    const data = {
      ...createEmptyResume(),
      fullname: nasty,
      fullnameKana: nasty,
      sex: nasty,
      address1: nasty,
      address2: nasty,
      tel1: nasty,
      tel2: nasty,
      mail1: nasty,
      career: [{ start: nasty, end: nasty, name: nasty, position: nasty, description: nasty }],
      license: [{ date: nasty, name: nasty, pass: nasty }],
    };
    const host = document.createElement('div');
    host.innerHTML = generateResumeHtml(data);
    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('td')?.textContent).toContain(nasty);
    expect(host.querySelector('li')?.textContent).toContain(nasty);
  });
});
