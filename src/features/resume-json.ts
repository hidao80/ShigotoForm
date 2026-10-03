import type { ResumeJson } from '../db.ts';
import type { Career, License, Resume as ResumeData } from '../models/Resume';

/**
 * ResumeJson形式のデータをフォーム用Resume形式へ変換します。
 * @param {ResumeJson} json - ResumeJson形式のデータ
 * @returns {Object} フォーム用Resume形式データ
 * @throws なし
 * @example
 * const formData = jsonToFormResume(json);
 */
export function jsonToFormResume(json: ResumeJson) {
  // career, licenseはjson.resume直下・json直下どちらにも対応
  const careerSrc =
    json.resume && Array.isArray(json.resume.career)
      ? json.resume.career
      : Array.isArray(json.career)
        ? json.career
        : [];
  const licenseSrc =
    json.resume && Array.isArray(json.resume.license)
      ? json.resume.license
      : Array.isArray(json.license)
        ? json.license
        : [];
  return {
    createdAt: json.createdAt,
    fullname: json.fullname,
    fullnameKana: json.fullnameKana,
    birthday: json.birthday,
    sex: json.sex,
    zipCode: json.zipCode,
    address1: json.address1,
    address1Kana: json.address1Kana,
    address2: json.address2,
    address2Kana: json.address2Kana,
    tel1: json.tel1,
    tel2: json.tel2,
    mail1: json.mail1,
    mail2: json.mail2,
    career: Array.isArray(careerSrc)
      ? careerSrc.filter(Boolean).map((c: Career) => ({
          start: c.start ?? c.startDate ?? '',
          end: c.end ?? c.endDate ?? '',
          name: c.name ?? '',
          position: c.position ?? '',
          description: c.description ?? '',
        }))
      : [],
    license: Array.isArray(licenseSrc)
      ? licenseSrc.filter(Boolean).map((l: License) => ({
          date: l.date ?? '',
          name: l.name ?? '',
          pass: l.pass ?? '合格',
        }))
      : [],
  };
}

/**
 * フォームの内容をResumeJson形式へ変換します。
 * @param {Object} form - フォームの入力データ
 * @returns {ResumeJson} ResumeJson形式のデータ
 * @throws なし
 * @example
 * const json = formResumeToJson(form);
 */
export function formResumeToJson(form: ResumeData): ResumeJson {
  return {
    fullnameKana: form.fullnameKana || '',
    fullname: form.fullname || '',
    sex: form.sex || '',
    birthday: form.birthday || '',
    age: 0,
    zipCode: form.zipCode || '',
    address1Kana: '',
    address1: form.address1 || '',
    tel1: form.tel1 || '',
    mail1: form.mail1 || '',
    address2Kana: '',
    address2: form.address2 || '',
    tel2: form.tel2 || '',
    mail2: form.mail2 || '',
    photo: '',
    createdAt: form.createdAt || '',
    resume: {
      education: [],
      career: form.career || [],
      license: form.license || [],
      subject: '',
      condition: '',
      hobby: '',
      reason: '',
      expectations: '',
    },
  };
}
