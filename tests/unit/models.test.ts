import { describe, expect, test } from 'vitest';
import { createEmptyResume } from '../../src/models/Resume';

describe('createEmptyResume', () => {
  test('全項目が空で career / license は空配列', () => {
    const r = createEmptyResume();
    expect(r.career).toEqual([]);
    expect(r.license).toEqual([]);
    expect(r.fullname).toBe('');
    expect(r.createdAt).toBe('');
  });

  test('呼び出しごとに独立したオブジェクトを返す', () => {
    const a = createEmptyResume();
    a.career.push({ start: '2020-04', end: '', name: 'A', position: '', description: '' });
    expect(createEmptyResume().career).toHaveLength(0);
  });
});
