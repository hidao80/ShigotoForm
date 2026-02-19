import Dexie, { type Table } from 'dexie';
import type { Career, License } from './models/Resume';

// JSONスキーマに合わせた型
export interface ResumeJson {
  fullnameKana: string;
  fullname: string;
  sex: string;
  birthday: string;
  age: number;
  zipCode: string;
  address1Kana: string;
  address1: string;
  tel1: string;
  mail1: string;
  address2Kana: string;
  address2: string;
  tel2: string;
  mail2: string;
  photo: string;
  createdAt: string;
  // 旧形式や他ツール出力対応のため追加
  career?: Career[];
  license?: License[];
  resume: {
    education: string[];
    career: Career[];
    license: License[];
    subject: string;
    condition: string;
    hobby: string;
    reason: string;
    expectations: string;
  };
}

// IndexedDB用スキーマ
export interface ResumeRecord {
  id?: number;
  createdAt: string;
  json: ResumeJson;
}

/**
 * IndexedDB操作用のDBクラス
 */
export class ResumeDB extends Dexie {
  resumes!: Table<ResumeRecord, number>;

  /**
   * ResumeDBのインスタンスを生成します。
   * @constructor
   * @throws Dexie関連の例外
   */
  constructor() {
    super('ResumeDB');
    // createdAtで一意
    this.version(4).stores({
      resumes: 'createdAt',
    });
  }
}

const db = new ResumeDB();

/**
 * 履歴書データを保存します。
 * @param {ResumeJson} resume - 保存する履歴書データ
 * @returns {Promise<void>}
 * @throws DexieのDBエラー
 * @example
 * await saveResume(resume);
 */
export async function saveResume(resume: ResumeJson) {
  await db.resumes.where('createdAt').equals(resume.createdAt).delete();
  await db.resumes.put({
    createdAt: resume.createdAt,
    json: resume,
  });
}

/**
 * 最新の履歴書データを復元します。
 * @returns {Promise<ResumeJson | undefined>} 復元した履歴書データ。なければundefined。
 * @throws DexieのDBエラー
 * @example
 * const resume = await loadResume();
 */
export async function loadResume(): Promise<ResumeJson | undefined> {
  const rec = await db.resumes.orderBy('createdAt').reverse().first();
  return rec?.json;
}

/**
 * 履歴書データを全て削除します。
 * @returns {Promise<void>}
 * @throws DexieのDBエラー
 * @example
 * await clearResume();
 */
export async function clearResume() {
  await db.resumes.clear();
}
