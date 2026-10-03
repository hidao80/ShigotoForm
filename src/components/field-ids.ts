import type { ResumeFormField } from '../models/resume-form-schema.ts';

/** 検証対象の欄と入力要素 id の対応 */
export const FIELD_IDS: Record<ResumeFormField, string> = {
  createdAt: 'created-at',
  fullnameKana: 'furigana-input',
  fullname: 'name-input',
  birthday: 'birthdate-input',
  zipCode: 'zip-code-input',
  address1: 'address1-input',
  tel1: 'tel1-input',
  mail1: 'mail1-input',
  tel2: 'tel2-input',
};

/** 折りたたみ（連絡先）の中にある欄 */
export const CONTACT_FIELDS: ResumeFormField[] = ['tel2'];
