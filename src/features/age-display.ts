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
