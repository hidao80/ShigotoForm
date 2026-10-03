import { saveResume } from '../db.ts';
import { saveFromForm } from '../resume.ts';
import { formResumeToJson } from './resume-json.ts';

/**
 * 生年月日から満年齢を計算します。
 * @param {string} birthday - 生年月日（YYYY-MM-DD）
 * @param {Date} [today] - 基準日（省略時は現在日時）
 * @returns {string} 満年齢の文字列。生年月日が空・不正なら空文字
 * @throws なし
 * @example
 * calculateAge('1990-04-01', new Date('2026-10-03')); // '36'
 */
export function calculateAge(birthday: string, today: Date = new Date()): string {
  if (!birthday) return '';
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Number.isNaN(age) ? '' : String(age);
}

/**
 * 生年月日入力時に満年齢を計算して表示し、DBへ保存します。初期表示時も反映します。
 * @returns {void}
 * @throws なし
 */
export function setupAgeDisplay() {
  const birthInput = document.querySelector('#birthdate-input') as HTMLInputElement | null;
  const ageDisplay = document.querySelector('#age-display');
  if (!birthInput || !ageDisplay) return;

  birthInput.addEventListener('change', async () => {
    const age = calculateAge(birthInput.value);
    ageDisplay.textContent = age;

    // 年齢再計算時にDBへ保存
    const data = saveFromForm();
    const json = formResumeToJson(data);
    json.age = age ? Number(age) : 0;
    await saveResume(json);
  });
  // 初期表示時も反映
  if (birthInput.value) {
    ageDisplay.textContent = calculateAge(birthInput.value);
  }
}
