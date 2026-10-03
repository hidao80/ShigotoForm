import { saveResume } from '../db.ts';
import { saveFromForm } from '../resume.ts';
import { formResumeToJson } from './resume-json.ts';

/**
 * 入力・変更イベントで自動保存します。
 * すべてのinput, textarea, select要素にchangeイベントを付与し、
 * 動的に追加される行（学歴・職歴 / 免許・資格）にも MutationObserver で付与します。
 * @returns {void}
 * @throws なし
 */
export function setupAutoSave() {
  const formEl = document.querySelector('form');
  if (!formEl) return;

  const saveHandler = async () => {
    const data = saveFromForm();
    await saveResume(formResumeToJson(data));
  };
  const elements = formEl.querySelectorAll('input, textarea, select');
  for (const el of elements) {
    el.addEventListener('change', saveHandler);
    // 年月入力にもイベントを追加
    if (el instanceof HTMLInputElement && (el.type === 'month' || el.type === 'date')) {
      el.addEventListener('input', saveHandler);
    }
  }

  // 動的追加項目にも保存イベントを付与
  const observeTargets = [document.getElementById('career-history'), document.getElementById('license-history')];
  for (const target of observeTargets) {
    if (!target) continue;
    const observer = new MutationObserver(() => {
      // 新しく追加されたinput, textarea, select全てにイベントを付与
      const newInputs = target.querySelectorAll('input, textarea, select');
      for (const el of newInputs) {
        el.removeEventListener('change', saveHandler);
        el.removeEventListener('input', saveHandler);
        el.addEventListener('change', saveHandler);
        el.addEventListener('input', saveHandler);
      }
    });
    observer.observe(target, { childList: true, subtree: true });
  }
}
