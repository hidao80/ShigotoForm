import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { formatDate, formatZipCode, ResumePreview } from '../../../src/components/resume-preview.tsx';
import { createEmptyResume, type Resume } from '../../../src/models/Resume.ts';
import { fromResume } from '../../../src/models/resume-state.ts';
import { sample } from '../fixtures.ts';

afterEach(cleanup);

const renderPreview = (resume: Resume, fontType?: 'gothic' | 'mincho') =>
  render(<ResumePreview data={fromResume(resume)} fontType={fontType} />).container;

describe('ResumePreview', () => {
  test('日付を YYYY年MM月DD日 / YYYY年MM月 形式に整形する', () => {
    const text = renderPreview(sample()).textContent;
    expect(text).toContain('1990年04月01日');
    expect(text).toContain('2010年04月 ～ 2014年03月');
  });

  test('終了年月が空なら「現在」と表示する', () => {
    expect(renderPreview(sample()).textContent).toContain('2014年04月 ～ 現在');
  });

  test('郵便番号は 7 桁ならハイフンを挿入し、ハイフン付きはそのまま', () => {
    expect(renderPreview(sample()).textContent).toContain('100-0001');
    expect(renderPreview({ ...sample(), zipCode: '123-4567' }).textContent).toContain('123-4567');
  });

  test('フォント種別に応じたクラスを付与する（既定はゴシック）', () => {
    expect(renderPreview(sample()).querySelector('.resume-preview')?.classList.contains('font-gothic')).toBe(true);
    expect(renderPreview(sample(), 'mincho').querySelector('.resume-preview')?.classList.contains('font-mincho')).toBe(
      true,
    );
  });

  test('免許・資格の区分を出力する', () => {
    const text = renderPreview(sample()).textContent;
    expect(text).toContain('普通自動車免許');
    expect(text).toContain('取得');
    expect(text).toContain('合格');
  });

  test('ふりがなが無ければ rt を出さない', () => {
    expect(renderPreview({ ...sample(), fullnameKana: '' }).querySelector('rt')).toBeNull();
    expect(renderPreview(sample()).querySelector('rt')?.textContent).toBe('やまだ たろう');
  });

  test('空データでも例外なく描画できる', () => {
    expect(() => renderPreview(createEmptyResume())).not.toThrow();
  });
});

describe('値の表示（HTML として解釈しない）', () => {
  const nasty = `"><img src=x onerror=alert(1)> & '`;

  test('履歴書プレビューは値をタグとして解釈せず、文字列として表示する', () => {
    const container = renderPreview({
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
    });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('td')?.textContent).toContain(nasty);
    expect(container.querySelector('li')?.textContent).toContain(nasty);
  });
});

describe('formatDate / formatZipCode', () => {
  test('formatDate は空・年のみ・年月・年月日を整形する', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate('2020')).toBe('2020年');
    expect(formatDate('2020-04')).toBe('2020年04月');
    expect(formatDate('2020/04/01')).toBe('2020年04月01日');
  });

  test('formatZipCode は 7 桁未満をそのまま返す', () => {
    expect(formatZipCode('')).toBe('');
    expect(formatZipCode('12345')).toBe('12345');
    expect(formatZipCode('1000001')).toBe('100-0001');
  });
});
