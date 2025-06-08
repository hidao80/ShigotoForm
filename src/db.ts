import Dexie, { Table } from 'dexie';
import { Career, License } from './models/Resume';

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
    career: Career[],
    license: License[],
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

export class ResumeDB extends Dexie {
  resumes!: Table<ResumeRecord, number>;

  constructor() {
    super('ResumeDB');
    // createdAtで一意
    this.version(4).stores({
      resumes: 'createdAt'
    });
  }
}

const db = new ResumeDB();

// 保存
export async function saveResume(resume: ResumeJson) {
  await db.resumes.where('createdAt').equals(resume.createdAt).delete();
  await db.resumes.put({
    createdAt: resume.createdAt,
    json: resume
  });
}

// 復元
export async function loadResume(): Promise<ResumeJson | undefined> {
  const rec = await db.resumes.orderBy('createdAt').reverse().first();
  return rec?.json;
}

export async function clearResume() {
  await db.resumes.clear();
}
