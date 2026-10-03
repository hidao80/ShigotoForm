import { z } from 'zod';
import type { Resume } from './Resume';

/**
 * 入力欄の HTML `pattern` 属性と Zod 検証で共有する正規表現のソース文字列。
 * `pattern` 属性は暗黙に全体一致のため、Zod 側では ^(?:…)$ で包んで同じ意味にする。
 */
export const FIELD_PATTERNS = {
  furigana: String.raw`(?=.*?[ぁ-ゟ])[ぁ-ゟー\s]*`,
  notBlank: String.raw`.*\S+.*`,
  zipCode: String.raw`\d{3}-?\d{4}`,
  tel: String.raw`\d{2,4}-?\d{2,4}-?\d{3,4}`,
  mail: String.raw`^[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+(\.[a-zA-Z]{2,})+$`,
} as const;

const fullMatch = (source: string) => new RegExp(`^(?:${source})$`, 'u');

const required = (message: string) => z.string().min(1, message);
const optionalPattern = (source: string, message: string) => {
  const re = fullMatch(source);
  return z.string().refine((v) => v === '' || re.test(v), message);
};

/**
 * 入力欄ごとの検証スキーマ（HTML の required / pattern と同じ規則）。キー順は画面上の並び順。
 * 空でよい欄（性別・連絡先住所・職歴・資格）は検証対象外。
 */
export const resumeFormFieldSchemas = {
  createdAt: required('年月日を入力してください'),
  fullnameKana: required('ふりがなを入力してください').regex(
    fullMatch(FIELD_PATTERNS.furigana),
    'ふりがなはひらがなで入力してください',
  ),
  fullname: required('氏名を入力してください').regex(fullMatch(FIELD_PATTERNS.notBlank), '氏名を入力してください'),
  birthday: required('生年月日を入力してください'),
  zipCode: required('郵便番号を入力してください').regex(
    fullMatch(FIELD_PATTERNS.zipCode),
    '郵便番号は7桁の数字で入力してください（ハイフン可）',
  ),
  address1: required('住所を入力してください').regex(fullMatch(FIELD_PATTERNS.notBlank), '住所を入力してください'),
  tel1: optionalPattern(FIELD_PATTERNS.tel, '電話番号は半角数字で入力してください（例: 03-1234-5678）'),
  mail1: optionalPattern(FIELD_PATTERNS.mail, '有効なメールアドレスを入力してください'),
  tel2: optionalPattern(FIELD_PATTERNS.tel, '連絡先の電話番号は半角数字で入力してください（例: 03-1234-5678）'),
};

export type ResumeFormField = keyof typeof resumeFormFieldSchemas;

/** 検証対象の入力欄（画面上の並び順） */
export const RESUME_FORM_FIELDS = Object.keys(resumeFormFieldSchemas) as ResumeFormField[];

export interface FieldError {
  field: ResumeFormField;
  message: string;
}

/**
 * 1 つの入力欄の値を検証します。
 * @param {ResumeFormField} field - 検証する欄
 * @param {string} value - 入力値
 * @returns {string | null} 不正なら利用者向けメッセージ、正しければ null
 * @throws なし
 * @example
 * validateField('zipCode', '12345'); // '郵便番号は7桁の数字で入力してください（ハイフン可）'
 */
export function validateField(field: ResumeFormField, value: string): string | null {
  const result = resumeFormFieldSchemas[field].safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? '入力内容が正しくありません');
}

/**
 * フォーム全体を検証します。
 * @param {Resume} resume - フォームから読み取った履歴書データ
 * @returns {FieldError[]} 不正な欄（画面上の並び順、1 欄につき 1 件）。全て正しければ空配列
 * @throws なし
 * @example
 * const errors = validateResumeForm(saveFromForm());
 */
export function validateResumeForm(resume: Resume): FieldError[] {
  const errors: FieldError[] = [];
  for (const field of RESUME_FORM_FIELDS) {
    const message = validateField(field, resume[field]);
    if (message) errors.push({ field, message });
  }
  return errors;
}
