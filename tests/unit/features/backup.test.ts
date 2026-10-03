import { afterEach, describe, expect, test, vi } from 'vitest';
import { exportResume, pickJsonFile, readResumeFile } from '../../../src/features/backup.ts';
import { formResumeToJson } from '../../../src/features/resume-json.ts';
import { sample } from '../fixtures.ts';

const showToast = vi.hoisted(() => vi.fn());
vi.mock('../../../src/components/toast.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/components/toast.ts')>()),
  showToast,
}));

afterEach(() => {
  vi.restoreAllMocks();
  showToast.mockClear();
});

const file = (text: string) => new File([text], 'resume.json', { type: 'application/json' });

describe('readResumeFile', () => {
  test('正しい JSON は検証・正規化して返し、トーストは出さない', async () => {
    const json = formResumeToJson(sample());
    expect(await readResumeFile(file(JSON.stringify(json)))).toEqual(json);
    expect(showToast).not.toHaveBeenCalled();
  });

  test('旧形式（json 直下の career）も正規化して受け付ける', async () => {
    const data = await readResumeFile(
      file(JSON.stringify({ fullname: 'X', career: [{ startDate: '2010-04', name: 'A' }] })),
    );
    expect(data?.resume.career[0]).toMatchObject({ start: '2010-04', name: 'A' });
  });

  test('JSON として不正なら null とエラートースト', async () => {
    expect(await readResumeFile(file('{not json'))).toBeNull();
    expect(showToast).toHaveBeenCalledWith('JSONとして読み込めませんでした。', 'error', 5000);
  });

  test('形式が不正なら null と、問題を列挙したエラートースト（日本語）', async () => {
    expect(await readResumeFile(file(JSON.stringify({ fullname: 1, tel1: 2 })))).toBeNull();
    const [message, kind] = showToast.mock.calls[0] as [string, string];
    expect(kind).toBe('error');
    expect(message).toContain('履歴書データの形式が正しくありません。');
    expect(message).toContain('・fullname:');
    expect(message).toContain('・tel1:');
    expect(message).not.toMatch(/Invalid input|expected/);
  });
});

describe('pickJsonFile', () => {
  const stubClick = (action: (input: HTMLInputElement) => void) =>
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      action(this);
    });

  test('選択されたファイルを返し、JSON だけを受け付ける', async () => {
    const chosen = file('{}');
    let accept = '';
    stubClick((input) => {
      accept = input.accept;
      // jsdom に DataTransfer は無いため、files は配列で代用する
      Object.defineProperty(input, 'files', { value: [chosen] });
      input.dispatchEvent(new Event('change'));
    });
    expect(await pickJsonFile()).toBe(chosen);
    expect(accept).toBe('.json,application/json');
  });

  test('キャンセルなら undefined', async () => {
    stubClick((input) => input.dispatchEvent(new Event('cancel')));
    expect(await pickJsonFile()).toBeUndefined();
  });
});

describe('exportResume', () => {
  test('resume_YYYYMMDD.json として、従来の JSON 形式（行の id なし）でダウンロードする', async () => {
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob) => {
      blob = b;
      return 'blob:test';
    });
    let download = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      download = this.download;
    });
    exportResume(sample());
    expect(download).toBe('resume_20261003.json');
    expect(blob?.type).toBe('application/json');
    expect(JSON.parse((await blob?.text()) ?? '')).toEqual(formResumeToJson(sample()));
  });
});
