import { showToast } from '../components/toast.ts';
import { saveResume } from '../db.ts';
import { parseResumeJson } from '../models/resume-schema.ts';
import { loadToForm, saveFromForm } from '../resume.ts';
import { formResumeToJson, jsonToFormResume } from './resume-json.ts';

// インポート検証エラーをトーストに列挙する最大件数
const MAX_SHOWN_ERRORS = 5;

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
      let raw: unknown;
      try {
        raw = JSON.parse(await file.text());
      } catch {
        showToast('JSONとして読み込めませんでした。', 'error', 5000);
        return;
      }
      const result = parseResumeJson(raw);
      if (!result.success) {
        const shown = result.errors.slice(0, MAX_SHOWN_ERRORS).map((e) => `・${e}`);
        const rest = result.errors.length - shown.length;
        if (rest > 0) shown.push(`…他${rest}件`);
        showToast(['履歴書データの形式が正しくありません。', ...shown].join('\n'), 'error', 8000);
        return;
      }
      loadToForm(jsonToFormResume(result.data));
      await saveResume(result.data);
    };
    input.click();
  });
}
