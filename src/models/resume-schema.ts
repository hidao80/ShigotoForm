import { z } from 'zod';
import { ja } from 'zod/locales';
import type { ResumeJson } from '../db.ts';

/**
 * 職歴スキーマ。旧形式の startDate / endDate は start / end へ正規化します。
 */
const careerSchema = z
  .looseObject({
    start: z.string().optional(),
    end: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    name: z.string().default(''),
    position: z.string().default(''),
    description: z.string().default(''),
  })
  .transform((c) => ({
    ...c,
    start: c.start ?? c.startDate ?? '',
    end: c.end ?? c.endDate ?? '',
  }));

/**
 * 免許・資格スキーマ。
 */
const licenseSchema = z.looseObject({
  date: z.string().default(''),
  name: z.string().default(''),
  pass: z.string().default('合格'),
});

/**
 * 履歴書JSON（インポート / IndexedDB 保存形式）スキーマ。
 * 旧形式（json 直下の career / license、resume 欠落）も受け付け、ResumeJson へ正規化します。
 */
export const resumeJsonSchema = z
  .looseObject({
    fullnameKana: z.string().default(''),
    fullname: z.string().default(''),
    sex: z.string().default(''),
    birthday: z.string().default(''),
    age: z.number().default(0),
    zipCode: z.string().default(''),
    address1Kana: z.string().default(''),
    address1: z.string().default(''),
    tel1: z.string().default(''),
    mail1: z.string().default(''),
    address2Kana: z.string().default(''),
    address2: z.string().default(''),
    tel2: z.string().default(''),
    mail2: z.string().default(''),
    photo: z.string().default(''),
    createdAt: z.string().default(''),
    career: z.array(careerSchema).optional(),
    license: z.array(licenseSchema).optional(),
    resume: z
      .looseObject({
        education: z.array(z.string()).default([]),
        career: z.array(careerSchema).optional(),
        license: z.array(licenseSchema).optional(),
        subject: z.string().default(''),
        condition: z.string().default(''),
        hobby: z.string().default(''),
        reason: z.string().default(''),
        expectations: z.string().default(''),
      })
      .optional(),
  })
  .transform(
    (json): ResumeJson => ({
      ...json,
      resume: {
        education: [],
        subject: '',
        condition: '',
        hobby: '',
        reason: '',
        expectations: '',
        ...json.resume,
        career: json.resume?.career ?? json.career ?? [],
        license: json.resume?.license ?? json.license ?? [],
      },
    }),
  );

/**
 * 未検証の値を ResumeJson として検証・正規化します。
 * @param {unknown} input - JSON.parse 直後などの未検証データ
 * @returns {{ success: true; data: ResumeJson } | { success: false; errors: string[] }} 検証結果。失敗時は全問題の利用者向けメッセージ（`パス: 理由`）
 * @throws なし
 * @example
 * const result = parseResumeJson(JSON.parse(text));
 */
export function parseResumeJson(
  input: unknown,
): { success: true; data: ResumeJson } | { success: false; errors: string[] } {
  const result = resumeJsonSchema.safeParse(input, { error: ja().localeError });
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
  };
}
