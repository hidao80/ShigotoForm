import { saveResume } from '../db.ts';
import { loadToForm, saveFromForm } from '../resume.ts';
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
      const text = await file.text();
      const data = JSON.parse(text);
      loadToForm(jsonToFormResume(data));
      await saveResume(data);
    };
    input.click();
  });
}
