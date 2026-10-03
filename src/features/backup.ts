import { formatToastList, showToast } from '../components/toast.ts';
import { saveResume } from '../db.ts';
import { parseResumeJson } from '../models/resume-schema.ts';
import { loadToForm, saveFromForm } from '../resume.ts';
import { refreshFormValidation, validateFormWithWarning } from './form-validation.ts';
import { formResumeToJson, jsonToFormResume } from './resume-json.ts';

/**
 * エクスポート / インポートボタンにイベントリスナーを追加します。
 * @returns {void}
 * @throws なし
 */
export function setupBackup() {
  /**
   * エクスポートボタン
   */
  document.querySelector('#backup-button')?.addEventListener('click', async () => {
    // 入力途中でもバックアップできるよう、エラーは警告のみでエクスポートは続行する
    validateFormWithWarning({ header: '入力内容に誤りがあります（エクスポートは続行しました）。', focus: false });
    const data = saveFromForm();
    // 入力年月日取得
    const date = (data.createdAt || '').replace(/-/g, '');
    const filename = `resume_${date}.json`;
    // エクスポートは従来のjson形式
    const blob = new Blob([JSON.stringify(formResumeToJson(data), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  });

  /**
   * インポートボタン
   */
  document.querySelector('#upload-button')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      let raw: unknown;
      try {
        raw = JSON.parse(await file.text());
      } catch {
        showToast('JSONとして読み込めませんでした。', 'error', 5000);
        return;
      }
      const result = parseResumeJson(raw);
      if (!result.success) {
        showToast(formatToastList('履歴書データの形式が正しくありません。', result.errors), 'error', 8000);
        return;
      }
      loadToForm(jsonToFormResume(result.data));
      refreshFormValidation();
      await saveResume(result.data);
    };
    input.click();
  });
}
