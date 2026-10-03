import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import { clearResume, loadResume, type ResumeJson, saveResume } from '../../src/db.ts';

const make = (createdAt: string, fullname: string): ResumeJson => ({
  fullnameKana: '',
  fullname,
  sex: '',
  birthday: '',
  age: 0,
  zipCode: '',
  address1Kana: '',
  address1: '',
  tel1: '',
  mail1: '',
  address2Kana: '',
  address2: '',
  tel2: '',
  mail2: '',
  photo: '',
  createdAt,
  resume: {
    education: [],
    career: [],
    license: [],
    subject: '',
    condition: '',
    hobby: '',
    reason: '',
    expectations: '',
  },
});

beforeEach(async () => {
  await clearResume();
});

describe('db', () => {
  test('データが無ければ undefined', async () => {
    expect(await loadResume()).toBeUndefined();
  });

  test('保存したデータを復元できる', async () => {
    await saveResume(make('2026-10-03', '山田 太郎'));
    expect((await loadResume())?.fullname).toBe('山田 太郎');
  });

  test('同じ createdAt は上書き（upsert）される', async () => {
    await saveResume(make('2026-10-03', '山田 太郎'));
    await saveResume(make('2026-10-03', '山田 花子'));
    expect((await loadResume())?.fullname).toBe('山田 花子');
  });

  test('複数あれば createdAt が最新のものを復元する', async () => {
    await saveResume(make('2026-01-01', '古い'));
    await saveResume(make('2026-12-31', '新しい'));
    await saveResume(make('2026-06-01', '中間'));
    expect((await loadResume())?.fullname).toBe('新しい');
  });

  test('clearResume で全件削除される', async () => {
    await saveResume(make('2026-10-03', '山田 太郎'));
    await clearResume();
    expect(await loadResume()).toBeUndefined();
  });
});
