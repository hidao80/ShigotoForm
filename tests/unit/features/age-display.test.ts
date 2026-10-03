import { describe, expect, test } from 'vitest';
import { calculateAge } from '../../../src/features/age-display.ts';

const today = new Date('2026-10-03T12:00:00');

describe('calculateAge', () => {
  test('誕生日前は 1 歳引く', () => {
    expect(calculateAge('1990-10-04', today)).toBe('35');
  });

  test('誕生日当日・以降は加算済み', () => {
    expect(calculateAge('1990-10-03', today)).toBe('36');
    expect(calculateAge('1990-04-01', today)).toBe('36');
  });

  test('月が同じで日が先なら誕生日前', () => {
    expect(calculateAge('2000-10-31', today)).toBe('25');
  });

  test('空・不正な日付は空文字', () => {
    expect(calculateAge('', today)).toBe('');
    expect(calculateAge('abc', today)).toBe('');
  });

  test('生まれていない日付（未来）は負数になる', () => {
    expect(calculateAge('2027-01-01', today)).toBe('-1');
  });
});
