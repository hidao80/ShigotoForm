import { formatToastList, showToast } from '../components/toast.ts';
import type { ResumeJson } from '../db.ts';
import type { Resume } from '../models/Resume.ts';
import { parseResumeJson } from '../models/resume-schema.ts';
import { formResumeToJson } from './resume-json.ts';

/**
 * 履歴書を JSON ファイルとしてダウンロードします（エクスポートは従来の json 形式）。
 * @param {Resume} resume - エクスポートする履歴書
 * @returns {void}
 * @throws なし
 * @example
 * exportResume(resume);
 */
export function exportResume(resume: Resume) {
  // 入力年月日取得
  const date = (resume.createdAt || '').replace(/-/g, '');
  const blob = new Blob([JSON.stringify(formResumeToJson(resume), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `resume_${date}.json`;
  a.click();
}

/**
 * ファイル選択ダイアログを開き、JSON ファイルを 1 つ選ばせます。
 * @returns {Promise<File | undefined>} 選択されたファイル。キャンセルなら undefined
 * @throws なし
 */
export function pickJsonFile(): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => resolve(input.files?.[0]));
    input.addEventListener('cancel', () => resolve(undefined));
    input.click();
  });
}

/**
 * 選択された JSON ファイルを検証して履歴書データにします。不正ならエラートーストを出して null を返します。
 * @param {File} file - 選択されたファイル
 * @returns {Promise<ResumeJson | null>} 検証・正規化済みのデータ。不正なら null
 * @throws なし
 * @example
 * const data = await readResumeFile(file);
 */
export async function readResumeFile(file: File): Promise<ResumeJson | null> {
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    showToast('JSONとして読み込めませんでした。', 'error', 5000);
    return null;
  }
  const result = parseResumeJson(raw);
  if (!result.success) {
    showToast(formatToastList('履歴書データの形式が正しくありません。', result.errors), 'error', 8000);
    return null;
  }
  return result.data;
}
